// Projector state: which kanji, how many strokes are drawn, and the class
// quiz. Pure, so the key handling can be tested without a DOM.

export type QuizState = "off" | "asking" | "revealed";

export interface ProjectorState {
    index: number;
    drawn: number;
    quiz: QuizState;
}

export type ProjectorAction =
    /** Space or click. `total` is the stroke count, null while the strokes are loading. */
    | { type: "advance"; total: number | null; count: number }
    | { type: "unstroke" }
    | { type: "go"; delta: number; count: number }
    | { type: "show-all"; total: number | null }
    | { type: "toggle-quiz" }
    | { type: "reveal" }
    | { type: "close-quiz" };

export const INITIAL_PROJECTOR: ProjectorState = { index: 0, drawn: 0, quiz: "off" };

function go(state: ProjectorState, delta: number, count: number): ProjectorState {
    const index = Math.max(0, Math.min(count - 1, state.index + delta));
    if (index === state.index) return state;
    // Quiz mode carries on to the next kanji as a fresh question.
    return { index, drawn: 0, quiz: state.quiz === "off" ? "off" : "asking" };
}

export function projectorReducer(state: ProjectorState, action: ProjectorAction): ProjectorState {
    switch (action.type) {
        case "advance":
            if (state.quiz === "asking") return { ...state, quiz: "revealed" };
            if (state.quiz === "revealed") return go(state, 1, action.count);
            if (action.total === null) return state;
            if (state.drawn < action.total) return { ...state, drawn: state.drawn + 1 };
            return go(state, 1, action.count);
        case "unstroke":
            return state.quiz === "off" && state.drawn > 0 ? { ...state, drawn: state.drawn - 1 } : state;
        case "go":
            return go(state, action.delta, action.count);
        case "show-all":
            return action.total === null || state.quiz !== "off" ? state : { ...state, drawn: action.total };
        case "toggle-quiz":
            return { ...state, quiz: state.quiz === "off" ? "asking" : "off" };
        case "reveal":
            return state.quiz === "asking" ? { ...state, quiz: "revealed" } : state;
        case "close-quiz":
            return state.quiz === "off" ? state : { ...state, quiz: "off" };
        default:
            return state;
    }
}

export type ProjectorCommand = ProjectorAction["type"] | "exit" | "fullscreen";

/** Maps a key press to a command, or null to let the browser handle it. */
export function projectorKey(key: string, quiz: QuizState): ProjectorCommand | null {
    switch (key) {
        case " ":
        case "Spacebar":
            return "advance";
        case "Enter":
            return quiz === "off" ? "advance" : "reveal";
        // Presentation clickers send PageDown/PageUp.
        case "ArrowRight":
        case "PageDown":
            return "go";
        case "ArrowLeft":
        case "PageUp":
            return "go";
        case "Backspace":
            return "unstroke";
        case "a":
        case "A":
            return "show-all";
        case "q":
        case "Q":
            return "toggle-quiz";
        case "r":
        case "R":
            return "reveal";
        case "f":
        case "F":
            return "fullscreen";
        case "Escape":
            return quiz === "off" ? "exit" : "close-quiz";
        default:
            return null;
    }
}

/** +1 for keys that move forward through the set, -1 for back. */
export const keyDirection = (key: string) => (key === "ArrowLeft" || key === "PageUp" ? -1 : 1);
