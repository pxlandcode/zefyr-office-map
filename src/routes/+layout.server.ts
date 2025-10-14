// src/routes/+layout.server.ts
import { redirect } from '@sveltejs/kit';

const ALLOWLIST = new Set([
    '/login',
    '/auth/callback',
    '/auth/confirm',
    '/auth/magic-link',
    '/api/public', // example
]);

export const load = async ({ locals, cookies, url }) => {
    // Skip protection for allowlisted paths
    if (!ALLOWLIST.has(url.pathname)) {
        if (!locals.user) {
            throw redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
        }

        // Optional max-age check you already had
        const maxDays = Number(import.meta.env.PUBLIC_AUTH_MAX_AGE_DAYS ?? 30);
        const verifiedAt = Number(cookies.get('auth_verified_at') || 0);
        const tooOld = !verifiedAt || Date.now() - verifiedAt > maxDays * 24 * 60 * 60 * 1000;

        if (tooOld) {
            await locals.supabase.auth.signOut();
            cookies.delete('auth_verified_at', { path: '/' });
            throw redirect(303, '/login?again=1');
        }
    }

    return { session: locals.session, user: locals.user };
};
