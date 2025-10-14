<script lang="ts">
    import MeetingProgressIndicator from '$lib/components/ui/meeting-progress-indicator/MeetingProgressIndicator.svelte';
    import type { Meeting } from '$lib/types/roomTypes';
    import Icon from '../../ui/icon-component/Icon.svelte';

    export let ongoingMeetings: Meeting[] = [];
</script>

<div>
    {#each ongoingMeetings as meeting}
        <div class="meeting-item">
            <div class="flex flex-row justify-between">
                <div class="flex items-center gap-2">
                    <Icon icon="MeetingRoom" size="14px" />
                    <p class="font-semibold">{meeting.roomName}</p>
                </div>

                <div class="flex items-center gap-2">
                    <p>{meeting.organizer}</p>
                </div>
            </div>

            <MeetingProgressIndicator
                startDate={meeting.startDate}
                endDate={meeting.endDate}
                showProgress
            />
        </div>
    {/each}
</div>
