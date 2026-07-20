# Journal de bord Orderix — mémoire partagée

> **Règle pour toute session Claude (terminal, claude.ai, routine cloud) : lire ce
> fichier en début de session, et y consigner IMMÉDIATEMENT toute décision produit
> ou événement notable — pas en fin de session.** C'est l'unique mémoire commune à
> toutes les surfaces : les transcripts de conversation ne voyagent pas, git si.

## Règles produit permanentes (ne jamais défaire sans demande explicite de Wael)

- **Jamais d'adversaire CPU ni de faux multijoueur** — la joueuse joue contre les règles et le chrono.
- **Zéro publicité.** Monétisation = cosmétiques premium uniquement (fonds d'écran, packs).
- **Modes adorés intouchables** : Les Tubes, La Tour (Hanoï), La Balance, L'Ordre Caché.
- **Aucune suppression d'anciens modes** (rotation après janvier) sans validation via la campagne de re-test.
- **Badges « ! » retirés définitivement** (19/07) — le suivi des révisions vit sur docs/suivi-gameplays.html.
- Ne jamais dépendre des labels GitHub (le `?labels=` des URLs ne s'applique pas sur mobile) → filtrer par titre `[feedback]`.
- La routine cloud ne peut PAS builder l'APK (pas de SDK Android) → rebuild local + renvoi à chaque session.
- Cible : femmes ~40 ans, jeux cérébraux ; design Easybrain × SNG ; ton bienveillant, jamais punitif.

## Infrastructure (état)

- **Supabase branché** (19/07) : staging `gzrquivrysbmodlwhslb` / prod `bivjyemdewgtvcwoptbo` (Paris),
  migrations 0001→0005 appliquées, client vanilla (auth anonyme, scores, classements, pseudo,
  export/suppression RGPD), **double écriture Supabase + repli GAS**. Mots de passe DB :
  `C:\Users\w.hadjmouldi\Documents\Orderix-keys\LISEZMOI-IMPORTANT.txt`.
- **CI GitHub Actions** : build APK auto, keystore stable (fin des alertes Play Protect).
- **Routine cloud** « Orderix — correctifs depuis les feedbacks » : cron toutes les 2 h, lit les
  issues `[feedback]` sans réponse [claude-bot], corrige, teste, commite sur main, répond, ferme.
- Catalogue chiffré (mdp WaelOrderix) : https://wael3rd.github.io/orderix/ · Dashboard : docs/index.html
- Environnements : flavors Android dev/prod + `set-env.js` ; SDK dans `C:\Android\sdk`.

## Chronologie

### 12/06 — Refonte v2 + fondations pro (session terminal)
Audit complet (AUDIT.md), refonte totale en APK Capacitor, design **Easybrain × SNG** choisi
parmi 8 mockups, fix navigation retour, release v2.0, phase 1 pro (schéma Supabase, envs, flavors).

### 16-17/07 — Qualité gameplay v2.1 puis vague de janvier
Purge des reskins « par irritation » (spinSort & co), 3 modes phares (La Chaîne, L'Insertion,
Tri Cascade), manches + joker. Puis **26 nouveaux modes d'ordonnancement** écrits par 5 agents
parallèles (74015c3, 5 340 lignes, 67 modes au total) : janvier = 1 gameplay/jour. Boucle de
feedback in-app → issues GitHub + routine cloud. Catalogue chiffré publié.

### 18/07 — Le grand jour de test (Wael a testé ~30 jeux, 4 vagues de retours)
~45 issues traitées en vagues (#1-#113) : remplacements décidés en jouant — Duel → **Le
Solitaire** (règle « jamais de CPU » actée ici), Le Sommet/Dégradé remplacés, 6 nouveaux
gameplays issus des tops casual (#21-#33), verdicts Validé/À modifier/Remplacer obligatoires.
Système de révisions + dashboard de suivi. **Campagne de re-test février** (jours 32-69 : chaque
ancien mode 1 jour, type neutre) ; rien après le 10 mars (jours vides). Méta locale vague 1 :
série assurée, rattrapage, médailles ; fresque « mon année », partage façon Wordle ; CI.
Doc de référence : docs/meta-retention.html (game loop + rétention D365).

### 19/07 — Journée marathon : comptes, ligue, monétisation, événements
- **Nuit** : FTUE (epic 9), défi par lien + og-image, crash reporting, audit 360px,
  privacy policy publiée, analytics locaux.
- **Après-midi** : **Supabase en prod** (E2, vérifié 12/12 en réel), RGPD in-app (export +
  `delete_my_account`), **ligue hebdo** puis **ligue v2** (divisions or/argent/bronze,
  promotion/relégation), **groupes d'amies à code** (friend_groups), analytics_events,
  day_config lu depuis Supabase, stats publiques (stats.html). Board epics : 7/9 verts.
- **Soir** : **monétisation tranchée** (E6) : cosmétiques premium only, zéro pub — packs
  Aurore/Forêt, puis v2 : arrière-plans par niveau/carnet/boutique, onglet Boutique,
  **Carnet de Saison** (pass mensuel 6 paliers gratuit + premium). **Événements calendaires**
  (E5, délégué) : week-end double étoiles, défi du 1er (gel offert), niveau aux étoiles.
  **Compte sans mot de passe** (email + code), flux OAuth Google/Facebook/Apple codés
  (deep link `orderix://auth-callback` — TODO consoles fournisseurs), confirmation email
  par deep link. **Calendrier miroir** : jours 200-268 rejouent la séquence 1-69 à partir du
  19/07 → le puzzle du jour existe pour de vrai (série/événements/pass en conditions réelles).
  Classement : tout le monde visible (« Invitée-xxxx »), ligne perso `is_me`, écriture serveur
  attendue avant rafraîchissement. Badges « ! » retirés. wipe.sql.
- **23 h** : étude UI top casual 2025-26 (docs/etude-ui.html) + **plan d'uplift 6 phases** ;
  assets pro (Fluent Emoji 3D + icônes Lucide) ; sprint « différence visible » = phases B+C+D
  (moment de victoire, calendrier-trophée, dégraissage).

### 20/07 matin — Session bridgée (mobile/claude.ai)
Dashboard projet (docs/index.html). **Refonte graphique du battle pass** + polish. Études de
référence : **analyse du flow de l'APK Blockudoku** + **prototype cliquable « Meowdoku »**
(scratchpad : blockudoku-flow.html, meowdoku-proto.html, comparatifs par écran
compare-{home,boutique,calendrier,profil,resultat}.html). Corrections après test émulateur :
**fond réchauffé #F5F3F0 (beige, palette Meowdoku)**, panneau de résultat (plateau flouté
opacity .15 + blur 4px), boutons de feedback égalisés (vert clair / rose clair).
**Outils d'automatisation mobile** : recherche → 2 pépites identifiées :
- **claude-in-mobile** installé (MCP, `.mcp.json` projet) — 50+ actions ADB (tap, swipe,
  screenshot, UI tree, App Autopilot BFS/DFS). Redémarrage Claude Code nécessaire pour charger.
- **ghost-in-the-droid** testé → KO sur Windows (dépendance `fcntl` Unix-only).
- **DroidBot** identifié comme meilleur outil pour explorer un jeu automatiquement en BFS et
  générer un graphe de transition avec captures — à installer session suivante.
- Émulateur `orderix_test` tournait (ADB connecté), APK installé et fonctionnel.
- Plan : installer Royal Match sur téléphone réel (ARM, pas émulable x86), piloter via ADB.
- MCP connectés côté bridge : Slack, Figma, Linear, Asana, Atlassian, Notion, Intercom,
  Google Calendar, Gmail.

### 20/07 midi — Session terminal (celle-ci)
 6 icônes Lucide oubliées commitées (+ .mcp.json claude-in-mobile). **Phase A de l'uplift** :
tokens motion (3 easings + 4 durées en variables CSS, easing orphelin unifié), phases A-D
marquées faites dans l'étude. APK dev rebuildé et envoyé. Découverte du trou de mémoire des
sessions bridgées → création de ce journal comme mémoire partagée.

### 20/07 après-midi — Session bridge (claude.ai) : diagnostic transcripts, AUCUN changement produit
Constat vérifié dans le JSONL local (`80a3948b….jsonl`) : une session **bridge** (reprise
depuis le téléphone/claude.ai alors que le terminal était fermé) n'écrit PAS ses messages
dans le JSONL local — seulement des marqueurs `bridge-session`. Reprendre une session bridge
la laisse en bridge. **Règle : terminal OUVERT + message du téléphone → tout est local ;
terminal FERMÉ → l'échange vit côté claude.ai** (rouvrable là-bas, pas via `--continue`).
Incident réglage : `remoteControlAtStartup` brièvement passé à `false` par erreur de
diagnostic, **remis à `true` aussitôt** (c'est lui qui permet le flux téléphone→PC).
Vérif rapide qu'une session écrit en local :
`Select-String -Path "$env:USERPROFILE\.claude\projects\C--Users-w-hadjmouldi-Documents-GitHub-orderix\*.jsonl" -Pattern "<mot distinctif tapé dans la session>" -SimpleMatch -List`

## Reste à faire (vu du 20/07)

- **Uplift UI** : ~~phase E (FTUE éclair)~~ FAITE 20/07 → reste **phase F** (pastilles tabbar
  + thème sombre gratuit).
- **OAuth** : créer les apps dans Google Cloud Console / Meta (côté Wael — docs/todo-wael.html).
- Backlog gameplay : multi-guichets pour La File (#12, seule issue feedback ouverte).
- Epics restants : voir docs/epics.html (7/9 verts au 19/07).
- Campagne de re-test février : verdicts à donner en jouant (cases dans l'app).

### 20/07 aprem (suite 3, terminal) - Royal Match KO sur emulateur (confirme)
XAPK Royal Match (v37281, `~/Downloads/Royal+Match_37281_APKPure.xapk`) : le seul split natif
est `config.armeabi_v7a` (ARM 32-bit). L'emulateur `orderix_test` expose
`ro.product.cpu.abilist = x86_64,arm64-v8a` (traduction libndk_translation, mais **arm64
uniquement, pas armeabi-v7a 32-bit**). `adb install-multiple` echoue :
`INSTALL_FAILED_NO_MATCHING_ABIS (res=-113)`. **Conclusion : Royal Match ne tourne pas sur
cet emulateur x86 → telephone reel ARM obligatoire** (comme prevu). adb du SDK :
`C:\Android\sdk\platform-tools\adb.exe` (pas dans le PATH). Rappel : claude-in-mobile pas
charge cette session (redemarrage requis) ; pilotage possible aussi en ADB brut
(input tap/swipe, screencap) sans le MCP.

### 20/07 aprem (suite 5, terminal) - Uplift phase E : FTUE eclair (fait)
Onboarding reduit de **3 slides -> 1 ecran d'accueil**. Le CTA « Jouer le puzzle du jour »
enchaine direct sur `selectDay(jour du jour)` = l'intro du mode, qui enseigne sa propre regle
(fini les slides meta abstraites avant d'avoir joue). Les 2 slides « album » et « serie »
retirees : la serie est deja proposee APRES la 1re victoire, l'album se decouvre via le
calendrier. Bouton secondaire « Plus tard » = atterrir sur l'accueil sans forcer le jeu.
Fichiers : `www/scripts/main.js` (OB_SLIDES a 1 element, `startTodayFromOnboarding()`,
`closeOnboarding(launch)`, dots masques si <2 slides), `www/index.html` (libelles boutons).
smoke-test OK, `node --check` OK. Phase E marquee done dans docs/etude-ui.html.
**Reste uplift : phase F** (pastilles tabbar + theme sombre gratuit). APK a rebuilder en local.

### 20/07 aprem (suite 4, terminal) - Royal Match : installe mais injouable sous traduction ARM
Contournement du NO_MATCHING_ABIS trouve : AVD `royalmatch_arm` sur image
**android-28 google_apis x86** (abilist `x86,armeabi-v7a,armeabi`, libhoudini/ndk_translation
gere l'ARM 32-bit). Le XAPK armeabi-v7a **s'installe (`Success`) et se lance**. MAIS a
l'execution le device est sature (CPU 100 %, meme `adb shell echo ok` time out a 20 s) :
gros jeu Unity + traduction ARM temps reel + rendu logiciel swiftshader = injouable/
inautomatisable. Bilan : l'archi est resolue, la **perf ne l'est pas** sur emulateur.
Leviers restants : relancer avec `-gpu host -cores 4 -memory 4096` (peut passer de « fige »
a « lent »), sinon **telephone reel ARM = seule voie vraiment jouable** (plan initial du
journal). Alternative outil : ghost-in-the-droid v1.3.0 (meme repo qu'android-agent, KO
Windows/fcntl) a un backend Docker+KVM qui contournerait le blocage Windows.

### 20/07 aprem (suite 2, session bridge) - MCP game design installe
Wael avait evoque un « MCP game design » dans une session bridge non consignee (trou de
memoire confirme : aucune trace dans journal/dumps/JSONL — d'ou l'importance de consigner
immediatement). Reconstruit et installe : **gamethinking-mcp-server** (github.com/mahecode/
gamethinking-mcp-server, fork du serveur sequential-thinking oriente conception/equilibrage
de gameplay). Pas sur npm → clone + build local dans
`C:\Users\w.hadjmouldi\Documents\GitHub\gamethinking-mcp-server`, entree `gamethinking`
ajoutee au `.mcp.json` du projet (handshake stdio verifie). Redemarrage de Claude Code
necessaire pour le charger. Rappel : le MCP de controle mobile deja en place = claude-in-mobile.

### 20/07 aprem (suite) - Bug report envoye a Anthropic
Issue deposee : https://github.com/anthropics/claude-code/issues/79420 (sessions bridge = transcript jamais ecrit en JSONL local, pas de rapatriement possible). Dump complet de la session : docs/dump-bridge-2026-07-20-aprem.md (commit 20c3909).
