import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import {
    getEndOfDay,
    addMinutes,
    calculateMaxExtension,
    calculateMinutesUntil,
} from '$lib/server/helpers/timeUtils';
import { getNextMeeting, updateMeetingEndTime } from '$lib/server/helpers/meeting';
import { REQUIRE_AUTH } from '$env/static/private';

import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { verifyPinOrThrow } from '$lib/server/auth/pin';

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { roomEmail, extensionOption, pin } = (await request.json()) as {
            roomEmail: string;
            extensionOption: number;
            pin?: string;
        };
        if (!roomEmail) return new Response('roomEmail krävs', { status: 400 });

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();
        const endOfDay = getEndOfDay(now);

        const events = await getNextMeeting(client, roomEmail, now, endOfDay);

        const currentEvent = events.find((event: any) => {
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            return now >= start && now < end;
        });

        if (!currentEvent) {
            return new Response('Inget aktuellt möte att förlänga.', { status: 404 });
        }

        const minutesRemaining = calculateMinutesUntil(currentEvent.end.dateTime);
        if (minutesRemaining > 15) {
            return new Response(
                'Kan endast förlängas när det är mindre än 15 minuter kvar av bokningen.',
                { status: 400 }
            );
        }

        const currentEndTime = new Date(currentEvent.end.dateTime);
        const maxEndTime = await calculateMaxExtension(currentEndTime, events);
        let newEndTime =
            extensionOption === 0 ? maxEndTime : addMinutes(currentEndTime, extensionOption);

        newEndTime = new Date(
            Math.min(newEndTime.getTime(), maxEndTime.getTime(), endOfDay.getTime())
        );

        await updateMeetingEndTime(client, roomEmail, currentEvent.id, newEndTime);

        // 📝 Optional: audit log
        await supabaseAdmin.from('booking_action_audit').insert({
            action: 'extend',
            room_email: roomEmail,
            app_user_id: pinUser.id,
            meta: { extensionOption, subject: currentEvent.subject },
        });

        const timeStr = newEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return json({ message: `Rummet ${roomEmail} har förlängts till kl ${timeStr}` });
    } catch (error: any) {
        // Return 401 specifically for PIN problems so UI can show “Fel PIN”
        if (/\bPIN\b|ogiltig|låst|invalid/i.test(String(error?.message))) {
            return new Response('Fel PIN eller konto låst', { status: 401 });
        }
        console.error('Fel vid förlängning av rummet:', error);
        return new Response('Fel vid förlängning av rummet: ' + (error?.message ?? 'Okänt fel'), {
            status: 500,
        });
    }
};
