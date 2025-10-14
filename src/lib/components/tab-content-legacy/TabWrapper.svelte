<script lang="ts">
    import type { TabOption } from '$lib/types/tabTypes';
    import { createEventDispatcher } from 'svelte';
    import Icon from '../ui/icon-component/Icon.svelte';

    export let tabOptions: TabOption[] = [];
    const dispatch = createEventDispatcher();

    function selectTab(tabId: string) {
        tabOptions = tabOptions.map((tab) => ({
            ...tab,
            selected: tab.id === tabId,
        }));
        dispatch('tabChange', tabId);
    }
</script>

<div class="tab-wrapper flex flex-col shadow-md rounded-xl">
    <!-- Tab headers -->
    <div class="tab-header flex shrink-0">
        {#each tabOptions as tab, index}
            <button
                on:click={() => selectTab(tab.id)}
                class={`flex items-center gap-2 py-3 text-center font-semibold transition duration-200
                    ${tab.selected ? 'bg-white text-black rounded-t-xl border border-gray-200 border-b-0 px-8' : 'bg-gray-200 w-full mt-2 text-gray-500 text-sm px-4 h-10'}
                    ${index === 0 && !tab.selected ? 'rounded-tl-xl' : ''}    
                    ${index === tabOptions.length - 1 && !tab.selected ? 'rounded-tr-xl' : ''} 
                    ${index !== 0 && index !== tabOptions.length - 1 && !tab.selected ? 'rounded-none' : ''} 
                `}
            >
                <Icon icon={tab.icon} size="18px" />
                <h3>{tab.label}</h3>
            </button>
        {/each}
    </div>

    <!-- Content area -->
    <div class="tab-content flex-1 overflow-y-auto p-4 bg-white rounded-b-xl border border-gray-200 -mt-1">
        <slot />
    </div>
</div>

<style>
    .tab-wrapper {
        width: 100%;
        max-height: 100%;
        min-width: 340px;
        min-height: 280px;
    }
    /* Negative margin to align content and tab */
    .-mt-1 {
        margin-top: -1px;
    }

    .tab-content {
        max-height: clamp(240px, 60vh, 540px);
        scrollbar-width: none;
    }

    .tab-content::-webkit-scrollbar {
        display: none;
    }
</style>
