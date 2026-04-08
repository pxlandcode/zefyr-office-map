<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatTime, getMeetingHeight, getTopOffset } from '$lib/utils/helpers/calendarHelpers';
	import type { Meeting } from '$lib/types/roomTypes';
	import ClockIcon from '../../clock-icon/ClockIcon.svelte';
	import Icon from '../../icon-component/Icon.svelte';

	export let meeting: Meeting;
	export let startHour: number;
	export let hourHeight: number;
	export let i: number;
	export let leftOffset = 0;
	export let slotWidth = 'calc(100% - 2rem)';
	export let compact = false;
	export let interactive = false;
	export let selected = false;
	export let variant: 'existing' | 'preview' = 'existing';

	const dispatch = createEventDispatcher<{ select: Meeting }>();

	$: topOffset = getTopOffset(meeting.startDate, startHour, hourHeight);
	$: meetingHeight = getMeetingHeight(meeting.startDate, meeting.endDate, hourHeight);
	$: layoutClass = compact || meetingHeight >= 45 ? 'flex-col' : 'flex-row';
	$: isGreenSlot = i % 2 === 0;
	$: baseColorClass =
		variant === 'preview'
			? 'border-gray-400 text-gray-600 opacity-95'
			: selected
				? isGreenSlot
					? 'border-green text-green opacity-100'
					: 'border-blue text-blue opacity-100'
				: isGreenSlot
					? 'border-green bg-white text-green opacity-80'
					: 'border-blue bg-white text-blue opacity-80';
	$: backgroundColor =
		variant === 'preview'
			? 'rgba(229, 231, 235, 0.34)'
			: selected
				? isGreenSlot
					? 'rgba(41, 121, 61, 0.10)'
					: 'rgba(59, 130, 246, 0.10)'
				: 'white';
	$: selectedClass =
		variant === 'preview'
			? 'shadow-sm slot-pulse'
			: selected
				? 'shadow-sm slot-pulse'
				: 'shadow-sm';
	$: wrapperClass =
		variant === 'preview'
			? 'pointer-events-none border-2 border-dashed'
			: interactive
				? 'border-2 border-dashed transition-[box-shadow,background-color,opacity,filter] duration-200 hover:opacity-100 hover:shadow-md focus:outline-none'
				: 'border-2 border-dashed';
	$: sharedClass = `absolute overflow-hidden rounded-md font-bold text-left text-xs flex items-center ${wrapperClass} ${baseColorClass} ${selectedClass}`;
	$: sharedStyle = `
        top: ${topOffset}px;
        height: ${meetingHeight}px;
        left: ${leftOffset}px;
        width: ${slotWidth};
        background-color: ${backgroundColor};
    `;

	function handleClick(event: MouseEvent) {
		if (!interactive) {
			return;
		}

		event.stopPropagation();
		dispatch('select', meeting);
	}
</script>

{#if interactive}
	<button
		type="button"
		class={`${sharedClass} cursor-pointer`}
		style={sharedStyle}
		aria-pressed={selected}
		on:click={handleClick}
	>
		<div class={`flex px-2 py-1 ${layoutClass} gap-1`}>
			<div class="flex items-center gap-1">
				<Icon icon="Person" size="14px" />
				<p class="truncate">{meeting.organizer}</p>
			</div>
			<div class="flex items-center gap-1">
				<ClockIcon time={meeting.startDate} size="14px" />
				<p class="truncate">{formatTime(meeting.startDate)} - {formatTime(meeting.endDate)}</p>
			</div>
		</div>
	</button>
{:else}
	<div class={sharedClass} style={sharedStyle}>
		<div class={`flex px-2 py-1 ${layoutClass} gap-1`}>
			<div class="flex items-center gap-1">
				<Icon icon="Person" size="14px" />
				<p class="truncate">{meeting.organizer}</p>
			</div>
			<div class="flex items-center gap-1">
				<ClockIcon time={meeting.startDate} size="14px" />
				<p class="truncate">{formatTime(meeting.startDate)} - {formatTime(meeting.endDate)}</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.slot-pulse {
		animation: slotPulse 3.4s ease-in-out infinite;
		will-change: filter, opacity;
	}

	@keyframes slotPulse {
		0%,
		100% {
			opacity: 0.88;
			filter: saturate(1) brightness(1);
		}

		50% {
			opacity: 1;
			filter: saturate(1.22) brightness(1.06);
		}
	}
</style>
