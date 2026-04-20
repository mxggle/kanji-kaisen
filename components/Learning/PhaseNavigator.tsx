interface PhaseNavigatorProps {
    currentPhase: "info" | "quiz" | "practice" | "challenge";
    onPhaseChange: (phase: "info" | "quiz" | "practice" | "challenge") => void;
    skipHandwriting?: boolean;
}

const PHASES = [
    { id: "info" as const, label: "Memorize", number: 1 },
    { id: "quiz" as const, label: "Quiz", number: 2 },
    { id: "practice" as const, label: "Trace", number: 3 },
    { id: "challenge" as const, label: "Challenge", number: 4 },
];

export function PhaseNavigator({ currentPhase, onPhaseChange, skipHandwriting = false }: PhaseNavigatorProps) {
    const visiblePhases = skipHandwriting
        ? PHASES.filter((phase) => phase.id === "info" || phase.id === "quiz")
        : PHASES;

    return (
        <div className="flex items-center justify-center gap-2 mb-2">
            {visiblePhases.map((phase, index) => {
                const isActive = currentPhase === phase.id;
                const isPast = visiblePhases.findIndex((p) => p.id === currentPhase) > index;

                return (
                    <button
                        key={phase.id}
                        onClick={() => onPhaseChange(phase.id)}
                        className={`
                            group relative flex items-center gap-2 px-3 py-1.5 rounded-full
                            transition-all duration-300 ease-out
                            ${isActive
                                ? 'bg-white/10 scale-105'
                                : 'bg-white/5 hover:bg-white/8 hover:scale-102'
                            }
                        `}
                        title={`Jump to Phase ${phase.number}: ${phase.label}`}
                    >
                        {/* Phase number indicator */}
                        <div
                            className={`
                                w-6 h-6 rounded-full flex items-center justify-center
                                text-xs font-bold transition-all duration-300
                                ${isActive
                                    ? 'bg-[var(--accent)] text-black'
                                    : isPast
                                        ? 'bg-[var(--accent)]/40 text-white/80'
                                        : 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/70'
                                }
                            `}
                        >
                            {phase.number}
                        </div>

                        {/* Phase label - only show on active */}
                        <span
                            className={`
                                text-sm font-medium transition-all duration-300 overflow-hidden
                                ${isActive
                                    ? 'max-w-[100px] opacity-100 text-white'
                                    : 'max-w-0 opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 text-white/70'
                                }
                            `}
                        >
                            {phase.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
