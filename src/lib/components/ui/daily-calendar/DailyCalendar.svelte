<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { getCurrentTimeOffset } from '$lib/utils/helpers/calendarHelpers';
    import HourSlot from './hour-slot/HourSlot.svelte';
    import CurrentTimeIndicator from './current-time-indicator/CurrentTimeIndicator.svelte';
    import MeetingSlot from './meeting-slot/MeetingSlot.svelte';

    import type { Meeting } from '$lib/types/roomTypes';

    export let meetings: Meeting[] = [];

    const startHour = 0;
    const totalHours = 24;
    const hourHeight = 60;
    const initialScrollOffset = getCurrentTimeOffset(startHour, hourHeight) - hourHeight;

    let calendarContainer: HTMLDivElement | null = null;

    const scrollToInitialPosition = async () => {
        await tick();
        if (calendarContainer) {
            calendarContainer.scrollTop = initialScrollOffset;
        }
    };

    onMount(scrollToInitialPosition);
</script>

<div
    bind:this={calendarContainer}
    class="relative h-96 overflow-y-auto w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-md no-scrollbar"
>
    <div class="absolute top-0 left-0 w-full">
        {#each Array.from({ length: totalHours }, (_, i) => (startHour + i) % 24) as hour, index}
            <HourSlot {hour} {index} {hourHeight} />
        {/each}
    </div>

    <CurrentTimeIndicator {startHour} {hourHeight} />

    <div class="ml-16 relative">
        {#each meetings as meeting, i}
            <MeetingSlot {meeting} {startHour} {hourHeight} {i} />
        {/each}
    </div>
</div>

<style>
    .no-scrollbar {
        scrollbar-width: none; /* For Firefox */
    }

    .no-scrollbar::-webkit-scrollbar {
        display: none; /* For Chrome, Safari, and Edge */
    }
</style>
