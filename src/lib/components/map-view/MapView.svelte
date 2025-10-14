<script lang="ts">
    import FloorPlan from '$lib/components/FloorPlan.svelte';
    import { getRoomStatus } from '$lib/utils/api/api.js';
    import { onDestroy } from 'svelte';
    import type { Meeting, Room } from '$lib/types/roomTypes';
    import TabWrapper from '$lib/components/ui/tab-wrapper/TabWrapper.svelte';
    import type { TabOption } from '$lib/types/tabTypes';
    import OngoingMeetings from '../tab-content/ongoing-meetings/OngoingMeetings.svelte';
    import UpcomingMeetings from '../tab-content/upcoming-meetings/UpcomingMeetings.svelte';

    import { openRoomPopup, updateRoomInPopupIfOpen } from '$lib/stores/roomPopupStore'; // ⟵ NEW

    export let rooms: Room[] = [];
    export let ongoingMeetings: Meeting[] = [];
    export let upcomingMeetings: Meeting[] = [];

    // polling
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let tabRotationInterval: ReturnType<typeof setInterval> | null = null;
    const TAB_ROTATION_DELAY = 10_000;
    const isBrowser = typeof window !== 'undefined';

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

            for (const r of rooms) updateRoomInPopupIfOpen(r);
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
        if (room) {
            openRoomPopup(room, { onBookingUpdated: resetPollingAndFetch });
        }
    }

    function resetPollingAndFetch() {
        stopPolling();
        fetchRooms().finally(startPolling);
    }

    function setActiveTab(tabId: string) {
        tabOptions = tabOptions.map((tab) => ({ ...tab, selected: tab.id === tabId }));
    }

    function rotateTabs() {
        const currentIndex = tabOptions.findIndex((tab) => tab.selected);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tabOptions.length;
        const nextTab = tabOptions[nextIndex];
        setActiveTab(nextTab.id);
    }

    function startTabRotation() {
        if (tabOptions.length <= 1) return;
        stopTabRotation();
        tabRotationInterval = setInterval(rotateTabs, TAB_ROTATION_DELAY);
    }

    function stopTabRotation() {
        if (tabRotationInterval) {
            clearInterval(tabRotationInterval);
            tabRotationInterval = null;
        }
    }

    let tabOptions: TabOption[] = [
        { id: 'ongoing', label: 'Pågående', icon: 'OngoingMeeting', selected: true },
        { id: 'upcoming', label: 'Kommande', icon: 'UpcomingMeeting', selected: false },
    ];

    function handleTabChange(event: CustomEvent<string>) {
        const selectedTabId = event.detail;
        setActiveTab(selectedTabId);
        startTabRotation();
    }

    if (isBrowser) {
        startPolling();
        startTabRotation();
    }

    onDestroy(() => {
        if (!isBrowser) return;
        stopPolling();
        stopTabRotation();
    });
</script>

<main class="relative flex h-screen w-full items-center justify-center overflow-hidden">
    <div class="floorplan-container">
        <div class="tab-wrapper-overlay">
            <TabWrapper {tabOptions} on:tabChange={handleTabChange}>
                {#if tabOptions[0].selected}
                    <OngoingMeetings {ongoingMeetings} />
                {/if}
                {#if tabOptions[1].selected}
                    <UpcomingMeetings {upcomingMeetings} />
                {/if}
            </TabWrapper>
        </div>

        <FloorPlan {rooms} on:roomclick={handleRoomClick} />
    </div>
</main>

<style>
    .floorplan-container {
        position: relative;
        display: flex;
        align-items: stretch;
        justify-content: center;
        align-items: center;
        --map-height-ratio: 0.75; /* FloorPlan viewBox height (600) / width (800) */
        width: min(72rem, 100%, 100vw, 100vh);
        aspect-ratio: 1 / 1;
    }
    .tab-wrapper-overlay {
        position: absolute;
        top: calc(((1 - var(--map-height-ratio)) * 50%) + (var(--map-height-ratio) * 3%));
        left: 74%;
        transform: translate(-50%, 0);
        width: clamp(360px, 28vw, 460px);
        max-height: calc(var(--map-height-ratio) * 72%);
        display: flex;
        z-index: 10;
    }
    .tab-wrapper-overlay :global(.tab-wrapper) {
        width: 100%;
        height: auto;
        max-height: 100%;
    }
</style>
