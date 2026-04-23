"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Cloud, Loader2, LogOut, Mail, TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useSyncStatusStore } from "@/lib/sync/sync-engine";

export function AccountPanel() {
    const [email, setEmail] = useState("");
    const {
        configured,
        loading,
        sendingMagicLink,
        magicLinkSent,
        error,
        user,
        signInWithEmail,
        signOut,
    } = useAuthStore();
    const syncStatus = useSyncStatusStore((state) => state.status);
    const syncError = useSyncStatusStore((state) => state.error);
    const lastSyncedAt = useSyncStatusStore((state) => state.lastSyncedAt);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void signInWithEmail(email);
    };

    return (
        <section id="account" className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-5">
            <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                    <Cloud size={20} />
                </div>
                <div>
                    <h2 className="text-base font-semibold mb-1">Account & Sync</h2>
                    <p className="text-xs text-zinc-400">
                        Sign in to back up progress and sync it across devices.
                    </p>
                </div>
            </div>

            {!configured && (
                <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <TriangleAlert size={16} className="shrink-0" />
                    <p>
                        Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
                        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable login.
                    </p>
                </div>
            )}

            {configured && !user && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <label className="block">
                        <span className="text-xs font-medium text-zinc-300">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 w-full rounded-xl border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-400"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={sendingMagicLink || loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {sendingMagicLink ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        Send Magic Link
                    </button>
                    {magicLinkSent && (
                        <p className="flex items-center gap-2 text-xs text-emerald-300">
                            <CheckCircle2 size={14} /> Check your inbox to finish signing in.
                        </p>
                    )}
                    {error && <p className="text-xs text-red-300">{error}</p>}
                </form>
            )}

            {configured && user && (
                <div className="space-y-3">
                    <div className="rounded-xl border border-zinc-800 bg-black/25 p-3">
                        <p className="text-xs text-zinc-500">Signed in as</p>
                        <p className="truncate text-sm font-semibold text-white">{user.email}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black/25 p-3">
                        <div>
                            <p className="text-sm font-semibold text-white">
                                {syncStatus === "syncing" ? "Syncing" : syncStatus === "error" ? "Sync issue" : "Synced"}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {syncError ||
                                    (lastSyncedAt
                                        ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
                                        : "Your local progress will be backed up automatically.")}
                            </p>
                        </div>
                        {syncStatus === "syncing" ? (
                            <Loader2 size={18} className="animate-spin text-cyan-300" />
                        ) : syncStatus === "error" ? (
                            <TriangleAlert size={18} className="text-amber-300" />
                        ) : (
                            <CheckCircle2 size={18} className="text-emerald-300" />
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => void signOut()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}
        </section>
    );
}
