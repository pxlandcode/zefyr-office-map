// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
    // Attach a server-side Supabase client to locals
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
        event,
    });

    // Populate session & user on every request
    const {
        data: { session },
    } = await event.locals.supabase.auth.getSession();
    event.locals.session = session ?? null;

    const {
        data: { user },
    } = await event.locals.supabase.auth.getUser();
    event.locals.user = user ?? null;

    // Let through a couple of Supabase headers SvelteKit would normally strip
    const response = await resolve(event, {
        filterSerializedResponseHeaders: (name) =>
            name === 'content-range' || name === 'x-supabase-api-version',
    });

    return response;
};
