import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured() {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
            (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
}

export function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;

    if (!browserClient) {
        browserClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
        );
    }

    return browserClient;
}
