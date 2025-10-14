<script lang="ts">
    import { fly } from 'svelte/transition';
    import ArrowIcon from '../arrow-icon/ArrowIcon.svelte';
    import { createEventDispatcher } from 'svelte';

    export let options: Array<{ value: any; label: string }> = [];
    export let selectedOption: { value: any; label: string } | null = null;

    let filteredOptions: Array<{ value: any; label: string }> = [];

    const dispatch = createEventDispatcher();

    async function toggleDropdown() {
        if (filteredOptions.length === 0) {
            await openDropdown();
        } else {
            await closeDropdown();
        }
    }

    async function openDropdown() {
        filteredOptions = [];

        for (let index = 0; index < options.length; index++) {
            const option = options[index];
            if (option.value !== selectedOption?.value) {
                await new Promise((resolve) =>
                    setTimeout(() => {
                        filteredOptions = [...filteredOptions, option];
                        resolve(true);
                    }, 50 * index)
                );
            }
        }
    }

    async function closeDropdown() {
        for (let index = filteredOptions.length - 1; index >= 0; index--) {
            await new Promise((resolve) =>
                setTimeout(
                    () => {
                        filteredOptions = filteredOptions.slice(0, index);
                        resolve(true);
                    },
                    50 * (filteredOptions.length - 1 - index)
                )
            );
        }
        filteredOptions = [];
    }

    function selectOption(option) {
        selectedOption = option;
        dispatch('select', option.value);
        toggleDropdown();
    }
</script>

<div class="relative inline-block w-full">
    <button
        class="w-full max-w-md shadow-lg font-semibold text-text rounded-md p-px bg-gradient-to-r from-teal-500 to-green-500 active:shadow-sm active:translate-y-1 active:scale-95"
        on:click={toggleDropdown}
    >
        <div class="flex justify-center rounded-[calc(0.375rem-1px)] h-12 bg-white items-center">
            <p class="w-full text-center">{selectedOption?.label ?? 'Välj alternativ'}</p>
            <ArrowIcon
                size="14px"
                direction={filteredOptions.length > 0 ? 'up' : 'down'}
                extraClasses="absolute top-5 right-4"
            />
        </div>
    </button>

    <div class="absolute z-50 mt-2 w-full flex flex-col gap-2">
        {#each filteredOptions as option, index}
            <button
                on:click={() => selectOption(option)}
                in:fly={{ y: -10, opacity: 0, duration: 300 }}
                out:fly={{
                    y: -10,
                    opacity: 0,
                    duration: 200,
                    delay: 50 * index,
                }}
                class="w-full max-w-md font-semibold text-text rounded-md p-px bg-gradient-to-r from-teal-500 to-green-500 shadow-lg translate-y-1 scale-95 active:shadow-sm active:translate-y-2 active:scale-90"
            >
                <div
                    class="flex justify-center rounded-[calc(0.375rem-1px)] h-12 bg-white items-center"
                >
                    <p class="w-full text-center">{option.label}</p>
                </div>
            </button>
        {/each}
    </div>
</div>
