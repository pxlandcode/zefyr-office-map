import { json } from '@sveltejs/kit';

import { REQUIRE_AUTH } from '$env/static/private';
import { verifyPinOrThrow } from '$lib/server/auth/pin';

export const POST = async ({ request, locals }) => {
    try {
        if (REQUIRE_AUTH === 'true' && !locals.session) {
            return new Response('Unauthorized', { status: 401 });
        }
        const { pin } = await request.json();
        const user = await verifyPinOrThrow(pin);
        return json({ ok: true, user });
    } catch (e: any) {
        return new Response('Fel PIN', { status: 401 });
    }
};
