import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { rooms } from '$lib/server/config/rooms';
import { getRoomEvents, processMeetingStatus } from '$lib/server/helpers/meeting';
import { formatRoomStatus } from '$lib/server/helpers/format';
import { REQUIRE_AUTH } from '$env/static/private';

const MAX_GRAPH_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 400;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractHttpStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;
    const err = error as Record<string, unknown>;
    return (
        (typeof err.statusCode === 'number' && err.statusCode) ||
        (typeof err.status === 'number' && err.status) ||
        (err.response && typeof (err.response as Response).status === 'number'
            ? ((err.response as Response).status as number)
            : null)
    );
}

function describeGraphError(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Okänt fel mot Graph';
    const err = error as { message?: string; code?: string };
    const status = extractHttpStatus(error);
    const parts = [] as string[];
    if (status) parts.push(`HTTP ${status}`);
    if (err.code) parts.push(err.code);
    if (err.message) parts.push(err.message);
    return parts.length ? parts.join(' – ') : 'Okänt fel mot Graph';
}

function shouldRetry(error: unknown): boolean {
    const status = extractHttpStatus(error);
    if (status && RETRYABLE_STATUS_CODES.has(status)) return true;
    if (!error || typeof error !== 'object') return false;
    const err = error as { code?: string };
    return err.code === 'TooManyRequests' || err.code === 'TimeoutError';
}

async function fetchRoomStatusWithRetry(
    client: any,
    room: (typeof rooms)[number],
    now: Date,
    startOfDay: Date,
    endOfDay: Date
) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            const events = await getRoomEvents(client, room.email, startOfDay, endOfDay);
            const eventCount = Array.isArray(events?.value) ? events.value.length : 0;
            console.log(`Hämtade ${eventCount} möten för rum ${room.email}`);
            const statusData = processMeetingStatus(events, now);
            console.log('Statusdata för rum', room.email, statusData);
            return formatRoomStatus(room, statusData, now);
        } catch (error) {
            attempt += 1;
            const retryable = shouldRetry(error);
            const delay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
            console.warn(
                `Graph-förfrågan misslyckades för ${room.email} (försök ${attempt}/${MAX_GRAPH_RETRIES})`,
                describeGraphError(error)
            );

            if (!retryable || attempt >= MAX_GRAPH_RETRIES) {
                throw error;
            }

            await sleep(delay);
        }
    }
}

export const GET = async ({ locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const client = await getClient();

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const roomResults = await Promise.allSettled(
            rooms.map((room) => fetchRoomStatusWithRetry(client, room, now, startOfDay, endOfDay))
        );

        const fallbackStatus = {
            status: 'Okänt',
            currentMeeting: null,
            nextMeeting: null,
            currentMeetingOrganizer: null,
            nextMeetingOrganizer: null,
            todaysMeetings: [],
        };

        const failedRooms: { room: string; error: string }[] = [];

        const roomStatuses = roomResults.map((result, index) => {
            const room = rooms[index];
            if (result.status === 'fulfilled') return result.value;

            const errorInfo = describeGraphError(result.reason);
            failedRooms.push({ room: room.email, error: errorInfo });
            return {
                ...formatRoomStatus(room, fallbackStatus, now),
                status: 'Okänt',
                error: errorInfo,
            };
        });

        const ongoingMeetings: any[] = [];
        const upcomingMeetings: any[] = [];

        for (const room of roomStatuses) {
            (room.todaysMeetings ?? []).forEach((meeting: any) => {
                const start = new Date(meeting.startDate);
                const end = new Date(meeting.endDate);
                (meeting as any).roomName = room.name;

                if (now >= start && now < end) ongoingMeetings.push(meeting);
                else if (start > now) upcomingMeetings.push(meeting);
            });
        }

        return json({
            rooms: roomStatuses,
            ongoingMeetings,
            upcomingMeetings,
            errors: failedRooms.length ? failedRooms : undefined,
        });
    } catch (error: any) {
        console.error('Fel vid hämtning av rumstatus:', error);
        const status = extractHttpStatus(error) ?? 500;
        const message = describeGraphError(error);
        return new Response('Fel vid hämtning av rumstatus: ' + message, { status });
    }
};
