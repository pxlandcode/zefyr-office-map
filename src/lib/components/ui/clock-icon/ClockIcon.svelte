<script>
    export let size = '40px';
    export let extraClasses = '';
    export let time = new Date().toISOString();

    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const hourRotation = (hours % 12) * 30 + minutes * 0.5;
    const minuteRotation = minutes * 6;

    $: classString = `${extraClasses}`;
</script>

<svg
    width={size}
    height={size}
    class={classString}
    fill="currentColor"
    viewBox="0 0 40 40"
    xmlns="http://www.w3.org/2000/svg"
>
    <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="4.5" fill="none" />

    <line
        x1="20"
        y1="20"
        x2="20"
        y2="10"
        stroke="currentColor"
        stroke-width="4.5"
        transform="rotate({hourRotation}, 20, 20)"
    />

    <line
        x1="20"
        y1="20"
        x2="20"
        y2="8"
        stroke="currentColor"
        stroke-width="4.5"
        transform="rotate({minuteRotation}, 20, 20)"
    />
</svg>

<style>
    svg {
        transition: transform 0.2s ease-in-out;
    }
</style>
