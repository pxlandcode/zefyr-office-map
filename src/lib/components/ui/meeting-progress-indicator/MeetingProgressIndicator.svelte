<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { format } from 'date-fns-tz';
    import HourglassIcon from '../hourglass-icon/HourglassIcon.svelte';

    const REFRESH_INTERVAL_MS = 30_000;

    export let startDate: string;
    export let endDate: string;
    export let currentTime: string | undefined = undefined;
    export let showProgress: boolean = false;

    let start = 0;
    let end = 0;
    let duration = 1;
    let now = Date.now();
    let timer: ReturnType<typeof setInterval> | undefined;

    $: start = new Date(startDate).getTime();
    $: end = new Date(endDate).getTime();
    $: duration = Math.max(end - start, 1);
    $: if (currentTime) {
        now = new Date(currentTime).getTime();
    }

    $: progress = Math.min(100, Math.max(0, ((now - start) / duration) * 100));
    $: minutesLeft = Math.max(0, Math.ceil((end - now) / 60000));

    const startTimer = () => {
        if (timer) return;

        timer = setInterval(() => {
            now = Date.now();
        }, REFRESH_INTERVAL_MS);
    };

    const stopTimer = () => {
        if (!timer) return;

        clearInterval(timer);
        timer = undefined;
    };

    onMount(() => {
        if (!currentTime) {
            startTimer();
        }
    });

    onDestroy(stopTimer);

    $: if (currentTime) {
        stopTimer();
        now = new Date(currentTime).getTime();
    } else if (!timer) {
        startTimer();
    }
</script>

<div class="flex items-center text-gray-600 text-sm relative">
    <p>{format(new Date(startDate), 'HH:mm')}</p>

    <div class="flex-1 relative mx-2 h-0.5">
        <div class="absolute inset-0 border-dotted border-t border-gray-300"></div>

        {#if showProgress}
            <div
                class="absolute inset-y-0 left-0 border-dotted border-t border-blue"
                style="width: {progress}%"
            ></div>

            <div
                class="absolute text-blue bg-white transform -translate-y-1/2"
                style="left: calc({progress}% - 0.5rem)"
            >
                <HourglassIcon size="11" minutes={minutesLeft} />
            </div>
        {/if}
    </div>

    <p>{format(new Date(endDate), 'HH:mm')}</p>
</div>
