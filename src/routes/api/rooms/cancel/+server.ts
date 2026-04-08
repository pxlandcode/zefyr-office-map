// src/routes/api/rooms/cancel/+server.ts
import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { REQUIRE_AUTH } from '$env/static/private';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { verifyPinOrThrow } from '$lib/server/auth/pin';

const TIME_ZONE = 'Europe/Stockholm';
const GRAPH_TIME_ZONE = 'W. Europe Standard Time';
const nonPanelFutureCancelMessage =
    'Den här bokningen kan inte avbokas här. Kontakta den som bokade rummet.';

function parseGraphDateTime(dateTime: string) {
    return fromZonedTime(dateTime, TIME_ZONE);
}

function createDateKey(date: Date) {
    return formatInTimeZone(date, TIME_ZONE, 'yyyy-MM-dd');
}

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { roomEmail, pin, meetingId } = (await request.json()) as {
            roomEmail: string;
            pin?: string;
            meetingId?: string;
        };
        if (!roomEmail) return new Response('roomEmail krävs', { status: 400 });

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();
        const todayDateKey = createDateKey(now);
        let eventToCancel: any = null;

        if (meetingId) {
            eventToCancel = await client
                .api(`/users/${roomEmail}/events/${meetingId}`)
                .header('Prefer', `outlook.timezone="${GRAPH_TIME_ZONE}"`)
                .get();
        } else {
            const events = await client
                .api(`/users/${roomEmail}/calendarView`)
                .header('Prefer', `outlook.timezone="${GRAPH_TIME_ZONE}"`)
                .query({
                    startDateTime: now.toISOString(),
                    endDateTime: new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        23,
                        59,
                        59
                    ).toISOString(),
                })
                .get();

            eventToCancel = events.value.find((event: any) => {
                const start = parseGraphDateTime(event.start.dateTime);
                const end = parseGraphDateTime(event.end.dateTime);
                return now >= start && now < end;
            });
        }

        if (!eventToCancel) {
            return new Response('Ingen bokning att avboka', { status: 404 });
        }

        const eventStart = parseGraphDateTime(eventToCancel.start.dateTime);
        const eventEnd = parseGraphDateTime(eventToCancel.end.dateTime);
        const isTodayEvent = createDateKey(eventStart) === todayDateKey;
        const isPanelBooking = Boolean(eventToCancel.categories?.includes('PanelBooking'));

        if (eventEnd <= now) {
            return new Response('Mötet har redan avslutats.', { status: 400 });
        }

        if (!isTodayEvent && !isPanelBooking) {
            return new Response(nonPanelFutureCancelMessage, { status: 403 });
        }

        await client.api(`/users/${roomEmail}/events/${eventToCancel.id}`).delete();

        // Optional audit
        await supabaseAdmin.from('booking_action_audit').insert({
            action: 'cancel',
            room_email: roomEmail,
            app_user_id: pinUser.id,
            starts_at: eventStart.toISOString(),
            ends_at: eventEnd.toISOString(),
            meta: {
                meeting_id: eventToCancel.id,
                subject: eventToCancel.subject,
                is_panel_booking: isPanelBooking,
            },
        });

        return json({ message: `Rummet ${roomEmail} har avbokats` });
    } catch (error: any) {
        if (error?.statusCode === 404) {
            return new Response('Bokningen kunde inte hittas.', { status: 404 });
        }

        // Return 401 on PIN problems so the UI can show “Fel PIN”
        if (/\bPIN\b|ogiltig|låst|invalid/i.test(String(error?.message))) {
            return new Response('Fel PIN eller konto låst', { status: 401 });
        }
        console.error('Fel vid avbokning av rummet:', error);
        return new Response('Fel vid avbokning av rummet: ' + (error?.message ?? 'Okänt fel'), {
            status: 500,
        });
    }
};
