<script lang="ts">
    import { formatTime, getTopOffset, getMeetingHeight } from '$lib/utils/helpers/calendarHelpers';
    import type { Meeting } from '$lib/types/roomTypes';
    import ClockIcon from '../../clock-icon/ClockIcon.svelte';
    import Icon from '../../icon-component/Icon.svelte';

    export let meeting: Meeting;
    export let startHour: number;
    export let hourHeight: number;
    export let i: number;

    $: topOffset = getTopOffset(meeting.startDate, startHour, hourHeight);
    $: meetingHeight = getMeetingHeight(meeting.startDate, meeting.endDate, hourHeight);

    $: layoutClass = meetingHeight >= 45 ? 'flex-col' : 'flex-row';
</script>

<div
    class={`absolute border-2 border-dashed bg-white opacity-80 left-0 w-[calc(100%-2rem)] ${
        i % 2 === 0 ? 'border-green text-green' : 'border-blue-500 text-blue-500'
    } rounded-md shadow-sm font-bold text-xs flex items-center`}
    style="
        top: {topOffset}px;
        height: {meetingHeight}px;
    "
>
    <div class="px-2 py-1 flex {layoutClass} gap-1">
        <div class="flex items-center gap-1">
            <Icon icon="Person" size="14px" />
            <p>{meeting.organizer}</p>
        </div>
        <div class="flex items-center gap-1">
            <ClockIcon time={meeting.startDate} size="14px" />
            <p>{formatTime(meeting.startDate)} - {formatTime(meeting.endDate)}</p>
        </div>
    </div>
</div>
