<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
	import { formatTime, formatTimeInHoursAndMinutes } from '$lib/utils/helpers/calendarHelpers';
	import type { BookingSelectOption } from './roomBookingHelpers';
	import Button from '../../ui/button/Button.svelte';
	import Tag from '../../ui/tag/Tag.svelte';
	import Icon from '../../ui/icon-component/Icon.svelte';
	import HourglassIcon from '../../ui/hourglass-icon/HourglassIcon.svelte';
	import ClockIcon from '../../ui/clock-icon/ClockIcon.svelte';
	import OptionsButton from '../../ui/options-button/OptionsButton.svelte';

	type RoomBookingSidebarState =
		| 'defaultTodayStatus'
		| 'emptySelectedDay'
		| 'freeSlotSelected'
		| 'meetingSelected';

	export let room: MeetingRoom;
	export let viewState: RoomBookingSidebarState = 'defaultTodayStatus';
	export let expanded = false;
	export let isViewingToday = true;
	export let selectedCalendarLabel = '';
	export let showNextMeetingSummary = false;
	export let calendarDayLoaded = true;
	export let hasSelectableSlots = false;
	export let canBookSelection = false;
	export let canExtend = false;
	export let startTimeOptions: BookingSelectOption[] = [];
	export let bookingOptions: BookingSelectOption[] = [];
	export let extendOptions: BookingSelectOption[] = [];
	export let selectedStartOption: BookingSelectOption | null = null;
	export let selectedBookingOption: BookingSelectOption | null = null;
	export let selectedExtendOption: BookingSelectOption | null = null;
	export let selectedMeeting: Meeting | null = null;
	export let canCancelSelectedMeeting = false;
	export let selectedMeetingCancelMessage: string | null = null;

	const dispatch = createEventDispatcher();

	function handleStartTimeSelect(event: CustomEvent<number>) {
		dispatch('startoffsetchange', event.detail);
	}

	function handleBookingOptionSelect(event: CustomEvent<number>) {
		dispatch('bookingoptionchange', event.detail);
	}

	function handleExtendOptionSelect(event: CustomEvent<number>) {
		dispatch('extendoptionchange', event.detail);
	}
</script>

<div
	class="min-h-0 overflow-hidden transition-[width,opacity,transform] duration-300 ease-out"
	style={`width: ${expanded ? 0 : 400}px; opacity: ${expanded ? 0 : 1}; transform: translateX(${expanded ? -24 : 0}px); pointer-events: ${expanded ? 'none' : 'auto'};`}
	aria-hidden={expanded}
>
	<div class="flex h-full w-[400px] flex-col justify-between">
		<div class="space-y-4">
			{#if viewState === 'defaultTodayStatus'}
				{#if room.status === 'Upptagen'}
					<Tag color="red" text={room.status}></Tag>
				{:else}
					<div class="flex flex-row items-center justify-between">
						<Tag color="green" text={room.status}></Tag>
						{#if showNextMeetingSummary && room.minutesUntilNextMeeting}
							<p class="text-sm text-gray-500">
								{formatTimeInHoursAndMinutes(room.minutesUntilNextMeeting)} till nästa möte
							</p>
						{:else}
							<p class="text-sm text-gray-500">Tillgänglig resten av dagen</p>
						{/if}
					</div>
				{/if}

				{#if room.status === 'Upptagen'}
					<div class="flex items-center gap-1">
						<Icon icon="Person" size="14px" />
						<p>{room.currentMeetingOrganizer}</p>
					</div>
					{#if room.currentMeeting}
						<div class="flex items-center gap-1">
							<ClockIcon time={room.currentMeeting.startDate} size="14px" />
							<p>
								{formatTime(room.currentMeeting.startDate)} - {formatTime(room.currentMeeting.endDate)}
							</p>
						</div>
					{/if}
					<div class="flex items-center gap-1">
						<HourglassIcon size="14px" minutes={room.currentMeetingEndsIn} />
						<p>{room.currentMeetingEndsIn} minuter kvar på mötet</p>
					</div>
				{:else}
					<p class="text-sm text-gray-500">
						{#if !calendarDayLoaded}
							Laddar dagens bokningar…
						{:else if hasSelectableSlots}
							Klicka i kalendern för att välja en ledig starttid.
						{:else}
							Det finns ingen ledig bokningstid kvar idag.
						{/if}
					</p>
				{/if}
			{:else if viewState === 'emptySelectedDay'}
				<p class="text-sm text-gray-500">
					{#if !calendarDayLoaded}
						Laddar bokningar för den valda dagen…
					{:else if hasSelectableSlots}
						Klicka i kalendern för att välja en ledig starttid.
					{:else}
						Det finns inga lediga bokningsbara tider på den valda dagen.
					{/if}
				</p>
			{:else if viewState === 'freeSlotSelected'}
				{#if isViewingToday}
					<div class="flex flex-row items-center justify-between">
						<Tag color={room.status === 'Upptagen' ? 'red' : 'green'} text={room.status}></Tag>
						{#if room.status === 'Upptagen' && room.currentMeetingEndsIn != null}
							<p class="text-sm text-gray-500">
								{room.currentMeetingEndsIn} minuter kvar av pågående möte
							</p>
						{:else if showNextMeetingSummary && room.minutesUntilNextMeeting}
							<p class="text-sm text-gray-500">
								{formatTimeInHoursAndMinutes(room.minutesUntilNextMeeting)} till nästa möte
							</p>
						{:else}
							<p class="text-sm text-gray-500">Tillgänglig resten av dagen</p>
						{/if}
					</div>
				{:else}
					<div></div>
				{/if}
			{:else if viewState === 'meetingSelected' && selectedMeeting}
				<Tag color="gray" text="Bokning"></Tag>
				<div class="space-y-2">
					<p class="text-lg font-semibold capitalize">{selectedCalendarLabel}</p>
					<div class="flex items-center gap-1">
						<Icon icon="Person" size="14px" />
						<p>{selectedMeeting.organizer}</p>
					</div>
					<div class="flex items-center gap-1">
						<ClockIcon time={selectedMeeting.startDate} size="14px" />
						<p>{formatTime(selectedMeeting.startDate)} - {formatTime(selectedMeeting.endDate)}</p>
					</div>
				</div>
			{/if}
		</div>

		<div class="space-y-4">
			{#if viewState === 'defaultTodayStatus' && isViewingToday && room.status === 'Upptagen'}
				{#if canExtend}
					<div class="flex flex-col gap-2">
						<label for="bookingTime" class="text-sm font-medium text-gray-600">
							Välj bokningstid:
						</label>

						<OptionsButton
							options={extendOptions}
							selectedOption={selectedExtendOption}
							on:select={handleExtendOptionSelect}
							type="secondary"
						/>
					</div>
					<Button type="secondary" fullWidth on:click={() => dispatch('extend')}>Förläng</Button>
				{/if}
				<Button type="cancel" fullWidth on:click={() => dispatch('cancel')}>Avboka</Button>
			{/if}

			{#if viewState === 'freeSlotSelected'}
				<div class="flex flex-col gap-2">
					<label for="startTime" class="text-sm font-medium text-gray-600"> Välj starttid: </label>

					<OptionsButton
						options={startTimeOptions}
						selectedOption={selectedStartOption}
						on:select={handleStartTimeSelect}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label for="bookingTime" class="text-sm font-medium text-gray-600">
						Välj bokningstid:
					</label>

					<OptionsButton
						options={bookingOptions}
						selectedOption={selectedBookingOption}
						on:select={handleBookingOptionSelect}
					/>
				</div>

				{#if canBookSelection}
					<Button type="primary" fullWidth on:click={() => dispatch('book')}>Boka</Button>
				{:else}
					<p class="text-sm text-gray-500">
						Den valda starttiden har inte tillräckligt med ledig tid kvar.
					</p>
				{/if}
			{/if}

			{#if viewState === 'meetingSelected' && selectedMeeting}
				{#if canCancelSelectedMeeting}
					<Button type="cancel" fullWidth on:click={() => dispatch('cancel')}>Avboka</Button>
				{:else if selectedMeetingCancelMessage}
					<p class="text-sm text-gray-500">{selectedMeetingCancelMessage}</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
