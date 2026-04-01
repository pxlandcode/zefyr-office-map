<script lang="ts">
	import type { CalendarDayColumn } from '$lib/types/calendarTypes';
	import { fly } from 'svelte/transition';
	import {
		formatDayOfMonth,
		formatSelectedDayLabel,
		formatWeekdayShort
	} from '$lib/utils/helpers/calendarHelpers';
	import CurrentTimeIndicator from './current-time-indicator/CurrentTimeIndicator.svelte';
	import MeetingSlot from './meeting-slot/MeetingSlot.svelte';

	const paneFlyInDuration = 190;
	const paneFlyOutDuration = 150;

	export let container: HTMLDivElement | null = null;
	export let headerScroller: HTMLDivElement | null = null;
	export let bodyScroller: HTMLDivElement | null = null;
	export let viewportWidth = 0;
	export let selectedWeekStartKey: string;
	export let hours: number[] = [];
	export let dayColumns: CalendarDayColumn[] = [];
	export let startHour: number;
	export let hourHeight: number;
	export let trackHeight: number;
	export let timeGutterWidth: number;
	export let weekDaysTrackWidth: number;
	export let meetingHorizontalInset: number;
	export let paneFlyInX = 0;
	export let paneFlyOutX = 0;
	export let onScroll: (event: Event) => void = () => {};
	export let onHeaderScroll: () => void = () => {};
	export let onBodyScroll: () => void = () => {};
	export let onFocusDay: (dateKey: string) => void = () => {};
</script>

<div
	bind:this={container}
	class="calendar-scroll relative h-full min-h-0 w-full overflow-y-auto overflow-x-hidden rounded-lg border border-gray-300 bg-white shadow-md"
	on:scroll={onScroll}
>
	<div class="sticky top-0 z-20 border-b border-gray-200 bg-white">
		<div class="flex">
			<div
				class="h-12 shrink-0 border-r border-gray-200 bg-white"
				style={`width: ${timeGutterWidth}px;`}
			></div>

			<div class="relative h-12 min-w-0 flex-1 overflow-hidden">
				{#key selectedWeekStartKey}
					<div
						class="absolute inset-0 bg-white"
						in:fly={{ x: paneFlyInX, opacity: 0, duration: paneFlyInDuration }}
						out:fly={{ x: paneFlyOutX, opacity: 0, duration: paneFlyOutDuration }}
					>
						<div
							bind:this={headerScroller}
							class="calendar-scroll h-full overflow-x-auto overflow-y-hidden"
							on:scroll={onHeaderScroll}
						>
							<div class="flex" style={`width: ${weekDaysTrackWidth}px;`}>
								{#each dayColumns as column, columnIndex}
									<button
										type="button"
										class={`flex h-12 shrink-0 items-center justify-center gap-2 px-3 py-2 text-center transition-colors hover:bg-gray-50 ${
											columnIndex > 0 ? 'border-l border-dashed border-gray-200' : ''
										}`}
										style={`width: ${column.width}px;`}
										on:click={() => void onFocusDay(column.dateKey)}
									>
										<span
											class={`text-[11px] font-medium ${
												column.isToday ? 'text-blue-600' : 'text-gray-500'
											}`}
										>
											{formatWeekdayShort(column.date)}
										</span>
										<span
											class={`inline-flex min-w-[1.55rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
												column.isToday ? 'bg-blue-500 text-white' : 'text-gray-900'
											}`}
										>
											{formatDayOfMonth(column.date)}
										</span>
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/key}
			</div>
		</div>
	</div>

	<div class="flex">
		<div
			class="pointer-events-none relative z-40 shrink-0 border-r border-gray-200 bg-white"
			style={`width: ${timeGutterWidth}px; height: ${trackHeight}px;`}
		>
			{#each hours as hour, index}
				<div
					class="absolute left-0 w-full pl-[10px]"
					style={`top: ${index * hourHeight}px;`}
				>
					<div class="inline-flex rounded-sm bg-white pr-2 text-sm text-gray-500">
						{hour === 0 ? '00:00' : `${hour}:00`}
					</div>
				</div>
			{/each}

			<CurrentTimeIndicator {startHour} {hourHeight} showLine={false} labelLeft={0} />
		</div>

		<div class="relative min-w-0 flex-1 overflow-hidden" style={`height: ${trackHeight}px;`}>
			{#key selectedWeekStartKey}
				<div
					class="absolute inset-0 bg-white"
					in:fly={{ x: paneFlyInX, opacity: 0, duration: paneFlyInDuration }}
					out:fly={{ x: paneFlyOutX, opacity: 0, duration: paneFlyOutDuration }}
				>
					<div
						bind:this={bodyScroller}
						bind:clientWidth={viewportWidth}
						class="calendar-scroll h-full overflow-x-auto overflow-y-hidden"
						on:scroll={onBodyScroll}
					>
						<div
							class="relative"
							style={`width: ${weekDaysTrackWidth}px; height: ${trackHeight}px;`}
						>
							<div class="pointer-events-none absolute inset-0 z-0">
								{#each hours as hour, index}
									<div
										class="absolute left-0 right-0 border-t border-dashed border-gray-300"
										style={`top: ${index * hourHeight}px;`}
									></div>
								{/each}
							</div>

							<div class="pointer-events-none absolute inset-0 z-30">
								<CurrentTimeIndicator
									{startHour}
									{hourHeight}
									lineWidth={`${weekDaysTrackWidth}px`}
									labelLeft={0}
									leftOffset={0}
									showLabel={false}
								/>
							</div>

							{#each dayColumns as column}
								<button
									type="button"
									class="absolute bottom-0 top-0 border-l border-dashed border-gray-200 bg-transparent transition-colors hover:bg-gray-50/30"
									style={`left: ${column.left}px; width: ${column.width}px;`}
									aria-label={`Visa ${formatSelectedDayLabel(column.date)}`}
									on:click={() => void onFocusDay(column.dateKey)}
								></button>
							{/each}

							{#if dayColumns.length > 0}
								<div
									class="absolute bottom-0 top-0 border-r border-dashed border-gray-200"
									style={`left: ${weekDaysTrackWidth}px;`}
								></div>
							{/if}

							{#each dayColumns as column, dayIndex}
								{#each column.meetings as meeting, meetingIndex (meeting.id ?? `${column.dateKey}-${meeting.startDate}-${meeting.endDate}-${meetingIndex}`)}
									<MeetingSlot
										{meeting}
										{startHour}
										{hourHeight}
										i={dayIndex + meetingIndex}
										leftOffset={column.left + meetingHorizontalInset}
										slotWidth={`${column.width - meetingHorizontalInset * 2}px`}
									/>
								{/each}
							{/each}
						</div>
					</div>
				</div>
			{/key}
		</div>
	</div>
</div>
