<script lang="ts">
    import MapView from '$lib/components/map-view/MapView.svelte';
    import type { Meeting, Room } from '$lib/types/roomTypes';

    export let data: {
        rooms: Room[];
        ongoingMeetings: Meeting[];
        upcomingMeetings: Meeting[];
        error?: string;
    };
</script>

{#if data.error}
    <p class="text-red-500 p-4">Kunde inte hämta rum: {data.error}</p>
{/if}

<MapView
    rooms={data.rooms}
    ongoingMeetings={data.ongoingMeetings}
    upcomingMeetings={data.upcomingMeetings}
/>
