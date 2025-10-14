<script lang="ts">
    import { format } from 'date-fns-tz';
    import HourglassIcon from '../hourglass-icon/HourglassIcon.svelte';

    export let startDate: string;
    export let endDate: string;
    export let currentTime: string = new Date().toISOString();
    export let showProgress: boolean = false;

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = new Date(currentTime).getTime();

    $: progress = Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));
    $: minutesLeft = Math.max(0, Math.ceil((end - current) / 60000));
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
