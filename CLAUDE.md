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
- Dev version online: 0.1.125 (2026-11-26). Nothing verified on a phone.
- 0.1.125 (one note), awaiting the owner's verdict: the race ceremony's replay is softened (he found 0.1.122 « beaucoup trop brusque »):
  replay time goes to the hours where the track moves and each curve is smoothed by a sliding average (`RaceRecap.Chart.Calm`, `Blur`),
  an overtaken row slides in about a second (`RaceCeremony.RowSmooth`), the bar's end is worth at least half the winner's stars
  (`ScaleFloor`), 9 s instead of 7 (outside note 68's 5 to 7 s). Smoothness judged on stills and per-frame tests only, never in motion.
- 0.1.124 (one note), awaiting the owner's verdict: on the Journée tab the toast « Le rattrapage complète le calendrier, sans compter pour la série »
  shows once per profile, at the first missed day tapped, then never again (`ProfileKeys.CatchUpSaid`; it used to come back at each opening of the screen).
  Lanes: `git rebase main` fails in a lane when main changed `ProjectSettings.asset` (the lane's skip-worktree copy blocks it); cherry-pick the
  lane's commit onto main in the main repo instead.
- 0.1.123 (two notes), awaiting the owner's verdict: L'Embouteillage asks for work before each of the three exits from level 6 up
  (`TrafficGame.Config.SecondSlides` / `ThirdSlides`, counted on every shortest solution; Légende = at least 14 / 10 / 8 slides, 40 to 50
  in all; replaces the « at least 20 before car 1 » of 0.1.116). Such grids are found by retouching (`TrafficGame.ClimbEntries`), bank
  rebuilt by `Tools/embouteillage/banque.py 60 2-9` (27 minutes). Automatic hints share one pace in every game: `Core/HintPace.Seconds`,
  25 s at every level (Gratte-Ciel, Plus Petit, Plus Grand; replaces the 15 to 26 s of 0.1.108); a new game with automatic hints reads
  it. To contest: grids of one family look alike; futoshiki's daily puzzle helps 10 s later; par times not remeasured.
- 0.1.122 (three notes), awaiting the owner's verdict: Le Dégradé is rebuilt on his description (`GradientGame`: each column is the gradient of
  one hue from light to deep, top and bottom rows are the fixed bounds, free tiles are shuffled inside their column and only swap inside it,
  `SameColumn`; 3×4, 3×5, 4×6 at the daily puzzle, 5×6, 5×7, 6×7; no orange or yellow). This replaces the 0.1.119 Dégradé line below. To contest:
  much easier (a per-column shade sort), par time 55 s not remeasured, share card `j/og/degrade.jpg` still shows the old board. The race ceremony's
  replay is a « bar chart race » (`RaceRecap.Chart`: hourly keyframes, values climb continuously, thick bars scaled on the current leader, star
  count written at the bar's end, 7 s; replaces the 0.1.110 replay's look); its smoothness was judged on stills only. « Mes notes » > Essais has
  a « La roue » trial (`MetaTrial.WheelKey`) in the third tab, renamed « Événements » (was « Compétition »). Lanes: after merging into main, make
  the main editor reload (`AssetDatabase.Refresh` + `CompilationPipeline.RequestScriptCompilation`) before `publier.sh`, or the build fails.
- 0.1.121 (two notes), awaiting the owner's verdict: stars won in a loot card (wheel, chests) fly from the card to the top bar's star counter, which
  climbs at each arrival (`Hud.FlyStars`, called by `RewardOverlay` on « Continuer »; replaces the « only roll the counter » of 0.1.114). The race
  no longer says « case » anywhere: it counts in stars (« 32 étoiles », « Chaque étoile gagnée compte », `RaceText.StarsRule`; the code keeps the
  name `cases`; value column 300 wide). To contest: « étoiles » now names both the star balance and the race count.
- 0.1.120 (one note), awaiting the owner's verdict: Le Carillon shows the height columns in the first round of three only (`ChimeView.FirstRound`:
  intro of round 1 at every level, every ring of round 1 at level 1; rounds 2 and 3 ring once at the start without columns). This narrows the 0.1.116
  and 0.1.117 Carillon lines below. To contest: harder at every level, daily puzzle included, par time not remeasured.
- 0.1.119 (one note), awaiting the owner's verdict: Le Dégradé is simplified (`GradientGame.LayoutFor`, `AnchorsFor`: 3×4 at levels 1-2, 4×5 at
  levels 3-30 with 10 free tiles at the daily puzzle, 5×6 beyond, never 6×7) and its colours turn around grey instead of crossing it (any two
  tiles at least 0.07 apart in OKLab, no brown or olive). To contest: daily puzzle much easier, par time 80 → 55 s estimated, past days' grids change.
- 0.1.118 (four notes), awaiting the owner's verdict: Tri Cascade's board is redrawn in the style of its preview (violet item tile, blue reference
  tile, well-judged items stack as small green tiles on each side, emptied at each new reference; `CascadeView`, shared `App/TileLook.cs`; rules
  unchanged). Saute-Mouton cells have exactly the card's size. Plus ou Moins never greys the 0 key. « Mes notes » > Essais has a « Compétition »
  tab with a « Fin de course » trial (`MetaTrial.RaceEndKey`, `RaceCeremony.ShowTrial`).
- 0.1.117 (three notes), awaiting the owner's verdict: the free wheel spin comes every 10 finished games, won or lost (`Wheel.OnGame`; the save
  field `wheelWins` and the online setting `MetaConfig.WheelBonusEveryWins` keep their names; replaces the « every 10 wins » of 0.1.112). La
  Fontaine's scale ends on red (blue, violet, pink, red; `Palette.ThermalSteps`; replaces the orange end of 0.1.115). Le Carillon shows the height
  column at every ring at level 1 only (`ChimeView.Ring`).
- 0.1.116 (five notes), awaiting the owner's verdict: Le Sentier plays three grids per game (`TrailGame.RoundFor`, 9, 16 then 25 cells at
  levels 1 to 3; par time 95 → 110 s, estimated). L'Embouteillage's curve is rebuilt from level 6 (`TrafficGame.Steps`, `Config.FirstSlides`:
  Légende = 40 to 50 slides with at least 20 before car 1 exits; levels 1 to 5 unchanged; bank rebuilt by `Tools/embouteillage/banque.py`,
  14 minutes); still three gold cars. Le Carillon shows the height columns once at the start of each round, then plays by ear
  (`ChimeView.PlayIntro`; columns stay when sound effects are switched off); to contest: much harder, par time not remeasured.
  Plus ou Moins has a 3×4 numeric keypad. Gratte-Ciel hints come every 25 s instead of 10 (`SkylineView.HintEvery`).
- 0.1.115 (two notes), awaiting the owner's verdict: La Fontaine balls carry the colour of their value, cold to warm on the 1-99 scale
  (blue, violet, pink, coral, orange; `Palette.Thermal`, no green and no yellow on purpose; wrong tap = coral with a white ring). To contest:
  the game gets a little easier, par times not remeasured; the share card `j/og/fontaine.jpg` still shows blue balls. Saute-Mouton: each
  arrival cell shows a faded picture of the expected animal and a border in its colour; once the camps have crossed without being swapped
  (`LeapfrogGame.Crossed`) the status pill says what is left (« Les renards tout à gauche ! ») and the free arrival cells bounce. Rules unchanged.
- 0.1.114 (one note), awaiting the owner's verdict: on a won result screen the earned stars fly from the three score stars to the top bar's star counter, which
  climbs one star per arrival (`ResultScreen.StarsToCounter`, `Hud.AddShownStars`; only once Places are open, i.e. the counter exists). To contest:
  they no longer fly to the star chest bar, which fills by itself; stars from a chest or the wheel still only roll the counter.
- 0.1.113 (one note), awaiting the owner's verdict: every success row of the Profile opens an explanation sheet on tap (`App/SuccessSheet.cs`:
  current goal, counter and « Avant le palier » or current run and record, the rule in one or two sentences from `SuccessGuide.Notes`, then every
  tier with its coins and Gems; `ChainSheet` is gone). A new success needs its `SuccessGuide.Unit` and `Notes` (a test checks). « Série de jours »
  follows the current streak like « Sur sa lancée » (`SuccessGuide.Run`); « Touche-à-tout » has a fifth tier at 57 games (keep its last tier within
  the catalogue); « Tournées » uses the tour's scooter. The rule texts were never read by the owner; no success was added.
- 0.1.112 (four notes), awaiting the owner's verdict: a free wheel spin every 10 wins, put in the existing reserve (`Wheel.OnWin`,
  `MetaState.wheelWins`, online `MetaConfig.WheelBonusEveryWins`, 0 closes; tournament practice and the paid daily retry do not count; the wheel
  screen says « Encore N victoires pour un tour offert »; the economy simulation does not model it). The « Sur sa lancée » success reads « Gagner
  20 parties d'affilée », its bar follows the current run, and a tap opens an explanation sheet (`ChainSheet` in `App/ProfileScreen.cs`). The
  phone's sleep is held on every screen while a touch is less than 2 minutes old (5 minutes in game; `ScreenAwake`); a note's gesture trail now
  logs « pause » (screen, idle seconds, sleep held or not) and « retour »: note 35 (« comme en mode lock ») is not understood for sure, read those
  lines in his next note before changing code again. Note numbers no longer wrap at 99: a new note's id ends with the phone's whole counter
  (`ReportBoard.Suffix`, up to 999999) and old notes are shown with their rebuilt whole number (`ReportBoard.Numbers`), so the number shown on
  the phone (273) can differ from the id's ending (73) that the PC tools use.
- 0.1.111 (four notes), awaiting the owner's verdict: a very soft background music (80 s loop generated by `Tools/musique/generer.py`, played by
  `App/Music.cs`, silent in Métronome, Carillon and Écho) and a « Réglages » screen behind a gear on the Profile (`App/SettingsScreen.cs`: music and
  sound-effect switches with level sliders, vibrations, reminders, terms of use and privacy policy as in-game pages from `Core/LegalText.cs`,
  version). The music has never been heard by a human; the two texts are drafts (publisher « Orderix », no name, no address). Asked in the note's
  reply: which legal entity and contact address to write, and whether a gear is wanted in game (the daily clock would keep running behind).
  The race rule is a five-page animated carousel (`App/Compete/RaceRules.cs`, `RaceRulesArt.cs`; shared swipe/dots in `App/Carousel.cs`, also used
  by the album guide). A button's or row's tap sound plays on click, never on press, and not after a slide (`PressSound` in `UI/UIButton.cs`).
  Tester mode: « Test : recommencer la course » under the race prizes forgets the day's race (`Race.Forget`).
- 0.1.110 (five notes), awaiting the owner's verdict: the race ceremony opens on a 6-second replay of the race (five runners from zero, overtakes,
  an hour pill; a tap skips it), then the verdict; the prize is no longer written before « MA RÉCOMPENSE » (`RaceCeremony`, `Race.Replay.cs`,
  `RaceRecap.cs`; the player's own games are logged in `raceLog` from this version on; `RaceCeremony.DebugShow(place)`). Daily quests can be swapped
  or renewed for Gems (`Core/Meta/QuestOffers.cs`: « Changer les quêtes » 10 Gems twice a day, « Nouvelles quêtes » 20/30/40, online
  `MetaConfig.QuestSwapGemPrices` / `QuestExtraGemPrices`, 0 closes; a paid series gives its coins only, no prime chest, no season points: never a
  draw sold for Gems; blue Gem button like the wheel's). « Mes notes »: each note's line reads « [Parcours] · n° 62 · 2026-11-26 10:06:19 · 35 s »
  (`ReportBoard.Number`, `Stamp`; the number wraps after 99). Tooling: a note is checked and shown at the screen size of the phone that sent it
  (the owner's: 1216×2688; `AgentScripts/ecran.sh <w> <h>` before opening the screen, `shot.sh` follows, `apres.py` refuses another shape).
  Open, asked in note 55's reply: time drawn in the challenge preview image and a short link both need a server of ours (short domain, about
  10–15 € a year, on a free Cloudflare worker) or a fallback (real image, not clickable; or a public shortener): the owner must choose.
- 0.1.109 (four notes), awaiting the owner's verdict: the race has no finish line any more (24 hours, most cases at the end wins, ties to the first
  to reach the total; nothing frozen before the 24th hour; `RaceLength` removed, bar scaled on the leader, `RaceTrack.MinScale`; fast simulated
  runner's band 40 to 52 stars a day instead of 30 to 110). To contest: an assiduous player now wins 96 % of races (71 % before), the price of a
  tight race for a regular one; way back: `Compete.RaceBotStarsMin/Max` online. The top bar has a third counter, the star balance, between level
  and Gems once Places are open (`Hud.SyncStars`; tap goes to Places; the step card's « 26 / 13 » pill is still there). The League's « Aujourd'hui »
  hero card no longer says « N° 330 »: game name, date in words, animated preview, three captioned figures (`CompeteText.DailyStats`); the home
  daily card still says « N° 330 » (asked in the note's reply). In « Mes notes », Commenter / Modifier / Corriger maintenant open the native
  Android window directly (`ReportSync.OpenSheet`; the in-game sheet is the fallback), so the game's mic no longer dictates there; not seen on a phone.
- 0.1.108 (one note), awaiting the owner's verdict: Plus Petit, Plus Grand (futoshiki) no longer shows the « Indice dans N s » gauge (no countdown at all,
  the gold sign just arrives) and its automatic hints are slower (15 s instead of 8 up to level 5, then 18, 22, 26; `InequalityGame.ConfigFor`). Gratte-Ciel
  unchanged (10 s, gold-filling bubble; asked in the note's reply). First update shipped with patch 2: 3.3 MB instead of 30, checked on the PC only.
- 0.1.107 (five notes), awaiting the owner's verdict: updates get a second patch format (« patch 2 »: a bsdiff of each changed APK entry,
  recompressed on the phone byte for byte by `Core/ZlibFast.cs`, a C# copy of zlib level 1 as Gradle uses it; `ApkPatch` format 2,
  `latest.json` fields `patch2_*`, `Tools/publication/delta.py make2`, checked before each announcement by `verifie_patch.py` with the phone's
  own code). The APK itself is unchanged. First use: 0.1.107 → 0.1.108, about 4 MB instead of 30 (`PATCH2_DEPUIS=107` in `publier.sh`;
  needs `bsdiff4` on the PC, otherwise the publication goes without patch 2 and says so); never run on a phone, fallbacks: old patch, then
  full file. « Mes notes » multi-line fields open a native Android `EditText` window (`TextEdit.java`, `App/NativeTextEdit.cs`; one-line
  fields unchanged), never seen on a phone. The Tournoi pane is rebuilt (big cup with rays, countdown pill, the game's name and preview in
  one frame; `Core/Compete/WeekendLayout.cs`, states shown by `WeekendPanel.DebugShow("repos"…)`); to contest: place and best time left
  the open tournament's hero card. Parcours: the game named by a daily quest has a green cell with a « Quête 0/2 » ribbon
  (`Quests.ForMode`). A toast wider than the screen wraps on balanced lines (`Widgets.Toast`).
- 0.1.106 (four notes), awaiting the owner's verdict: the challenge share sends one line and a per-game relay link
  (`…/j/<game id lowercase>/?n=&t=&g=`, `InviteLink.Relay(…, modeId)`); each of the 57 games has a page and a 1200×630 preview card on this
  repo's `gh-pages` branch (`j/<id>/index.html` redirects to `j/` with the same query, `j/og/<id>.jpg`), generated by
  `AgentScripts/partage_captures.sh` + `Tools/partage/cartes.py` in the Unity repo: a new game needs its page before it ships, or its link
  is dead. The link preview has not been seen in WhatsApp. Places: the star pill reads « 8 / 15 » (balance / step price), « GAGNER DES
  ÉTOILES » no longer repeats what is missing; the « Lieu terminé » block is centred with RÉCUPÉRER under the caption
  (`PlacesScreen.GloryCenter`). « Mes notes » viewer: a last « Infos » page, three-page carousel (`ReportSync.Viewer.cs`).
- 0.1.105 (five notes), awaiting the owner's verdict: the five League sub-tabs share the Journée skeleton (hero card with a ribbon, one list card with
  one-line rows, one main button at the bottom; `Core/Compete/CompeteLayout.cs`, `App/Compete/CompeteCards.cs`). Removed from the page, to contest:
  the podium and the weekly medals of « Aujourd'hui », the three illustrated steps of the Race tab (kept in « La règle »), the spread-out tournament
  reward table (behind « Récompenses »). A won game fills the top bar in green before the result (`GameScreen.FillBarOnWin`, `WinDelay`). The Profile's
  « Succès · N à récupérer » title follows each claim. Journée's main button takes the card width (`DayLayout.PlayW`). Open, asked in note 54's reply:
  an update still downloads about 30 MB (the whole `libil2cpp.so` changes at each build); a binary patch inside it is a big job, or wait for Google Play.
- 0.1.104 (five notes), awaiting the owner's verdict: « Mes notes » has an « En cours » tab left of « À faire » (`ReportBoard.Doing`: status
  « en cours », or a fix asked and not yet taken by the PC). The success gateway claims every reached tier on the spot (`Passerelles.ClaimSuccess`,
  the Profile keeps its per-tier buttons). A button that charges coins is gold with its price: « Rejouer pour mieux faire » on the replayed
  daily card, « Garder mon élan » on the defeat screen. After a rival's arrival the race line names the place still open (`RaceText.Chase`).
  Note 40's question was answered: no finish line since 0.1.109.
- 0.1.103 (one note, the owner's comment on 0.1.102), awaiting his verdict: in « Mes notes » a note's capture opens full screen, one image at
  a time; with an after image, a swipe either way goes from « Avant » to « Après » and back (the image follows the finger, two dots, close
  cross top right; `ReportSync.Viewer.cs`). The side-by-side view of 0.1.102 is gone.
- 0.1.102 (two notes), awaiting the owner's verdict: the phone no longer sleeps during a game (`Core/ScreenAwake.cs`: game screen shown and a
  touch within the last 5 minutes; elsewhere the phone's own setting decides). In « Mes notes » a note's thumbnail opens its capture full size,
  with the fixed screen when the PC uploaded one (`ReportSync.Viewer.cs`; `python Tools/retours/apres.py <id end> <image>` after each visible
  fix, asked by the batch prompt in `travail.py`; server: `retours_image`, `retours_admin_apres`, applied on `orderix-staging` only).
- 0.1.101 (three notes), awaiting the owner's verdict: the Places screen says each thing once, Royal Match style (one card: the next
  step's name, the star balance as a counter pill, the eight steps; the price only on « CONSTRUIRE »; the two sentences, the repeated
  step name, the numbered badge and the progress bar are gone). « GAGNER DES ÉTOILES » opens the tour sheet on the Places screen
  (`TourSheet.from`), the game returns there. Result screen: bottom gaps depend on screen height (`ResultLayout.ForFoot`: 44 under
  the secondary row and 40 above it at 16:9, 56 and 44 on a tall screen). To contest: with too few stars the price is no longer shown.
- 0.1.100 (two notes), awaiting the owner's verdict: a chest won and left on the result screen has a home gateway, ahead of everything
  that waits except the streak at risk (`Gate.StarChest` opens the full star chest on the spot, it used to open from the result screen
  only; `Gate.TourChest` opens the finished tour's sheet); home only. Journée: 32 between the « AUJOURD'HUI » ribbon and the tiles, 44
  under the main button (`DayLayout.TodayPadTop`, `PlayPad`); spacing rule in the Unity repo's CLAUDE.md (« Écarts »). Open: whether the
  lost gift of note 41 really was the star chest (asked in the note's reply).
- 0.1.99 (one note), awaiting the owner's verdict: a « Mode testeur » switch at the very bottom of the Profile (test builds only;
  `TesterMode`, PlayerPrefs `tester.on`, kept on the device). Off, the mic, the magnifier, the notes button, the « Test » pill, the
  solution button and the calendar's note badges are hidden, to play as a player would; gate any tester-only UI on `App.Tester`.
- 0.1.98 (owner's feedback on 0.1.97 Journée and on the 0.1.96 home gateway): Journée = an « AUJOURD'HUI » card on top (ribbon like
  « PUZZLE DU JOUR », tiles drawn as the game's buttons: gold with a dot and a verb when something can be taken, white with its
  state while waiting), then one card holding the month, the trophy progress (chevron → « Mes trophées » sheet), the grid and the
  main button naming the chosen day (« JOUER · 13 NOVEMBRE », « REJOUER · 25 NOVEMBRE »); cards 1040 wide; weekday letters and the
  trophy sentence at 44 px. Home gateway = one whole button (gold for a reward, blue-bordered to play, green-bordered to build) with
  the verb and a chevron, same width as the daily card, free height shared evenly above, between and below.
- 0.1.97 (owner: "no scroll for the Journée part"): the Journée tab fits one screen at 1216×2688 and 1080×1920. « Aujourd'hui » is
  a 3×2 grid of tiles (icon, short name, short state, gold border and dot when something waits; a closed system has no tile), the
  calendar's day bubbles are sized on the remaining height (116 at 2688, 88 at 1920 with six tiles), « Mes trophées » opens in a
  sheet from the monthly trophy card (chevron). Small existing calendar texts (28 px weekday letters) were left as they were.
- 0.1.96 (owner's feedback on 0.1.95: the won daily card's LA TOURNÉE button and the next-game gateway "don't match what we show"
  and overload the screen): once the daily puzzle is won, the card's main button is about friends (DÉFIER MES AMIES if a friend
  has not played, INVITER UNE AMIE without a group, VOIR LE CLASSEMENT if all played; `HomeMain`), with « Rejouer » beside it on
  the same row; the tour and the next game only go through the bottom gateway (one door to play on); the friends box's
  « Défier » chips and the « 25 » calendar button (a duplicate of the Journée tab; Easybrain has none) are gone.
- 0.1.95 (lot 2 of the navigation redesign), awaiting the owner's verdict: five fixed tabs from day one (Accueil, Journée, Parcours,
  Ligue, Collection; `Core/NavTabs.cs`, `App/TabBar.cs`), shown on the five root screens, never inserted or moved; a closed tab is
  greyed with a padlock and says when it opens ("La collection s'ouvre après 5 victoires"), its "NOUVEAU" moment unlocks it in
  place; tab dots are dots, never sums. No back arrow on root tabs; Android back on a root tab goes home; Saison, Roue, Boutique,
  Profil are pushed screens (back arrow, no bar) returning to the tab they came from. « Journée » is a screen (month calendar and
  trophy, « Aujourd'hui » rows from the former DaySheet, which was removed, JOUER for the chosen day; `App/Meta/DayRows.cs`).
  Collection = Lieux and Album panes (`App/Meta/CollectionPanes.cs`, swipe between them). Bar 1040 wide, labels 44 px. On a
  1080×1920 screen nothing overlaps, but the places painting shrinks (724 high) and Journée's first « Aujourd'hui » row is cut
  above JOUER (scroll).
- 0.1.94 (lot 1 of the navigation redesign the owner approved on 2026-11-25), awaiting his verdict: "gateways" (passerelles). The
  element that announces something to do elsewhere takes the player there in one tap: the home "à faire" line is now an illustrated
  card with its own button (same place, same height), the result card's items are tappable (quests claimed on the spot, season tier,
  league, closed tournament ceremony), one priority order for home and result in `Core/Gateways.cs` (streak at risk, what expires
  today, rewards to take, friends/competition, progress in reach, Passe Or last and never on the result), and a game launched from
  the calendar, league, race or places returns there. Lot 2 shipped in 0.1.95.
- Commercial launch plan (2026-11-25): https://claude.ai/artifact/MzLgccGz96FypQ9QGZdVuq (what is missing, budget, financing).
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
- Tester notes ("Corriger maintenant") run in parallel lanes since 2026-11-26 (owner: "each note as soon as it
  arrives"): two permanent copies `OrderixUnity-wt\voie-1|2`, each with its own headless editor and product name; the
  watcher gives each request to a free lane, one session per lane that codes, checks on screen and tests there, then
  publishes through two queues (`Tools/retours/guichet.py`: « notes » for retours.json and the journal, « publication »
  for merging into main, the main editor and publier.sh). Anyone else touching docs/journal.md, retours.json or the
  main editor takes the matching queue too. Without lanes the watcher falls back to batches (`travail.CONSIGNE`). See
  `Tools/retours/installer.md` in the Unity repo. Tests: `AgentScripts/tests.sh` (45 s; sixteen long generator tests
  are `[Explicit]` and run only when their game changed, or with `--tout`).
- Several sessions edit the Unity repo at once (tester notes): do big work in a git worktree with its own editor
  (`AgentScripts/u.sh` targets the project it lives in) and merge into `main` when it is quiet.

Wiki: C:\Users\w.hadjmouldi\Documents\GitHub\ClaudeWiki\Orderix\index.md (detailed history and topics — read when needed)
