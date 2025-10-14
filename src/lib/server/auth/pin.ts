import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { PIN_PEPPER } from '$env/static/private';

export type PinUser = { id: number; full_name: string; role?: string; email?: string };

export async function verifyPinOrThrow(pin?: string): Promise<PinUser> {
    if (!pin || !/^\d{4,8}$/.test(pin)) {
        throw new Error('Ogiltig PIN (4–8 siffror krävs)');
    }

    const { data, error } = await supabaseAdmin.rpc('login_by_pin', {
        p_pin: pin,
        p_pepper: PIN_PEPPER,
    });

    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) throw new Error('Fel PIN eller låst konto');

    return { id: row.app_user_id, full_name: row.full_name, role: row.role, email: row.email };
}

export async function verifyPinClient(pin: string) {
    const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
    });
    return res.ok || 'Fel PIN';
}
