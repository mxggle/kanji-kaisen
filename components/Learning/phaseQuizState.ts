export function canSelectQuizMeaning(selectedMeaning: string | null): boolean {
    return selectedMeaning === null;
}

export function getLockedQuizMeaning(selectedMeaning: string | null, nextMeaning: string): string {
    return selectedMeaning ?? nextMeaning;
}

export function shouldLoseHeartForQuizSelection(
    selectedMeaning: string | null,
    nextMeaning: string,
    correctMeaning: string
): boolean {
    return canSelectQuizMeaning(selectedMeaning) && nextMeaning !== correctMeaning;
}
