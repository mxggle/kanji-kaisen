// A QR code for a share link, drawn as one SVG path. Always dark modules on a
// light card (the 墨 tokens), since many scanners can't read inverted codes.

import { useMemo } from "react";
import { encodeQr, qrPath } from "@/lib/qr";
import { cn } from "@/lib/utils";

const QUIET_ZONE = 4;

export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
    const qr = useMemo(() => (value ? encodeQr(value) : null), [value]);
    if (!qr) return null;
    const size = qr.size + QUIET_ZONE * 2;
    return (
        <div data-skin="ink" className={cn("bg-card rounded-lg overflow-hidden", className)}>
            <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges" className="block w-full h-auto">
                <path d={qrPath(qr, QUIET_ZONE)} className="fill-ink" />
            </svg>
        </div>
    );
}
