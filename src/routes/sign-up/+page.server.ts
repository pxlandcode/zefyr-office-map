import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { PIN_PEPPER, REQUIRE_AUTH, GATEWAY_EMAIL } from '$env/static/private';

const ALLOWED_DOMAINS = new Set([
    'pixelcode.se',
    'zefyr.se',
    'fridayvibes.se',
    'a2accounting.se',
    'atom8.se',
    'geisli.se',
    'mavrix.se',
    'homerun.cx',
    'zunnypeople.com',
    'wadeinsight.com',
    'reddy.se',
    'fyrenab.se',
]);

function domainOf(email: string) {
    const m = email
        .toLowerCase()
        .trim()
        .match(/^[^@]+@([^@]+)$/);
    return m?.[1] ?? '';
}
function isAllowedEmail(email: string) {
    const d = domainOf(email);
    return ALLOWED_DOMAINS.has(d);
}

function assertGateway(locals: App.Locals) {
    if (REQUIRE_AUTH === 'true') {
        const email = locals.session?.user?.email?.toLowerCase();
        if (!email) throw error(401, 'Unauthorized');
        if (GATEWAY_EMAIL && email !== GATEWAY_EMAIL.toLowerCase()) {
            throw error(403, 'Forbidden');
        }
    }
}

export const load: PageServerLoad = async ({ locals }) => {
    assertGateway(locals);
    return { form: {} };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        assertGateway(locals);

        const formData = await request.formData();
        const full_name = String(formData.get('full_name') || '').trim();
        const emailRaw = String(formData.get('email') || '').trim();
        const email = emailRaw.toLowerCase(); // normalize
        const pin = String(formData.get('pin') || '').trim();

        const errors: Record<string, string> = {};
        const values = { full_name, email };

        // Basic validation
        if (!full_name) errors.full_name = 'Ange namn';
        if (!email) errors.email = 'Ange e-post';
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = 'Ogiltig e-post';
        } else if (email && !isAllowedEmail(email)) {
            errors.email = 'e-postdomänen ej tillåten';
        }
        if (!pin || !/^\d{4,8}$/.test(pin)) {
            errors.pin = 'PIN måste vara 4–8 siffror';
        }

        if (Object.keys(errors).length > 0) {
            return fail(400, {
                form: { success: false, message: 'Korrigera fälten nedan.', errors, values },
            });
        }

        // 1) Create app_user (email must be unique in DB)
        const { data: row, error: insertErr } = await supabaseAdmin
            .from('app_user')
            .insert({ full_name, email, role: 'member', active: true })
            .select()
            .single();

        if (insertErr || !row) {
            const isUnique =
                insertErr?.code === '23505' ||
                /unique|duplicate|already exists/i.test(insertErr?.message || '');

            if (isUnique) {
                return fail(409, {
                    form: {
                        success: false,
                        message: 'Korrigera fälten nedan.',
                        errors: { email: 'E-posten används redan.' },
                        values,
                    },
                });
            }

            return fail(500, {
                form: {
                    success: false,
                    message: insertErr?.message || 'Misslyckades att skapa användare.',
                    errors: {},
                    values,
                },
            });
        }

        // 2) Set unique PIN (RPC enforces uniqueness)
        const { error: pinErr } = await supabaseAdmin.rpc('set_app_user_pin', {
            p_app_user_id: row.id,
            p_pin: pin,
            p_pepper: PIN_PEPPER,
        });

        if (pinErr) {
            const pinTaken =
                pinErr.code === '23505' || /unique|already in use|duplicate/i.test(pinErr.message);

            if (pinTaken) {
                // cleanup so we don't leave an orphan without a PIN
                await supabaseAdmin.from('app_user').delete().eq('id', row.id);

                return fail(409, {
                    form: {
                        success: false,
                        message: 'Korrigera fälten nedan.',
                        errors: { pin: 'PIN används redan, välj en annan.' },
                        values,
                    },
                });
            }

            return fail(400, {
                form: { success: false, message: pinErr.message, errors: {}, values },
            });
        }

        // Success
        return {
            form: {
                success: true,
                message: `Användare ${full_name} skapad. Du kan nu boka med din PIN.`,
            },
        };
    },
};
