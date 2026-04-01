<script lang="ts">
	import AirDatepicker, { type AirDatepickerOptions } from 'air-datepicker';
	import 'air-datepicker/air-datepicker.css';
	import './datepicker.css';
	import localeSv from 'air-datepicker/locale/sv';
	import { clickOutside } from '$lib/actions/clickOutside';
	import { ripple, type RippleOptions } from '$lib/actions/ripple';

	type Props = {
		options?: AirDatepickerOptions;
		value?: string;
		class?: string;
	};

	let { options, value = $bindable(), class: className = '' }: Props = $props();

	let datepickerContainer: HTMLDivElement | undefined = $state();
	let hiddenInput: HTMLInputElement | undefined = $state();
	let triggerButton: HTMLButtonElement | undefined = $state();

	// Swedish weekday abbreviations (Monday-indexed)
	const swedishWeekdaysShort = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
	const popupRippleSelector = [
		'.air-datepicker-nav--action',
		'.air-datepicker-nav--title',
		'.air-datepicker-cell',
		'.air-datepicker-button'
	].join(', ');
	const triggerRippleOptions: RippleOptions = {
		color: 'rgba(0, 0, 0, 0.16)',
		opacity: 0.18,
		duration: 650
	};
	const popupRippleInstances = new Map<HTMLElement, ReturnType<typeof ripple>>();

	function getPopupRippleOptions(node: HTMLElement): RippleOptions {
		if (node.classList.contains('-disabled-')) {
			return { disabled: true };
		}

		if (node.classList.contains('-selected-')) {
			return {
				color: 'rgba(255, 255, 255, 0.38)',
				opacity: 0.3,
				duration: 650
			};
		}

		if (
			node.classList.contains('air-datepicker-nav--action') ||
			node.classList.contains('air-datepicker-nav--title')
		) {
			return {
				color: 'rgba(0, 0, 0, 0.12)',
				opacity: 0.18,
				duration: 650
			};
		}

		return {
			color: 'rgba(51, 199, 89, 0.22)',
			opacity: 0.22,
			duration: 650
		};
	}

	function isPopupRippleTarget(node: Node): node is HTMLElement {
		return (
			node instanceof HTMLElement &&
			(node.matches(popupRippleSelector) || node.querySelector(popupRippleSelector) !== null)
		);
	}

	function syncPopupRipples() {
		if (!datepickerContainer) return;

		const interactiveNodes = new Set(
			Array.from(datepickerContainer.querySelectorAll<HTMLElement>(popupRippleSelector))
		);

		for (const [node, handle] of popupRippleInstances) {
			if (!interactiveNodes.has(node)) {
				handle.destroy();
				popupRippleInstances.delete(node);
				continue;
			}

			handle.update(getPopupRippleOptions(node));
		}

		for (const node of interactiveNodes) {
			const options = getPopupRippleOptions(node);
			const existingHandle = popupRippleInstances.get(node);

			if (existingHandle) {
				existingHandle.update(options);
				continue;
			}

			popupRippleInstances.set(node, ripple(node, options));
		}
	}

	function shouldRefreshPopupRipples(mutations: MutationRecord[]): boolean {
		return mutations.some((mutation) => {
			if (mutation.type === 'attributes') {
				return isPopupRippleTarget(mutation.target);
			}

			return (
				Array.from(mutation.addedNodes).some(isPopupRippleTarget) ||
				Array.from(mutation.removedNodes).some(isPopupRippleTarget)
			);
		});
	}

	function destroyPopupRipples() {
		for (const handle of popupRippleInstances.values()) {
			handle.destroy();
		}

		popupRippleInstances.clear();
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return (
			date.getFullYear() === today.getFullYear() &&
			date.getMonth() === today.getMonth() &&
			date.getDate() === today.getDate()
		);
	}

	function formatWeekdayShort(date: Date): string {
		return swedishWeekdaysShort[(date.getDay() + 6) % 7];
	}

	function formatDayNumber(date: Date): string {
		return new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'short'
		}).format(date);
	}

	function formatDisplayDate(date: Date): string {
		if (isToday(date)) {
			return `Idag, ${formatDayNumber(date)}`;
		}
		return `${formatWeekdayShort(date)}, ${formatDayNumber(date)}`;
	}

	// Display value for the button
	const displayValue = $derived.by(() => {
		if (!value) return 'Välj datum';
		const date = new Date(value);
		if (isNaN(date.getTime())) return value;
		return formatDisplayDate(date);
	});

	let airPicker: AirDatepicker | undefined = $state(undefined);

	function initAirPicker() {
		if (airPicker || !hiddenInput || !datepickerContainer) return;

		airPicker = new AirDatepicker(hiddenInput, {
			locale: localeSv,
			position: 'bottom left',
			autoClose: true,
			container: datepickerContainer,
			dateFormat: 'yyyy-MM-dd',
			selectedDates: value ? [new Date(value)] : [],
			...options,
			onSelect({ date }: { date: Date | Date[] }) {
				const selectedDate = Array.isArray(date) ? date[0] : date;
				if (selectedDate) {
					const year = selectedDate.getFullYear();
					const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
					const day = String(selectedDate.getDate()).padStart(2, '0');
					value = `${year}-${month}-${day}`;
				}
				airPicker?.hide();
			}
		});
	}

	$effect(() => {
		if (hiddenInput && datepickerContainer) {
			initAirPicker();
		}
	});

	$effect(() => {
		if (!datepickerContainer) return;

		const observer = new MutationObserver((mutations) => {
			if (!shouldRefreshPopupRipples(mutations)) return;
			syncPopupRipples();
		});

		observer.observe(datepickerContainer, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['class']
		});

		syncPopupRipples();

		return () => {
			observer.disconnect();
			destroyPopupRipples();
		};
	});

	$effect(() => {
		if (airPicker && value) {
			const date = new Date(value);
			const currentSelected = airPicker.selectedDates[0];
			if (!currentSelected || currentSelected.getTime() !== date.getTime()) {
				airPicker.selectDate(date);
			}
		}
	});

	function handleClick(event: MouseEvent) {
		if (airPicker) {
			if (airPicker.visible) {
				airPicker.hide();
			} else {
				airPicker.show();
			}
		}

		// Prevent sticky pressed/hover styling after pointer activation.
		if (event.detail > 0) {
			triggerButton?.blur();
		}
	}

	function handleClickOutside() {
		airPicker?.hide();
	}
</script>

	<div class="datepicker-wrapper {className}" use:clickOutside={handleClickOutside}>
		<button
			bind:this={triggerButton}
			type="button"
			use:ripple={triggerRippleOptions}
			aria-expanded={airPicker?.visible ?? false}
			class="datepicker-trigger flex h-[48px] items-center justify-center px-4 rounded-lg border border-gray-200 bg-white shadow-sm text-sm font-semibold text-gray-700 whitespace-nowrap"
			onclick={handleClick}
		>
		{displayValue}
	</button>

	<!-- Hidden input for air-datepicker attachment -->
	<input bind:this={hiddenInput} type="text" class="sr-only" tabindex="-1" aria-hidden="true" />
	<div bind:this={datepickerContainer} class="datepicker-container"></div>
</div>

<style>
	.datepicker-wrapper {
		position: relative;
	}
	.datepicker-container {
		position: absolute;
		z-index: 200;
		top: 100%;
		left: 0;
		margin-top: 8px;
	}
	.datepicker-trigger {
		transition: background-color 0.15s ease, color 0.15s ease;
	}
	.datepicker-trigger:focus {
		outline: none;
	}
	.datepicker-trigger:focus-visible {
		outline: 2px solid #33c759;
		outline-offset: 2px;
	}
	@media (hover: hover) and (pointer: fine) {
		.datepicker-trigger:hover {
			background-color: #f9fafb;
			color: #111827;
		}
	}
</style>
