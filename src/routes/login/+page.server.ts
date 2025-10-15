// src/routes/login/+page.server.ts
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { DISPLAY_EMAIL } from '$env/static/private';

export const actions: Actions = {
    default: async ({ request, locals, cookies, url }) => {
        // If already signed in, bounce to next/app
        const {
            data: { user: existingUser },
        } = await locals.supabase.auth.getUser();
        if (existingUser) {
            const next = url.searchParams.get('next') || '/app';
            throw redirect(303, next);
        }

        try {
            // 0) Ensure Supabase client exists
            if (!locals?.supabase?.auth) {
                console.error('Login: locals.supabase is missing');
                return fail(500, { message: 'Internt fel: supabase-klienten saknas (hooks?).' });
            }

            // 1) Read form
            const form = await request.formData();

            const email = String(form.get('email') ?? '')
                .trim()
                .toLowerCase();
            const password = String(form.get('password') ?? '');

            if (!email || !password) {
                return fail(400, { message: 'Ange både e-post och lösenord.' });
            }

            // 2) Restrict to DISPLAY_EMAIL (your current rule)
            const allowed = (DISPLAY_EMAIL ?? '').trim().toLowerCase();
            if (!allowed) {
                console.error('Login: DISPLAY_EMAIL not set in server env');
                return fail(500, {
                    message:
                        'DISPLAY_EMAIL saknas i .env (server). Lägg till och starta om dev-servern.',
                });
            }
            if (email !== allowed) {
                return fail(403, { message: `Endast ${allowed} får logga in här.` });
            }

            const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('signInWithPassword error:', {
                    code: (error as any)?.status,
                    message: error.message,
                });
                return fail(400, { message: mapSupabaseAuthError(error.message) });
            }

            // 4) Mark verification time (optional)
            cookies.set('auth_verified_at', String(Date.now()), {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 365,
            });

            const next = url.searchParams.get('next') || '/app';
            throw redirect(303, next);
        } catch (e: any) {
            // 🔑 Let SvelteKit handle framework redirects
            if (
                e instanceof Redirect ||
                (typeof e?.status === 'number' && e.status >= 300 && e.status < 400 && e?.location)
            ) {
                throw e;
            }
            console.error('Login action fatal:', e);
            return fail(500, { message: e?.message ?? 'Okänt fel vid inloggning' });
        }
    },
};

function mapSupabaseAuthError(message: string) {
    const m = message.toLowerCase();
    if (m.includes('invalid login credentials')) return 'Fel e-post eller lösenord.';
    if (m.includes('email not confirmed') || m.includes('confirmed'))
        return 'E-postadressen är inte bekräftad ännu.';
    if (m.includes('over quota') || m.includes('rate limit'))
        return 'För många försök. Vänta en stund och prova igen.';
    return message; // fallback to Supabase message
}
