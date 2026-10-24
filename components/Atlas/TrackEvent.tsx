"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/** Fires one analytics event when a (server-rendered) page mounts. */
export function TrackEvent({ name, properties }: { name: string; properties: Record<string, string | number | boolean | null> }) {
    const key = JSON.stringify(properties);
    useEffect(() => {
        trackEvent(name, JSON.parse(key));
    }, [name, key]);
    return null;
}
