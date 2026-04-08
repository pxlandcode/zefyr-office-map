<script lang="ts">
	import { onDestroy } from 'svelte';
	import PopupWrapper from '$lib/components/ui/popup-wrapper/PopupWrapper.svelte';
	import {
		calendarInfoPopup,
		closeCalendarInfoPopup,
		type CalendarInfoPopupState
	} from '$lib/stores/calendarInfoPopupStore';
	import IconMeetingRoom from '$lib/icons/IconMeetingRoom.svelte';
	import IconClock from '$lib/icons/IconClock.svelte';
	import IconCircleCross from '$lib/icons/IconCircleCross.svelte';
	import IconPerson from '$lib/icons/IconPerson.svelte';

	let open = false;
	let options: CalendarInfoPopupState['options'] = {
		title: 'Snabbguide',
		width: '560px'
	};

	const unsubscribe = calendarInfoPopup.subscribe((state) => {
		open = state.open;
		options = { ...state.options };
	});

	function handleClose() {
		closeCalendarInfoPopup();
	}

	onDestroy(unsubscribe);
</script>

<PopupWrapper
	{open}
	header={options.title}
	width={options.width}
	icon={undefined}
	z={70}
	on:close={handleClose}
>
	<div class="space-y-4">
		<!-- See room info -->
		<div class="info-card">
			<div class="icon-wrapper text-gray-500">
				<IconMeetingRoom size="18px" />
			</div>
			<div class="card-content">
				<h3 class="card-title">Se rumsstatus</h3>
				<p class="card-text">
					Klicka på ett rum i kartan för att se status, bokningar och detaljer.
				</p>
			</div>
		</div>

		<!-- Booking -->
		<div class="info-card">
			<div class="icon-wrapper text-gray-500">
				<IconClock size="18px" />
			</div>
			<div class="card-content">
				<h3 class="card-title">Boka ett rum</h3>
				<ol class="card-steps">
					<li><span class="step-number">1</span> Välj ett rum i kartan</li>
					<li><span class="step-number">2</span> Klicka på en ledig tid i kalendern</li>
					<li><span class="step-number">3</span> Välj starttid och längd</li>
					<li><span class="step-number">4</span> Bekräfta med din PIN</li>
				</ol>
			</div>
		</div>

		<!-- Canceling -->
		<div class="info-card">
			<div class="icon-wrapper text-gray-500">
				<IconCircleCross size="18px" color="gray-500" />
			</div>
			<div class="card-content">
				<h3 class="card-title">Avboka</h3>
				<ul class="card-list">
					<li>Dagens bokningar kan avbokas direkt i panelen</li>
					<li>
						Framtida bokningar kan bara avbokas här om de skapades på panelen, annars behöver du
						kontakta personen som bokade rummet
					</li>
				</ul>
			</div>
		</div>

		<!-- Add user -->
		<div class="info-card">
			<div class="icon-wrapper text-gray-500">
				<IconPerson size="18px" color="gray-500" />
			</div>
			<div class="card-content">
				<h3 class="card-title">Lägg till användare</h3>
				<p class="card-text">Klicka 5 gånger på klockan för att lägga till en ny användare.</p>
			</div>
		</div>

		<!-- POC note -->
		<p class="poc-note">Det här är ett proof of concept och ett work in progress.</p>
	</div>
</PopupWrapper>

<style>
	.info-card {
		display: flex;
		gap: 0.875rem;
		padding: 0.875rem;
		background: #f9fafb;
		border-radius: 0.75rem;
		transition: background-color 0.15s ease;
	}

	.info-card:hover {
		background: #f3f4f6;
	}

	.icon-wrapper {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 0.125rem;
	}

	.card-content {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.card-text {
		font-size: 0.8125rem;
		color: #4b5563;
		line-height: 1.5;
	}

	.card-steps {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #4b5563;
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.card-steps li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.125rem;
		height: 1.125rem;
		background: #e5e7eb;
		color: #4b5563;
		border-radius: 50%;
		font-size: 0.6875rem;
		font-weight: 500;
	}

	.card-list {
		font-size: 0.8125rem;
		color: #4b5563;
		line-height: 1.6;
		padding-left: 1rem;
		margin: 0;
	}

	.card-list li {
		margin-bottom: 0.125rem;
	}

	.card-list li::marker {
		color: #d1d5db;
	}

	.poc-note {
		text-align: center;
		font-size: 0.75rem;
		color: #9ca3af;
		padding-top: 0.5rem;
		margin: 0;
	}
</style>
