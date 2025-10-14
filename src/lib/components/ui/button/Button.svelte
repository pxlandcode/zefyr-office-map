<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount } from 'svelte';
    import { loadingStore } from '../../../../stores/loadingStore';
    import Spinner from '../spinner/Spinner.svelte';

    export let fullWidth: boolean = false;
    export let type: 'primary' | 'secondary' | 'cancel' = 'primary';
    const dispatch = createEventDispatcher();

    let isLoading = false;
    let showSpinner = false;

    const unsubscribe = loadingStore.subscribe((value) => {
        isLoading = value;

        if (isLoading) {
            setTimeout(() => {
                if (isLoading) showSpinner = true;
            }, 500);
        } else {
            showSpinner = false;
        }
    });

    onMount(() => {
        return () => {
            unsubscribe();
        };
    });

    function onClick() {
        if (!isLoading) {
            dispatch('click');
        }
    }
</script>

<button
    on:click={onClick}
    disabled={isLoading}
    class={`relative flex h-12 shadow-lg items-center justify-center font-semibold text-white rounded-md cursor-pointer transition-all duration-200 active:shadow-sm active:translate-y-1 active:scale-95
        ${isLoading ? 'opacity-75 translate-y-1 cursor-not-allowed shadow-sm scale-95' : ''}
        ${type === 'primary' ? 'bg-gradient-to-r from-teal-500 to-green-500' : ''}
        ${type === 'secondary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : ''}
        ${type === 'cancel' ? 'bg-gradient-to-r from-red-500 to-red-700' : ''}
        ${fullWidth ? 'w-full' : 'px-10'} py-4`}
>
    {#if showSpinner}
        <div class="absolute inset-0 flex items-center justify-center">
            <Spinner size="2rem" color="white" />
        </div>
    {/if}

    <slot />
</button>

<style>
    .isLoading {
        background-color: rgba(0, 0, 0, 0.5);
    }
</style>
