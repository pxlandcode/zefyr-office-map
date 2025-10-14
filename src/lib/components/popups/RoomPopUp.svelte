<script lang="ts">
    import { roomPopup, closeRoomPopup } from '$lib/stores/roomPopupStore';
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
    import RoomBookingContent from '$lib/components/popup-content/RoomBookingContent.svelte';

    let open = false;
    let room = null;
    let onBookingUpdated: (() => void) | undefined;

    const unsub = roomPopup.subscribe((s) => {
        open = s.open;
        room = s.room;
        onBookingUpdated = s.onBookingUpdated;
    });

    function handleClose() {
        closeRoomPopup();
    }
    function handleBookingUpdated() {
        onBookingUpdated?.();
    }

    import { onDestroy } from 'svelte';
    onDestroy(unsub);
</script>

{#if room}
    <PopupWrapper {open} header={room.name} icon="MeetingRoom" on:close={handleClose} z={60}>
        <RoomBookingContent
            {room}
            extraClasses="min-h-[400px]"
            on:bookingUpdated={handleBookingUpdated}
        />
    </PopupWrapper>
{/if}
