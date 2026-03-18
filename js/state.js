// Shared mutable game state
export const state = {
    // Session
    sessionReferredBy: new URLSearchParams(window.location.search).get('ref') || '',
    isNameValid: false,
    dayConfig: {},
    serverPlayedDays: {},
    // Current game
    currentDayConfig: null,
    activeItemCount: 10,
    gameInProgress: false,
    isPaused: false,
    hasSharedThisGame: false,
    pendingTimeVal: 0,
    // Timer
    timerInterval: null,
    gameTimeout: null,
    envInterval: null,
    lastTime: 0,
    timeElapsed: 0,
    // Selection state (sort / sum modes)
    selectionOrder: [],
    // Pairs mode
    flipped: [],
    matched: 0,
    // Special targets
    exactTarget: 0,
    targetSum: 0,
    targetDiff: 0,
    targetSequence: [],
    currentSequenceIdx: 0,
    // Round-based modes
    currentRound: 1,
    totalRounds: 3,
    currentMathTarget: 0,
};
