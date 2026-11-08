import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

/** Every event name the app sends. Add new names here before using them. */
export type AnalyticsEvent =
    // Atlas
    | "search_performed"
    | "kanji_viewed"
    | "radical_viewed"
    | "kanji_saved"
    | "kanji_status_changed"
    | "trace_used"
    | "study_started"
    | "study_completed"
    | "feedback_clicked"
    // Story atlas
    | "journey_played" // {radical, stages}
    | "build_played" // {kanji}
    | "learn_step_completed" // {kanji, step}
    | "ink_changed" // {kanji, from, to, source}
    | "share_card_created" // {kanji, action}
    | "worksheet_printed" // {count, paper, answerKey}
    | "projector_opened" // {count}
    | "share_link_created" // {count}
    | "share_link_opened" // {count}
    | "zh_note_opened" // {kanji, relation}
    | "zh_edition_interest" // {kanji}
    | "skin_changed" // {skin}
    | "theme_gate_clicked" // {theme, source}
    // Classic practice
    | "learn_page_viewed"
    | "category_page_viewed"
    | "category_story_opened"
    | "checkpoint_opened"
    | "checkpoint_completed"
    | "learning_modal_opened"
    | "learning_phase_viewed"
    | "quiz_started"
    | "quiz_answered"
    | "quiz_completed"
    | "practice_started"
    | "handwriting_started"
    | "handwriting_submitted"
    | "handwriting_skipped"
    | "handwriting_auto_skipped"
    | "handwriting_skipped_for_today"
    | "challenge_submitted"
    | "challenge_passed"
    | "challenge_failed"
    | "challenge_canvas_cleared"
    | "challenge_peek_used"
    | "challenge_continue_clicked"
    | "challenge_practice_again_clicked"
    | "challenge_retry_clicked";

export function trackEvent(name: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (typeof window === "undefined") return;
    track(name, properties);
}
