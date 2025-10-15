<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import {
        fetchSmhiForecast,
        pickNearestByLocalHour,
        type SmhiForecastEntry,
    } from '$lib/utils/api/smhi';
    import {
        ArrowUp,
        Cloud,
        CloudDrizzle,
        CloudLightning,
        CloudRain,
        CloudSun,
        Snowflake,
        Sun,
        Wind,
    } from '@lucide/svelte';
    import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

    const TIME_ZONE = 'Europe/Stockholm';
    const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

    type SlotType = 'now' | 'future';

    interface SlotDefinition {
        label: string;
        targetHour: number;
        dayOffset: number;
        type: SlotType;
    }

    interface DisplaySegment {
        label: string;
        temperatureLabel: string;
        hasPrecipitation: boolean;
        icon: typeof Sun;
        iconClass: string;
        entry: SmhiForecastEntry | null;
        type: SlotType;
    }

    interface WindMeta {
        speed: number | null;
        direction: number | null;
    }

    let loading = true;
    let error: string | null = null;
    let segments: DisplaySegment[] = [];
    let wind: WindMeta = { speed: null, direction: null };

    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    let initialised = false;

    function determineSlots(currentHour: number): SlotDefinition[] {
        if (currentHour < 12) {
            return [
                { label: '', targetHour: currentHour, dayOffset: 0, type: 'now' },
                { label: '12:00', targetHour: 12, dayOffset: 0, type: 'future' },
                { label: '17:00', targetHour: 17, dayOffset: 0, type: 'future' },
            ];
        }

        if (currentHour < 17) {
            return [
                { label: '', targetHour: currentHour, dayOffset: 0, type: 'now' },
                { label: '17:00', targetHour: 17, dayOffset: 0, type: 'future' },
                { label: '20:00', targetHour: 20, dayOffset: 0, type: 'future' },
            ];
        }

        if (currentHour < 20) {
            return [
                { label: '', targetHour: currentHour, dayOffset: 0, type: 'now' },
                { label: '20:00', targetHour: 20, dayOffset: 0, type: 'future' },
                { label: '08:00', targetHour: 8, dayOffset: 1, type: 'future' },
            ];
        }

        return [
            { label: '', targetHour: currentHour, dayOffset: 0, type: 'now' },
            { label: '08:00', targetHour: 8, dayOffset: 1, type: 'future' },
            { label: '12:00', targetHour: 12, dayOffset: 1, type: 'future' },
        ];
    }

    function padHour(hour: number) {
        return hour.toString().padStart(2, '0');
    }

    function buildThresholdUtc(baseDateIso: string, targetHour: number, dayOffset: number) {
        const baseUtcMidnight = fromZonedTime(`${baseDateIso}T00:00:00`, TIME_ZONE);
        const shiftedUtc = new Date(baseUtcMidnight.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const shiftedLocalDate = formatInTimeZone(shiftedUtc, TIME_ZONE, 'yyyy-MM-dd');
        const localIso = `${shiftedLocalDate}T${padHour(targetHour)}:00:00`;
        return fromZonedTime(localIso, TIME_ZONE);
    }

    function roundTemperature(value: number | null) {
        if (value === null || Number.isNaN(value)) {
            return '–°C';
        }
        const rounded = Math.round(value);
        return `${rounded}°C`;
    }

    function selectIcon(entry: SmhiForecastEntry | null) {
        if (!entry) {
            return { icon: Cloud, className: 'icon-cloud' };
        }

        const { t, pmean, tstm, tcc_mean } = entry.parameters;
        const precipitation = pmean ?? 0;
        const thunder = tstm ?? 0;
        const clouds = tcc_mean ?? 8;
        const temperature = t ?? null;

        if (temperature !== null && temperature <= 0 && precipitation > 0) {
            return { icon: Snowflake, className: 'icon-snow' };
        }

        if (thunder >= 30 && precipitation > 0) {
            return { icon: CloudLightning, className: 'icon-lightning' };
        }

        if (precipitation >= 2) {
            return { icon: CloudRain, className: 'icon-rain' };
        }

        if (precipitation > 0) {
            return { icon: CloudDrizzle, className: 'icon-drizzle' };
        }

        if (clouds <= 1) {
            return { icon: Sun, className: 'icon-sun' };
        }

        if (clouds <= 4) {
            return { icon: CloudSun, className: 'icon-cloudsun' };
        }

        return { icon: Cloud, className: 'icon-cloud' };
    }

    function extractWind(nowEntry: SmhiForecastEntry | null): WindMeta {
        if (!nowEntry) {
            return { speed: null, direction: null };
        }

        return {
            speed: nowEntry.parameters.ws,
            direction: nowEntry.parameters.wd,
        };
    }

    function buildSegments(entries: SmhiForecastEntry[]) {
        const nowUtc = new Date();
        const currentDateIso = formatInTimeZone(nowUtc, TIME_ZONE, 'yyyy-MM-dd');
        const currentHour = Number.parseInt(formatInTimeZone(nowUtc, TIME_ZONE, 'H'), 10);
        const currentLocalIso = formatInTimeZone(nowUtc, TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss");
        const nowThresholdUtc = fromZonedTime(currentLocalIso, TIME_ZONE);

        const slots = determineSlots(currentHour);
        const annotated = entries.map((entry) => {
            const utcDate = new Date(entry.validTime);
            const localDateKey = formatInTimeZone(utcDate, TIME_ZONE, 'yyyy-MM-dd');
            return {
                entry,
                utcDate,
                localDateKey,
            };
        });

        const result: DisplaySegment[] = [];

        for (const slot of slots) {
            const thresholdUtc =
                slot.type === 'now'
                    ? nowThresholdUtc
                    : buildThresholdUtc(currentDateIso, slot.targetHour, slot.dayOffset);
            const thresholdTime = thresholdUtc.getTime();
            const targetDateKey = formatInTimeZone(thresholdUtc, TIME_ZONE, 'yyyy-MM-dd');

            const filteredAnnotated = annotated.filter(
                (item) => item.utcDate.getTime() >= thresholdTime
            );

            const sameDayEntries = filteredAnnotated
                .filter((item) => item.localDateKey === targetDateKey)
                .map((item) => item.entry);

            const filteredEntries = filteredAnnotated.map((item) => item.entry);

            const pool = sameDayEntries.length
                ? sameDayEntries
                : filteredEntries.length
                  ? filteredEntries
                  : entries;
            const chosen = pickNearestByLocalHour(pool, slot.targetHour, TIME_ZONE);
            const { icon, className } = selectIcon(chosen);

            result.push({
                label: slot.label,
                temperatureLabel: roundTemperature(chosen?.parameters.t ?? null),
                hasPrecipitation: (chosen?.parameters.pmean ?? 0) > 0,
                icon,
                iconClass: className,
                entry: chosen,
                type: slot.type,
            });
        }

        const nowSegment = result.find((segment) => segment.type === 'now');
        const windMeta = extractWind(nowSegment?.entry ?? null);

        return { segments: result, wind: windMeta };
    }

    async function loadForecast(forceRefresh = false) {
        try {
            if (!initialised) {
                loading = true;
            }

            const entries = await fetchSmhiForecast(
                forceRefresh ? { forceRefresh: true } : undefined
            );

            if (!entries?.length) {
                segments = [];
                wind = { speed: null, direction: null };
                return;
            }

            const built = buildSegments(entries);
            segments = built.segments;
            wind = built.wind;
            error = null;
        } catch (err) {
            console.error('Failed to load SMHI forecast', err);
            error = 'Kunde inte hämta väder.';
        } finally {
            loading = false;
            initialised = true;
        }
    }

    onMount(() => {
        loadForecast();
        refreshTimer = setInterval(() => {
            void loadForecast(true);
        }, REFRESH_INTERVAL_MS);

        return () => {
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
        };
    });

    onDestroy(() => {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
    });

    $: windSpeedDisplay =
        wind.speed === null || Number.isNaN(wind.speed) ? '– m/s' : `${wind.speed.toFixed(1)} m/s`;
</script>

{#if loading}
    <div
        class="weather-strip mt-2 rounded-xl border border-neutral-700/40 bg-neutral-900/40 p-3 text-sm text-neutral-200"
    >
        <p class="animate-pulse">Hämtar väder …</p>
    </div>
{:else if error}
    <div
        class="weather-strip mt-2 rounded-xl border border-neutral-700/40 bg-neutral-900/40 p-3 text-sm"
    >
        <p class="text-red-400">{error}</p>
    </div>
{:else if segments.length}
    <div class="weather-strip mt-2 rounded-xl text-gray-700">
        <div class="flex gap-3">
            {#each segments as segment (segment.label)}
                <div
                    class="weather-bubble flex w-20 min-w-[5rem] flex-col items-center gap-2 rounded-lg text-center font-light"
                >
                    <div class="flex flex-col items-center gap-1">
                        <div class={`weather-icon h-7 w-7 ${segment.iconClass}`} aria-hidden="true">
                            <svelte:component
                                this={segment.icon}
                                class="h-full w-full"
                                aria-hidden="true"
                            />
                        </div>
                        {#if segment.hasPrecipitation}
                            <span class="precip-indicator" aria-hidden="true"></span>
                        {/if}
                    </div>
                    <p class="text-lg leading-none">{segment.temperatureLabel}</p>
                    <p class="text-xs lowercase">{segment.label}</p>
                </div>
            {/each}
        </div>
        <div class="text-xs lowercase flex items-center gap-2 mt-[-20px]">
            <!-- <Wind class="h-4 w-4" aria-hidden="true" /> -->
            {#if wind.direction !== null}
                <ArrowUp
                    class="h-4 w-4 transition-transform duration-500"
                    style={`transform: rotate(${wind.direction}deg);`}
                    aria-hidden="true"
                />
            {/if}
            <span>{windSpeedDisplay}</span>
        </div>
    </div>
{:else}
    <div
        class="weather-strip mt-2 rounded-xl border border-neutral-700/40 bg-neutral-900/40 p-3 text-sm"
    >
        <p class="text-neutral-200">Ingen prognos finns tillgänglig just nu.</p>
    </div>
{/if}

<style>
    .weather-bubble {
        position: relative;
    }

    .weather-icon {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        transform-origin: center;
        transform-box: fill-box;
        transition: filter 0.4s ease;
    }

    .weather-icon.icon-cloud,
    .weather-icon.icon-cloudsun {
        animation: cloudDrift 18s linear infinite;
        color: #d6dcff;
    }

    .weather-icon.icon-cloudsun {
        color: #fde68a;
    }

    .weather-icon.icon-drizzle,
    .weather-icon.icon-rain {
        animation: rainDrift 4s ease-in-out infinite;
        color: #38bdf8;
    }

    .weather-icon.icon-lightning {
        animation: lightningFlash 7s ease-in-out infinite;
        color: #facc15;
        filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.45));
    }

    .weather-icon.icon-sun {
        animation: sunGlow 10s ease-in-out infinite;
        color: #fde047;
    }

    :global(.weather-icon.icon-sun circle) {
        fill: rgba(253, 224, 71, 0.3);
    }

    .weather-icon.icon-snow {
        animation: snowDrift 6s ease-in-out infinite;
        color: #bae6fd;
    }

    .precip-indicator {
        display: block;
        width: 1.75rem;
        height: 0.2rem;
        border-radius: 9999px;
        background: linear-gradient(90deg, #38bdf8, #60a5fa);
        animation: rainPulse 2.6s ease-in-out infinite;
    }

    @keyframes cloudDrift {
        0% {
            transform: translateX(-4%);
        }
        50% {
            transform: translateX(4%);
        }
        100% {
            transform: translateX(-4%);
        }
    }

    @keyframes rainDrift {
        0% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(3px);
        }
        100% {
            transform: translateY(0);
        }
    }

    @keyframes lightningFlash {
        0%,
        95%,
        100% {
            filter: drop-shadow(0 0 0 rgba(250, 204, 21, 0.25));
        }
        96% {
            filter: drop-shadow(0 0 14px rgba(250, 204, 21, 0.95));
        }
        97% {
            filter: drop-shadow(0 0 5px rgba(250, 204, 21, 0.35));
        }
    }

    @keyframes sunGlow {
        0%,
        100% {
            filter: drop-shadow(0 0 0 rgba(253, 224, 71, 0.15));
        }
        50% {
            filter: drop-shadow(0 0 22px rgba(253, 224, 71, 0.9));
        }
    }

    @keyframes snowDrift {
        0% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(2px);
        }
        100% {
            transform: translateY(0);
        }
    }

    @keyframes rainPulse {
        0%,
        100% {
            opacity: 0.3;
            transform: translateY(0);
        }
        50% {
            opacity: 0.95;
            transform: translateY(2px);
        }
    }

    .weather-icon.icon-cloud {
        animation-delay: -2s;
    }
    .weather-icon.icon-cloudsun {
        animation-delay: -4s;
    }
    .weather-icon.icon-drizzle {
        animation-delay: -1s;
    }
    .weather-icon.icon-rain {
        animation-delay: -3s;
    }
    .weather-icon.icon-lightning {
        animation-delay: -5s;
    }
    .weather-icon.icon-sun {
        animation-delay: -2.5s;
    }
    .weather-icon.icon-snow {
        animation-delay: -1.5s;
    }

    @media (prefers-reduced-motion: reduce) {
        .weather-icon.icon-cloud,
        .weather-icon.icon-cloudsun,
        .weather-icon.icon-drizzle,
        .weather-icon.icon-rain,
        .weather-icon.icon-lightning,
        .weather-icon.icon-sun,
        .weather-icon.icon-snow,
        .precip-indicator {
            animation-duration: 0.01ms;
            animation-iteration-count: 1;
            animation-play-state: paused;
            filter: none;
        }
    }
</style>
