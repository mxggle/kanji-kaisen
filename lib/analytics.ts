import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

export function trackEvent(name: string, properties?: AnalyticsProperties) {
    if (typeof window === "undefined") return;
    track(name, properties);
}
