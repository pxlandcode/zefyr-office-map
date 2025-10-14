// src/app.d.ts
declare global {
    namespace App {
        interface Locals {
            supabase: import('@supabase/auth-helpers-sveltekit').SupabaseClient;
            session: import('@supabase/supabase-js').Session | null;
            user: import('@supabase/supabase-js').User | null;
        }
    }
}
export {};
