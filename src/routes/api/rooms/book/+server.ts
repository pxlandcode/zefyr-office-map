import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { getEndOfDay, addMinutes } from '$lib/server/helpers/timeUtils';
import { getNextMeeting, createCalendarEvent } from '$lib/server/helpers/meeting';
import { formatTime } from '$lib/server/helpers/format';
import { REQUIRE_AUTH } from '$env/static/private';
import { verifyPinOrThrow } from '$lib/server/auth/pin';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const payload = (await request.json()) as {
            roomEmail: string;
            bookingOption: number;
            startOffsetMinutes?: number;
            pin: string;
        };

        const { roomEmail, bookingOption, pin } = payload;
        const startOffsetMinutes = Math.max(0, payload.startOffsetMinutes ?? 0);

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();
        const start = addMinutes(now, startOffsetMinutes);
        const endOfDay = getEndOfDay(start);

        if (start >= endOfDay) {
            return new Response('Starttiden ligger efter slutet på dagen.', { status: 400 });
        }

        const events = await getNextMeeting(client, roomEmail, start, endOfDay);
        const nextEvent = events.find((e: any) => new Date(e.start.dateTime) > start);

        let end: Date;

        if (bookingOption === 0) {
            end = nextEvent ? new Date(nextEvent.start.dateTime) : endOfDay;
        } else {
            end = addMinutes(start, bookingOption);
            if (nextEvent) {
                const nextEventStart = new Date(nextEvent.start.dateTime);
                if (nextEventStart < end) end = nextEventStart;
            }
            if (end > endOfDay) end = endOfDay;
        }

        if (end <= start) {
            return new Response('Starttiden krockar med nästa bokning.', { status: 400 });
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

        await createCalendarEvent(client, {
            subject,
            bodyContent,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            timeZone: 'Europe/Stockholm',
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
            meta: { bookingOption, startOffsetMinutes },
        });

        return json({ message: `Rummet ${roomEmail} bokat fram till kl ${formatTime(end)}` });
    } catch (error: any) {
        console.error('Fel vid bokning av rummet:', error);
        return new Response('Fel vid bokning av rummet: ' + error.message, { status: 500 });
    }
};
