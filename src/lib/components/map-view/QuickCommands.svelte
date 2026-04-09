<script lang="ts">
    import { format } from 'date-fns-tz';
    import { findFreeRooms } from '$lib/utils/api/api';
    import type { FreeSlot } from '$lib/types/roomTypes';
    import Icon from '$lib/components/ui/icon-component/Icon.svelte';
    import Spinner from '$lib/components/ui/spinner/Spinner.svelte';

    const TIME_ZONE = 'Europe/Stockholm';
    const DURATIONS = [15, 30, 60] as const;

    let selectedDuration = 30;
    let state: 'idle' | 'loading' | 'results' | 'error' = 'idle';
    let slots: FreeSlot[] = [];
    let errorMessage = '';
    let activeCommand: string | null = null;
    let lastSearchRange: { start: string; end: string } | null = null;
    let searchVersion = 0;

    function todayKey(): string {
        return format(new Date(), 'yyyy-MM-dd', { timeZone: TIME_ZONE });
    }

    function dateKeyOffset(days: number): string {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return format(d, 'yyyy-MM-dd', { timeZone: TIME_ZONE });
    }

    function fridayOfThisWeek(): string {
        const now = new Date();
        const day = now.getDay(); // 0=Sun..6=Sat
        const daysUntilFriday = day <= 5 ? 5 - day : -1; // if Sat -> -1 (past friday)
        if (daysUntilFriday < 0) return todayKey(); // fallback, won't match
        return dateKeyOffset(daysUntilFriday);
    }

    async function search(startDate: string, endDate: string) {
        if (startDate > endDate) {
            state = 'results';
            slots = [];
            return;
        }
        lastSearchRange = { start: startDate, end: endDate };
        state = 'loading';
        errorMessage = '';
        const version = ++searchVersion;
        try {
            const result = await findFreeRooms(startDate, endDate, selectedDuration);
            if (version !== searchVersion) return;
            slots = result.slots;
            state = 'results';
        } catch (err: any) {
            if (version !== searchVersion) return;
            errorMessage = err.message ?? 'Kunde inte hämta lediga tider';
            state = 'error';
        }
    }

    function findFirstFreeToday() {
        activeCommand = 'today';
        const today = todayKey();
        search(today, today);
    }

    function findTimeTomorrow() {
        activeCommand = 'tomorrow';
        const tomorrow = dateKeyOffset(1);
        search(tomorrow, tomorrow);
    }

    function findTimeLaterThisWeek() {
        activeCommand = 'week';
        const start = dateKeyOffset(2);
        const end = fridayOfThisWeek();
        search(start, end);
    }

    function handleDurationChange(dur: number) {
        selectedDuration = dur;
        if (lastSearchRange && (state === 'results' || state === 'error')) {
            search(lastSearchRange.start, lastSearchRange.end);
        }
    }

    function formatSlotTime(dateTimeStr: string): string {
        return format(new Date(dateTimeStr), 'HH:mm');
    }

    function formatSlotDate(dateTimeStr: string): string {
        const slotDate = dateTimeStr.slice(0, 10);
        const today = todayKey();
        const tomorrow = dateKeyOffset(1);
        if (slotDate === today) return 'Idag';
        if (slotDate === tomorrow) return 'Imorgon';
        return format(new Date(dateTimeStr), 'EEE d/M', { timeZone: TIME_ZONE });
    }

    function isMultiDay(): boolean {
        if (!lastSearchRange) return false;
        return lastSearchRange.start !== lastSearchRange.end;
    }
</script>

<section class="mt-auto flex flex-shrink-0 flex-col gap-3 pt-4">
    <h3 class="font-semibold">Hitta ledigt rum</h3>

    <div class="flex gap-2">
        {#each DURATIONS as dur}
            <button
                class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
                class:bg-blue={selectedDuration === dur}
                class:text-white={selectedDuration === dur}
                class:bg-gray-bright={selectedDuration !== dur}
                class:text-text={selectedDuration !== dur}
                on:click={() => handleDurationChange(dur)}
            >
                {dur} min
            </button>
        {/each}
    </div>

    <div class="flex flex-col gap-2">
        <button
            class="quick-cmd-btn"
            class:quick-cmd-active={activeCommand === 'today'}
            disabled={state === 'loading'}
            on:click={findFirstFreeToday}
        >
            Första lediga tid idag
        </button>
        <button
            class="quick-cmd-btn"
            class:quick-cmd-active={activeCommand === 'tomorrow'}
            disabled={state === 'loading'}
            on:click={findTimeTomorrow}
        >
            Hitta tid imorgon
        </button>
        <button
            class="quick-cmd-btn"
            class:quick-cmd-active={activeCommand === 'week'}
            disabled={state === 'loading'}
            on:click={findTimeLaterThisWeek}
        >
            Hitta tid senare i veckan
        </button>
    </div>

    {#if state === 'loading'}
        <div class="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size="1rem" color="blue" />
            <span>Söker lediga rum...</span>
        </div>
    {/if}

    {#if state === 'error'}
        <p class="text-sm text-red">{errorMessage}</p>
    {/if}

    {#if state === 'results'}
        {#if slots.length === 0}
            <p class="text-sm text-gray-500">Inga lediga tider hittades.</p>
        {:else}
            <div class="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                {#each slots as slot (slot.roomEmail + slot.start)}
                    <div class="slot-item">
                        <div class="flex items-center gap-2">
                            <Icon icon="MeetingRoom" size="12px" />
                            <span class="font-semibold">{slot.roomName}</span>
                        </div>
                        <span class="text-gray-600">
                            {#if isMultiDay()}
                                {formatSlotDate(slot.start)}
                            {/if}
                            {formatSlotTime(slot.start)}–{formatSlotTime(slot.end)}
                        </span>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</section>

<style>
    .quick-cmd-btn {
        text-align: left;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(15, 23, 42, 0.08);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 150ms ease,
            box-shadow 150ms ease,
            transform 150ms ease;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
    }

    .quick-cmd-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
        transform: translateY(-1px);
    }

    .quick-cmd-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .quick-cmd-active {
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .slot-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(15, 23, 42, 0.06);
        padding: 0.4rem 0.75rem;
        font-size: 0.8125rem;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }
</style>
