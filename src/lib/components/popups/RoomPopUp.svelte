<script lang="ts">
	import { browser } from '$app/environment';
	import { roomPopup, closeRoomPopup } from '$lib/stores/roomPopupStore';
	import { pinPrompt } from '$lib/stores/pinPromptStore';
	import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
	import RoomBookingContent from '$lib/components/popup-content/RoomBookingContent.svelte';
	import IdleCountdownIndicator from '$lib/components/ui/idle-countdown-indicator/IdleCountdownIndicator.svelte';
	import Icon from '$lib/components/ui/icon-component/Icon.svelte';
	import type { MeetingRoom } from '$lib/types/roomTypes';
	import { onDestroy } from 'svelte';

	const IDLE_TIMEOUT_MS = 45000;
	const IDLE_WARNING_WINDOW_MS = 10000;

	let open = false;
	let room: MeetingRoom | null = null;
	let onBookingUpdated: (() => void) | undefined;
	let calendarExpanded = false;
	let idleRemainingMs = IDLE_TIMEOUT_MS;
	let pinPromptOpen = false;
	let previousRoomEmail: string | null = null;
	let previousOpen = false;
	let idleDeadlineTimestamp = 0;
	let idleTimeout: ReturnType<typeof setTimeout> | null = null;
	let idleAnimationFrame: number | null = null;

	const unsub = roomPopup.subscribe((s) => {
		open = s.open;
		room = s.room;
		onBookingUpdated = s.onBookingUpdated;
	});
	const unsubPinPrompt = pinPrompt.subscribe((s) => {
		const nextPinPromptOpen = Boolean(s.open);

		if (nextPinPromptOpen === pinPromptOpen) {
			return;
		}

		pinPromptOpen = nextPinPromptOpen;

		if (!open) {
			return;
		}

		if (pinPromptOpen) {
			stopIdleTimer();
		} else {
			resetIdleTimer();
		}
	});

	function clearIdleTimeout() {
		if (idleTimeout) {
			clearTimeout(idleTimeout);
			idleTimeout = null;
		}
	}

	function clearIdleAnimationFrame() {
		if (browser && idleAnimationFrame != null) {
			cancelAnimationFrame(idleAnimationFrame);
			idleAnimationFrame = null;
		}
	}

	function stopIdleTimer(resetRemaining = true) {
		clearIdleTimeout();
		clearIdleAnimationFrame();
		idleDeadlineTimestamp = 0;

		if (resetRemaining) {
			idleRemainingMs = IDLE_TIMEOUT_MS;
		}
	}

	function updateIdleCountdown() {
		if (!browser || !open || pinPromptOpen || idleDeadlineTimestamp === 0) {
			idleAnimationFrame = null;
			return;
		}

		idleRemainingMs = Math.max(0, idleDeadlineTimestamp - Date.now());

		if (idleRemainingMs <= 0) {
			idleAnimationFrame = null;
			return;
		}

		idleAnimationFrame = requestAnimationFrame(updateIdleCountdown);
	}

	function resetIdleTimer() {
		if (!browser) {
			return;
		}

		stopIdleTimer(false);
		idleRemainingMs = IDLE_TIMEOUT_MS;

		if (!open || pinPromptOpen) {
			return;
		}

		idleDeadlineTimestamp = Date.now() + IDLE_TIMEOUT_MS;
		idleTimeout = setTimeout(() => {
			handleClose();
		}, IDLE_TIMEOUT_MS);
		idleAnimationFrame = requestAnimationFrame(updateIdleCountdown);
	}

	function handleClose() {
		stopIdleTimer();
		calendarExpanded = false;
		closeRoomPopup();
	}

	function handleBookingUpdated() {
		onBookingUpdated?.();
		resetIdleTimer();
	}

	function handleCalendarLayoutChange(event: CustomEvent<{ expanded: boolean }>) {
		calendarExpanded = Boolean(event.detail?.expanded);
		resetIdleTimer();
	}

	function handlePopupInteraction() {
		if (!open || pinPromptOpen) {
			return;
		}

		resetIdleTimer();
	}

	$: if (room?.email !== previousRoomEmail) {
		previousRoomEmail = room?.email ?? null;
		calendarExpanded = false;

		if (open) {
			resetIdleTimer();
		}
	}

	$: if (open !== previousOpen) {
		previousOpen = open;

		if (open) {
			resetIdleTimer();
		} else {
			stopIdleTimer();
		}
	}

	$: popupWidth = calendarExpanded ? '1220px' : '860px';
	$: contentHeightClass = calendarExpanded ? 'h-[560px]' : 'h-[400px]';

	onDestroy(() => {
		stopIdleTimer();
		unsub();
		unsubPinPrompt();
	});
</script>

{#if room}
	<PopupWrapper
		{open}
		header={room.name}
		width={popupWidth}
		icon="MeetingRoom"
		on:close={handleClose}
		on:interact={handlePopupInteraction}
		z={60}
	>
		<IdleCountdownIndicator
			slot="headerRight"
			remainingMs={idleRemainingMs}
			warningWindowMs={IDLE_WARNING_WINDOW_MS}
		>
			<Icon icon="Close" size="18px" color="white" />
		</IdleCountdownIndicator>

		<RoomBookingContent
			{room}
			extraClasses={contentHeightClass}
			on:bookingUpdated={handleBookingUpdated}
			on:calendarLayoutChange={handleCalendarLayoutChange}
		/>
	</PopupWrapper>
{/if}
