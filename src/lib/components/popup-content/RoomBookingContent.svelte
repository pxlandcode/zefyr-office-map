<script lang="ts">
	import type { MeetingRoom } from '$lib/types/roomTypes';
	import { createEventDispatcher } from 'svelte';
	import DailyCalendar from '../ui/daily-calendar/DailyCalendar.svelte';
	import {
		generateTimeBookingOptions,
		handleBooking,
		handleCancel,
		handleExtend,
		MIN_BOOKING_MINUTES
	} from '$lib/utils/helpers/bookingHelpers';
	import {
		createDateKey,
		formatSelectedDayLabel,
		parseDateKey
	} from '$lib/utils/helpers/calendarHelpers';
	import RoomBookingSidebar from './room-booking/RoomBookingSidebar.svelte';
	import {
		type BookingSelectOption,
		canBookRoom,
		canExtendRoom,
		getAvailableMinutesForBooking,
		getNextMeeting,
		getSelectedOption,
		getStartTimeOptions
	} from './room-booking/roomBookingHelpers';

	export let room: MeetingRoom | null = null;
	export let extraClasses: string = '';

	const dispatch = createEventDispatcher();

	let selectedBookingOption: number = 30;
	let selectedExtendOption: number = 30;
	let selectedStartOffset: number = 0;

	let previousExtendMaxTime: number | null = null;
	let previousRemainingTime: number | null = null;
	let calendarExpanded = false;
	let selectedCalendarDateKey = createDateKey(new Date());
	let previousRoomEmail: string | null = null;

	let bookingOptions: BookingSelectOption[] = generateTimeBookingOptions(24 * 60);
	let extendOptions: BookingSelectOption[] = generateTimeBookingOptions(24 * 60);
	let startTimeOptions: BookingSelectOption[] = [{ value: 0, label: 'Nu' }];

	$: minutesUntilNextMeeting = room?.minutesUntilNextMeeting ?? null;
	$: startTimeOptions = getStartTimeOptions(minutesUntilNextMeeting);

	$: if (!startTimeOptions.find((option) => option.value === selectedStartOffset)) {
		selectedStartOffset = startTimeOptions[0]?.value ?? 0;
	}

	$: availableMinutesForBooking = getAvailableMinutesForBooking(
		minutesUntilNextMeeting,
		selectedStartOffset
	);

	$: bookingOptions = generateTimeBookingOptions(
		availableMinutesForBooking,
		null,
		minutesUntilNextMeeting != null &&
			minutesUntilNextMeeting - selectedStartOffset >= MIN_BOOKING_MINUTES
			? minutesUntilNextMeeting - selectedStartOffset
			: null
	);

	$: if (!bookingOptions.find((option) => option.value === selectedBookingOption)) {
		selectedBookingOption = bookingOptions[0]?.value ?? 0;
	}

	$: selectedBookingOptionItem = getSelectedOption(bookingOptions, selectedBookingOption);
	$: selectedStartOption = getSelectedOption(startTimeOptions, selectedStartOffset);

	$: if (
		room &&
		(room?.minutesUntilNextMeeting !== previousExtendMaxTime ||
			room?.currentMeetingEndsIn !== previousRemainingTime)
	) {
		previousExtendMaxTime = room?.minutesUntilNextMeeting;
		previousRemainingTime = room?.currentMeetingEndsIn;
		extendOptions = generateTimeBookingOptions(
			previousExtendMaxTime ?? 24 * 60,
			previousRemainingTime ?? null,
			room?.minutesUntilNextMeeting
		);
	}

	$: if (!extendOptions.find((option) => option.value === selectedExtendOption)) {
		selectedExtendOption = extendOptions[0]?.value ?? 0;
	}

	$: selectedExtendOptionItem = getSelectedOption(extendOptions, selectedExtendOption);
	$: nextMeeting = getNextMeeting(room?.todaysMeetings ?? []);
	$: isViewingToday = selectedCalendarDateKey === createDateKey(new Date());
	$: selectedCalendarLabel = formatSelectedDayLabel(parseDateKey(selectedCalendarDateKey));
	$: showNextMeetingSummary = Boolean(room?.minutesUntilNextMeeting && nextMeeting);
	$: canBook = canBookRoom(room, startTimeOptions, bookingOptions);
	$: canExtend = canExtendRoom(room, selectedExtendOption);

	function handleCalendarLayoutChange(event: CustomEvent<{ expanded: boolean }>) {
		calendarExpanded = Boolean(event.detail?.expanded);
		dispatch('calendarLayoutChange', event.detail);
	}

	function handleCalendarSelectionChange(
		event: CustomEvent<{ dateKey?: string; isToday?: boolean }>
	) {
		selectedCalendarDateKey = event.detail?.dateKey ?? createDateKey(new Date());
	}

	$: if (room?.email !== previousRoomEmail) {
		previousRoomEmail = room?.email ?? null;
		selectedCalendarDateKey = createDateKey(new Date());
	}

	function handleBook() {
		if (!room) return;
		return handleBooking(room, selectedBookingOption, selectedStartOffset, dispatch);
	}

	function handleExtendBooking() {
		if (!room) return;
		return handleExtend(room, selectedExtendOption, dispatch);
	}

	function handleCancelBooking() {
		if (!room) return;
		return handleCancel(room, dispatch);
	}
</script>

{#if room}
	<div class="wrapper gap-4 text-text">
		<div class={`flex min-h-0 flex-row gap-4 ${extraClasses}`}>
			<RoomBookingSidebar
				{room}
				expanded={calendarExpanded}
				{isViewingToday}
				{selectedCalendarLabel}
				{showNextMeetingSummary}
				{canBook}
				{canExtend}
				{startTimeOptions}
				{bookingOptions}
				{extendOptions}
				selectedStartOption={selectedStartOption}
				selectedBookingOption={selectedBookingOptionItem}
				selectedExtendOption={selectedExtendOptionItem}
				on:startoffsetchange={(event) => (selectedStartOffset = event.detail)}
				on:bookingoptionchange={(event) => (selectedBookingOption = event.detail)}
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
						on:layoutchange={handleCalendarLayoutChange}
						on:selectionchange={handleCalendarSelectionChange}
					/>
				{/key}
			</div>
		</div>
	</div>
{/if}
