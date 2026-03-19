// Google Apps Script Web App URL - REPLACE THIS BEFORE PUBLISHING
const GAS_URL = "https://script.google.com/macros/s/AKfycbwdBn3nmfJzB-uNlGGQ2_u5-6hqRy4urDKOWRTQWmclVwnmjE5NCE8TYPu6Saelwu_y6g/exec";

// Game state variables
let timerInterval, lastTime, gameTimeout, envInterval;
let timeElapsed = 0;
let selectionOrder = [];
let isPaused = false;
let currentDayConfig = null;
let activeItemCount = 10;
let isNameValid = false;
let exactTarget = 0, targetSum = 0, targetDiff = 0, flipped = [], matched = 0, targetSequence = [], currentSequenceIdx = 0, currentRound = 1, totalRounds = 3, currentMathTarget = 0;
let sessionReferredBy = new URLSearchParams(window.location.search).get('ref') || '';
let hasSharedThisGame = false;

// Compilation of 365 Days using procedural cross-multiplication
let ALL_DAYS = [];
// The first 50 remain original
BASE_TYPES.forEach(d => {
    ALL_DAYS.push({ id: d.id, title: `Jour ${d.id} : Tri Croissant - ${d.title}`, type: d.type, modeId: 'sortAsc' });
});

// Fill up to 365
const MKEYS = Object.keys(GAME_MODES);
let cId = ALL_DAYS.length + 1, mIdx = 0;
while (ALL_DAYS.length < 365) {
    const base = BASE_TYPES[(cId * 13) % BASE_TYPES.length];
    const mKey = MKEYS[mIdx % MKEYS.length];
    ALL_DAYS.push({ id: cId, title: `Jour ${cId} : ${GAME_MODES[mKey].name} - ${base.title}`, type: base.type, modeId: mKey });
    cId++; mIdx++;
}
const DAYS = ALL_DAYS;

// DOM Cache
const sidebar = document.getElementById('sidebar');
const board = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const checkBtn = document.getElementById('check-btn');
const menuBtn = document.getElementById('menu-btn');
const shareBtn = document.getElementById('share-btn');
const resultDisplay = document.getElementById('result');
const feedbackContainer = document.getElementById('feedback-container');
const btnLike = document.getElementById('btn-like');
const btnDislike = document.getElementById('btn-dislike');
const btnSkip = document.getElementById('btn-skip');
let pendingTimeVal = 0;
const levelTitle = document.getElementById('level-title');
const dayButtonsContainer = document.getElementById('day-buttons-container');

let dayConfig = {};
let gameInProgress = false;
let serverPlayedDays = {};

const playerNameMainInput = document.getElementById('player-name-main');
const verifyNameBtn = document.getElementById('verify-name-btn');
const nameStatus = document.getElementById('name-status');
const nameInputContainer = document.getElementById('name-input-container');
const lockedNameDisplay = document.getElementById('locked-name-display');

const leaderboardSection = document.getElementById('leaderboard-section');
const dbMessage = document.getElementById('db-message');
const leaderboardList = document.getElementById('leaderboard-list');
const leaderboardTitle = document.getElementById('leaderboard-title');

// Storage Helpers (LocalStorage + Secure Cookies)
function setStorage(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { }
    document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=None; Secure`;
}
function getStorage(key) {
    try { if (localStorage.getItem(key)) return localStorage.getItem(key); } catch (e) { }
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
}

// Load saved name and lock UI immediately
const savedName = getStorage('orderix_player_name');
if (savedName) {
    isNameValid = true;
    if (nameInputContainer) nameInputContainer.classList.add('hidden');
    if (nameStatus) nameStatus.classList.add('hidden');
    if (lockedNameDisplay) {
        lockedNameDisplay.textContent = savedName;
        lockedNameDisplay.classList.remove('hidden');
    }
}
