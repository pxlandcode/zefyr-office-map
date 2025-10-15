<script lang="ts">
    import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
    import {
        closeOfficeRoomPopup,
        officeRoomPopup,
        type OfficeRoomPopupState,
    } from '$lib/stores/officeRoomPopupStore';
    import type { OfficeRoom } from '$lib/types/officeRoomTypes';
    import { onDestroy } from 'svelte';

    let open = false;
    let room: OfficeRoom | null = null;
    let options: OfficeRoomPopupState['options'] = { width: 'min(92vw, 520px)', height: 'auto' };

    const unsubscribe = officeRoomPopup.subscribe((state) => {
        open = state.open;
        room = state.room;
        options = state.options;
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
        icon="MeetingRoom"
        on:close={handleClose}
    >
        <div class="flex flex-col gap-6 md:flex-row">
            <div class="overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 md:w-56">
                <img
                    src={room.image}
                    alt={`Illustration of ${room.company}`}
                    class="h-full w-full object-cover"
                    loading="lazy"
                />
            </div>
            <div class="flex flex-1 flex-col gap-4 text-left">
                {#if room.company}
                    <span class="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
                        {room.company}
                    </span>
                {/if}
                {#if room.tagline}
                    <h3 class="text-2xl font-semibold text-slate-900 md:text-3xl">
                        {room.tagline}
                    </h3>
                {/if}
                <p class="text-base leading-relaxed text-slate-600">{room.description}</p>
                {#if room.website}
                    <a
                        class="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        href={room.website}
                        target="_blank"
                        rel="noreferrer noopener"
                    >
                        Visit website
                        <span aria-hidden="true" class="text-lg">↗</span>
                    </a>
                {/if}
            </div>
        </div>
    </PopupWrapper>
{/if}
