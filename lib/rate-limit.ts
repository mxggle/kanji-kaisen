// Best-effort fixed-window rate limiter kept in server memory. Each serverless instance has its
// own window, so this caps bursts from a single client rather than enforcing a global quota.
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
    const hits = new Map<string, { count: number; resetAt: number }>();

    return function isAllowed(key: string, now = Date.now()): boolean {
        if (hits.size > 10_000) {
            for (const [k, entry] of hits) {
                if (entry.resetAt <= now) hits.delete(k);
            }
        }

        const entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return true;
        }

        if (entry.count >= limit) return false;
        entry.count += 1;
        return true;
    };
}
