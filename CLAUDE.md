# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orderix is a French-language daily brain-puzzle game with 365 unique daily levels, packaged as a
**native Android app via Capacitor** (the web app in `www/` is the entire game; the `android/`
folder is the generated native shell). Target audience: women ~40 who enjoy brain games — the UI
is an "Easybrain × SNG" design: flat utilitarian white/light-gray (Easybrain) with a social home
layout (SNG): player HUD (avatar/level/stars), "Puzzle du jour" banner card, daily leaderboard on
home, 4 tabs (Jour/Année/Classement/Profil). Signature blue #4A6CFA, gold #F5B227, green #34B871,
red #E0533D; Roboto bundled offline in `www/assets/fonts/`.

Vanilla JavaScript, no framework, no bundler: global script loading, load order in
`www/index.html` matters.

## Development

- **Web preview:** open `www/index.html` in a browser (everything works except native packaging).
- **Environments:** `config/orderix.{staging,prod}.json` → `node set-env.js <env>` generates
  `www/scripts/env.js` (NEVER edit env.js by hand; it exposes `ORDERIX_ENV` consumed by state.js).
  Android has matching product flavors `dev` (appId `.dev`, name "Orderix Dev") and `prod`.
- **Build APK:** `npm run android:dev` (staging) / `npm run android:prod` →
  `android/app/build/outputs/apk/<flavor>/debug/` (requires Android SDK;
  `ANDROID_HOME` or `android/local.properties` must point to it).
- **Backend migration in progress:** GAS is the active backend; Supabase (EU) schema lives in
  `supabase/migrations/` — see `docs/architecture.md` for the 4-phase plan and what's done.
- **Regenerate icons/splash:** sources in `assets/icon.svg` / `assets/splash.svg`, then
  `npx capacitor-assets generate --android` (PNGs are rendered from the SVGs with sharp).
- No automated tests or linting. `node --check` each JS file for syntax.

## Architecture (www/)

Script load order (index.html): `data.js` → `utils.js` → `generators.js` → `styles.js` →
`modes/*.js` → `core/state.js` → `api/database.js` → `ui/board.js` → `ui/screens.js` →
`core/logic.js` → `core/gameLoop.js` → `main.js`. All state is global; name collisions across
files will cause bugs.

- **`scripts/data.js`** — `GAME_MODES` (67 modes incl. the 26-mode "January wave" of ordering
  gameplays, each with a `desc` instruction string; `forceType` pins math modes to readable
  numeric types; `typeAgnostic` hides the theme), `BASE_TYPES` (50 visual types), `TEXT_TYPES`
  whitelist, `buildDayTitle()`. Calendar: days 1-31 = `JANUARY_LINEUP` (one new gameplay per
  day, testing phase — do not reorder without the owner's ask), days 32-69 = `LEGACY_RETEST`
  (each legacy mode once, neutral `numbers` type, auto `rev:1` for test badges), day 70+ =
  legacy rotation (mode × type cross).
- **Feedback loop**: end-of-game comment box opens a prefilled GitHub issue (label `feedback`);
  a cloud routine ("Orderix — correctifs depuis les feedbacks", every 2h) reads them, implements
  fixes, runs `node smoke-test.js`, commits to main and answers/closes the issue. APK rebuilds
  still happen locally (`npm run android:dev`).
- **Test badge (MANDATORY on every gameplay change)**: each mode in `GAME_MODES` may carry a
  `rev: N` field. Whenever you create, replace, or materially change a gameplay, you MUST bump
  its `rev` (add `rev: 1` if absent, else increment). The staging app shows a "!" badge on days
  whose mode `rev` is newer than the locally played revision (`needsTest()` in state.js) — this
  is how the owner knows which gameplays to (re-)test. Forgetting the bump silently hides the
  change from the test workflow.
- **`scripts/core/state.js`** — globals, the 365-day `DAYS` table (procedural mode×type cross),
  DOM cache, storage helpers, **local progress** (`orderix_local_results`, playable without a
  nickname), day-of-year ↔ date mapping, stats/streak computation.
- **`scripts/ui/screens.js`** — screen navigation (home / calendar / profile / game), daily-puzzle
  card, month-grouped 365-day calendar, `selectDay()` (intro panel with per-mode instructions and
  visual example).
- **`scripts/core/gameLoop.js`** — `startGame()`, **`resetBoard()`** (clears all inline styles
  modes leave on `#game-board` — always call it between games), timer, `endGame()` (result panel,
  feedback-first flow, petals + haptics), `abandonGame()`, `goHome()`.
- **`scripts/core/logic.js`** — `handleLogic()` dispatcher + `verifyOrder()` (sort correction view).
- **`scripts/api/database.js`** — Google Apps Script backend (`GAS_URL` in state.js). Score
  submission is skipped when no nickname is set (local-only play). Config is cached in storage
  for offline startup (4s timeout).
- **`scripts/modes/*.js`** — one file per interactive mode. Typing & speedLetters use an
  **on-screen AZERTY keypad** (`buildKeypad` in typing.js) — never use physical `<input>` for
  letters (broken with Android virtual keyboard).

### Mobile constraints (learned from the 2026 audit — see AUDIT.md)

- Never rely on `:hover`, `mousemove`, or `:active`-reveal mechanics — removed modes hideHover,
  chaseMin, blurMax for this reason.
- Modes that render a computed target visually (sum/diff) must use `forceType: 'numbers'`.
- speedQuiz "starts with / ends with" rules only apply to `TEXT_TYPES`.
- Every mode sets inline styles on `#game-board`; `resetBoard()` is the only cleanup point.

### Adding a new game mode

Create `www/scripts/modes/<mode>.js` with `startGame*()` and `showExample*(day, row, vals)`
(renders a static preview into `row`), add the mode (with `desc`) to `GAME_MODES`, wire it in
`gameLoop.js` (`startGame`) and `ui/board.js` (`showExample`), add the `<script>` tag in
`www/index.html` before `core/state.js`.

### Styling

`www/styles/`: `base.css` (design tokens — always use the CSS variables, e.g. `--bleu`, `--vert`,
`--or`, `--rouge`, `--fond`, `--carte`, `--ligne`), `app.css` (screens/shell, HUD, lead lists,
tabbar), `game.css` (board, items, keypad, result panel). Item visuals in `scripts/styles.js` use
hardcoded palette hexes (blue #4A6CFA/#3553D1, green #34B871, gold #F5B227, red #E0533D,
ink #23262F, gray #8B90A0). Mockup explorations live in `mockups/` (self-contained HTML +
`shoot.js` to screenshot them).

### Backend

Google Apps Script (Google Sheets as DB) at `GAS_URL` — leaderboards, score submission, name
checks, feedback, per-day config overrides. The GAS code is not in this repo. Scores are fully
client-trusted (known limitation).
