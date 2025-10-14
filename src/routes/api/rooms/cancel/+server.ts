// src/routes/api/rooms/cancel/+server.ts
import { json } from '@sveltejs/kit';
import { getClient } from '$lib/server/msgraph';
import { REQUIRE_AUTH } from '$env/static/private';

import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { verifyPinOrThrow } from '$lib/server/auth/pin';

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { roomEmail, pin } = (await request.json()) as { roomEmail: string; pin?: string };
        if (!roomEmail) return new Response('roomEmail krävs', { status: 400 });

        const pinUser = await verifyPinOrThrow(pin);

        const client = await getClient();
        const now = new Date();

        const events = await client
            .api(`/users/${roomEmail}/calendarView`)
            .header('Prefer', 'outlook.timezone="W. Europe Standard Time"')
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

        const currentEvent = events.value.find((event: any) => {
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            return now >= start && now < end;
        });

        if (!currentEvent) {
            return new Response('Inget nuvarande möte att avboka', { status: 404 });
        }

        await client.api(`/users/${roomEmail}/events/${currentEvent.id}`).delete();

        // Optional audit
        await supabaseAdmin.from('booking_action_audit').insert({
            action: 'cancel',
            room_email: roomEmail,
            app_user_id: pinUser.id,
            meta: { subject: currentEvent.subject },
        });

        return json({ message: `Rummet ${roomEmail} har avbokats` });
    } catch (error: any) {
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
