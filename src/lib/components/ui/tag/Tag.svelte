<script lang="ts">
    export let color: string = 'gray';
    export let text: string = '';

    $: bgColorClass =
        color === 'red' ? 'bg-red' : color === 'green' ? 'bg-green-bright' : 'bg-gray-500';
</script>

<div class={`px-2 py-1 rounded-md text-white ${bgColorClass} text-center w-fit min-w-20`}>
    {text}
</div>
