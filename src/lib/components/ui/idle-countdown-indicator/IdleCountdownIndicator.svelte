<script lang="ts">
	export let remainingMs = 0;
	export let warningWindowMs = 10000;

	$: clampedRemainingMs = Math.max(0, remainingMs);
	$: visible = clampedRemainingMs > 0 && clampedRemainingMs <= warningWindowMs;
	$: elapsed = visible && warningWindowMs > 0 ? 1 - clampedRemainingMs / warningWindowMs : 0;
	$: progressTurn = `${elapsed}turn`;
	$: secondsLabel = Math.ceil(clampedRemainingMs / 1000);
</script>

{#if visible}
	<div
		class="idle-indicator"
		style={`--progress-turn: ${progressTurn};`}
		role="img"
		aria-label={`Popupen stängs om ${secondsLabel} sekunder`}
	>
		<div class="idle-indicator__pie"></div>
		<div class="idle-indicator__icon-mask">
			<slot />
		</div>
	</div>
{/if}

<style>
	.idle-indicator {
		position: relative;
		width: 28px;
		height: 28px;
		border-radius: 9999px;
		pointer-events: none;
		overflow: hidden;
	}

	.idle-indicator__pie {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		background: conic-gradient(
			from 0deg,
			rgb(239 68 68) 0turn var(--progress-turn),
			transparent var(--progress-turn) 1turn
		);
	}

	.idle-indicator__icon-mask {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-mask-image: conic-gradient(
			from 0deg,
			black 0turn var(--progress-turn),
			transparent var(--progress-turn) 1turn
		);
		mask-image: conic-gradient(
			from 0deg,
			black 0turn var(--progress-turn),
			transparent var(--progress-turn) 1turn
		);
	}
</style>
