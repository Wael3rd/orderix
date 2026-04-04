# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Orderix is a French-language, browser-based daily puzzle game with 365 unique daily levels. Players complete ordering, sorting, and identification challenges with time-based scoring. Built entirely with vanilla JavaScript (no frameworks, no npm, no build step).

## Development

**Run locally:** Open `index.html` directly in a browser. No build or install step required.

**No automated tests or linting** are configured.

## Architecture

The app uses global script loading (no modules/bundler). Script load order in `index.html` matters — dependencies must be loaded before dependents.

### Load order and data flow

1. **Data layer** (`scripts/data.js`) — Defines ~50 `BASE_TYPES` (visual/data categories like lightness, emojis, numbers) and ~40 `GAME_MODES`. `DAYS` array maps each of 365 days to a mode+type combination.
2. **Utilities** (`scripts/utils.js`, `scripts/generators.js`, `scripts/styles.js`) — Helper functions, value generation per type, and visual styling logic.
3. **Game modes** (`scripts/modes/*.js`) — Each file implements `startGame*()` and `showExample*()` for one mode (reflex, typing, connectDots, mathQuiz, dragDrop, conveyor, speedQuiz, guessNumber, dobble, speedLetters).
4. **State** (`scripts/core/state.js`) — Global variables, DOM element cache, LocalStorage/cookie helpers, and the Google Apps Script API URL.
5. **API** (`scripts/api/database.js`) — Score submission, leaderboard fetch, and name validation via Google Apps Script backend (Google Sheets as database).
6. **UI** (`scripts/ui/board.js`, `scripts/ui/sidebar.js`) — Game board rendering and day-selection sidebar.
7. **Game logic** (`scripts/core/logic.js`) — `handleLogic()` dispatcher that routes to mode-specific win/loss evaluation.
8. **Game loop** (`scripts/core/gameLoop.js`) — Initializes a day's game, delegates to the appropriate `startGame*()`, manages timer.
9. **Entry point** (`scripts/main.js`) — Event listeners and app initialization.

### Key patterns

- **Adding a new game mode:** Create a file in `scripts/modes/`, implement `startGame*()` and `showExample*()`, add the mode to `GAME_MODES` in `data.js`, wire it into `handleLogic()` in `logic.js` and `gameLoop.js`, and add the `<script>` tag in `index.html` in the correct load-order position.
- **Adding a new base type:** Add to `BASE_TYPES` in `data.js`, add generation logic in `generators.js`, and add styling in `styles.js`.
- All state is global (no module scope). Variable/function name collisions across files will cause bugs.

### Backend

Google Apps Script at a hardcoded URL in `scripts/core/state.js` (`GAS_URL`). Handles leaderboards, score submission, name checks, and feedback. The actual GAS code is not in this repo.

### Styling

Six CSS files in `styles/`: `layout.css`, `sidebar.css`, `board.css`, `components.css`, `animations.css`, `responsive.css`. The app is mobile-responsive with a collapsible sidebar.
