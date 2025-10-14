<script lang="ts">
    export let size = '40px';
    export let extraClasses = '';
    export let direction: 'up' | 'down' | 'left' | 'right' = 'right';

    const rotationMap = {
        up: -90,
        right: 0,
        down: 90,
        left: 180,
    };

    $: rotationDegree = rotationMap[direction];
    $: classString = `${extraClasses}`;
</script>

<svg
    width={size}
    height={size}
    class={classString}
    fill="currentColor"
    viewBox="0 0 24 40"
    xmlns="http://www.w3.org/2000/svg"
    style="transform: rotate({rotationDegree}deg); transition: transform 0.3s ease;"
>
    <path
        d="M3.77461 40.4395L0.224609 36.8895L16.6746 20.4395L0.224609 3.98945L3.77461 0.439453L23.7746 20.4395L3.77461 40.4395Z"
    />
</svg>

<style>
    svg {
        display: block;
        transition: transform 0.3s ease;
    }
</style>
