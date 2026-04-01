import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { addMinutes } from '$lib/server/helpers/timeUtils';
import {
    createCalendarEvent,
    getRoomEvents,
    normalizeCalendarEvent,
} from '$lib/server/helpers/meeting';
import { formatTime } from '$lib/server/helpers/format';
import { REQUIRE_AUTH } from '$env/static/private';
import { verifyPinOrThrow } from '$lib/server/auth/pin';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = 'Europe/Stockholm';
const DATE_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MINUTES = 24 * 60;

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function buildZonedDateTime(dateKey: string, minuteOfDay: number) {
    const hours = Math.floor(minuteOfDay / 60);
    const minutes = minuteOfDay % 60;
    return fromZonedTime(
        `${dateKey}T${pad(hours)}:${pad(minutes)}:00.000`,
        TIME_ZONE
    );
}

function buildDayBoundary(dateKey: string, boundary: 'start' | 'end') {
    const time = boundary === 'start' ? '00:00:00.000' : '23:59:59.999';
    return fromZonedTime(`${dateKey}T${time}`, TIME_ZONE);
}

function parseGraphDateTime(dateTime: string) {
    return fromZonedTime(dateTime, TIME_ZONE);
}

function createTodayDateKey() {
    return formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd');
}

function getCurrentMinuteOfDay(now: Date) {
    const hours = Number(formatInTimeZone(now, TIME_ZONE, 'H'));
    const minutes = Number(formatInTimeZone(now, TIME_ZONE, 'm'));
    return hours * 60 + minutes;
}

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const payload = (await request.json()) as {
            roomEmail: string;
            bookingOption: number;
            startDate: string;
            startMinuteOfDay: number;
            pin: string;
        };

        const { roomEmail, bookingOption, startDate, startMinuteOfDay, pin } = payload;

        if (!DATE_PARAM_PATTERN.test(startDate)) {
            return new Response('Ogiltigt datum för bokningen.', { status: 400 });
        }

        const isTodayBooking = startDate === createTodayDateKey();

        if (
            !Number.isInteger(startMinuteOfDay) ||
            startMinuteOfDay < 0 ||
            startMinuteOfDay >= DAY_MINUTES ||
            (!isTodayBooking && startMinuteOfDay % 15 !== 0)
        ) {
            return new Response('Ogiltig starttid för bokningen.', { status: 400 });
        }

        if (!Number.isInteger(bookingOption) || bookingOption < 0) {
            return new Response('Ogiltig bokningslängd.', { status: 400 });
        }

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();
        const currentMinuteOfDay = getCurrentMinuteOfDay(now);
        const isImmediateTodayStart = isTodayBooking && startMinuteOfDay <= currentMinuteOfDay;
        const start = isImmediateTodayStart ? now : buildZonedDateTime(startDate, startMinuteOfDay);
        const startOfDay = buildDayBoundary(startDate, 'start');
        const endOfDay = buildDayBoundary(startDate, 'end');

        if (start < now) {
            return new Response('Starttiden har redan passerat.', { status: 400 });
        }

        const events = await getRoomEvents(client, roomEmail, startOfDay, endOfDay);
        const nextEvent = (events?.value ?? []).find(
            (event: any) => parseGraphDateTime(event.start.dateTime) > start
        );

        let end: Date;

        if (bookingOption === 0) {
            end = nextEvent ? parseGraphDateTime(nextEvent.start.dateTime) : endOfDay;
        } else {
            end = addMinutes(start, bookingOption);
            if (end > endOfDay) {
                return new Response('Bokningen måste sluta innan dagens slut.', { status: 400 });
            }
        }

        if (end <= start) {
            return new Response('Det finns ingen ledig tid för den valda bokningen.', { status: 400 });
        }

        const overlappingEvent = (events?.value ?? []).find((event: any) => {
            const eventStart = parseGraphDateTime(event.start.dateTime);
            const eventEnd = parseGraphDateTime(event.end.dateTime);
            return eventStart < end && eventEnd > start;
        });

        if (overlappingEvent) {
            return new Response('Den valda tiden krockar med en befintlig bokning.', {
                status: 400,
            });
        }

        const timeRangeSummary = `${formatTime(start)} - ${formatTime(end)}`;
        const bookingLengthSummary =
            bookingOption === 0 ? 'Tills nästa möte' : `${bookingOption} minuter`;
        const subject = `Panelbokning: ${pinUser.full_name}`;
        const bodyContent = [
            '<p><strong>Bokat på panel (kiosk)</strong></p>',
            `<p>Bokad av: ${pinUser.full_name}</p>`,
            `<p>Tid: ${timeRangeSummary}</p>`,
            `<p>Längd: ${bookingLengthSummary}</p>`,
        ].join('');

        const createdEvent = await createCalendarEvent(client, {
            subject,
            bodyContent,
            startTime: start,
            endTime: end,
            timeZone: TIME_ZONE,
            roomEmail,
            category: 'PanelBooking',
        });

        // Optional audit row
        await supabaseAdmin.from('booking_action_audit').insert({
            action: 'book',
            room_email: roomEmail,
            starts_at: start.toISOString(),
            ends_at: end.toISOString(),
            app_user_id: pinUser.id,
            meta: { bookingOption, startDate, startMinuteOfDay },
        });

        return json({
            message: `Rummet ${roomEmail} bokat fram till kl ${formatTime(end)}`,
            meeting: normalizeCalendarEvent(createdEvent),
        });
    } catch (error: any) {
        console.error('Fel vid bokning av rummet:', error);
        return new Response('Fel vid bokning av rummet: ' + error.message, { status: 500 });
    }
};
