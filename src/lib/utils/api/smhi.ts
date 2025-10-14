import { formatInTimeZone } from 'date-fns-tz';

const SMHI_ENDPOINT =
    'https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/18.0527/lat/59.3362/data.json';

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

interface SmhiParameter {
    name: string;
    unit: string;
    values: number[];
}

interface SmhiTimeSeries {
    validTime: string;
    parameters: SmhiParameter[];
}

interface SmhiResponse {
    approvedTime: string;
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
    const param = series.parameters.find((p) => p.name === name);
    return param?.values?.[0] ?? null;
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
        validTime: series.validTime,
        parameters: {
            t: extractParameter(series, 't'),
            tcc_mean: extractParameter(series, 'tcc_mean'),
            pmean: extractParameter(series, 'pmean'),
            tstm: extractParameter(series, 'tstm'),
            Wsymb2: extractParameter(series, 'Wsymb2'),
            ws: extractParameter(series, 'ws'),
            wd: extractParameter(series, 'wd'),
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
        }
    }

    return bestEntry ?? null;
}
