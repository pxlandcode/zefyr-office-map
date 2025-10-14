<!-- src/lib/components/ui/popup-wrapper/PopupWrapper.svelte -->
<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { browser } from '$app/environment';
    import IconButton from '../icon-button/IconButton.svelte';
    import Icon from '../icon-component/Icon.svelte';

    export let header = 'Popup';
    export let width: string = 'fit-content';
    export let height: string = 'fit-content';
    export let icon: string | undefined;

    export let open = false;
    export let z: number = 50;

    // Options
    export let closeOnBackdrop = true;
    export let closeOnEsc = true;
    export let lockScroll = true;

    const dispatch = createEventDispatcher();

    function onClose() {
        dispatch('close');
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!open || !closeOnEsc) return;
        if (event.key === 'Escape') onClose();
    }

    let prevOverflow: string | null = null;

    onMount(() => {
        if (browser && closeOnEsc) window.addEventListener('keydown', handleKeyDown);
    });

    onDestroy(() => {
        if (browser && closeOnEsc) window.removeEventListener('keydown', handleKeyDown);
        if (browser && prevOverflow !== null) {
            document.body.style.overflow = prevOverflow;
            prevOverflow = null;
        }
    });

    // lock/unlock body scroll only on client
    $: if (browser && lockScroll) {
        if (open) {
            if (prevOverflow === null) prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        } else if (prevOverflow !== null) {
            document.body.style.overflow = prevOverflow;
            prevOverflow = null;
        }
    }

    function clickBackdrop() {
        if (closeOnBackdrop) onClose();
    }
</script>

{#if open}
    <div
        class="fixed inset-0 bg-black/50 flex justify-center items-center"
        style="z-index: {z};"
        role="presentation"
        on:click={clickBackdrop}
    >
        <div
            class="modal-content bg-white rounded-lg shadow-lg overflow-hidden transition-all"
            on:click|stopPropagation
            style="width: {width}; height: {height};"
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
        >
            <div class="p-4">
                <div class="header flex items-center justify-between pb-2 border-b-2">
                    <div class="flex items-center gap-2">
                        {#if icon}
                            <div
                                class="flex items-center justify-center w-7 h-7 rounded-full bg-text text-white"
                            >
                                <Icon {icon} size="14px" />
                            </div>
                        {/if}
                        <h2 class="text-xl font-semibold text-text" id="popup-title">{header}</h2>
                    </div>
                    <IconButton
                        on:click={onClose}
                        size="18px"
                        icon="Close"
                        type="cancel"
                        transparent
                    />
                </div>

                <div class="w-auto h-auto p-4">
                    <slot />
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-content {
        max-width: 90vw;
        max-height: 90vh;
    }
    :global(html.dark) .modal-content {
        background-color: #111827;
    }
</style>
