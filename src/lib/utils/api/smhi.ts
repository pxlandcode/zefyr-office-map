import { formatInTimeZone } from 'date-fns-tz';

const SMHI_ENDPOINT = '/api/weather/smhi';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedForecast: {
    expiresAt: number;
    entries: SmhiForecastEntry[];
} | null = null;

export type FetchLike = typeof fetch;

export interface SmhiForecastEntry {
    validTime: string;
    parameters: Record<string, number | null> & {
        t: number | null;
        tcc_mean: number | null;
        pmean: number | null;
        tstm: number | null;
        Wsymb2: number | null;
        ws: number | null;
        wd: number | null;
    };
}

interface SmhiTimeSeries {
    time: string;
    data: Record<string, number | null | undefined>;
}

interface SmhiResponse {
    createdTime: string;
    referenceTime: string;
    geometry: {
        type: string;
        coordinates: number[][];
    };
    timeSeries: SmhiTimeSeries[];
}

type FetchForecastOptions = {
    fetcher?: FetchLike;
    forceRefresh?: boolean;
};

function extractParameter(series: SmhiTimeSeries, name: string) {
    const value = series.data?.[name];
    return typeof value === 'number' ? value : null;
}

function getHourInTimeZone(dateIso: string, timeZone: string) {
    const hourString = formatInTimeZone(new Date(dateIso), timeZone, 'H');
    return Number.parseInt(hourString, 10);
}

export async function fetchSmhiForecast(
    options: FetchForecastOptions = {}
): Promise<SmhiForecastEntry[]> {
    const now = Date.now();

    if (!options.forceRefresh && cachedForecast && cachedForecast.expiresAt > now) {
        return cachedForecast.entries;
    }

    const fetcher = options.fetcher ?? fetch;
    const response = await fetcher(SMHI_ENDPOINT);

    if (!response.ok) {
        throw new Error(`SMHI forecast request failed with status ${response.status}`);
    }

    const data = (await response.json()) as SmhiResponse;

    const entries: SmhiForecastEntry[] = data.timeSeries.map((series) => ({
        validTime: series.time,
        parameters: {
            t: extractParameter(series, 'air_temperature'),
            tcc_mean: extractParameter(series, 'cloud_area_fraction'),
            pmean: extractParameter(series, 'precipitation_amount'),
            tstm: extractParameter(series, 'thunder_probability'),
            Wsymb2: extractParameter(series, 'symbol_code'),
            ws: extractParameter(series, 'wind_speed'),
            wd: extractParameter(series, 'wind_from_direction'),
        },
    }));

    cachedForecast = {
        expiresAt: now + CACHE_TTL_MS,
        entries,
    };

    return entries;
}

export function pickNearestByLocalHour(
    entries: SmhiForecastEntry[],
    targetHourLocal: number,
    tz: string = 'Europe/Stockholm'
): SmhiForecastEntry | null {
    if (!entries.length) {
        return null;
    }

    let bestEntry: SmhiForecastEntry | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    let bestHour: number | null = null;

    for (const entry of entries) {
        const hour = getHourInTimeZone(entry.validTime, tz);

        const rawDiff = Math.abs(hour - targetHourLocal);
        const hourDiff = Math.min(rawDiff, 24 - rawDiff);

        if (
            hourDiff < bestDiff ||
            (hourDiff === bestDiff &&
                bestEntry &&
                new Date(entry.validTime) > new Date(bestEntry.validTime))
        ) {
            bestEntry = entry;
            bestDiff = hourDiff;
            bestHour = hour;
        }
    }

    return bestEntry ?? null;
}
