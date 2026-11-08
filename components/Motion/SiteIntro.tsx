import type { CSSProperties } from "react";
import { INTRO_SCRIPT } from "./script";

// 解 (the logo mark) in stroke order, from KanjiVG 089e3.svg
// (© Ulrich Apel, CC BY-SA 3.0; see public/kanjivg/README.md).
const STROKES = [
    "M28.73,11c0.04,0.49,0.19,1.3-0.08,1.96c-1.9,4.54-6.77,12.16-15.15,18.79",
    "M28.39,18c2,0,10.36-1.25,14.07-2.25c2.16-0.58,3.24,1.1,2,2.75c-4.33,5.75-6.96,9-10.9,15.25",
    "M18.17,36.25c0.98,0.98,1.24,2.38,1.23,3.94C19.25,61.25,19.38,80.5,9.5,93.5",
    "M20.57,37.45c4.18-0.7,21.17-3.25,23.03-3.46c2.15-0.24,4.16,1.13,4.16,3.96c0,2.55,0.12,34.8,0.12,51.68c0,12.12-5.39,4.75-7.43,2.37",
    "M31.42,37.12c0.8,0.8,1.23,2.13,1.23,3.27c0,8.87,0.1,19.62,0.1,25.37",
    "M20.32,52.6c7.8-1.1,18.05-2.48,26.12-3.1",
    "M19.57,68.5c8.31-1,17.18-2.25,26.94-3",
    "M59.14,18.67c1.5,0.4,3.55,0.43,5.12,0.25c8.32-0.95,20.84-2.92,25.13-3.21c2.97-0.21,3.78,2.12,3.62,3.56c-0.43,3.8-3.85,13.68-7.24,18.63c-4.52,6.61-5.27,1.86-6.91,0.19",
    "M72.33,21.38c0.04,0.5-0.06,1.33-0.34,2.02C69.5,29.5,66,35.5,59,40.9",
    "M63.1,48.71c0.03,0.39,0.05,1-0.05,1.55c-0.62,3.28-3.8,10.74-9.09,16.11",
    "M60.52,59.55c0.6,0.25,2.45,0.29,3.06,0.25c6.94-0.5,16.4-1.77,22.94-2.41c1.81-0.18,3.98-0.26,5.83,0.06",
    "M55.85,73.96c2.65,0.67,5.17,0.23,7.4-0.06c8.56-1.13,18.73-2.4,26.5-3c2.41-0.19,4.78-0.39,7.15,0.12",
    "M74.67,46.63c0.79,0.79,1.36,2.12,1.36,3.22c0,0.47,0.06,29.24,0.08,42.52c0.01,3.18,0.01,5,0.01,5.88",
];

const WORD = "Kanji Kaisen";

/**
 * The once-a-session entrance: 解 is written stroke by stroke inside the
 * logo's frame, the wordmark rises, then the paper lifts and the mark flies
 * into the header logo. Hidden unless html[data-intro] says it plays (see
 * MOTION_SCRIPT); styles in app/motion.css. Server-rendered, so it starts
 * before hydration. Place it right after <SiteHeader />.
 */
export function SiteIntro() {
    return (
        <div className="kk-intro" aria-hidden="true" data-chrome="">
            <div className="kk-intro-paper" />
            <div className="kk-intro-stage">
                <div className="kk-intro-mark">
                    {/* The frame is a line (rule 2) and never glows; only the strokes being written do (rule 5). */}
                    <svg viewBox="0 0 109 109" className="kk-intro-glyph" focusable="false">
                        <rect className="kk-intro-frame" x="0.5" y="0.5" width="108" height="108" pathLength={1} />
                    </svg>
                    <svg viewBox="0 0 109 109" className="kk-intro-glyph kk-intro-ink live" focusable="false">
                        <g className="kk-intro-strokes">
                            {STROKES.map((d, i) => (
                                <path key={i} d={d} pathLength={1} style={{ "--s": i } as CSSProperties} />
                            ))}
                        </g>
                    </svg>
                </div>
                <p className="kk-intro-word">
                    {Array.from(WORD).map((ch, i) => (
                        <span key={i} style={{ "--l": i } as CSSProperties}>
                            {ch}
                        </span>
                    ))}
                </p>
                <p className="kk-intro-jp" lang="ja">
                    漢字図鑑
                </p>
            </div>
            <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        </div>
    );
}
