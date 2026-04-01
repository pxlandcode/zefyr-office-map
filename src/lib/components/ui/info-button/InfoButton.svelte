<script lang="ts">
	import { openCalendarInfoPopup } from '$lib/stores/calendarInfoPopupStore';

	export let position: 'fixed' | 'absolute' = 'fixed';
	export let bottom = '14px';
	export let left = '14px';

	function handleClick() {
		openCalendarInfoPopup();
	}
</script>

<button
	type="button"
	class="info-button"
	style={`position:${position}; bottom:${bottom}; left:${left};`}
	aria-label="Visa information om bokningssystemet"
	aria-haspopup="dialog"
	on:click={handleClick}
>
	i
</button>

<style>
	.info-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: 1px solid #e5e7eb;
		border-radius: 9999px;
		background: #fff;
		color: #374151;
		font-size: 18px;
		font-weight: 700;
		line-height: 1;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
		cursor: pointer;
		z-index: 40;
		transition:
			background-color 160ms ease,
			color 160ms ease,
			transform 160ms ease,
			box-shadow 160ms ease;
	}

	.info-button:hover {
		background: #f9fafb;
		color: #111827;
		transform: translateY(-1px);
		box-shadow: 0 14px 28px rgba(15, 23, 42, 0.16);
	}

	.info-button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>
