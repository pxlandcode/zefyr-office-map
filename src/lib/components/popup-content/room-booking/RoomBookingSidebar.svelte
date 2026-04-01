<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { MeetingRoom } from '$lib/types/roomTypes';
	import { formatTimeInHoursAndMinutes } from '$lib/utils/helpers/calendarHelpers';
	import type { BookingSelectOption } from './roomBookingHelpers';
	import Button from '../../ui/button/Button.svelte';
	import Tag from '../../ui/tag/Tag.svelte';
	import Icon from '../../ui/icon-component/Icon.svelte';
	import HourglassIcon from '../../ui/hourglass-icon/HourglassIcon.svelte';
	import OptionsButton from '../../ui/options-button/OptionsButton.svelte';

	export let room: MeetingRoom;
	export let expanded = false;
	export let isViewingToday = true;
	export let selectedCalendarLabel = '';
	export let showNextMeetingSummary = false;
	export let canBook = false;
	export let canExtend = false;
	export let startTimeOptions: BookingSelectOption[] = [];
	export let bookingOptions: BookingSelectOption[] = [];
	export let extendOptions: BookingSelectOption[] = [];
	export let selectedStartOption: BookingSelectOption | null = null;
	export let selectedBookingOption: BookingSelectOption | null = null;
	export let selectedExtendOption: BookingSelectOption | null = null;

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
			{#if !isViewingToday}
				<Tag color="gray" text="Vald dag"></Tag>
				<div class="space-y-2">
					<p class="text-lg font-semibold capitalize">{selectedCalendarLabel}</p>
					<p class="text-sm text-gray-500">
						Bokningspanelen visar bara dagens status och åtgärder.
					</p>
				</div>
			{:else if room.status === 'Upptagen'}
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

			{#if isViewingToday && room.status === 'Upptagen'}
				<div class="flex items-center gap-1">
					<Icon icon="Person" size="14px" />
					<p>{room.currentMeetingOrganizer}</p>
				</div>
				<div class="flex items-center gap-1">
					<HourglassIcon size="14px" minutes={room.currentMeetingEndsIn} />
					<p>{room.currentMeetingEndsIn} minuter</p>
				</div>
			{/if}
		</div>

		<div class="space-y-4">
			{#if isViewingToday && room.status === 'Upptagen'}
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
					<Button type="secondary" fullWidth on:click={() => dispatch('extend')}
						>Förläng</Button
					>
				{/if}
				<Button type="cancel" fullWidth on:click={() => dispatch('cancel')}>Avboka</Button>
			{/if}

			{#if isViewingToday && room.status === 'Ledig' && canBook}
				<div class="flex flex-col gap-2">
					<label for="startTime" class="text-sm font-medium text-gray-600">
						Välj starttid:
					</label>

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

				<Button type="primary" fullWidth on:click={() => dispatch('book')}>Boka</Button>
			{/if}
		</div>
	</div>
</div>
