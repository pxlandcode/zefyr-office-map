<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { Meeting } from '$lib/types/roomTypes';
    import {
        getMeetingIdentity,
        getNearestValidStartMinute,
        getSnappedMinuteOfDayFromOffset,
    } from '$lib/utils/helpers/bookingSelectionHelpers';
    import { fly } from 'svelte/transition';
    import CurrentTimeIndicator from './current-time-indicator/CurrentTimeIndicator.svelte';
    import MeetingSlot from './meeting-slot/MeetingSlot.svelte';

    export let container: HTMLDivElement | null = null;
    export let viewportWidth = 0;
    export let selectedDateKey: string;
    export let meetings: Meeting[] = [];
    export let previewMeeting: Meeting | null = null;
    export let selectedMeetingIdentity: string | null = null;
    export let validStartMinutes: number[] = [];
    export let hours: number[] = [];
    export let startHour: number;
    export let hourHeight: number;
    export let trackHeight: number;
    export let meetingHorizontalInset: number;
    export let showLoadingOverlay = false;
    export let paneFlyInX = 0;
    export let paneFlyOutX = 0;
    export let onScroll: (event: Event) => void = () => {};
    export let onTouchStart: (event: TouchEvent) => void = () => {};
    export let onTouchMove: (event: TouchEvent) => void = () => {};
    export let onTouchEnd: (event: TouchEvent) => void = () => {};
    export let onTouchCancel: () => void = () => {};

    const dispatch = createEventDispatcher<{
        slotselect: { requestedMinuteOfDay: number; startMinuteOfDay: number };
        meetingselect: Meeting;
    }>();

    function handleGridClick(event: MouseEvent) {
        const target = event.currentTarget;

        if (!(target instanceof HTMLDivElement)) {
            return;
        }

        const bounds = target.getBoundingClientRect();
        const requestedMinute = getSnappedMinuteOfDayFromOffset(event.clientY - bounds.top, hourHeight);
        const selectedMinute = getNearestValidStartMinute(requestedMinute, validStartMinutes);

        if (selectedMinute == null) {
            return;
        }

        dispatch('slotselect', {
            requestedMinuteOfDay: requestedMinute,
            startMinuteOfDay: selectedMinute
        });
    }

    function handleMeetingSelect(event: CustomEvent<Meeting>) {
        dispatch('meetingselect', event.detail);
    }

    function handleGridKeyDown(event: KeyboardEvent) {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();

        const selectedMinute = validStartMinutes[0];

        if (selectedMinute == null) {
            return;
        }

        dispatch('slotselect', {
            requestedMinuteOfDay: selectedMinute,
            startMinuteOfDay: selectedMinute
        });
    }
</script>

<div class="relative h-full min-h-0 w-full">
    {#if showLoadingOverlay}
        <div
            class="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-white/60 backdrop-blur-[2px]"
        >
            <p class="text-sm font-medium text-gray-500">Laddar kalender…</p>
        </div>
    {/if}

    <div
        bind:this={container}
        class="calendar-scroll day-swipe-surface relative h-full min-h-0 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-md"
        on:scroll={onScroll}
        on:touchstart|passive={onTouchStart}
        on:touchmove|passive={onTouchMove}
        on:touchend|passive={onTouchEnd}
        on:touchcancel={onTouchCancel}
    >
        <div class="relative" style={`height: ${trackHeight}px;`}>
            <div class="absolute inset-y-0 left-0 z-10 w-16 border-r border-gray-200 bg-white">
                {#each hours as hour, index}
                    <div
                        class="absolute left-0 w-full pl-[10px]"
                        style={`top: ${index * hourHeight}px; height: 0;`}
                    >
                        <div class="w-12 text-sm text-gray-500">
                            {hour === 0 ? '00:00' : `${hour}:00`}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="pointer-events-none absolute inset-0 z-20">
                <CurrentTimeIndicator {startHour} {hourHeight} lineWidth="100%" labelLeft={0} />
            </div>

            <div
                class="absolute inset-y-0 left-16 right-0 overflow-hidden"
                bind:clientWidth={viewportWidth}
            >
                {#key selectedDateKey}
                    <div
                        class="absolute inset-0 bg-white"
                        in:fly={{ x: paneFlyInX, opacity: 0, duration: 260 }}
                        out:fly={{ x: paneFlyOutX, opacity: 0, duration: 220 }}
                        role="button"
                        tabindex="0"
                        aria-label="Välj tid i dagskalendern"
                        on:click={handleGridClick}
                        on:keydown={handleGridKeyDown}
                    >
                        {#each hours as hour, index}
                            <div
                                class="absolute left-0 right-0 border-t border-dashed border-gray-300"
                                style={`top: ${index * hourHeight}px;`}
                            ></div>
                        {/each}

                        {#if previewMeeting}
                            <MeetingSlot
                                meeting={previewMeeting}
                                {startHour}
                                {hourHeight}
                                i={-1}
                                leftOffset={meetingHorizontalInset}
                                slotWidth={`calc(100% - ${meetingHorizontalInset * 2}px)`}
                                variant="preview"
                            />
                        {/if}

                        {#each meetings as meeting, index (meeting.id ?? `${selectedDateKey}-${meeting.startDate}-${meeting.endDate}-${index}`)}
                            <MeetingSlot
                                {meeting}
                                {startHour}
                                {hourHeight}
                                i={index}
                                leftOffset={meetingHorizontalInset}
                                slotWidth={`calc(100% - ${meetingHorizontalInset * 2}px)`}
                                interactive={true}
                                selected={getMeetingIdentity(meeting) === selectedMeetingIdentity}
                                on:select={handleMeetingSelect}
                            />
                        {/each}
                    </div>
                {/key}
            </div>
        </div>
    </div>
</div>
