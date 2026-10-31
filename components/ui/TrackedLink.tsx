"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent, type AnalyticsEvent, type AnalyticsProperties } from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
    event: AnalyticsEvent;
    properties?: AnalyticsProperties;
};

/** A next/link that fires one analytics event on click, so server components can keep their events. */
export function TrackedLink({ event, properties, onClick, ...props }: TrackedLinkProps) {
    return (
        <Link
            {...props}
            onClick={(e) => {
                trackEvent(event, properties);
                onClick?.(e);
            }}
        />
    );
}
