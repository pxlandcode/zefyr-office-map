<script lang="ts">
	import type {
		CalendarMeetingSelection,
		CalendarSelectionChangeDetail,
		CalendarSlotSelection
	} from '$lib/types/calendarTypes';
	import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
	import { createEventDispatcher } from 'svelte';
	import DailyCalendar from '../ui/daily-calendar/DailyCalendar.svelte';
	import {
		generateTimeBookingOptions,
		handleBooking,
		handleCancel,
		handleExtend
	} from '$lib/utils/helpers/bookingHelpers';
	import {
		createDateKey,
		formatSelectedDayLabel,
		getMinutesFromDateTime,
		parseDateKey
	} from '$lib/utils/helpers/calendarHelpers';
	import {
		createMeetingFromSelection,
		getCurrentMinuteOfDay,
		getMeetingByIdentity,
		getMeetingIdentity,
		getValidStartMinutes,
		mergeMeetings
	} from '$lib/utils/helpers/bookingSelectionHelpers';
	import RoomBookingSidebar from './room-booking/RoomBookingSidebar.svelte';
	import {
		type BookingSelectOption,
		canBookSelectedSlot,
		canCancelSelectedMeeting as canCancelSelectedMeetingInSidebar,
		canExtendRoom,
		getAvailableMinutesForBooking,
		getNextMeeting,
		getSelectedMeetingCancelMessage,
		getSelectedOption,
		getStartTimeOptions
	} from './room-booking/roomBookingHelpers';

	export let room: MeetingRoom | null = null;
	export let extraClasses = '';

	type RoomBookingSidebarState =
		| 'defaultTodayStatus'
		| 'emptySelectedDay'
		| 'freeSlotSelected'
		| 'meetingSelected';

	const dispatch = createEventDispatcher();

	let selectedBookingOption = 30;
	let selectedExtendOption = 30;
	let selectedStartMinuteOfDay: number | null = null;
	let startOptionsAnchorMinuteOfDay: number | null = null;
	let bookingSelectionReferenceNow = new Date();
	let bookingSelectionReferenceDateKey = createDateKey(bookingSelectionReferenceNow);
	let previousExtendMaxTime: number | null = null;
	let previousRemainingTime: number | null = null;
	let calendarExpanded = false;
	let selectedCalendarDateKey = bookingSelectionReferenceDateKey;
	let selectedCalendarMeetings: Meeting[] = [];
	let selectedCalendarMeetingsLoaded = true;
	let selectedMeetingIdentity: string | null = null;
	let selectedMeetingFallback: Meeting | null = null;
	let previousRoomEmail: string | null = null;
	let optimisticMeetings: Meeting[] = [];
	let hiddenMeetingIdentities: string[] = [];
	let showPreviewMeeting = false;

	let bookingOptions: BookingSelectOption[] = generateTimeBookingOptions(24 * 60);
	let extendOptions: BookingSelectOption[] = generateTimeBookingOptions(24 * 60);
	let startTimeOptions: BookingSelectOption[] = [];

	$: selectedDayValidStartMinutes =
		selectedCalendarMeetingsLoaded
			? getValidStartMinutes(
					selectedCalendarDateKey,
					selectedCalendarMeetings,
					bookingSelectionReferenceNow
				)
			: [];
	$: immediateTodayStartMinuteOfDay =
		selectedCalendarDateKey === bookingSelectionReferenceDateKey
			? getCurrentMinuteOfDay(bookingSelectionReferenceNow)
			: null;
	$: selectedStartAllowedMinutes =
		immediateTodayStartMinuteOfDay != null &&
		getAvailableMinutesForBooking(
			selectedCalendarDateKey,
			selectedCalendarMeetings,
			immediateTodayStartMinuteOfDay,
			bookingSelectionReferenceNow
		) > 0
			? Array.from(
					new Set([immediateTodayStartMinuteOfDay, ...selectedDayValidStartMinutes])
				)
			: selectedDayValidStartMinutes;
	$: availableMinutesForBooking = getAvailableMinutesForBooking(
		selectedCalendarDateKey,
		selectedCalendarMeetings,
		selectedStartMinuteOfDay,
		bookingSelectionReferenceNow
	);
	$: startOptionsCenterMinuteOfDay =
		startOptionsAnchorMinuteOfDay != null &&
		selectedStartAllowedMinutes.includes(startOptionsAnchorMinuteOfDay)
			? startOptionsAnchorMinuteOfDay
			: selectedStartMinuteOfDay;
	$: startTimeOptions = selectedCalendarMeetingsLoaded
		? getStartTimeOptions(
				selectedCalendarDateKey,
				startOptionsCenterMinuteOfDay,
				selectedCalendarMeetings,
				bookingSelectionReferenceNow
			)
		: [];

	$: if (
		selectedStartMinuteOfDay != null &&
		!selectedStartAllowedMinutes.includes(selectedStartMinuteOfDay)
	) {
		selectedStartMinuteOfDay = null;
		startOptionsAnchorMinuteOfDay = null;
		showPreviewMeeting = false;
	}

	$: bookingOptions =
		selectedStartMinuteOfDay != null
			? generateTimeBookingOptions(
					availableMinutesForBooking,
					null,
					availableMinutesForBooking > 0 ? availableMinutesForBooking : null
				)
			: [];

	$: if (!bookingOptions.find((option) => option.value === selectedBookingOption)) {
		selectedBookingOption = bookingOptions[0]?.value ?? 30;
	}

	$: selectedBookingOptionItem = getSelectedOption(bookingOptions, selectedBookingOption);
	$: selectedStartOption = getSelectedOption(startTimeOptions, selectedStartMinuteOfDay);

	$: if (
		room &&
		(room.minutesUntilNextMeeting !== previousExtendMaxTime ||
			room.currentMeetingEndsIn !== previousRemainingTime)
	) {
		previousExtendMaxTime = room.minutesUntilNextMeeting;
		previousRemainingTime = room.currentMeetingEndsIn;
		extendOptions = generateTimeBookingOptions(
			previousExtendMaxTime ?? 24 * 60,
			previousRemainingTime ?? null,
			room.minutesUntilNextMeeting
		);
	}

	$: if (!extendOptions.find((option) => option.value === selectedExtendOption)) {
		selectedExtendOption = extendOptions[0]?.value ?? 0;
	}

	$: selectedExtendOptionItem = getSelectedOption(extendOptions, selectedExtendOption);
	$: nextMeeting = getNextMeeting(room?.todaysMeetings ?? []);
	$: isViewingToday = selectedCalendarDateKey === createDateKey(new Date());
	$: currentOngoingMeeting =
		isViewingToday && room?.status === 'Upptagen' ? room.currentMeeting ?? null : null;
	$: currentOngoingMeetingIdentity = currentOngoingMeeting
		? getMeetingIdentity(currentOngoingMeeting)
		: null;
	$: currentOngoingMeetingEndMinuteOfDay = currentOngoingMeeting
		? getMinutesFromDateTime(currentOngoingMeeting.endDate)
		: null;
	$: isSelectedAfterOngoingMeeting =
		currentOngoingMeetingEndMinuteOfDay != null &&
		selectedStartMinuteOfDay != null &&
		selectedStartMinuteOfDay >= currentOngoingMeetingEndMinuteOfDay;
	$: isViewingNonCurrentMeeting =
		Boolean(
			currentOngoingMeetingIdentity &&
			selectedMeetingFallback &&
			getMeetingIdentity(selectedMeetingFallback) !== currentOngoingMeetingIdentity
		);
	$: selectedCalendarLabel = formatSelectedDayLabel(parseDateKey(selectedCalendarDateKey));
	$: showNextMeetingSummary = Boolean(room?.minutesUntilNextMeeting && nextMeeting);
	$: canExtend = canExtendRoom(room, selectedExtendOption);
	$: hasSelectableSlots =
		selectedCalendarMeetingsLoaded && selectedDayValidStartMinutes.length > 0;
	$: canBookSelection = canBookSelectedSlot(selectedStartMinuteOfDay, bookingOptions);
	$: previewMeeting =
		selectedStartMinuteOfDay != null && canBookSelection && showPreviewMeeting
			? createMeetingFromSelection(
					selectedCalendarDateKey,
					selectedStartMinuteOfDay,
					selectedBookingOption,
					'Ny bokning'
				)
			: null;
	$: sidebarState = getSidebarState({
		isSelectedAfterOngoingMeeting,
		isViewingNonCurrentMeeting,
		isViewingToday,
		selectedStartMinuteOfDay,
		selectedMeeting: selectedMeetingFallback
	});
	$: canCancelSelectedMeeting =
		sidebarState === 'meetingSelected'
			? canCancelSelectedMeetingInSidebar(selectedMeetingFallback, selectedCalendarDateKey)
			: false;
	$: selectedMeetingCancelMessage =
		sidebarState === 'meetingSelected'
			? getSelectedMeetingCancelMessage(selectedMeetingFallback, selectedCalendarDateKey)
			: null;
	$: calendarHighlightedMeetingIdentity =
		selectedMeetingIdentity ??
		(sidebarState === 'defaultTodayStatus' ? currentOngoingMeetingIdentity : null);

	$: if (selectedMeetingIdentity) {
		const matchingMeeting = getMeetingByIdentity(selectedCalendarMeetings, selectedMeetingIdentity);

		if (matchingMeeting) {
			selectedMeetingFallback = matchingMeeting;
		}
	}

	function getSidebarState({
		isSelectedAfterOngoingMeeting,
		isViewingNonCurrentMeeting,
		isViewingToday,
		selectedStartMinuteOfDay,
		selectedMeeting
	}: {
		isSelectedAfterOngoingMeeting: boolean;
		isViewingNonCurrentMeeting: boolean;
		isViewingToday: boolean;
		selectedStartMinuteOfDay: number | null;
		selectedMeeting: Meeting | null;
	}): RoomBookingSidebarState {
		if (
			isViewingToday &&
			room?.status === 'Upptagen' &&
			!isSelectedAfterOngoingMeeting &&
			!isViewingNonCurrentMeeting
		) {
			return 'defaultTodayStatus';
		}

		if (selectedMeeting) {
			return 'meetingSelected';
		}

		if (selectedStartMinuteOfDay != null) {
			return 'freeSlotSelected';
		}

		return isViewingToday ? 'defaultTodayStatus' : 'emptySelectedDay';
	}

	function clearCalendarSelection() {
		selectedStartMinuteOfDay = null;
		startOptionsAnchorMinuteOfDay = null;
		selectedMeetingIdentity = null;
		selectedMeetingFallback = null;
		showPreviewMeeting = false;
	}

	function initializeDefaultOpenSelection(nextRoom: MeetingRoom | null) {
		const todayDateKey = bookingSelectionReferenceDateKey;

		if (
			!nextRoom ||
			nextRoom.status !== 'Ledig' ||
			selectedCalendarDateKey !== todayDateKey
		) {
			return;
		}

		const currentMinuteOfDay = getCurrentMinuteOfDay(bookingSelectionReferenceNow);
		const availableNow = getAvailableMinutesForBooking(
			todayDateKey,
			selectedCalendarMeetings,
			currentMinuteOfDay,
			bookingSelectionReferenceNow
		);

		if (availableNow <= 0) {
			return;
		}

		selectedStartMinuteOfDay = currentMinuteOfDay;
		startOptionsAnchorMinuteOfDay = currentMinuteOfDay;
		showPreviewMeeting = false;
	}

	function resetToDefaultTodaySelection(dateKey: string) {
		selectedCalendarDateKey = dateKey;
		clearCalendarSelection();
		initializeDefaultOpenSelection(room);
	}

	function handleCalendarLayoutChange(event: CustomEvent<{ expanded: boolean }>) {
		calendarExpanded = Boolean(event.detail?.expanded);
		dispatch('calendarLayoutChange', event.detail);
	}

	function handleCalendarSelectionChange(event: CustomEvent<CalendarSelectionChangeDetail>) {
		const nextDateKey = event.detail?.dateKey ?? createDateKey(new Date());
		const hasDateChanged = nextDateKey !== selectedCalendarDateKey;

		selectedCalendarDateKey = nextDateKey;
		selectedCalendarMeetings = event.detail?.meetings ?? [];
		selectedCalendarMeetingsLoaded = Boolean(event.detail?.meetingsLoaded);

		if (hasDateChanged) {
			clearCalendarSelection();
		}
	}

	function handleCalendarSlotSelect(event: CustomEvent<CalendarSlotSelection>) {
		const todayDateKey = bookingSelectionReferenceDateKey;
		const isTodaySelection = event.detail.dateKey === todayDateKey;
		const currentMinuteOfDay = isTodaySelection
			? getCurrentMinuteOfDay(bookingSelectionReferenceNow)
			: null;

		if (
			isTodaySelection &&
			currentMinuteOfDay != null &&
			event.detail.requestedMinuteOfDay < currentMinuteOfDay
		) {
			resetToDefaultTodaySelection(event.detail.dateKey);
			showPreviewMeeting = selectedStartMinuteOfDay != null;
			return;
		}

		if (
			room?.status === 'Upptagen' &&
			isTodaySelection &&
			currentOngoingMeetingEndMinuteOfDay != null &&
			event.detail.requestedMinuteOfDay < currentOngoingMeetingEndMinuteOfDay
		) {
			resetToDefaultTodaySelection(event.detail.dateKey);
			return;
		}

		selectedCalendarDateKey = event.detail.dateKey;
		selectedStartMinuteOfDay = event.detail.startMinuteOfDay;
		startOptionsAnchorMinuteOfDay = event.detail.startMinuteOfDay;
		selectedMeetingIdentity = null;
		selectedMeetingFallback = null;
		showPreviewMeeting = true;
	}

	function handleCalendarMeetingSelect(event: CustomEvent<CalendarMeetingSelection>) {
		const isTodaySelection = event.detail.dateKey === createDateKey(new Date());

		if (
			room?.status === 'Upptagen' &&
			isTodaySelection &&
			currentOngoingMeetingIdentity &&
			event.detail.meetingIdentity === currentOngoingMeetingIdentity
		) {
			clearCalendarSelection();
			return;
		}

		selectedCalendarDateKey = event.detail.dateKey;
		selectedStartMinuteOfDay = null;
		startOptionsAnchorMinuteOfDay = null;
		selectedMeetingIdentity = event.detail.meetingIdentity;
		selectedMeetingFallback = event.detail.meeting;
	}

	$: if (room?.email !== previousRoomEmail) {
		previousRoomEmail = room?.email ?? null;
		bookingSelectionReferenceNow = new Date();
		bookingSelectionReferenceDateKey = createDateKey(bookingSelectionReferenceNow);
		selectedCalendarDateKey = bookingSelectionReferenceDateKey;
		selectedCalendarMeetings = room?.todaysMeetings ?? [];
		selectedCalendarMeetingsLoaded = true;
		optimisticMeetings = [];
		hiddenMeetingIdentities = [];
		clearCalendarSelection();
		initializeDefaultOpenSelection(room);
	}

	async function handleBook() {
		if (!room || selectedStartMinuteOfDay == null) return;

		const bookedMeeting = await handleBooking(
			room,
			selectedBookingOption,
			selectedCalendarDateKey,
			selectedStartMinuteOfDay,
			dispatch
		);

		if (!bookedMeeting) {
			return;
		}

		optimisticMeetings = mergeMeetings(optimisticMeetings, [bookedMeeting]);
		selectedCalendarMeetings = mergeMeetings(selectedCalendarMeetings, [bookedMeeting]);
		selectedMeetingIdentity = getMeetingIdentity(bookedMeeting);
		selectedMeetingFallback = bookedMeeting;
		selectedStartMinuteOfDay = null;
		startOptionsAnchorMinuteOfDay = null;
	}

	function handleExtendBooking() {
		if (!room) return;
		return handleExtend(room, selectedExtendOption, dispatch);
	}

	async function handleCancelBooking() {
		if (!room) return;
		const meetingToCancel =
			sidebarState === 'meetingSelected' ? selectedMeetingFallback : room.currentMeeting;
		const canceledMeeting = await handleCancel(room, dispatch, meetingToCancel);

		if (!canceledMeeting || sidebarState !== 'meetingSelected') {
			return;
		}

		const canceledMeetingIdentity = getMeetingIdentity(canceledMeeting);
		optimisticMeetings = optimisticMeetings.filter(
			(meeting) => getMeetingIdentity(meeting) !== canceledMeetingIdentity
		);
		selectedCalendarMeetings = selectedCalendarMeetings.filter(
			(meeting) => getMeetingIdentity(meeting) !== canceledMeetingIdentity
		);
		hiddenMeetingIdentities = Array.from(
			new Set([...hiddenMeetingIdentities, canceledMeetingIdentity])
		);
		clearCalendarSelection();

		if (selectedCalendarDateKey === createDateKey(new Date())) {
			initializeDefaultOpenSelection(room);
		}
	}
</script>

{#if room}
	<div class="wrapper gap-4 text-text">
		<div class={`flex min-h-0 flex-row gap-4 ${extraClasses}`}>
			<RoomBookingSidebar
				{room}
				viewState={sidebarState}
				expanded={calendarExpanded}
				{isViewingToday}
				{selectedCalendarLabel}
				{showNextMeetingSummary}
				calendarDayLoaded={selectedCalendarMeetingsLoaded}
				hasSelectableSlots={hasSelectableSlots}
				canBookSelection={canBookSelection}
				{canExtend}
				{startTimeOptions}
				{bookingOptions}
				{extendOptions}
				selectedStartOption={selectedStartOption}
				selectedBookingOption={selectedBookingOptionItem}
				selectedExtendOption={selectedExtendOptionItem}
				selectedMeeting={selectedMeetingFallback}
				{canCancelSelectedMeeting}
				{selectedMeetingCancelMessage}
				on:startoffsetchange={(event) => {
					selectedStartMinuteOfDay = event.detail;
					startOptionsAnchorMinuteOfDay = event.detail;
					showPreviewMeeting = true;
				}}
				on:bookingoptionchange={(event) => {
					selectedBookingOption = event.detail;
					showPreviewMeeting = true;
				}}
				on:extendoptionchange={(event) => (selectedExtendOption = event.detail)}
				on:book={handleBook}
				on:extend={handleExtendBooking}
				on:cancel={handleCancelBooking}
			/>

			<div
				class={`min-h-0 min-w-0 flex-1 transition-[max-width] duration-300 ease-out ${
					calendarExpanded ? 'max-w-none' : 'max-w-[400px]'
				}`}
			>
				{#key room.email}
					<DailyCalendar
						roomEmail={room.email}
						todaysMeetings={room.todaysMeetings ?? []}
						{optimisticMeetings}
						{hiddenMeetingIdentities}
						{previewMeeting}
						selectedMeetingIdentity={calendarHighlightedMeetingIdentity}
						on:layoutchange={handleCalendarLayoutChange}
						on:selectionchange={handleCalendarSelectionChange}
						on:slotselect={handleCalendarSlotSelect}
						on:meetingselect={handleCalendarMeetingSelect}
					/>
				{/key}
			</div>
		</div>
	</div>
{/if}
