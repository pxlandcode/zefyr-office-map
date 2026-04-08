<script lang="ts">
    import { roomPopup, closeRoomPopup } from '$lib/stores/roomPopupStore';
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
    import RoomBookingContent from '$lib/components/popup-content/RoomBookingContent.svelte';
    import type { MeetingRoom } from '$lib/types/roomTypes';

    let open = false;
    let room: MeetingRoom | null = null;
    let onBookingUpdated: (() => void) | undefined;
    let calendarExpanded = false;
    let previousRoomEmail: string | null = null;

    const unsub = roomPopup.subscribe((s) => {
        open = s.open;
        room = s.room;
        onBookingUpdated = s.onBookingUpdated;
    });

    function handleClose() {
        calendarExpanded = false;
        closeRoomPopup();
    }
    function handleBookingUpdated() {
        onBookingUpdated?.();
    }

    function handleCalendarLayoutChange(event: CustomEvent<{ expanded: boolean }>) {
        calendarExpanded = Boolean(event.detail?.expanded);
    }

    $: if (room?.email !== previousRoomEmail) {
        previousRoomEmail = room?.email ?? null;
        calendarExpanded = false;
    }

    $: popupWidth = calendarExpanded ? '1220px' : '860px';
    $: contentHeightClass = calendarExpanded ? 'h-[560px]' : 'h-[400px]';

    import { onDestroy } from 'svelte';
    onDestroy(unsub);
</script>

{#if room}
    <PopupWrapper
        {open}
        header={room.name}
        width={popupWidth}
        icon="MeetingRoom"
        on:close={handleClose}
        z={60}
    >
        <RoomBookingContent
            {room}
            extraClasses={contentHeightClass}
            on:bookingUpdated={handleBookingUpdated}
            on:calendarLayoutChange={handleCalendarLayoutChange}
        />
    </PopupWrapper>
{/if}
