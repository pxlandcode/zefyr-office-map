import { json, type RequestHandler } from '@sveltejs/kit';
import { REQUIRE_AUTH } from '$env/static/private';
import { getRoomEvents, normalizeCalendarEvents } from '$lib/server/helpers/meeting';
import { getClient } from '$lib/server/msgraph';
import { fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Europe/Stockholm';
const MAX_RANGE_DAYS = 14;
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateBoundary(value: string | null, boundary: 'start' | 'end') {
    if (!value || !DATE_PARAM_PATTERN.test(value)) return null;

    const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
    return fromZonedTime(`${value}T${time}`, TIME_ZONE);
}

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const roomEmail = url.searchParams.get('roomEmail');
        const startDateParam = url.searchParams.get('startDate');
        const endDateParam = url.searchParams.get('endDate');
        const startDate = parseDateBoundary(startDateParam, 'start');
        const endDate = parseDateBoundary(endDateParam, 'end');

        if (!roomEmail || !startDate || !endDate) {
            return new Response('roomEmail, startDate och endDate krävs', { status: 400 });
        }

        if (endDate < startDate) {
            return new Response('endDate måste vara samma dag eller senare än startDate', {
                status: 400,
            });
        }

        const rangeMs = endDate.getTime() - startDate.getTime();
        const rangeDays = rangeMs / (1000 * 60 * 60 * 24);
        if (rangeDays > MAX_RANGE_DAYS) {
            return new Response(`Datumintervallet får vara högst ${MAX_RANGE_DAYS} dagar`, {
                status: 400,
            });
        }

        const client = await getClient();
        const events = await getRoomEvents(client, roomEmail, startDate, endDate);

        return json({
            roomEmail,
            startDate: startDateParam,
            endDate: endDateParam,
            meetings: normalizeCalendarEvents(events),
        });
    } catch (error: any) {
        console.error('Fel vid hämtning av kalenderintervall:', error);
        const status = typeof error?.statusCode === 'number' ? error.statusCode : 500;
        return new Response(error?.message ?? 'Fel vid hämtning av kalenderintervall', {
            status,
        });
    }
};
