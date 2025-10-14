<script lang="ts">
    import Icon from '$lib/components/ui/icon-component/Icon.svelte';
    import type { Meeting } from '$lib/types/roomTypes';

    export let upcomingMeetings: Meeting[] = [];

    const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    function formatTimeRange(startDate: string, endDate: string) {
        const startLabel = timeFormatter.format(new Date(startDate));
        const endLabel = timeFormatter.format(new Date(endDate));
        return `${startLabel} – ${endLabel}`;
    }

    function formatStartsIn(startDate: string) {
        const now = new Date();
        const start = new Date(startDate);
        const diffMs = start.getTime() - now.getTime();

        if (diffMs <= 0) return 'Startar nu';

        const totalMinutes = Math.round(diffMs / 60000);
        if (totalMinutes < 60) {
            return `Startar om ${totalMinutes} min`;
        }

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (minutes === 0) {
            return `Startar om ${hours} h`;
        }
        return `Startar om ${hours} h ${minutes} min`;
    }
</script>

<div class="flex h-full flex-col gap-3">
    {#if upcomingMeetings.length === 0}
        <p class="text-sm text-gray-500">Inga kommande möten hittades.</p>
    {:else}
        {#each upcomingMeetings as meeting}
            <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <div class="flex items-center justify-between gap-2 text-sm text-gray-500">
                    <div class="flex items-center gap-2 font-medium text-gray-700">
                        <Icon icon="MeetingRoom" size="14px" />
                        <span>{meeting.roomName ?? 'Okänt rum'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <Icon icon="Clock" size="14px" />
                        <span class="font-semibold text-gray-700">{formatTimeRange(meeting.startDate, meeting.endDate)}</span>
                    </div>
                </div>

                <div class="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                        <Icon icon="Person" size="14px" />
                        <span>{meeting.organizer}</span>
                    </div>
                    <span class="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500">
                        {formatStartsIn(meeting.startDate)}
                    </span>
                </div>
            </div>
        {/each}
    {/if}
</div>
