<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getCurrentTimeOffset } from '$lib/utils/helpers/calendarHelpers';

    export let startHour: number;
    export let hourHeight: number;

    let currentTime = new Date();
    let currentTimeOffset = getCurrentTimeOffset(startHour, hourHeight);

    function updateTime() {
        currentTime = new Date();
        currentTimeOffset = getCurrentTimeOffset(startHour, hourHeight);
    }

    const millisecondsUntilNextMinute =
        60000 - (currentTime.getSeconds() * 1000 + currentTime.getMilliseconds());

    let interval: NodeJS.Timeout;

    onMount(() => {
        const initialTimeout = setTimeout(() => {
            updateTime();

            interval = setInterval(updateTime, 60000);
        }, millisecondsUntilNextMinute);

        onDestroy(() => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        });
    });

    $: currentTimeLabel = currentTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
</script>

<div class="relative">
    <div
        class="absolute left-0 w-full border-t-2 border-dashed border-blue-300"
        style="top: {currentTimeOffset}px;"
    ></div>

    <div
        class="absolute bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-full shadow-md transform -translate-y-1/2"
        style="top: {currentTimeOffset}px; left: 0"
    >
        {currentTimeLabel}
    </div>
</div>
