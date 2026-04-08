<script lang="ts">
    import FloorPlan from '$lib/components/FloorPlan.svelte';
    import LeftMeetings from './LeftMeetings.svelte';

    import { getRoomStatus } from '$lib/utils/api/api.js';
    import { onDestroy } from 'svelte';
    import type { Meeting, MeetingRoom } from '$lib/types/roomTypes';
    import { openRoomPopup, updateRoomInPopupIfOpen } from '$lib/stores/roomPopupStore';
    import { openOfficeRoomPopup } from '$lib/stores/officeRoomPopupStore';
    import { officeRooms } from '$lib/officeRooms';

    export let meetingRooms: MeetingRoom[] = [];
    export let ongoingMeetings: Meeting[] = [];
    export let upcomingMeetings: Meeting[] = [];

    let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
    const isBrowser = typeof window !== 'undefined';
    const POLL_INTERVAL_MS = 1000;

    async function fetchRooms() {
        try {
            const {
                rooms: fetchedRooms,
                ongoingMeetings: fetchedOngoing,
                upcomingMeetings: fetchedUpcoming,
            } = await getRoomStatus();

            meetingRooms = fetchedRooms;
            ongoingMeetings = fetchedOngoing;
            upcomingMeetings = fetchedUpcoming;

            for (const room of meetingRooms) updateRoomInPopupIfOpen(room);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    }

    async function pollLoop() {
        await fetchRooms();
        pollingTimeout = setTimeout(pollLoop, POLL_INTERVAL_MS);
    }

    function startPolling(immediate = false) {
        stopPolling();
        if (immediate) {
            pollLoop();
        } else {
            pollingTimeout = setTimeout(pollLoop, POLL_INTERVAL_MS);
        }
    }

    function stopPolling() {
        if (pollingTimeout) {
            clearTimeout(pollingTimeout);
            pollingTimeout = null;
        }
    }

    if (isBrowser) startPolling(true);

    type RoomClickDetail = {
        roomId: string;
        roomMail?: string;
    };

    function handleRoomClick(event: CustomEvent<RoomClickDetail>) {
        const { roomMail, roomId } = event.detail;

        if (roomMail) {
            const room = meetingRooms.find((r) => r.email === roomMail);
            if (room) openRoomPopup(room, { onBookingUpdated: resetPollingAndFetch });
            return;
        }

        const officeRoom = officeRooms[roomId];
        if (officeRoom) openOfficeRoomPopup(officeRoom);
    }

    async function resetPollingAndFetch() {
        stopPolling();
        try {
            await fetchRooms();
        } finally {
            startPolling();
        }
    }

    onDestroy(() => {
        if (!isBrowser) return;
        stopPolling();
    });
</script>

<main
    class="grid h-screen w-screen min-h-0 min-w-0 overflow-hidden grid-cols-[clamp(300px,26vw,420px)_1fr] items-stretch gap-6 bg-white p-10"
>
    <LeftMeetings {ongoingMeetings} {upcomingMeetings} />

    <div
        class="relative flex h-full w-full min-h-0 min-w-0 items-center justify-end overflow-hidden"
    >
        <FloorPlan {meetingRooms} on:roomclick={handleRoomClick} />
    </div>
</main>

<style>
</style>
