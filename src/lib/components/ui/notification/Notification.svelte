<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import Icon from '../icon-component/Icon.svelte';
    import IconButton from '../icon-button/IconButton.svelte';

    export let id: string;
    export let type: 'success' | 'cancel' | 'note' = 'note';
    export let message: string = '';
    export let description: string = '';

    const dispatch = createEventDispatcher();

    function close() {
        dispatch('close', id);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            close();
        }
    }
</script>

<div
    class={`flex relative items-start gap-2 px-4 py-2 mb-2 w-80 rounded-lg shadow-md cursor-pointer transition-transform border  ${type === 'success' ? 'bg-green-bright border-green-dark ' : type === 'cancel' ? 'bg-red border-red-dark' : 'bg-blue-500 border-blue-950'} text-white`}
    transition:fly={{ x: 300, duration: 400 }}
    role="alert"
>
    <div class="flex-1">
        <div class="flex items-center gap-2">
            {#if type === 'success'}
                <Icon icon="CircleCheck" size="14px" />
            {:else if type === 'cancel'}
                <Icon icon="CircleCross" size="14px" />
            {:else if type === 'note'}
                <Icon icon="Notification" size="14px" />
            {/if}
            <p class="text-sm font-semibold">{message}</p>
        </div>
        <p class="text-xs">{description}</p>
    </div>

    <div class="absolute top-2 right-2">
        <IconButton small icon="Close" size="10px" transparent on:click={close} />
    </div>
</div>
