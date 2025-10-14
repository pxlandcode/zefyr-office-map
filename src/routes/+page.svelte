<script lang="ts">
    import MapView from '$lib/components/map-view/MapView.svelte';
    import type { Meeting, Room } from '$lib/types/roomTypes';

    export let data: {
        rooms: Room[];
        ongoingMeetings: Meeting[];
        upcomingMeetings: Meeting[];
        error?: string;
        errors?: { room: string; error: string }[];
    };
</script>

{#if data.error}
    <p class="text-red-500 p-4">Kunde inte hämta rum: {data.error}</p>
{/if}

{#if data.errors && data.errors.length > 0}
    <div class="p-4 bg-yellow-100 text-yellow-900 border border-yellow-300 rounded">
        <p class="font-semibold">Vissa rum kunde inte uppdateras:</p>
        <ul class="list-disc pl-6 mt-2 space-y-1">
            {#each data.errors as item (item.room)}
                <li>
                    <span class="font-medium">{item.room}</span>: {item.error}
                </li>
            {/each}
        </ul>
        <p class="mt-2 text-sm">
            Visar senast kända data tills anslutningen till Microsoft Graph fungerar igen.
        </p>
    </div>
{/if}

<MapView
    rooms={data.rooms}
    ongoingMeetings={data.ongoingMeetings}
    upcomingMeetings={data.upcomingMeetings}
/>
