<script lang="ts">
    import FloorPlan from '$lib/components/FloorPlan.svelte';
    import { getRoomStatus } from '$lib/utils/api/api.js';
    import { onDestroy } from 'svelte';
    import type { Meeting, Room } from '$lib/types/roomTypes';
    import RoomBookingContent from '$lib/components/popup-content/RoomBookingContent.svelte';
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';

    import TabWrapper from '$lib/components/ui/tab-wrapper/TabWrapper.svelte';
    import type { TabOption } from '$lib/types/tabTypes';
    import OngoingMeetings from '$lib/components/tab-content/ongoing-meetings/OngoingMeetings.svelte';

    export let data: { rooms: Room[]; ongoingMeetings: Meeting[]; upcomingMeetings: Meeting[] };

    let rooms: Room[] = data.rooms;
    let ongoingMeetings: Meeting[] = data.ongoingMeetings;
    let upcomingMeetings: Meeting[] = data.upcomingMeetings;
    let selectedRoom: Room | null = null;
    let pollingInterval: NodeJS.Timeout;

    async function fetchRooms() {
        try {
            const {
                rooms: fetchedRooms,
                ongoingMeetings: fetchedOngoingMeetings,
                upcomingMeetings: fetchedUpcomingMeetings,
            } = await getRoomStatus();

            rooms = fetchedRooms;
            ongoingMeetings = fetchedOngoingMeetings;
            upcomingMeetings = fetchedUpcomingMeetings;

            selectedRoom = rooms.find((room) => room.email === selectedRoom?.email) || null;
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    }

    function startPolling() {
        pollingInterval = setInterval(fetchRooms, 5000);
    }

    function resetPollingAndFetch() {
        if (pollingInterval) clearInterval(pollingInterval);
        fetchRooms();
        startPolling();
    }

    startPolling();

    onDestroy(() => {
        if (pollingInterval) clearInterval(pollingInterval);
    });

    function handleRoomClick(event: CustomEvent<string>) {
        const roomEmail = event.detail;
        selectedRoom = rooms.find((room) => room.email === roomEmail) || null;
    }

    function closePopup() {
        selectedRoom = null;
    }

    let tabOptions: TabOption[] = [
        { id: 'ongoing', label: 'Pågående', icon: 'OngoingMeeting', selected: true },
        { id: 'upcoming', label: 'Kommande', icon: 'UpcomingMeeting', selected: false },
    ];

    function handleTabChange(event: CustomEvent<string>) {
        const selectedTabId = event.detail;
        tabOptions = tabOptions.map((tab) => ({
            ...tab,
            selected: tab.id === selectedTabId,
        }));
    }
</script>

<main class="relative w-full h-screen flex justify-center items-center overflow-hidden">
    <div class="floorplan-container relative w-full max-w-6xl h-full">
        <div class="absolute top-20 right-[125px] z-10">
            <TabWrapper {tabOptions} on:tabChange={handleTabChange}>
                {#if tabOptions[0].selected}
                    <OngoingMeetings {ongoingMeetings} />
                {/if}
                {#if tabOptions[1].selected}
                    upkommande
                {/if}
            </TabWrapper>
        </div>

        <FloorPlan {rooms} on:roomclick={handleRoomClick} />
    </div>

    {#if selectedRoom}
        <PopupWrapper header={selectedRoom.name} icon="MeetingRoom" on:close={closePopup}>
            <RoomBookingContent
                room={selectedRoom}
                extraClasses="min-h-[400px]"
                on:bookingUpdated={resetPollingAndFetch}
            />
        </PopupWrapper>
    {/if}
</main>

<style>
    .floorplan-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .floorplan-container > div:first-child {
        position: absolute;
        z-index: 10;
    }
</style>
