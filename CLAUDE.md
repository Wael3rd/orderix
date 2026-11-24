# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MANDATORY: shared session journal

**`docs/journal.md` is the shared memory across ALL surfaces** (terminal, claude.ai bridge,
cloud routines) — conversation transcripts do NOT travel between surfaces, git does.
At session start: read it. During the session: append every product decision or notable
event IMMEDIATELY (not at session end), then commit it with the related change.

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
  (each legacy mode once, neutral `numbers` type), days 200-268 = MIRROR of days 1-69
  (anchored July 19 so the real "daily puzzle" exists — streak/events/pass live for real;
  `_virtualDay()` in state.js), all other days EMPTY (`day.empty`). Feedback from mirror days
  maps back to virtual rows on the dashboard.
- **Feedback loop**: end-of-game comment box opens a prefilled GitHub issue (label `feedback`);
  a cloud routine ("Orderix — correctifs depuis les feedbacks", every 2h, **disabled since 18/07**)
  used to read them, implement fixes, run `node smoke-test.js`, commit to main and answer/close the
  issue. CI rebuilds the staging APK on each push touching code (release `staging-latest`).
- **Test badges: RETIRED (owner request, 19/07)**. `needsTest()` always returns false and no
  "!" badge is ever shown. `rev:` fields may remain on modes but are inert — do NOT reintroduce
  badge UI. Gameplay-change tracking happens on the web dashboard (docs/suivi-gameplays.html)
  instead.
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

## State

- 2026-11-22: active work is the native Unity rebuild in `C:\Github\MobileGames\OrderixUnity` (private repo);
  this repo keeps the shared journal `docs/journal.md`.
- Dev version online: 0.1.93 (2026-11-24). Nothing verified on a phone.
- 0.1.93 (one note), awaiting the owner's verdict: the race's simulated runners no longer stand still after the start. Each one plays an
  opening session in the first minutes (`Race.Open`, `CompeteConfig.RaceBotOpeningPercent` 30, 0 closes it, frozen at the start): her first
  games are moved earlier, nothing is added, so her 24-hour total, her arrival time and the measured ranks are unchanged, and it is still a
  pure function of the seed (no rubber band). On screen a green dot and « joue » follow the name of a runner who is mid-game
  (`Race.PlayingAt`), her pawn beats, and a rival advancing while the tab is open makes her count jump with a soft sound.
- 0.1.92 (batch of five notes), all awaiting the owner's verdict: every game of the catalogue (57) now has levels (`XGame.ConfigFor(level)`,
  the view reads `Host.Level`; levels 3 to 5 keep the former difficulty so the daily puzzle, `DailyLevel` 3, does not change; one step per
  rank; `AgentScripts/niveaux.sh <level>` plays every game at a level in test mode and builds contact sheets). The curves were never played
  by a human: the owner judges them through the Test pill. The won-game result screen shows three items at most (`Core/ResultCard.Pick`) and
  its main button is « JEU SUIVANT » (another game, the home's choice), with « Rejouer · niveau N » beside « Tous les jeux »: a loop change
  the owner must confirm. The running race fits on one page, each runner's pawn is her avatar (`RaceLayout`). The friends ranking reads
  « Temps total : … » with a stake line (`FriendsWeek`). Le Tournoi keeps the contestants' colours at the solution (tick + green pad).
- 0.1.91 (one note), awaiting the owner's verdict: the intro card of the daily puzzle replayed for fun (« Rejouer le puzzle » on home)
  also offers the paid retry, under « C'EST PARTI »: a line says this game leaves the day's time unchanged, then the button « Rejouer pour
  mieux faire · 50 pièces » (`GameScreen.BuildRetryOffer`) opens the existing retry card; Back returns to the card she came from. A card too
  tall for a short screen slides down under the progress bar (`GameHeaderLayout.IntroCenterY`). To contest: two taps before paying.
- 0.1.90 (one note), awaiting the owner's verdict: the Alvéoles token counter and the top bar now add up the whole game. They used to
  restart from zero at each placement (`HiveGame.Step.RemovedAfter` held the last placement's count, so a win showed « 11 / 40 »); the
  pill stops at the target (« 40 / 40 »). The 0.1.89 lesson was marked verified by the owner.
- 0.1.89 (one note, verified by the owner): Les Alvéoles explain themselves. A three-page animated lesson opens on the first game
  (`App/Modes/HiveLesson.cs`, same card as the Gratte-Ciel lesson, « Règles » button beside the back button), every pile shows the count of
  its top colour, and the neighbours that will pour twitch while a pile is dragged over a cell (`HiveView.NudgePourers`). The rules themselves
  did not change (they are the genre's). Open: the daily Alvéoles puzzle is won in 36 s by placing at random (par time 120 s).
- 0.1.88 (third batch, two notes), awaiting the owner's verdict: the wheel can be spun again for Gems (20, 30, 40, three a day, beside the
  coin spins; `MetaConfig.WheelGemPrices`, a 0 price closes them; `Wheel.NextGems`/`SpinGems`, two pay buttons side by side in `WheelScreen`).
  This lifts the former "never Gems to spin" guard at the owner's request: he must decide before Google Play is wired (Gems will then be
  bought with money). On the result screen the announcements (league, place, quests...) are illustrated tiles (`App/ResultScreen.Notes.cs`,
  `ResultLayout.TilesFit`); they fall back to compact lines when they do not all fit.
- 0.1.87 (second batch of four notes), awaiting the owner's verdict: the season has two reward lines on the same 30 tiers, « Gratuit »
  (unchanged) and « Passe Or » (`Core/Meta/SeasonPass.cs`, `App/Meta/SeasonPassSheet.cs`, spec: `docs/economie-design.md` section 7 in the
  Unity repo): certain rewards only, never a draw; its stars go to the places balance only; 4,99 € (`MetaConfig.SeasonPassCents`) through the
  test store (nothing is charged; a build without a store shows neither button nor column). Before a real payment the purchase must be held
  by the server. « Défier mes amies » resends the day's time from the friends panel and from the home daily card (`FriendsPanel.Share`,
  `HomeFriends.Challenge`). In Sudoku the chosen digit gilds every cell that carries it (`SudokuView.ToneOf`).
- 0.1.86 (first batch of five notes), all awaiting the owner's verdict: a new place element paints itself as a watercolour blot from its
  heart and the next one is announced by its silhouette (masks generated by `Tools/aquarelle/masques.py` into `App/Meta/PlaceMasks.Data.cs`;
  rerun it when a place image changes, a test checks the fingerprint); a won wheel slot leaves the wheel until the next day
  (`MetaState.wheelOut`, never under 4 slots, average value of a spin unchanged); the Race tab shows an illustrated card and three one-line
  steps, the full rule lives in the illustrated « La règle » pop-up (`RaceLook.cs`, `RaceText.Steps`); « Inviter » sends one relay link
  `…/j/?g=CODE` (`InviteLink.Invite`) that opens the game and joins the group, the relay page copies `orderix://amies/CODE` for a fresh
  install (read once, `InviteService.TakeClipboard`) and « Rejoindre avec un code » opens pre-filled. The link and the clipboard read
  have not been tried on a real phone.
- Since 0.1.85 each big mode has its own chest picture (`App/Meta/Chests.cs`: stars = the original wood-and-gold chest, small free chest,
  tour, quests, league, race, weekend tournament), all rendered from the same CC0 3D model by `Tools/icone/coffre/rendre.py` (table `COFFRES`:
  tints and a medallion carrying the mode's icon). Awaits the owner's verdict: same base shape recoloured, he may want truly different shapes.
- Since 0.1.84 every chest card (`RewardOverlay`) shares one layout: picture panel, a bold line (amount or sticker name), a softer line (unit, series,
  or a duplicate's dust), never wrapping; cards grow up to 1.3x when few (`ChestShow.CardScale`). Awaits the owner's verdict (his note: "ça ne fait pas pro").
- Since 0.1.83 album 1 is « Le tour du monde » (monuments, landscapes, world food, cruise, festivals, souvenirs, suitcase, cities, snow) and a sticker
  is drawn as a postage stamp (`App/Meta/Stamp.cs`, `Shape.Perforate`). Rule kept by `AlbumContentTests`: an album sticker is never an avatar
  (shop or other players). Awaits the owner's verdict on the travel theme; the perforated edge (shared UI shader) has not been seen on a phone.
- 0.1.82 rebuilt L'Aiguillage (side-view train, three tracks, the engine moves a cut of wagons from one track to another; `ShuntGame`/`ShuntView`)
  and brought Le Métronome back as a rhythm game (tap the next number on the beat; `MetronomeGame`/`MetronomeView`, id `metronome`, in the daily
  rotation from 2026-11-26). Both await the owner's verdict; the tick-to-pendulum audio delay on Android has not been heard on a phone.
- 0.1.81 carries a paid retry of the daily puzzle (50 then 100 coins, two a day, best time of the day counts; button in the friends
  panel), ON since 2026-11-24: `supabase/migrations/0006_meilleur_temps.sql` is applied on `orderix-staging` and
  `CompeteConfig.DailyRetryOpen` is 1 in the code since 0.1.91. `orderix-prod` (paused) has NOT received 0006: apply it before a
  production build, or close the feature with the online setting `"Compete.DailyRetryOpen": 0`. Spec: `docs/competition-design.md` in the
  Unity repo, section « Le nouvel essai du puzzle du jour ». Trial script: `AgentScripts/nouvel_essai.sh` (it plays at a date the server
  refuses, at least two days ahead: a date the server accepts writes a fake time on the real daily board).
- Since 0.1.80, Triple Suite tiles are thrown in a heap (no rows, always upright); a tile is covered as soon as another one bites on it;
  levels 1 to 3 are built around a winning order like the others (`TripleRunGame.BuildPositions`).
- Since 0.1.79 the shop has a loyalty card (`Core/Meta/Loyalty.cs`, spec: `docs/economie-design.md` 5 bis in the Unity repo): a shop purchase of
  100 coins or more, or paid in Gems, stamps one of 5 cases (first one offered); a full card gives in turn a wheel spin (kept in reserve,
  `MetaState.wheelBonus`), a tournament ticket, a sticker. Gem packs, paid wheel spins and bought tickets do not stamp.
- Since 0.1.77, test builds have a "Test" pill under a game's intro card: pick rank and level, play, nothing is counted
  (`GameScreen.Test.cs`, `TestLevels.cs` in the Unity repo). Since 0.1.92 every game reads the level.
- Since 0.1.76 the game's "share my time" text ends with a relay link served by this repo's `gh-pages` branch
  (`j/index.html`, https://wael3rd.github.io/orderix/j/): it opens the installed game through `orderix://amies/CODE`,
  otherwise starts the APK download. It carries the same download URL as `InviteLink.DownloadUrl` and `publier.sh` in the
  Unity repo: change them together.
- New economy loop shipped in 0.1.74/0.1.75 (spec: `docs/economie-design.md` in the Unity repo): stars are a balance
  that builds places (6 places, each with its own painter style, `Resources/Places/<id>/<n>.jpg`), wheel, tournament
  tickets, race on Tuesdays and Thursdays, calendar button on the daily card.
- Open (loyalty card): it dries up once the 53 avatars are bought (more things to sell needed); owner to decide whether a card stamped by a
  Gems purchase may still give a wheel spin or a sticker once Google Play is wired ("no chance paid with money" rule).
- Open: place paintings to be replaced later by better art (owner chose to ship the generated ones first); more places
  needed (a regular player finishes 20 a year since the star chest gives 3 stars per opening, 0.1.78); owner to
  decide whether the wheel keeps giving stars.
- Tester notes ("Corriger maintenant") are handled in batches since 2026-11-23: the PC watcher takes up to 5 pending
  requests at once, one headless session runs one worker per note in parallel, then one test pass and one published
  version for the batch (`Tools/retours/travail.py` and `installer.md` in the Unity repo). Tests: `AgentScripts/tests.sh`
  (45 s; sixteen long generator tests are `[Explicit]` and run only when their game changed, or with `--tout`).
- Several sessions edit the Unity repo at once (tester notes): do big work in a git worktree with its own editor
  (`AgentScripts/u.sh` targets the project it lives in) and merge into `main` when it is quiet.

Wiki: C:\Users\w.hadjmouldi\Documents\GitHub\ClaudeWiki\Orderix\index.md (detailed history and topics — read when needed)
