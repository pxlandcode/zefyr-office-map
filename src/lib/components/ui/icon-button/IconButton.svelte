<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Icon from '../icon-component/Icon.svelte';

    export let icon: string;
    export let size: string = '24px';
    export let type: 'primary' | 'secondary' | 'cancel' = 'primary';
    export let transparent: boolean = false;
    export let small: boolean = false;
    const dispatch = createEventDispatcher();

    function handleClick() {
        dispatch('click');
    }
</script>

<button
    on:click={handleClick}
    class={`flex items-center justify-center shadow-lg rounded-md cursor-pointer transition-all duration-200
        ${type === 'primary' ? 'bg-gradient-to-r from-teal-500 to-green-500' : ''}
        ${type === 'secondary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : ''}
        ${type === 'cancel' ? 'bg-gradient-to-r from-red to-red-dark' : ''}
        ${transparent ? 'bg-transparent shadow-none text-text hover:text-red-500' : 'text-white'}
        ${transparent && type === 'cancel' ? 'from-transparent to-transparent' : ''}
        ${transparent && type === 'primary' ? 'from-transparent to-transparent' : ''}
        w-12 h-12
        ${small ? 'w-4 h-4' : ''}
        active:shadow-sm active:translate-y-1 active:scale-95
        focus:outline-none`}
>
    <Icon {icon} {size} />
</button>
