"use client";

import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthState {
    configured: boolean;
    initialized: boolean;
    loading: boolean;
    sendingMagicLink: boolean;
    magicLinkSent: boolean;
    error: string | null;
    session: Session | null;
    user: User | null;
    initializeAuth: () => Promise<void>;
    signInWithEmail: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
}

let authListenerReady = false;

export const useAuthStore = create<AuthState>((set) => ({
    configured: isSupabaseConfigured(),
    initialized: false,
    loading: false,
    sendingMagicLink: false,
    magicLinkSent: false,
    error: null,
    session: null,
    user: null,

    initializeAuth: async () => {
        const supabase = getSupabaseClient();

        if (!supabase) {
            set({ configured: false, initialized: true, loading: false });
            return;
        }

        set({ configured: true, loading: true, error: null });

        const { data, error } = await supabase.auth.getSession();
        if (error) {
            set({ error: error.message, loading: false, initialized: true });
            return;
        }

        set({
            session: data.session,
            user: data.session?.user ?? null,
            loading: false,
            initialized: true,
        });

        if (authListenerReady) return;
        authListenerReady = true;

        supabase.auth.onAuthStateChange((_event, session) => {
            set({
                session,
                user: session?.user ?? null,
                magicLinkSent: false,
                error: null,
            });
        });
    },

    signInWithEmail: async (email) => {
        const supabase = getSupabaseClient();
        const trimmedEmail = email.trim();

        if (!supabase) {
            set({ error: "Supabase is not configured for this deployment." });
            return;
        }

        if (!trimmedEmail) {
            set({ error: "Enter an email address." });
            return;
        }

        set({ sendingMagicLink: true, magicLinkSent: false, error: null });

        const { error } = await supabase.auth.signInWithOtp({
            email: trimmedEmail,
            options: {
                emailRedirectTo:
                    typeof window !== "undefined" ? window.location.origin + "/settings" : undefined,
            },
        });

        if (error) {
            set({ error: error.message, sendingMagicLink: false });
            return;
        }

        set({ sendingMagicLink: false, magicLinkSent: true });
    },

    signOut: async () => {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        set({ loading: true, error: null });
        const { error } = await supabase.auth.signOut();

        if (error) {
            set({ error: error.message, loading: false });
            return;
        }

        set({
            session: null,
            user: null,
            loading: false,
            magicLinkSent: false,
        });
    },
}));
