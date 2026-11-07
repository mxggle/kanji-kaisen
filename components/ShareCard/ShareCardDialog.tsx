"use client";

// Loaded on demand by ShareCardButton, together with the canvas code.

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Download, RefreshCw, Share2, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { buildCardModel, type ShareCardInput } from "@/lib/share-card";
import { useSkin } from "@/components/Skin/useSkin";
import { SKIN_LABELS } from "@/components/Skin/skin";
import { prefersReducedMotion } from "@/components/Motion/tokens";
import { buttonClass } from "@/components/ui/Button";
import { renderShareCard } from "./drawCard";
import styles from "./share-card.module.css";

type CardState =
    | { status: "drawing" }
    | { status: "ready"; url: string; file: File | null }
    | { status: "error" };

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The dialog's exit (share-card.module.css), where the browser can play it. */
const CLOSE_MS = 180;
const closeDelay = () => (prefersReducedMotion() || typeof CSS === "undefined" || !CSS.supports("overlay", "auto") ? 0 : CLOSE_MS);

export interface ShareCardDialogProps {
    input: ShareCardInput;
    origin?: string;
    onClose: () => void;
}

/** Modal that draws the share card, previews it and offers Download PNG and Share…. */
export function ShareCardDialog({ input, origin, onClose }: ShareCardDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const skin = useSkin();
    // The dialog mounts per opening, so the model is built once.
    const [model] = useState(() => buildCardModel(input, { origin }));
    const [card, setCard] = useState<CardState>({ status: "drawing" });
    const [attempt, setAttempt] = useState(0);
    const [message, setMessage] = useState("");

    // A native modal: the page behind is inert and Esc closes it. It is
    // unmounted once its exit has played (focus is back on the opener at once).
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (!dialog.open) dialog.showModal();
        // "close" fires a task after close(). When an effect re-runs (Strict Mode
        // in development), the cleanup's close() lands after showModal() has
        // reopened the dialog; that late event must not shut it again. A real
        // close unmounts after the exit animation has played.
        let timer = 0;
        const handleClose = () => {
            if (dialog.open) return;
            timer = window.setTimeout(onClose, closeDelay());
        };
        dialog.addEventListener("close", handleClose);
        return () => {
            window.clearTimeout(timer);
            dialog.removeEventListener("close", handleClose);
            if (dialog.open) dialog.close();
        };
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;
        let url: string | null = null;
        renderShareCard(model, skin)
            .then((blob) => {
                if (cancelled) return;
                url = URL.createObjectURL(blob);
                const file = new File([blob], model.fileName, { type: "image/png" });
                const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
                setCard({ status: "ready", url, file: canShareFile ? file : null });
            })
            .catch(() => {
                if (!cancelled) setCard({ status: "error" });
            });
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [model, skin, attempt]);

    const close = () => dialogRef.current?.close();

    const retry = () => {
        setCard({ status: "drawing" });
        setMessage("");
        setAttempt((n) => n + 1);
    };

    const onDownload = () => {
        trackEvent("share_card_created", { kanji: model.char, action: "download" });
        setMessage(`Downloading ${model.fileName}.`);
    };

    const share = async () => {
        if (card.status !== "ready" || !card.file) return;
        try {
            await navigator.share({
                files: [card.file],
                title: model.question.text,
                text: `${model.char}${model.meaning ? `: ${model.meaning}` : ""} · ${model.url}`,
            });
            trackEvent("share_card_created", { kanji: model.char, action: "share" });
            setMessage("Shared.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            setMessage("Sharing didn't work here. Download the PNG instead.");
        }
    };

    // Keep Tab inside the dialog (showModal leaves the browser chrome in the cycle).
    const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== "Tab" || !dialogRef.current) return;
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    // A click on the backdrop lands on the <dialog> itself (the panel fills it).
    const onClick = (event: MouseEvent<HTMLDialogElement>) => {
        if (event.target === event.currentTarget) close();
    };

    const status =
        card.status === "drawing" ? "Drawing the card…" : card.status === "error" ? "The card couldn't be drawn." : message || "Card ready.";

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onKeyDown={onKeyDown}
            onClick={onClick}
            className={`m-auto w-[min(92vw,460px)] max-h-[94dvh] overflow-y-auto rounded-2xl border border-line-2 bg-card p-0 text-ink backdrop:bg-black/70 ${styles.dialog}`}
        >
            <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 id={titleId} className="type-section">
                            Share card for <span lang="ja" className="font-jp">{model.char}</span>
                        </h2>
                        <p id={descriptionId} className="mt-1 text-sm text-ink-2">
                            A 1080×1350 picture to save or post, in the {SKIN_LABELS[skin].jp} {SKIN_LABELS[skin].name} skin.
                        </p>
                    </div>
                    <button type="button" onClick={close} aria-label="Close" className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}>
                        <X aria-hidden />
                    </button>
                </div>

                <div className="mx-auto aspect-[4/5] w-full max-w-[min(100%,48dvh)] overflow-hidden rounded-xl border border-line bg-bg">
                    {card.status === "ready" ? (
                        // A blob URL: next/image has nothing to optimise here.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.url} alt={model.alt} width={1080} height={1350} data-enter="fade" className="h-full w-full object-contain" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" aria-hidden>
                            <span lang="ja" className="font-jp text-8xl text-ink-3 motion-safe:animate-pulse">
                                {model.char}
                            </span>
                        </div>
                    )}
                </div>

                <p role="status" className="min-h-5 text-sm text-ink-2">
                    {status}
                </p>

                <div className="flex flex-wrap gap-2">
                    {card.status === "error" ? (
                        <button type="button" onClick={retry} className={buttonClass({ variant: "primary" })}>
                            <RefreshCw aria-hidden /> Try again
                        </button>
                    ) : card.status === "ready" ? (
                        <a href={card.url} download={model.fileName} onClick={onDownload} className={buttonClass({ variant: "primary" })}>
                            <Download aria-hidden /> Download PNG
                        </a>
                    ) : (
                        <button type="button" disabled className={buttonClass({ variant: "primary" })}>
                            <Download aria-hidden /> Download PNG
                        </button>
                    )}
                    {card.status === "ready" && card.file && (
                        <button type="button" onClick={share} className={buttonClass()}>
                            <Share2 aria-hidden /> Share…
                        </button>
                    )}
                </div>
            </div>
        </dialog>
    );
}
