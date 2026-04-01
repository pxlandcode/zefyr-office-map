<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import type {
		CalendarMeetingSelection,
		CalendarMode,
		CalendarSelectionChangeDetail,
		CalendarSlotSelection,
		CalendarTransitionVariant
	} from '$lib/types/calendarTypes';
	import type { Meeting } from '$lib/types/roomTypes';
	import { getRoomCalendar } from '$lib/utils/api/api';
	import {
		getMeetingIdentity,
		getValidStartMinutes
	} from '$lib/utils/helpers/bookingSelectionHelpers';
	import {
		addDays,
		createDateKey,
		getCurrentTimeOffset,
		getWeekDates,
		parseDateKey
	} from '$lib/utils/helpers/calendarHelpers';
	import { Datepicker } from '$lib/components/datepicker';
	import ArrowIcon from '../arrow-icon/ArrowIcon.svelte';
	import OptionsButton from '../options-button/OptionsButton.svelte';
	import DayCalendarView from './DayCalendarView.svelte';
	import WeekCalendarView from './WeekCalendarView.svelte';
	import {
		DAY_COLUMN_WIDTH,
		HOURS,
		HOUR_HEIGHT,
		MEETING_HORIZONTAL_INSET,
		MODE_OPTIONS,
		START_HOUR,
		SWIPE_AXIS_LOCK_THRESHOLD,
		SWIPE_THRESHOLD,
		TIME_GUTTER_WIDTH,
		TRACK_HEIGHT,
		createDayColumns,
		getContainerFlyOffset,
		getDayPaneFlyOffset,
		getMeetingsForDate,
		getSelectedWeekLabel,
		getWeekDistance,
		getWeekColumnWidth,
		getWeekKeyForDate,
		getWeekPaneFlyOffset
	} from './calendarViewHelpers';

	export let roomEmail: string;
	export let todaysMeetings: Meeting[] = [];
	export let optimisticMeetings: Meeting[] = [];
	export let hiddenMeetingIdentities: string[] = [];
	export let previewMeeting: Meeting | null = null;
	export let selectedMeetingIdentity: string | null = null;

	const dispatch = createEventDispatcher<{
		layoutchange: { expanded: boolean };
		selectionchange: CalendarSelectionChangeDetail;
		slotselect: CalendarSlotSelection;
		meetingselect: CalendarMeetingSelection;
	}>();
	const dayPickerOptions = { dateFormat: 'yyyy-MM-dd' };
	const dayModeOption = { value: 'day', label: 'Dag' } as const;
	const weekModeOption = { value: 'week', label: 'Vecka' } as const;
	const pendingWeeks = new Set<string>();
	const todayTravelAnimatedWeekLimit = 6;
	const todayTravelPreviewWeekLimit = 3;
	const todayTravelStepCadenceMs = 80;
	const initialScrollOffset = Math.max(
		0,
		getCurrentTimeOffset(START_HOUR, HOUR_HEIGHT) - HOUR_HEIGHT
	);

	let currentTime = new Date();
	let todayDateKey = createDateKey(currentTime);
	let previousRoomEmail = roomEmail;
	let mode: CalendarMode = 'day';
	let selectedDateKey = todayDateKey;
	let transitionVariant: CalendarTransitionVariant = 'expand';

	let calendarContainer: HTMLDivElement | null = null;
	let weekHeaderScroller: HTMLDivElement | null = null;
	let weekBodyScroller: HTMLDivElement | null = null;
	let dayViewportWidth = DAY_COLUMN_WIDTH;
	let weekViewportWidth = 0;

	let loadingCount = 0;
	let showLoadingOverlay = false;
	let loadingDelayTimeout: ReturnType<typeof setTimeout> | null = null;
	let error: string | null = null;
	let touchStartX: number | null = null;
	let touchStartY: number | null = null;
	let touchAxis: 'horizontal' | 'vertical' | null = null;
	let syncingWeekScroll = false;
	let savedVerticalScrollTop: number | null = null;
	let savedWeekHorizontalScroll = 0;
	let cachedWeeks = new Map<string, Meeting[]>();
	let autoNavigationSequence = 0;

	function sleep(milliseconds: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, milliseconds);
		});
	}

	function updateCurrentTime() {
		currentTime = new Date();
		todayDateKey = createDateKey(currentTime);
	}

	function cancelAutoNavigation() {
		autoNavigationSequence += 1;
	}

	async function scrollToCalendarPosition() {
		await tick();

		if (!calendarContainer) {
			return;
		}

		calendarContainer.scrollTop = savedVerticalScrollTop ?? initialScrollOffset;

		if (mode === 'day') {
			calendarContainer.scrollLeft = 0;
			return;
		}

		setWeekHorizontalScroll(savedWeekHorizontalScroll);
	}

	function setWeekHorizontalScroll(scrollLeft: number) {
		savedWeekHorizontalScroll = scrollLeft;
		syncingWeekScroll = true;

		if (weekHeaderScroller) {
			weekHeaderScroller.scrollLeft = scrollLeft;
		}

		if (weekBodyScroller) {
			weekBodyScroller.scrollLeft = scrollLeft;
		}

		requestAnimationFrame(() => {
			syncingWeekScroll = false;
		});
	}

	function syncWeekScroll(source: 'header' | 'body') {
		if (syncingWeekScroll) {
			return;
		}

		const scrollLeft =
			source === 'header'
				? (weekHeaderScroller?.scrollLeft ?? 0)
				: (weekBodyScroller?.scrollLeft ?? 0);

		setWeekHorizontalScroll(scrollLeft);
	}

	function rememberVerticalScroll(event: Event) {
		const target = event.currentTarget;

		if (!(target instanceof HTMLDivElement)) {
			return;
		}

		savedVerticalScrollTop = target.scrollTop;
	}

	function areMeetingsLoadedForDate(dateKey: string) {
		return dateKey === todayDateKey || cachedWeeks.has(getWeekKeyForDate(dateKey));
	}

	async function ensureWeekLoaded(dateKey: string, opts?: { force?: boolean }) {
		const weekKey = getWeekKeyForDate(dateKey);

		if (!opts?.force && (cachedWeeks.has(weekKey) || pendingWeeks.has(weekKey))) {
			return;
		}

		pendingWeeks.add(weekKey);
		loadingCount += 1;

		try {
			const response = await getRoomCalendar(
				roomEmail,
				weekKey,
				createDateKey(addDays(parseDateKey(weekKey), 6))
			);

			const nextCache = new Map(cachedWeeks);
			nextCache.set(weekKey, response.meetings);
			cachedWeeks = nextCache;

			if (getWeekKeyForDate(selectedDateKey) === weekKey) {
				error = null;
			}
		} catch (err) {
			if (getWeekKeyForDate(selectedDateKey) === weekKey) {
				error = err instanceof Error ? err.message : 'Kunde inte hämta kalendern.';
			}
		} finally {
			pendingWeeks.delete(weekKey);
			loadingCount = Math.max(0, loadingCount - 1);
		}
	}

	async function preloadWeeks(dateKeys: string[]) {
		const uniqueWeekKeys = Array.from(new Set(dateKeys.map((dateKey) => getWeekKeyForDate(dateKey))));
		await Promise.all(uniqueWeekKeys.map((weekKey) => ensureWeekLoaded(weekKey)));
	}

	async function setMode(nextMode: CalendarMode) {
		cancelAutoNavigation();

		if (nextMode === mode) {
			return;
		}

		transitionVariant = nextMode === 'week' ? 'expand' : 'collapse';
		mode = nextMode;
		error = null;

		if (nextMode === 'week') {
			await ensureWeekLoaded(selectedDateKey);
		}

		await scrollToCalendarPosition();
	}

	async function moveSelectedDay(delta: number) {
		cancelAutoNavigation();
		transitionVariant = delta > 0 ? 'forward' : 'backward';
		selectedDateKey = createDateKey(addDays(selectedDate, delta));
		error = null;
		await scrollToCalendarPosition();
	}

	async function moveSelectedWeek(deltaWeeks: number, opts?: { preserveAutoNavigation?: boolean }) {
		if (!opts?.preserveAutoNavigation) {
			cancelAutoNavigation();
		}

		transitionVariant = deltaWeeks > 0 ? 'forward' : 'backward';
		selectedDateKey = createDateKey(addDays(selectedDate, deltaWeeks * 7));
		error = null;
		await ensureWeekLoaded(selectedDateKey);
		await scrollToCalendarPosition();
	}

	async function moveToToday() {
		cancelAutoNavigation();
		error = null;

		if (mode !== 'week') {
			transitionVariant = 'collapse';
			selectedDateKey = todayDateKey;
			await scrollToCalendarPosition();
			return;
		}

		const weeksToToday = getWeekDistance(selectedDateKey, todayDateKey);

		if (weeksToToday === 0) {
			selectedDateKey = todayDateKey;
			await scrollToCalendarPosition();
			return;
		}

		const direction = weeksToToday > 0 ? 1 : -1;
		const totalWeeksToTravel = Math.abs(weeksToToday);
		const animatedWeeks =
			totalWeeksToTravel <= todayTravelAnimatedWeekLimit
				? totalWeeksToTravel
				: todayTravelPreviewWeekLimit;
		const sequenceId = autoNavigationSequence;
		const animatedDateKeys: string[] = [];
		let travelDate = parseDateKey(selectedDateKey);

		for (let step = 0; step < animatedWeeks; step += 1) {
			travelDate = addDays(travelDate, direction * 7);
			animatedDateKeys.push(createDateKey(travelDate));
		}

		await preloadWeeks([...animatedDateKeys, todayDateKey]);

		for (const dateKey of animatedDateKeys) {
			if (sequenceId !== autoNavigationSequence) {
				return;
			}

			transitionVariant = direction > 0 ? 'forward' : 'backward';
			selectedDateKey = dateKey;
			await scrollToCalendarPosition();
			await sleep(todayTravelStepCadenceMs);
		}

		if (sequenceId !== autoNavigationSequence) {
			return;
		}

		if (getWeekDistance(selectedDateKey, todayDateKey) !== 0) {
			transitionVariant = direction > 0 ? 'forward' : 'backward';
			selectedDateKey = todayDateKey;
			await ensureWeekLoaded(todayDateKey);
			await scrollToCalendarPosition();
		} else {
			selectedDateKey = todayDateKey;
			await scrollToCalendarPosition();
		}
	}

	async function focusDay(dateKey: string) {
		cancelAutoNavigation();
		transitionVariant = 'collapse';
		selectedDateKey = dateKey;
		mode = 'day';
		error = null;
		await scrollToCalendarPosition();
	}

	async function retryVisibleRange() {
		cancelAutoNavigation();
		error = null;
		await ensureWeekLoaded(selectedDateKey, { force: true });
	}

	function resetTouchState() {
		touchStartX = null;
		touchStartY = null;
		touchAxis = null;
	}

	function handleDayTouchStart(event: TouchEvent) {
		const touch = event.changedTouches[0];

		if (!touch) {
			return;
		}

		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
		touchAxis = null;
	}

	function handleDayTouchMove(event: TouchEvent) {
		if (touchStartX === null || touchStartY === null || touchAxis) {
			return;
		}

		const touch = event.changedTouches[0];

		if (!touch) {
			return;
		}

		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;

		if (
			Math.abs(deltaX) < SWIPE_AXIS_LOCK_THRESHOLD &&
			Math.abs(deltaY) < SWIPE_AXIS_LOCK_THRESHOLD
		) {
			return;
		}

		touchAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
	}

	async function handleDayTouchEnd(event: TouchEvent) {
		if (touchStartX === null || touchStartY === null) {
			resetTouchState();
			return;
		}

		const touch = event.changedTouches[0];

		if (!touch) {
			resetTouchState();
			return;
		}

		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;
		const isHorizontalSwipe =
			(touchAxis === 'horizontal' || Math.abs(deltaX) > Math.abs(deltaY) * 1.2) &&
			Math.abs(deltaX) >= SWIPE_THRESHOLD;

		if (isHorizontalSwipe) {
			await moveSelectedDay(deltaX < 0 ? 1 : -1);
		}

		resetTouchState();
	}

	function handleDaySlotSelect(
		event: CustomEvent<{ requestedMinuteOfDay: number; startMinuteOfDay: number }>
	) {
		dispatch('slotselect', {
			dateKey: selectedDateKey,
			requestedMinuteOfDay: event.detail.requestedMinuteOfDay,
			startMinuteOfDay: event.detail.startMinuteOfDay,
			source: 'day'
		});
	}

	function handleDayMeetingSelect(event: CustomEvent<Meeting>) {
		dispatch('meetingselect', {
			dateKey: selectedDateKey,
			meeting: event.detail,
			meetingIdentity: getMeetingIdentity(event.detail),
			source: 'day'
		});
	}

	async function handleWeekSlotSelect(
		event: CustomEvent<{ dateKey: string; requestedMinuteOfDay: number; startMinuteOfDay: number }>
	) {
		const { dateKey, requestedMinuteOfDay, startMinuteOfDay } = event.detail;
		await focusDay(dateKey);

		dispatch('slotselect', {
			dateKey,
			requestedMinuteOfDay,
			startMinuteOfDay,
			source: 'week'
		});
	}

	async function handleWeekMeetingSelect(
		event: CustomEvent<{ dateKey: string; meeting: Meeting }>
	) {
		const { dateKey, meeting } = event.detail;
		await focusDay(dateKey);

		dispatch('meetingselect', {
			dateKey,
			meeting,
			meetingIdentity: getMeetingIdentity(meeting),
			source: 'week'
		});
	}

	$: if (roomEmail !== previousRoomEmail) {
		previousRoomEmail = roomEmail;
		mode = 'day';
		selectedDateKey = todayDateKey;
		loadingCount = 0;
		error = null;
		transitionVariant = 'collapse';
		cachedWeeks = new Map();
		pendingWeeks.clear();
		savedVerticalScrollTop = null;
		savedWeekHorizontalScroll = 0;
		void scrollToCalendarPosition();
	}

	$: selectedDate = parseDateKey(selectedDateKey);
	$: selectedWeekStartKey = getWeekKeyForDate(selectedDateKey);
	$: weekDates = getWeekDates(selectedDate);
	$: selectedWeekLabel = getSelectedWeekLabel(selectedWeekStartKey);
	$: selectedModeOption = mode === 'week' ? weekModeOption : dayModeOption;
	$: isLoading = loadingCount > 0;
	$: containerFlyInX = getContainerFlyOffset(transitionVariant);
	$: containerFlyOutX = -containerFlyInX;
	$: dayPaneFlyInX = getDayPaneFlyOffset(transitionVariant, dayViewportWidth);
	$: dayPaneFlyOutX = -dayPaneFlyInX;
	$: weekPaneFlyInX = getWeekPaneFlyOffset(transitionVariant, weekViewportWidth);
	$: weekPaneFlyOutX = -weekPaneFlyInX;

	$: {
		if (isLoading) {
			if (!loadingDelayTimeout) {
				loadingDelayTimeout = setTimeout(() => {
					showLoadingOverlay = true;
				}, 300);
			}
		} else {
			if (loadingDelayTimeout) {
				clearTimeout(loadingDelayTimeout);
				loadingDelayTimeout = null;
			}

			showLoadingOverlay = false;
		}
	}

	$: shouldLoadWeek = mode === 'week' || selectedDateKey !== todayDateKey;
	$: if (shouldLoadWeek) {
		void ensureWeekLoaded(selectedDateKey);
	}

	$: visibleDateKeys =
		mode === 'week' ? weekDates.map((date) => createDateKey(date)) : [selectedDateKey];

	$: selectedDayMeetings = getMeetingsForDate({
		dateKey: selectedDateKey,
		cachedWeeks,
		todaysMeetings,
		optimisticMeetings,
		hiddenMeetingIdentities,
		todayDateKey
	});
	$: validStartMinutesByDate = Object.fromEntries(
		visibleDateKeys.map((dateKey) => [
			dateKey,
			areMeetingsLoadedForDate(dateKey)
				? getValidStartMinutes(
						dateKey,
						getMeetingsForDate({
							dateKey,
							cachedWeeks,
							todaysMeetings,
							optimisticMeetings,
							hiddenMeetingIdentities,
							todayDateKey
						}),
						currentTime
					)
				: []
		])
	);
	$: selectedDayValidStartMinutes = validStartMinutesByDate[selectedDateKey] ?? [];

	$: weekColumnWidth = getWeekColumnWidth(weekViewportWidth);
	$: dayColumns = createDayColumns({
		dateKeys: visibleDateKeys,
		mode,
		weekColumnWidth,
		cachedWeeks,
		todaysMeetings,
		optimisticMeetings,
		hiddenMeetingIdentities,
		todayDateKey
	});

	$: weekDaysTrackWidth = dayColumns.reduce((sum, column) => sum + column.width, 0);
	$: layoutExpanded = mode === 'week';
	$: dispatch('layoutchange', { expanded: layoutExpanded });
	$: dispatch('selectionchange', {
		dateKey: selectedDateKey,
		isToday: selectedDateKey === todayDateKey,
		mode,
		meetings: selectedDayMeetings,
		meetingsLoaded: areMeetingsLoadedForDate(selectedDateKey)
	});

	onMount(() => {
		updateCurrentTime();
		void scrollToCalendarPosition();

		const millisecondsUntilNextMinute =
			60000 - (currentTime.getSeconds() * 1000 + currentTime.getMilliseconds());

		let interval: ReturnType<typeof setInterval>;
		const initialTimeout = setTimeout(() => {
			updateCurrentTime();
			interval = setInterval(updateCurrentTime, 60000);
		}, millisecondsUntilNextMinute);

		return () => {
			clearTimeout(initialTimeout);
			clearInterval(interval);
		};
	});

	onDestroy(() => {
		pendingWeeks.clear();

		if (loadingDelayTimeout) {
			clearTimeout(loadingDelayTimeout);
		}
	});
</script>

<div class="flex h-full min-h-0 flex-col gap-3 text-text">
	<div class="flex items-center justify-between gap-4">
		<div class="flex min-w-0 items-center gap-3">
			{#if mode === 'week'}
				<div
					class="flex shrink-0 items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
				>
					<button
						type="button"
						class="flex h-10 w-10 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
						aria-label="Föregående vecka"
						on:click={() => void moveSelectedWeek(-1)}
					>
						<ArrowIcon size="14px" direction="left" />
					</button>

					<button
						type="button"
						class="border-x border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
						on:click={() => void moveToToday()}
					>
						Idag
					</button>

					<button
						type="button"
						class="flex h-10 w-10 items-center justify-center text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
						aria-label="Nästa vecka"
						on:click={() => void moveSelectedWeek(1)}
					>
						<ArrowIcon size="14px" direction="right" />
					</button>
				</div>
			{/if}

			<div class="min-w-0">
				{#if mode === 'week'}
					<Datepicker
						bind:value={selectedDateKey}
						options={dayPickerOptions}
						buttonLabel={selectedWeekLabel}
					/>
				{:else}
					<Datepicker bind:value={selectedDateKey} options={dayPickerOptions} />
				{/if}
			</div>
		</div>

		<div class="w-full max-w-[220px] shrink-0">
			<OptionsButton
				options={MODE_OPTIONS}
				selectedOption={selectedModeOption}
				on:select={(event) => void setMode(event.detail as CalendarMode)}
			/>
		</div>
	</div>

	{#if error}
		<div
			class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
		>
			<p>{error}</p>
			<button
				type="button"
				class="shrink-0 rounded-md border border-red-300 px-3 py-1 font-semibold text-red-700 transition-colors hover:bg-red-100"
				on:click={() => void retryVisibleRange()}
			>
				Försök igen
			</button>
		</div>
	{/if}

	{#key mode}
		<div
			class="flex min-h-0 flex-1 flex-col gap-3"
			in:fly={{ x: containerFlyInX, opacity: 0, duration: 260 }}
			out:fly={{ x: containerFlyOutX, opacity: 0, duration: 220 }}
		>
			{#if mode === 'day'}
				<DayCalendarView
					bind:container={calendarContainer}
					bind:viewportWidth={dayViewportWidth}
					{selectedDateKey}
					meetings={selectedDayMeetings}
					{previewMeeting}
					{selectedMeetingIdentity}
					validStartMinutes={selectedDayValidStartMinutes}
					hours={HOURS}
					startHour={START_HOUR}
					hourHeight={HOUR_HEIGHT}
					trackHeight={TRACK_HEIGHT}
					{showLoadingOverlay}
					meetingHorizontalInset={MEETING_HORIZONTAL_INSET}
					paneFlyInX={dayPaneFlyInX}
					paneFlyOutX={dayPaneFlyOutX}
					onScroll={rememberVerticalScroll}
					onTouchStart={handleDayTouchStart}
					onTouchMove={handleDayTouchMove}
					onTouchEnd={handleDayTouchEnd}
					onTouchCancel={resetTouchState}
					on:slotselect={handleDaySlotSelect}
					on:meetingselect={handleDayMeetingSelect}
				/>
			{:else}
				<WeekCalendarView
					bind:container={calendarContainer}
					bind:headerScroller={weekHeaderScroller}
					bind:bodyScroller={weekBodyScroller}
					bind:viewportWidth={weekViewportWidth}
					{selectedWeekStartKey}
					hours={HOURS}
					{dayColumns}
					{previewMeeting}
					{selectedMeetingIdentity}
					{validStartMinutesByDate}
					startHour={START_HOUR}
					hourHeight={HOUR_HEIGHT}
					trackHeight={TRACK_HEIGHT}
					timeGutterWidth={TIME_GUTTER_WIDTH}
					{weekDaysTrackWidth}
					meetingHorizontalInset={MEETING_HORIZONTAL_INSET}
					paneFlyInX={weekPaneFlyInX}
					paneFlyOutX={weekPaneFlyOutX}
					onScroll={rememberVerticalScroll}
					onHeaderScroll={() => syncWeekScroll('header')}
					onBodyScroll={() => syncWeekScroll('body')}
					onFocusDay={focusDay}
					on:slotselect={handleWeekSlotSelect}
					on:meetingselect={handleWeekMeetingSelect}
				/>
			{/if}
		</div>
	{/key}

</div>

<style>
	:global(.calendar-scroll) {
		scrollbar-width: none;
	}

	:global(.calendar-scroll::-webkit-scrollbar) {
		display: none;
	}

	:global(.day-swipe-surface) {
		touch-action: pan-y;
	}
</style>
