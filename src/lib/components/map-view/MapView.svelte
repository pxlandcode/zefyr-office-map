<script lang="ts">
    import FloorPlan from '$lib/components/FloorPlan.svelte';
    import LeftMeetings from './LeftMeetings.svelte';

    import { getRoomStatus } from '$lib/utils/api/api.js';
    import { onDestroy } from 'svelte';
    import type { Meeting, Room } from '$lib/types/roomTypes';
    import { openRoomPopup, updateRoomInPopupIfOpen } from '$lib/stores/roomPopupStore';

    export let rooms: Room[] = [];
    export let ongoingMeetings: Meeting[] = [];
    export let upcomingMeetings: Meeting[] = [];

    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    const isBrowser = typeof window !== 'undefined';

    async function fetchRooms() {
        try {
            const {
                rooms: fetchedRooms,
                ongoingMeetings: fetchedOngoing,
                upcomingMeetings: fetchedUpcoming,
            } = await getRoomStatus();

            rooms = fetchedRooms;
            ongoingMeetings = fetchedOngoing;
            upcomingMeetings = fetchedUpcoming;

            for (const room of rooms) updateRoomInPopupIfOpen(room);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    }

    function startPolling() {
        stopPolling();
        pollingInterval = setInterval(fetchRooms, 5000);
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    function handleRoomClick(event: CustomEvent<string>) {
        const roomEmail = event.detail;
        const room = rooms.find((r) => r.email === roomEmail);
        if (room) openRoomPopup(room, { onBookingUpdated: resetPollingAndFetch });
    }

    function resetPollingAndFetch() {
        stopPolling();
        fetchRooms().finally(startPolling);
    }

    if (isBrowser) startPolling();

    onDestroy(() => {
        if (!isBrowser) return;
        stopPolling();
    });
</script>

<main
    class="grid min-h-screen w-full grid-cols-[clamp(300px,26vw,420px)_1fr] items-start gap-6 p-8 bg-gray-50"
>
    <LeftMeetings {ongoingMeetings} {upcomingMeetings} />

    <div class="relative flex h-full w-full items-start justify-end">
        <FloorPlan {rooms} on:roomclick={handleRoomClick} />
    </div>
</main>

<style>
    main {
        background: #ffffff;
    }
</style>
