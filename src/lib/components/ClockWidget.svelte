<script lang="ts">
    import { goto } from '$app/navigation';
    import { onDestroy, onMount } from 'svelte';
    import {
        CLICK_INDICATOR_MIN_VISIBLE,
        CLICK_INDICATOR_TOTAL,
        clickIndicatorStore,
    } from '../../stores/clickIndicatorStore';

    export let showWeek = false;
    export let timeZone: string | null = 'Europe/Stockholm';

    let now = new Date();
    let t: ReturnType<typeof setInterval> | undefined;
    let clickTimestamps: number[] = [];
    let indicatorHideTimeout: ReturnType<typeof setTimeout> | null = null;

    const CLICK_THRESHOLD = CLICK_INDICATOR_TOTAL;
    const CLICK_WINDOW_MS = 1500;
    const INDICATOR_HIDE_DELAY = 2000;

    function hideIndicator() {
        clickIndicatorStore.reset();
        if (indicatorHideTimeout) {
            clearTimeout(indicatorHideTimeout);
            indicatorHideTimeout = null;
        }
    }

    function week(d: Date) {
        const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = (dt.getUTCDay() + 6) % 7;
        dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
        const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
        const diff = (dt.getTime() - firstThu.getTime()) / 86400000;
        return 1 + Math.floor(diff / 7);
    }

    const fmtTime = (d: Date) =>
        new Intl.DateTimeFormat('sv-SE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: timeZone || undefined,
        }).format(d);

    const fmtDate = (d: Date) =>
        new Intl.DateTimeFormat('sv-SE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: timeZone || undefined,
        }).format(d);

    onMount(() => {
        t = setInterval(() => (now = new Date()), 1000);
    });

    onDestroy(() => {
        if (t) clearInterval(t);
        hideIndicator();
    });

    function handleClockClick() {
        const timestamp = Date.now();
        clickTimestamps = clickTimestamps.filter((ts) => timestamp - ts <= CLICK_WINDOW_MS);
        clickTimestamps.push(timestamp);

        const visibleCount = Math.min(clickTimestamps.length, CLICK_THRESHOLD);
        clickIndicatorStore.setProgress(visibleCount);

        if (indicatorHideTimeout) {
            clearTimeout(indicatorHideTimeout);
            indicatorHideTimeout = null;
        }

        if (visibleCount >= CLICK_INDICATOR_MIN_VISIBLE) {
            indicatorHideTimeout = setTimeout(() => {
                hideIndicator();
                clickTimestamps = [];
            }, INDICATOR_HIDE_DELAY);
        }

        if (clickTimestamps.length >= CLICK_THRESHOLD) {
            clickTimestamps = [];
            hideIndicator();
            void goto('/sign-up');
        }
    }

    function handleClockKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClockClick();
        }
    }
</script>

<button
    class="clock-widget select-none"
    type="button"
    aria-label="Visa registreringssida"
    on:click={handleClockClick}
    on:keydown={handleClockKeydown}
>
    <p class="clock-date text-gray-700">
        {fmtDate(now)}{showWeek ? ` · v.${week(now)}` : ''}
    </p>
    <p class="clock-time">{fmtTime(now)}</p>
</button>

<style>
    .clock-widget {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        text-align: right;
        color: #1f2937;
        gap: 0.25rem;
        cursor: pointer;
        background: transparent;
        border: none;
        padding: 0;
    }

    .clock-date {
        font-size: 1.05rem;
        font-weight: 200;
        letter-spacing: 0.01em;
        text-transform: capitalize;
        text-align: left;
        width: 100%;
    }

    .clock-time {
        font-size: clamp(3.25rem, 5vw, 5.5rem);
        font-weight: 600;
        line-height: 0.9;
        font-variant-numeric: tabular-nums;
        font-feature-settings: 'tnum' 1;
        width: 100%;
        text-align: right;
    }

    :global(.dark) .clock-widget {
        color: #f4f4f5;
    }

    .clock-widget:focus-visible {
        outline: 2px solid #2563eb;
        outline-offset: 4px;
    }
</style>
