<script>
	import PinPromptPopUp from '$lib/components/popups/PinPromptPopUp.svelte';
	import NotificationContainer from '$lib/components/ui/notification-container/NotificationContainer.svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import RoomPopUp from '$lib/components/popups/RoomPopUp.svelte';
	import OfficeRoomPopUp from '$lib/components/popups/OfficeRoomPopUp.svelte';
	import BrandStamp from '$lib/components/ui/brand-stamp/BrandStamp.svelte';
	import InfoButton from '$lib/components/ui/info-button/InfoButton.svelte';
	import BrandStampPopUp from '$lib/components/popups/BrandStampPopUp.svelte';
	import CalendarInfoPopUp from '$lib/components/popups/CalendarInfoPopUp.svelte';
	import ClickIndicator from '$lib/components/ClickIndicator.svelte';
	import { clickIndicatorStore } from '../stores/clickIndicatorStore';
	import { navigating } from '$app/stores';
	import { loadingStore } from '../stores/loadingStore';
	import { onDestroy } from 'svelte';

	let progress = 0;
	let visible = false;
	let completing = false;
	let wasLoading = false;
	let progressTimer = null;
	let hideTimer = null;

	const START_PROGRESS = 12;
	const MAX_PROGRESS = 88;
	const INTERVAL_MS = 160;
	const HIDE_DELAY_MS = 300;

	function clearTimers() {
		if (progressTimer) {
			clearInterval(progressTimer);
			progressTimer = null;
		}
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
	}

	function startLoadingCycle() {
		clearTimers();
		visible = true;
		completing = false;
		progress = 0;

		setTimeout(() => {
			progress = START_PROGRESS;
		}, 0);

		progressTimer = setInterval(() => {
			if (progress >= MAX_PROGRESS) return;
			const remaining = MAX_PROGRESS - progress;
			const increment = Math.max(0.6, remaining * 0.08);
			progress = Math.min(MAX_PROGRESS, progress + increment);
		}, INTERVAL_MS);
	}

	function finishLoadingCycle() {
		if (!visible) return;
		clearInterval(progressTimer);
		progressTimer = null;
		completing = true;
		progress = 100;

		hideTimer = setTimeout(() => {
			visible = false;
			completing = false;
			progress = 0;
		}, HIDE_DELAY_MS);
	}

	$: isLoading = Boolean($navigating) || $loadingStore;
	$: {
		if (isLoading && !wasLoading) {
			startLoadingCycle();
		} else if (!isLoading && wasLoading) {
			finishLoadingCycle();
		}
		wasLoading = isLoading;
	}

	onDestroy(() => {
		clearTimers();
	});
</script>

<NotificationContainer />

{#if visible}
	<div
		class="top-loader"
		class:is-complete={completing}
		role="progressbar"
		aria-label="Loading"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={progress}
	>
		<div class="top-loader__bar" style={`width: ${progress}%;`} />
	</div>
{/if}

{#if $clickIndicatorStore.show}
	<ClickIndicator count={$clickIndicatorStore.count} total={$clickIndicatorStore.total} />
{/if}

<slot />

<!-- TODO: Future feature - info button -->
<!-- <InfoButton position="fixed" bottom="14px" left="14px" /> -->
<BrandStamp text="Powered by " position="fixed" bottom="14px" right="14px" />
{#if browser}
	<PinPromptPopUp />
	<RoomPopUp />
	<OfficeRoomPopUp />
	<BrandStampPopUp />
	<CalendarInfoPopUp />
{/if}

<style>
	.top-loader {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		z-index: 10000;
		pointer-events: none;
	}

	.top-loader__bar {
		height: 100%;
		width: 0%;
		background: linear-gradient(90deg, #0ea5a5, #22c55e, #fbbf24);
		background-size: 200% 100%;
		animation: top-loader-shimmer 1.1s linear infinite;
		transition: width 180ms ease-out;
		box-shadow: 0 0 10px rgba(34, 197, 94, 0.35);
	}

	.top-loader.is-complete .top-loader__bar {
		animation-play-state: paused;
		transition: width 220ms ease-out;
	}

	@keyframes top-loader-shimmer {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 200% 50%;
		}
	}
</style>
