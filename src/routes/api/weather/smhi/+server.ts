import { json, type RequestHandler } from '@sveltejs/kit';

const SMHI_FORECAST_ENDPOINT =
    'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.0527/lat/59.3362/data.json?parameters=air_temperature,cloud_area_fraction,precipitation_amount,thunder_probability,symbol_code,wind_speed,wind_from_direction';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedPayload: {
    expiresAt: number;
    data: unknown;
} | null = null;

export const GET: RequestHandler = async ({ fetch }) => {
    const now = Date.now();

    if (cachedPayload && cachedPayload.expiresAt > now) {
        return json(cachedPayload.data, {
            headers: {
                'cache-control': 'public, max-age=300, stale-while-revalidate=60',
            },
        });
    }

    try {
        // Proxy the upstream request so the browser does not depend on third-party fetch/CORS behavior.
        const response = await fetch(SMHI_FORECAST_ENDPOINT, {
            headers: {
                accept: 'application/json',
            },
        });

        if (!response.ok) {
            const details = await response.text().catch(() => '');
            const message = details
                ? `SMHI forecast request failed with status ${response.status}: ${details}`
                : `SMHI forecast request failed with status ${response.status}`;
            console.error(message);
            return new Response(message, { status: 502 });
        }

        const data = await response.json();

        cachedPayload = {
            expiresAt: now + CACHE_TTL_MS,
            data,
        };

        return json(data, {
            headers: {
                'cache-control': 'public, max-age=300, stale-while-revalidate=60',
            },
        });
    } catch (error) {
        console.error('Failed to proxy SMHI forecast', error);
        return new Response('Failed to proxy SMHI forecast', { status: 502 });
    }
};
