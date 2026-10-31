// Theme art, shared by the theme page's specimen. Works in server and client components.

import Image from "next/image";
import { cn } from "@/lib/utils";

/** Theme art filling its positioned parent: full colour in 夜, ink wash in 墨. */
export function ThemeImage({
    src,
    sizes,
    preload,
    className,
}: {
    src: string;
    sizes: string;
    preload?: boolean;
    className?: string;
}) {
    return <Image src={src} alt="" fill sizes={sizes} preload={preload} className={cn("ink-art object-cover", className)} />;
}
