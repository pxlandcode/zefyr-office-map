<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Icon from '../icon-component/Icon.svelte';
    import { ripple } from '$lib/actions/ripple';

    export let options: Array<{ value: any; label: string }> = [];
    export let selectedOption: { value: any; label: string } | null = null;
    export let type: 'primary' | 'secondary' | 'cancel' = 'primary';

    const dispatch = createEventDispatcher();

    function selectOption(option) {
        selectedOption = option;
        dispatch('select', option.value);
    }

    function rippleOpts(isSelected: boolean) {
        const duration = 800;
        if (isSelected) {
            return { color: 'rgba(255,255,255,0.35)', opacity: 0.25, duration };
        }

        switch (type) {
            case 'secondary':
                return { color: 'rgba(180,83,9,0.25)', opacity: 0.22, duration };
            case 'cancel':
                return { color: 'rgba(239,68,68,0.25)', opacity: 0.22, duration };
            default:
                return { color: 'rgba(0,0,0,0.20)', opacity: 0.22, duration };
        }
    }
</script>

<div
    class={`${type === 'primary' ? 'bg-gradient-to-r from-teal-500 to-green-500' : ''}
    ${type === 'secondary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : ''}
    ${
        type === 'cancel' ? 'bg-gradient-to-r from-red to-red-dark' : ''
    } p-[2px] rounded-lg w-full max-w-md`}
>
    <div class="flex gap-[2px] rounded-lg">
        {#each options as option, index}
            <button
                on:click={() => selectOption(option)}
                use:ripple={rippleOpts(selectedOption?.value === option.value)}
                class={`flex-1 h-[46px] text-center text-sm font-semibold transition-all duration-200 active:scale-90
                ${index === 0 ? 'rounded-l-md' : index === options.length - 1 ? 'rounded-r-md' : ''}
                ${selectedOption?.value === option.value ? 'text-white' : 'bg-white'}`}
            >
                {#if selectedOption?.value === option.value}
                    <Icon icon="Check" size="16px" />
                {/if}
                {option.label}
            </button>
        {/each}
    </div>
</div>
