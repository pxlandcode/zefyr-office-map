<script lang="ts">
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
    import {
        closeOfficeRoomPopup,
        officeRoomPopup,
        type OfficeRoomPopupState,
    } from '$lib/stores/officeRoomPopupStore';
    import type { OfficeRoom } from '$lib/types/officeRoomTypes';
    import { onDestroy } from 'svelte';
    import OfficeRoomContent from '../popup-content/OfficeRoomContent.svelte';

    let open = false;
    let room: OfficeRoom | null = null;
    let options: OfficeRoomPopupState['options'] = {
        width: '882px',
        height: '522px',
    };

    const unsubscribe = officeRoomPopup.subscribe((state) => {
        open = state.open;
        room = state.room;
        options = { ...state.options };
    });
    onDestroy(unsubscribe);

    function handleClose() {
        closeOfficeRoomPopup();
    }
</script>

{#if room}
    <PopupWrapper
        {open}
        header={room.name}
        width={options.width}
        height={options.height}
        icon={room.icon ?? 'MeetingRoom'}
        on:close={handleClose}
    >
        <OfficeRoomContent {room} />
    </PopupWrapper>
{/if}
