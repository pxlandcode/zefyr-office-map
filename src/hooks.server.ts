// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
    if (env.REQUIRE_AUTH === 'false') {
        // Local dev: skip Supabase auth, set a synthetic user so the layout guard passes
        event.locals.supabase = null as any;
        event.locals.session = null;
        event.locals.user = { id: 'local-dev', email: 'dev@localhost' } as any;
    } else {
        // Production: full Supabase auth
        event.locals.supabase = createSupabaseServerClient({
            supabaseUrl: PUBLIC_SUPABASE_URL,
            supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
            event,
        });

        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession();
        event.locals.session = session ?? null;

        const {
            data: { user },
        } = await event.locals.supabase.auth.getUser();
        event.locals.user = user ?? null;
    }

    // Let through a couple of Supabase headers SvelteKit would normally strip
    const response = await resolve(event, {
        filterSerializedResponseHeaders: (name) =>
            name === 'content-range' || name === 'x-supabase-api-version',
    });

    return response;
};
