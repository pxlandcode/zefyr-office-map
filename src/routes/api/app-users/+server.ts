import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { RequestHandler } from '@sveltejs/kit';

const PEPPER = process.env.PIN_PEPPER!; // keep secret

export const POST: RequestHandler = async ({ request }) => {
    const { full_name, email, role = 'member', pin } = await request.json();
    if (!full_name)
        return new Response(JSON.stringify({ error: 'full_name required' }), { status: 400 });
    if (!pin || !/^\d{4,8}$/.test(pin))
        return new Response(JSON.stringify({ error: 'PIN 4–8 digits' }), { status: 400 });

    // 1) create
    const { data: row, error: insertErr } = await supabaseAdmin
        .from('app_user')
        .insert({ full_name, email, role, active: true })
        .select()
        .single();

    if (insertErr || !row) {
        return new Response(JSON.stringify({ error: insertErr?.message || 'Insert failed' }), {
            status: 500,
        });
    }

    // 2) set PIN (will fail if already taken)
    const { error: pinErr } = await supabaseAdmin.rpc('set_app_user_pin', {
        p_app_user_id: row.id,
        p_pin: pin,
        p_pepper: PEPPER,
    });

    if (pinErr) {
        const msg = /unique/i.test(pinErr.message) ? 'PIN already in use' : pinErr.message;
        return new Response(JSON.stringify({ error: msg }), { status: 400 });
    }

    return new Response(JSON.stringify({ id: row.id, full_name: row.full_name }), { status: 201 });
};
