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

    const viewportPadding = 32;
    const viewportWidthConstraint = `calc(100vw - ${viewportPadding}px)`;
    const viewportHeightConstraint = `calc(100dvh - ${viewportPadding}px)`;

    $: modalWidth =
        width && width !== 'fit-content' ? `min(${width}, ${viewportWidthConstraint})` : 'auto';

    $: modalHeight =
        height && height !== 'fit-content' ? `min(${height}, ${viewportHeightConstraint})` : 'auto';

    $: modalStyle = `width: ${modalWidth}; max-width: ${viewportWidthConstraint}; height: ${modalHeight}; max-height: ${viewportHeightConstraint};`;
</script>

{#if open}
    <div
        class="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
        style="z-index: {z};"
        role="presentation"
        on:click={clickBackdrop}
    >
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div
            class="modal-content flex flex-col overflow-hidden rounded-lg bg-white shadow-lg"
            on:click|stopPropagation
            on:keydown|stopPropagation
            style={modalStyle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="popup-title"
            tabindex="-1"
        >
            <div class="modal-inner flex h-full flex-col">
                <div
                    class="modal-header flex items-center justify-between gap-3 border-b-2 px-5 pb-2 pt-4"
                >
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

                <div class="modal-body min-h-0 flex-1 overflow-auto p-5">
                    <slot />
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-content {
        max-width: none;
        max-height: none;
    }
    .modal-inner {
        min-height: 0;
    }
    :global(html.dark) .modal-content {
        background-color: #111827;
    }
</style>
