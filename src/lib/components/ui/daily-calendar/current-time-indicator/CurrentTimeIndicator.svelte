<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { getCurrentTimeOffset } from '$lib/utils/helpers/calendarHelpers';

	export let startHour: number;
	export let hourHeight: number;
	export let leftOffset: number = 0;
	export let lineWidth: string = '100%';
	export let labelLeft: number = 0;
	export let showLine: boolean = true;
	export let showLabel: boolean = true;

	let currentTime = new Date();
	let currentTimeOffset = getCurrentTimeOffset(startHour, hourHeight);
	let initialTimeout: ReturnType<typeof setTimeout> | null = null;
	let interval: ReturnType<typeof setInterval> | null = null;

	function updateTime() {
		currentTime = new Date();
		currentTimeOffset = getCurrentTimeOffset(startHour, hourHeight);
	}

	onMount(() => {
		const millisecondsUntilNextMinute =
			60000 - (currentTime.getSeconds() * 1000 + currentTime.getMilliseconds());

		initialTimeout = setTimeout(() => {
			updateTime();
			interval = setInterval(updateTime, 60000);
		}, millisecondsUntilNextMinute);
	});

	onDestroy(() => {
		if (initialTimeout) {
			clearTimeout(initialTimeout);
		}

		if (interval) {
			clearInterval(interval);
		}
	});

	$: currentTimeLabel = currentTime.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<div class="relative">
	{#if showLine}
		<div
			class="absolute left-0 w-full border-t-2 border-dashed border-blue-300"
			style="top: {currentTimeOffset}px; left: {leftOffset}px; width: {lineWidth};"
		></div>
	{/if}

	{#if showLabel}
		<div
			class="absolute bg-blue-500 text-xs font-semibold text-white py-1 px-3 rounded-full shadow-md transform -translate-y-1/2"
			style="top: {currentTimeOffset}px; left: {labelLeft}px"
		>
			{currentTimeLabel}
		</div>
	{/if}
</div>
