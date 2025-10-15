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

        const { roomEmail, bookingOption, pin } = (await request.json()) as {
            roomEmail: string;
            bookingOption: number;
            pin: string;
        };

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();
        let end = new Date(now);

        if (bookingOption === 0) {
            const eod = getEndOfDay(now);
            const events = await getNextMeeting(client, roomEmail, now, eod);
            const nextEvent = events.find((e: any) => new Date(e.start.dateTime) > now);
            end = nextEvent ? new Date(nextEvent.start.dateTime) : eod;
        } else {
            end = addMinutes(now, bookingOption);
        }

        const endOfDay = getEndOfDay(now);
        if (end > endOfDay) end = endOfDay;

        const timeRangeSummary = `${formatTime(now)} - ${formatTime(end)}`;
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
            startTime: now.toISOString(),
            endTime: end.toISOString(),
            timeZone: 'Europe/Stockholm',
            roomEmail,
            category: 'PanelBooking',
        });

        // Optional audit row
        await supabaseAdmin.from('booking_action_audit').insert({
            action: 'book',
            room_email: roomEmail,
            starts_at: now.toISOString(),
            ends_at: end.toISOString(),
            app_user_id: pinUser.id,
            meta: { bookingOption },
        });

        return json({ message: `Rummet ${roomEmail} bokat fram till kl ${formatTime(end)}` });
    } catch (error: any) {
        console.error('Fel vid bokning av rummet:', error);
        return new Response('Fel vid bokning av rummet: ' + error.message, { status: 500 });
    }
};
