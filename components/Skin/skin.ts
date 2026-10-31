// Skin choice (夜 night / 墨 ink). The value lives on <html data-skin> and in
// localStorage; the inline script below applies it before first paint.

export type Skin = "night" | "ink";

export const SKINS: readonly Skin[] = ["night", "ink"];
export const DEFAULT_SKIN: Skin = "night";
export const SKIN_STORAGE_KEY = "kanji-skin";

export const SKIN_LABELS: Record<Skin, { jp: string; name: string }> = {
    night: { jp: "夜", name: "Night" },
    ink: { jp: "墨", name: "Ink" },
};

export function isSkin(value: unknown): value is Skin {
    return value === "night" || value === "ink";
}

/** Runs in <head> before paint. Keep it tiny and dependency-free. */
export const SKIN_SCRIPT = `(function(){var s="${DEFAULT_SKIN}";try{var v=localStorage.getItem("${SKIN_STORAGE_KEY}");if(v==="night"||v==="ink")s=v}catch(e){}document.documentElement.dataset.skin=s})();`;
