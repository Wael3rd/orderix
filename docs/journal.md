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
- La routine cloud ne peut PAS builder l'APK (pas de SDK Android). La CI le fait : chaque push sur main touchant
  `www/`, `android/`, `config/`, `set-env.js` ou `package.json` republie l'APK sur la release `staging-latest` (URL fixe).
  Rebuild local seulement pour tester avant de pousser.
- **PIÈGE build APK (résolu 20/07)** : `npm run android:dev` fait `cd android && gradlew ...` ;
  sous **Git Bash** `gradlew` (sans `./`) n'est pas trouvé → le build semblait « planter depuis
  des jours ». En réalité Gradle marche (BUILD SUCCESSFUL en ~14 s). **Builder depuis PowerShell**
  (`cd android; .\gradlew.bat assembleDevDebug`) après l'étape env/sync (`node set-env.js staging
  && npx cap sync android`), ou lancer `npm run android:dev` depuis PowerShell/cmd (pas Git Bash).
  APK dev → `android/app/build/outputs/apk/dev/debug/app-dev-debug.apk` (~6 Mo).
- **Une seule tentative par puzzle** : ni re-essai payant, ni mode entraînement (décidé par Wael le 19/07, retrouvé le 05/11 dans la session cloud).
- **Genre « distribution de file » écarté** après 4 rejets : Ascenseur, Guichet, Aiguillage, À Bord (18/07).
- **Pas d'assets dessinés maison** : banques d'images libres uniquement, Fluent Emoji 3D et Lucide (demande de Wael, 19/07).
- Quand Wael dit « pas intéressant » : changer de gameplay pour un vrai succès du casual, pas retoucher (18/07).
- Board de production : une tâche avance, ou elle est marquée « bloqué » avec sa raison (19/07).
- **WebView conservée** plutôt qu'une migration Kotlin (Wael, 23/06, retrouvé le 05/11 dans la session cloud). L'argument « les jeux Easybrain sont des WebViews » était sans source et s'est révélé faux pour Blockudoku (Unity, vérifié le 06/11) : choix à réexaminer lors du retravail.
- **Le gameplay passe avant les thèmes** : le croisement modes × 50 thèmes enfermait le design dans des carrés à comparer ; les thèmes ne servent plus que d'habillage sur quelques modes de perception (Wael, 17/07).
- **Anciens gameplays conservés** : « je veux pas qu'on supprime pour le moment » (Wael, 17/07).
- Cible : femmes ~40 ans, jeux cérébraux ; design Easybrain × SNG ; ton bienveillant, jamais punitif.

## Infrastructure (état)

- **Supabase branché** (19/07) : staging `gzrquivrysbmodlwhslb` / prod `bivjyemdewgtvcwoptbo` (Paris),
  migrations 0001→0005 appliquées, client vanilla (auth anonyme, scores, classements, pseudo,
  export/suppression RGPD), **double écriture Supabase + repli GAS**. Mots de passe DB :
  `C:\Users\w.hadjmouldi\Documents\Orderix-keys\LISEZMOI-IMPORTANT.txt` (ancien PC ; copie dans Drive, `ORDERIX/Orderix-keys`).
  **État au 06/11 : staging actif, prod en pause**, voir la chronologie du 05/11 et du 06/11.
- **CI GitHub Actions** : build APK auto, keystore stable (fin des alertes Play Protect).
- **Routine cloud** « Orderix — correctifs depuis les feedbacks » : **désactivée** (dernière exécution le 18/07 à 20:10 UTC).
  Quand elle tournait : cron toutes les 2 h, lit les
  issues `[feedback]` sans réponse [claude-bot], corrige, teste, commite sur main, répond, ferme.
- Dashboard projet : https://wael3rd.github.io/orderix/ (source docs/index.html). Le catalogue chiffré qui occupait cette
  adresse a été remplacé le 20/07 ; il ne reste que dans l'historique de `gh-pages`. Ne pas écrire son mot de passe ici : le dépôt est public.
- KitKat et store perso : aussi sur Cloudflare Pages (https://kitkat.wael3rd.pages.dev/, https://wael3rd.pages.dev/),
  déploiement manuel `npm run deploy:cf` depuis le dépôt Cours_Enfants.
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

- **Uplift UI** : ~~phases E (FTUE éclair) + F (pastilles tabbar + thème sombre)~~ **FAITES 20/07
  → uplift A→F terminé.** L'APK correspondant est publié par la CI (`staging-latest`).
- **OAuth** : créer les apps dans Google Cloud Console / Meta (côté Wael — docs/todo-wael.html).
- Backlog gameplay : multi-guichets pour La File (#12 refermée le 18/07, idée gardée dans docs/gameplay-audit.md §5).
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

### 20/07 aprem (suite 6, terminal) - Uplift phase F : pastilles tabbar + theme sombre (fait)
**Uplift TERMINE (A->F).** Deux livrables :
1. **Pastilles tabbar** (2 sources max, point dore + pop elastique) : onglet « Jour » si le
   puzzle du jour est jouable et pas encore joue (s'efface en jouant) ; onglet « Boutique »
   si un palier de Carnet est atteint mais pas encore vu (s'efface a la visite de la Boutique).
   Helpers `passReachedCount/SeenCount/passClaimable/markPassSeen` (cosmetics.js, cle
   `orderix_pass_seen`), `refreshTabBadges()`/`setTabDot()` (screens.js, appeles dans showScreen
   + au boot), spans `.tab-dot` dans index.html, style `.tab-dot` (app.css).
2. **Theme sombre gratuit** : bascule via `data-theme="dark"` sur <html>. Bloc de tokens
   sombres dans base.css (surfaces neutres + pales semantiques + ombres) ; l'accent (--bleu*)
   et le fond du body sont geres en JS (`applyTheme`/`applyBackground` deviennent dark-aware)
   pour rester lisibles ; `isDark()` suit la pref `orderix_dark` (on/off) sinon le systeme
   (prefers-color-scheme) ; `applyDarkMode()`/`toggleDark()` (cosmetics.js), bouton dans les
   Reglages du Profil (main.js), appel au boot. Verifie par capture headless (Edge/puppeteer) :
   clair intact, sombre propre, pastille « Jour » visible dans les deux.
smoke-test OK, `node --check` OK. Phase F marquee done dans docs/etude-ui.html.
**APK a rebuilder en local** (`npm run android:dev`) pour tester sur appareil.

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

### 26/09 - Hors projet : site KitKat Fighters
Page perso familiale (vote ○/× sur 13 KitKat japonais) source dans `docs/kitkat/`, publiee en copiant ce dossier sur la branche gh-pages (`kitkat/`) : https://wael3rd.github.io/orderix/kitkat/ . Aucun lien avec le jeu, aucun impact sur www/ ni sur le build Android.

### 26/09 - KitKat Fighters v2
Vote ○/× remplace par une note de goût sur 5 (mauvais, moyen, bon, très bon, trop bon) + bizarre-o-mètre sur 3 (normal, un peu bizarre, trop bizarre). Tier list sur la moyenne du goût, section bizarre-o-mètre. Anciens votes migrés (○ = très bon, × = mauvais).

### 26/09 - KitKat Fighters v3 (PWA + cloud)
- Goût sur 3 (mauvais, moyen, bon), bizarre sur 3 (non, un peu, trop). Joueurs : Wael, Aline, Ismael, Adel (prénoms modifiables en touchant le nom).
- Écran principal sur une seule hauteur (tablette plein écran) : titre, carrousel des 13 KitKat, photo à gauche, 4 joueurs à droite. Tier list, bizarre-o-mètre et sauvegarde sous l écran.
- PWA installable (manifest display fullscreen, service worker hors ligne, écran maintenu allumé).
- Avis stockés dans Supabase orderix-staging, tables isolées kitkat_votes / kitkat_players (script supabase/extras/kitkat_family.sql, à exécuter une fois dans le SQL Editor). Sans ces tables, l appli garde tout en local et envoie dès que les tables existent. Tables hors périmètre de wipe.sql.

### 10/10 - KitKat et store perso sur Cloudflare Pages (reconstitué le 05/11 depuis le log de la session cloud)
Une tablette n'installe qu'une seule PWA par origine : chaque app a donc sa propre origine Cloudflare Pages (projet `wael3rd`). KitKat : https://kitkat.wael3rd.pages.dev/ · store : https://wael3rd.pages.dev/. Déploiement manuel par `npm run deploy:cf` depuis le dépôt Cours_Enfants, pas depuis ce dépôt. L'id PWA de KitKat a été corrigé (be2a6e2). Ce jour-là, `kitkat_votes` et `kitkat_players` étaient introuvables sur Supabase : `supabase/extras/kitkat_family.sql` n'avait apparemment pas été exécuté.

### 05/11 - Reprise sur un nouveau PC
- Dépôt recloné dans `C:\Github\MobileGames\Orderix`. Node, Java, adb et le SDK Android n'y sont pas installés : ni build ni smoke-test en local pour l'instant. Les chemins `C:\Users\w.hadjmouldi\...` et `C:\Android\sdk` de ce journal désignent l'ancien PC.
- Archive hors dépôt : `C:\Github\MobileGames\Orderix-archive\` (issues, releases, synthèse des sessions cloud).
- **Supabase : les deux domaines ne résolvent plus.** `gzrquivrysbmodlwhslb.supabase.co` et `bivjyemdewgtvcwoptbo.supabase.co` répondent NXDOMAIN chez Cloudflare et Google. Vérifié sur le dashboard par Wael : les deux projets sont en pause (plan gratuit), données intactes. Reprise possible depuis le dashboard jusqu'au 20/11/2027 pour staging et au 30/08/2027 pour prod ; après ces dates, données téléchargeables seulement. Le script GAS répond toujours (HTTP 200).
- Mot de passe du catalogue retiré du journal et de `showcase-test.js`. Il reste dans l'historique git, mais le catalogue n'est plus en ligne depuis le 20/07.
- Restés hors git, sur l'ancien PC : `docs/dump-bridge-recovery.txt`, prototypes `blockudoku-flow.html`, `meowdoku-proto.html`, `compare-*.html`, transcripts locaux, `config/orderix.<env>.local.json`. Le MCP Trello (`@delorenj/mcp-server-trello`) y était aussi configuré.
- Routine arrêtée volontairement par Wael le 18/07 à 20:20 UTC, après une collision avec une session terminal sur la même file d'issues. Réactivable.
- Compte Google Play : compte Organisation prévu car Wael est auto-entrepreneur (D-U-N-S à vérifier sur dnb.com, 25 $, e-mail Google dédié). Un compte personnel imposerait 12 testeurs pendant 14 jours et l'affichage de son adresse si l'app monétise.
- Calendrier : d'après `state.js`, le miroir se termine au jour 268 (25/09). Depuis le 26/09, le puzzle du jour devrait être vide, à prolonger si les tests reprennent.
- Jeton `ORDERIX_FEEDBACK_TOKEN` créé le 18/07 pour 90 jours : expiration probable vers le 16/10, à renouveler si les tests reprennent.
- Écarts visuels listés le 20/07, non traités : pas de mascotte ni d'illustration (le plus gros manque, demande un illustrateur ou des assets achetés), classement sans podium, sons peu variés.
- Synthèse complète : `Orderix-archive\historique-cloud.md`.
- Wael annonce un gros retravail du projet (05/11), périmètre à préciser. Les décisions de juin et juillet ci-dessus seront à réexaminer à cette occasion.

### 06/11 - Staging relancé
Wael a relancé `orderix-staging` depuis le dashboard ; `orderix-prod` reste en pause. Vérifié : le domaine résout, l'auth répond (200), `profiles`, `results` et `day_config` répondent (200). Le plan gratuit peut remettre le projet en pause s'il reste inactif.
`kitkat_votes` et `kitkat_players` n'existent toujours pas (404, PGRST205) : `supabase/extras/kitkat_family.sql` reste à exécuter une fois dans le SQL Editor. D'ici là, KitKat garde les avis en local sur chaque appareil.

### 06/11 - Playbook de refonte
Wael veut une app de niveau pro autour du jeu. Étude de deux apps de référence, sans le gameplay : enrobage de Blockudoku, outils de feedback et de debug de brawler. Résultat dans `docs/playbook-pro.md`, versionné à la demande de Wael.
- Priorité de Wael : une finition professionnelle, qui compte énormément. La recommandation de rester en WebView est retirée : la pile se choisira sur un prototype comparé, jugé sur téléphone, avant le reste de la refonte.
- Exigence pour la boucle de test, sur le modèle de brawler : un retour à voix haute, transcrit, qui emporte les dernières secondes de jeu.

### 11/11 - Outils installés sur le nouveau PC
- Node LTS (`C:\Dev\node`), JDK 17 Temurin (`C:\Dev\jdk-17`), SDK Android (`C:\Android\sdk` : plateforme et build-tools 34, émulateur, pilote AEHD, AVD `orderix_test` en API 34), Unity 6000.3.28f1 avec le module Android complet (`C:\Dev\Unity\Editor`), ffmpeg (winget). Variables `JAVA_HOME`, `ANDROID_HOME` et PATH utilisateur.
- Vérifié : `node smoke-test.js` passe, l'APK staging se construit (5,9 Mo). Dans le shell Bash de Claude Code, `npm run android:dev` échoue sur `gradlew` : lancer `.\gradlew.bat assembleDevDebug` depuis `android/` en PowerShell.
- Licence Unity : connexion de Wael à Unity Hub nécessaire.
- Étude de Blockudoku : l'émulateur ne le fait pas tourner (code ARM traduit, bloqué sur le consentement puis « ne répond pas »). Le film se fera sur téléphone.
- **Décision de Wael : Orderix passe en Unity natif.** Tous les gameplays actuels réécrits, finition professionnelle partout (menus, jeu, et surtout cadeaux et récompenses, jugés « faits avec les pieds »). Le prototype comparatif WebView/Unity est abandonné. Playbook mis à jour.
- Unity CLI 1.0.0-beta.17 installé (`%LOCALAPPDATA%\Unity\bin`), avec les skills Unity pour Claude (`~\.claude\skills`). Le paquet `com.unity.pipeline` permet de piloter l'éditeur depuis le terminal.
- Projet Unity créé : `C:\Github\MobileGames\OrderixUnity`, dépôt privé `Wael3rd/orderix-unity` (les assets achetés ne peuvent pas aller dans ce dépôt public). Unity 6000.3.28f1, URP 2D, licence Personal, relié à Unity Cloud (organisation HadjMouldi-Wael). Son `CLAUDE.md` décrit l'architecture et les commandes.
- Wael veut que Unity soit piloté sans fenêtre : éditeur en mode batch, commandé par le Unity CLI.
- Comptes joueurs anonymes pour l'instant ; Wael voudra ensuite la connexion Google.
- Première tranche verticale construite et vérifiée par captures : accueil, La Chaîne sur 3 manches, victoire, cadeau avec vol de pièces. Interface entièrement construite par le code (formes procédurales, animations, sons synthétisés). Identifiant Android provisoire `com.orderix.game`.
- Wael a validé la première tranche Unity sur son téléphone (REDMAGIC 10 Pro, Android 15) : « visuellement c'est super super bien ». Elle sert de barre de finition.
- **Ordre de portage décidé par Wael : les 31 gameplays de janvier d'abord.** Les 38 anciens modes ne sont pas portés pour l'instant ; ils seront triés ensuite, gardés ou abandonnés un par un.
- Installation sur le téléphone de Wael par USB (`adb install -r`) : l'installateur du téléphone refuse l'APK téléchargé (« problème lors de l'analyse du package »), cause inconnue, APK sain.
- **Cible : 50 gameplays** (demande de Wael, 11/11), en comptant les existants. Critère : des mécaniques « evergreen » liées de près ou de loin au classement. Les anciens modes sont gardés seulement s'ils répondent à ce critère. S'y ajoutent des genres éprouvés trouvés par recherche et des gameplays originaux. La qualité passe avant le nombre : « il faut que j'écrase la concurrence grâce à ça ».
- Les modes inspirés d'un jeu précis gardent la mécanique (un genre libre) mais prennent un nom et un habillage propres à Orderix.
- Catalogue des 50 gameplays proposé à Wael, en attente de son tri : `docs/gameplays-50.html` du dépôt `orderix-unity` (aussi publié en artefact privé). 30 de janvier (22 validés, 7 retours positifs, 1 à retester), 4 anciens gardés à refondre (Le Parcours, Le Rangement, Plus ou Moins, Tri Éclair), 8 genres éprouvés (Gratte-Ciel, Chevalet, Familles, Alvéoles, Carrés Tournants, Proverbe, Cellules, Suite Logique), 8 paris à prototyper (Crêpes, Tournoi, Écho, Anneaux, Saute-Mouton, Carillon, Mille-Feuille, Dictionnaire).
- Règles exactes des 30 modes de janvier relevées dans `docs/modes-janvier.md` du dépôt `orderix-unity` ; recherche de marché dans `docs/recherche-gameplays.md`.
- Idée de Wael à l'étude : « One game a day », un jeu différent chaque jour de l'année, pas forcément du tri. Liste de 365 mini-jeux en 16 familles, notés sur la qualité du gameplay et la simplicité d'approche : `docs/jeux-365.txt` et `docs/jeux-365.html` du dépôt `orderix-unity` (aussi publiée en artefact privé). Les notes sont un jugement sur papier, sans test. Aucune décision prise : le cap reste les 50 gameplays de classement.
- Lot 1 de janvier porté en Unity : Tri Cascade, L'Insertion, Le Métronome, Le Code, Mémo Croissant (6 modes jouables sur 30 avec La Chaîne). Chaque mode a sa règle pure testée (89 tests) et sa vue ; joués en automatique avec captures, pas encore vus par Wael sur téléphone. Barre de temps commune ajoutée à l'écran de jeu. Méthode : un agent par mode en parallèle à partir de `docs/portage-brief.md`, intégration et vérification par l'orchestrateur.
- Écart assumé sur L'Insertion : après une mauvaise place, la barre de temps repart à 8 s (dans la version web elle continuait).
- Verdict de Wael sur le lot 1, joué sur téléphone : Tri Cascade, L'Insertion, Le Code et Mémo Croissant sont OK. Le Métronome retiré : « le jeu est nul » (c'est le jeu lui-même, pas le portage ; il avait pourtant été validé en juillet). Il sort du programme Unity (jour 5 vide, à remplacer) et ne doit pas être reproposé tel quel. Le catalogue des 50 retombe à 49.
- Lot 2 de janvier porté en Unity : La Fontaine, Les Dominos, Paires Reliées, Fusion glissée (ex-2048), Le Taquin, Le Nonogramme. 10 modes jouables sur 29 (172 tests de règles). Joués en automatique jusqu'à l'écran de fin, pas encore vus par Wael sur téléphone. Écarts assumés : Paires Reliées détecte le blocage (défaite « Plus aucun chemin possible », la version web ne le détectait pas) ; Fusion glissée se joue au glissement seul, sans flèches ; Le Nonogramme accepte le glisser sur plusieurs cases.
- Proposition en attente de réponse pour le 50e gameplay, à la place du Métronome : « Les Étagères » (réunir trois objets identiques sur une étagère, rangées cachées derrière).
- Lot 3 de janvier porté en Unity : Les Tubes, Le Tri Minimal, Le Mahjong, Plus Petit Plus Grand, Chronologie, L'Embouteillage. 16 modes jouables sur 29 (267 tests de règles), joués en automatique jusqu'à la victoire, pas encore vus par Wael. Glisser-déposer commun écrit une fois pour tous les modes (`Assets/Orderix/UI/ReorderList.cs`) : l'objet reste sous le doigt, suit dès le premier pixel, les autres s'écartent en direct. Écarts assumés : Le Mahjong s'arrête sur une défaite quand plus aucune paire n'est possible même après mélange (la version web tournait en rond) ; Plus Petit Plus Grand se saisit par un pavé 1 à 4 en plus du cycle au toucher.
- À vérifier : la spec annonçait 24, 25 et 28 manoeuvres minimales pour les 3 niveaux de L'Embouteillage ; le solveur Unity trouve 11, 13 et 12 gestes sur les mêmes données. Écart de comptage probable (case par case contre geste), non élucidé.
- Lot 4 de janvier porté en Unity, ce qui termine le programme : Les Boulons, La Tour, La Balance, L'Ordre Caché, Triple Suite, Fusion, Le Solitaire, Blocs, La Grille, Les Indices, Les Suites, Photo de Classe. Les 29 modes de janvier sont jouables dans Unity (473 tests de règles) ; correction : le lot 3 avait porté le total à 17 modes, pas 16. Seuls les lots 1 et 2 ont été vus par Wael sur téléphone (lot 1 validé sauf Le Métronome, lot 2 sans verdict). Socle commun ajouté : carte à jouer unique (`CardFace`), 8 personnages en relief.
- Écarts assumés du lot 4, à juger par Wael : La Balance et Photo de Classe se valident d'un bouton après avoir composé l'ordre (une vie par validation fausse, au lieu d'une vie par mauvais toucher) ; Photo de Classe s'échange par deux touchers ; L'Ordre Caché se range par glisser-déposer ; Fusion ajoute une défaite quand plus aucune chaîne n'est possible ; Les Indices n'affichent quels indices sont respectés qu'après une validation fausse ; Blocs n'a plus le toucher-toucher de secours. Fusion : le pilotage automatique ne gagne qu'environ une partie sur cinq, difficulté à vérifier.
- Retour vocal demandé par Wael (modèle : le système de l'application de référence « brawler ») : dans les versions de développement, un bouton micro flottant et déplaçable sur tous les écrans ; on le maintient, le jeu se met en pause, on parle, on relâche. Chaque note garde la voix, une capture, le mode, la graine, l'état et les 45 dernières secondes d'actions (`Assets/Orderix/App/ReportTool.cs`). Les notes restent sur le téléphone et sont récupérées par USB puis transcrites sur le PC par `python Tools/retours/recuperer.py` (dépôt `orderix-unity`), qui tient le suivi `retours/retours.json` (statuts). La voix reste hors de git, dans `Orderix-archive/retours/brut`. Transcription locale : Whisper large-v3-turbo par onnxruntime, car Smart App Control (laissé allumé) bloque faster-whisper. Pas encore validé sur la vraie voix de Wael ; pas encore d'envoi par internet ni de liste des notes dans l'application.
- Mise à jour en ligne demandée par Wael : hébergement choisi par lui = dépôt GitHub public `Wael3rd/orderix-builds`, qui ne contient que les APK de test et l'annonce `latest.json` (release `dev-latest`). L'application lit l'annonce au lancement, télécharge, vérifie taille et SHA-256, puis passe par l'installateur d'Android (`AppUpdater.cs`, module `Assets/Plugins/Android/OrderixUpdate.androidlib`). Publication : `AgentScripts/publier.sh "notes" [--usb]`, qui incrémente le numéro de version (0.1.N). À publier depuis ce PC uniquement tant qu'il n'y a pas de clé de signature propre au projet : la clé de test est celle de la machine.
- Notes vocales en ligne (demande de Wael après avoir perdu une note en désinstallant l'application : le premier jet les gardait en local). Les notes partent sur Supabase staging par des fonctions `rpc` (SQL : `Tools/retours/supabase.sql` du dépôt `orderix-unity`, collé par Wael dans le tableau de bord ; tables fermées, clé privée de l'outil sur le PC dans `Orderix-archive/secrets`, jamais dans git). Elles sont rattachées à l'identifiant de l'appareil et survivent à une réinstallation. Chaîne validée sur de vraies notes : la transcription locale (Whisper large-v3-turbo par onnxruntime) est bonne sur la voix de Wael.
- Parcours d'une note voulu par Wael : après la dictée, un écran de relecture montre la capture et le texte transcrit, avec « Envoyer » ou « Annuler » ; un petit bouton sous le micro ouvre « Mes notes » (texte, statut, réponse, vignette). Pour avoir le texte tout de suite, une veille tourne sur le PC (`python Tools/retours/veille.py`) et transcrit chaque note en 7 à 10 secondes ; elle prend environ 2,3 Go de mémoire quand le modèle est chargé et le décharge après 3 minutes sans note. Sans la veille (PC éteint), la note part quand même et le texte arrive plus tard. Statuts : nouveau, compris, en cours, corrigé, vérifié, écarté (`Tools/retours/envoyer.py` les pousse vers l'application ; page de suivi générée par `page.py`).
- Première note traitée : « le titre Bonsoir doit être plus bas, mieux centré verticalement » ; corrigé (titre centré entre le bandeau et la carte du jour, selon la hauteur de l'écran). Versions publiées en ligne jusqu'à 0.1.6. La publication de la 0.1.5 avait été interrompue par un manque de mémoire du PC : `publier.sh --envoi-seul` reprend après une interruption.
- Deux fichiers sur le bureau du PC, demandés par Wael : « Orderix - Démarrer la veille » (refuse d'en lancer une seconde) et « Orderix - Arrêter la veille ». La veille ne dépend plus d'une session Claude.
- Wael ne veut plus coller lui-même le réglage Supabase à chaque évolution. `Tools/retours/appliquer_sql.py` applique le SQL directement sur la base (connexion Postgres chiffrée et vérifiée, une transaction, tout ou rien). Il faut un branchement unique : le fichier du bureau « Orderix - Brancher Supabase » demande le mot de passe de la base et le range dans `Orderix-archive/secrets/supabase-db.txt` (jamais dans git, jamais dans une conversation). Choix : le mot de passe de la base plutôt qu'un jeton de compte Supabase, parce qu'il ne donne accès qu'à ce projet. Tant que le branchement n'est pas fait, la mise à jour reste manuelle. Le réglage v2 est bien en place sur le serveur (vérifié : annulation et vignettes répondent).

### 12/11/2026 (nuit) : six notes vocales traitées pendant que Wael dort, version 0.1.7

Wael a installé la 0.1.6, dicté six notes, puis demandé : « j'aimerais que tu t'occupes de chaque retour pendant que je vais dormir ». Tout est dans `OrderixUnity`, publié en 0.1.7.

- **Accueil** (note 03) : la date revient en haut sous le bandeau ; le salut reste centré entre le bandeau et la carte.
- **Nonogramme** (note 04) : grille 5 x 5 au lieu de 6 x 6, jugée trop dure.
- **Parcours par gameplay** (note 06, « une progression qui dure vraiment dans le temps ») : chaque victoire dans un gameplay fait monter d'un niveau ; huit rangs de plus en plus longs (Découverte, Bronze, Argent, Or, Rubis, Saphir, Diamant, Légende à 250 victoires). Le calendrier montre le niveau et une barre sur chaque case ; une partie lancée du calendrier est une partie de parcours (carte de présentation avec le niveau et le rang, « Niveau suivant » après une victoire, petite récompense, pas de cadeau à ouvrir). Seul le puzzle du jour compte pour la série. Choix à revoir avec Wael : la difficulté ne monte pas encore avec le niveau (les modes ne prennent qu'une graine) ; les seuils des rangs sont une première proposition.
- **Publicité** (même note : « l'endroit où je puisse commencer à mettre de la pub ») : rien n'est branché. Emplacement retenu : entre deux niveaux d'un parcours (bouton « Niveau suivant »). Il faut un compte de régie pour aller plus loin.
- **Aperçus animés** (note 07) : Wael a adoré la petite animation de La Chaîne sur la carte du jour et en veut une par gameplay. Les 28 autres existent (`Assets/Orderix/App/Previews`, une classe `ModePreview` par gameplay, brief dans `docs/apercus-brief.md`). Elles sont montrées sur la carte du jour et en tête de la carte de présentation de chaque partie. `AgentScripts/galerie.sh` les affiche toutes sur une planche. Pas encore jugées par Wael.
- **Notes vocales** (notes 08 et 09) : le texte se corrige au clavier pendant la relecture ; dans « Mes notes », chaque note a « Modifier », « Commenter », « C'est corrigé » / « Pas encore » après une correction, et « Corriger maintenant ». Ce dernier bouton, avec une consigne facultative, fait lancer par la veille du PC une session Claude Code sans fenêtre qui traite la note, publie et répond (`Tools/retours/travail.py`). Garde-fous : seuls les appareils de `Orderix-archive/retours/appareils-autorises.txt` (le téléphone de Wael) déclenchent un travail, une session à la fois, 90 minutes au plus ; supprimer ce fichier coupe le lancement.
- **Serveur** : ces boutons demandent la version 3 du réglage Supabase (`Tools/retours/supabase.sql`, testée sur un Postgres local avant envoi). Wael l'a collée lui-même dans la nuit depuis la page de réglage (vérifié : les fonctions répondent). Le branchement qui me permettrait de l'appliquer seul (`Orderix - Brancher Supabase` sur le bureau) n'est toujours pas fait.
- Corrigé au passage : le titre de chaque carte de « Mes notes » était invisible (cadre de texte trop bas).
- Non vérifié sur téléphone : le clavier Android dans la relecture et les feuilles de saisie (vérifié seulement dans l'éditeur), et toute la chaîne « Corriger maintenant » de bout en bout (chaque maillon est testé séparément).

### 12/11/2026 (fin de nuit) : neuf notes de plus, version 0.1.8

Wael a dicté neuf autres notes avant de dormir et collé lui-même la version 3 du réglage Supabase.

- **Les Tubes** (note 10, « un tout petit peu trop dur ») : mélange de départ ramené de 70-90 à 52-68 coups inverses.
- **Le Tri Minimal** (notes 12, 14, 15, 16) : deux déplacements de marge au lieu du minimum exact (le minimum reste la performance à trois étoiles) ; bouton « Annuler » sans limite ; mise en page aérée et centrée dans la hauteur de l'écran ; après une défaite, la correction se joue lentement (« Voici le bon ordre », tuiles fautives en rouge, puis une à une vers leur place).
- **Bouton de test « Solution : 1 étape »** (note 13) : dans les versions de test, chaque appui joue un coup juste, dans les 29 gameplays (c'est le pilote automatique `DebugStep`). Wael le veut « uniquement pour nous ». C'est aussi la mécanique toute prête d'un indice payant.
- **Calendrier** (note 11) : pastilles par gameplay dans les versions de test, orange pour les notes à traiter, verte pour les corrections à tester.
- **Écran de victoire** (note 17) : le nom du gameplay réussi est rappelé sous le titre.
- **Méta** (note 18 : « les pièces ne servent à rien, les niveaux non plus, le profil je ne peux pas y accéder, je veux une méta bien solide, de la rétention ») : l'onglet Profil s'ouvre maintenant (`ProfileScreen` : niveau, séries, totaux, parcours de chaque gameplay). Le reste est une proposition qui attend ses décisions, publiée en page privée : https://claude.ai/artifact/7nc7Ax4zeVZMYTN8ct5pBQ (indice, seconde chance et joker de série payés en pièces ; cadeau de la semaine ; quêtes et défi hebdomadaire ; gameplays débloqués par le niveau ; publicité entre deux niveaux et publicité choisie ; album). Rien de cela n'est codé. La note reste au statut « compris ».

### 12/11/2026, 3 h 15 à 7 h 15 : la méta, plage de travail autonome

Cap fixé par Wael avant de dormir : rétention sur deux ans ; s'appuyer sur les ressorts profonds des jeux de casino qui font revenir et rejouer (« la psychologie pour le one more »), sans jeu d'argent et sans rien de tape-à-l'œil (« du game design subtil et profond ») ; viser de longues sessions quotidiennes pour placer de la publicité dans le jeu libre ; le profil de la 0.1.8 est trop pauvre et « il manque plein de trucs de méta » ; « notre magnum opus ». Quatre heures en autonomie, aucune question. Deux ajouts de dernière minute : une icône pour l'application, et ne plus tout réinstaller à chaque mise à jour.

Limites que je me suis fixées (mon interprétation de « pas de jeu d'argent ») : aucun hasard payant, chances affichées et jamais ajustées selon la joueuse, pas de faux « presque gagné », rien n'est perdu d'un coup (série, élan, échelle du cadeau redescendent au lieu de repartir de zéro).

Ce qui a été construit (dépôt `orderix-unity`, conception dans `docs/meta-design.md`, recherches dans `docs/recherche-meta-*.md`) :

- **Cœur de la méta**, en règles pures et testées (`Assets/Orderix/Core/Meta`) : l'élan (victoires d'affilée, multiplicateur de pièces de ×1 à ×3, une défaite fait redescendre de trois marches), le coffre à étoiles (10 étoiles, contenu variable, chances publiées), l'album de 81 vignettes en 9 séries (trois raretés, doublons changés en poussière, vignette au choix contre poussière, garantie après quatre doublons), le cadeau du jour (une boîte parmi trois sur une échelle de sept jours, contenu fixé avant le choix et montré après), un petit coffre toutes les 4 heures, trois quêtes par jour et leur prime, quatre paliers par semaine, une saison de 30 paliers par mois, la tournée du jour (cinq gameplays, un coffre au bout), 14 succès à paliers, six statuts, le niveau du joueur (+8 % par niveau), le joker de série. Tous les nombres sont dans `MetaConfig.cs`.
- **Écrans** : accueil refait (rendez-vous, saison, onglets Jour / Parcours / Album / Profil), écran de résultat refait autour du « encore une » (élan, coffre, rang, quêtes, bouton suivant actif en une demi-seconde), ouverture de coffre, profil complet (statut, vitrine, chiffres, succès, parcours), album, saison, boutique (indices, joker, avatars de 200 à 25 000 pièces), calendrier des puzzles du jour (mois à compléter, jours à rattraper sans effet sur la série, un trophée par mois complet).
- **En partie** : bouton « Indice » pour toutes les joueuses (réserve d'indices, achat à 30 pièces), pastille d'élan, un indice offert après deux défaites d'affilée dans un gameplay. Le bouton de test « Solution : 1 étape » reste dans les versions de test.
- **Publicité** : aucune régie, mais la façade `Ads` et ses placements sont posés (jamais au lancement ni sur le puzzle du jour ; plein écran seulement après le résultat d'une partie de parcours, pas pendant les cinq premières, une sur trois au plus, six par jour ; publicités choisies : garder son élan, un indice, une boîte de plus, des pièces). Les versions de test montrent une publicité simulée.
- **Mesures** : un compteur par jour et par appareil (sessions, temps, parties, victoires, coffres, publicités), `python Tools/meta/mesures.py` en tire la rétention J1 à J90 et la durée des sessions. À inscrire dans la notice de confidentialité avant toute sortie publique.
- **Sauvegarde en ligne** de la progression, par appareil, reprise après une réinstallation.
- **Rappels** : une notification locale par jour au plus, à l'heure habituelle de jeu, et une après trois jours d'absence ; la question n'est posée qu'une fois, après un puzzle du jour réussi et une série commencée.
- **Mises à jour sans tout réinstaller** : les nombres de la méta se changent par un fichier en ligne (`Tools/meta/reglages.json`, `AgentScripts/regler.sh`, lu par `RemoteConfig`), sans fabriquer ni installer de version. Le code, lui, demande toujours une nouvelle version ; seule une distribution par magasin d'applications apporte les mises à jour par différences.
- **Icône** de l'application (trois barres en escalier, la dernière verte avec une coche ; `Tools/icone/dessiner.py`).
- **Gameplays** : onze nouveaux, qui remplissent les jours 5 et 15 et ouvrent la suite du programme : Les Crêpes (5), Les Gratte-Ciel (15), Les Carrés Tournants (32), Saute-Mouton (33), Le Tournoi (34), Le Mille-Feuille (35), La Suite Logique (36), Le Proverbe (37, 137 proverbes), Les Anneaux (38), Tri Éclair (39), Le Chevalet (40). Tous écrits sans version précédente, à partir du catalogue des 50 ; chacun a sa règle testée, son aperçu animé, et se gagne en pilote automatique. Aucun n'a été joué par un humain. L'écran des parcours défile et grandit avec le catalogue (40 gameplays jouables).
- **Serveur** : version 4 du réglage Supabase (sauvegarde et mesures), testée sur un Postgres local, PAS encore appliquée : tant qu'elle ne l'est pas, sauvegarde en ligne et mesures restent muettes sans gêner le jeu.
- **Économie dimensionnée par simulation** (`docs/meta-economie-simulation.md`, `Assets/Orderix/Editor/MetaSim.cs` sur le vrai code, réplique `Tools/meta/simuler.py`) : trois profils joués 730 jours. Mes premières valeurs étaient beaucoup trop généreuses (album fini en 35 jours, 900 000 pièces sans rien à acheter pour la joueuse régulière). Valeurs retenues : gain par partie divisé par deux, coffre à 20 étoiles (le premier pré-rempli de 12), vignettes plus rares, forge à 800 de poussière, saison à 140 points par palier, niveau à +3,5 % par niveau, statuts plus lents, boutique de 53 avatars de 200 à 100 000 pièces. Résultat pour la régulière (12 parties par jour, 6 jours sur 7) : 850 pièces par jour, premier album en 3 mois, saison finie 95 % des mois après 22 jours joués, niveau 118 et 52 000 pièces en poche au bout de deux ans. Ces profils sont des hypothèses, pas des joueuses.
- **Trois albums** (243 vignettes, icônes Fluent Emoji de Microsoft, licence MIT, `docs/album-icones.md`) : l'album suivant commence quand le précédent est complet et encaissé ; la poussière est gardée jusqu'à 800. Pour tenir deux ans au rythme de la régulière, il faut un nouvel album tous les quatre mois environ (`Tools/meta/albums.json` puis `python Tools/meta/albums.py`).
- **Revue de code indépendante** (`docs/revue-meta.md`) : douze défauts réels, tous corrigés. Les trois graves : le bouton retour pendant la fin d'une partie effaçait la partie ; la sauvegarde en ligne pouvait écraser une vraie progression après une réinstallation hors réseau (elle n'envoie plus rien tant que le serveur n'a pas été lu) ; un réglage à distance mal rempli pouvait casser le jeu à chaque lancement (le fichier entier est maintenant refusé à la première incohérence, et les réglages de structure sont verrouillés). Aussi : les gains d'un coffre sont acquis à l'ouverture et non au bouton « Continuer » ; reculer la date du téléphone ne redonne plus ni cadeau ni quêtes ; les tournées sont plafonnées à trois par jour ; les paliers de semaine et de saison atteints mais non encaissés sont convertis en pièces au changement de période.
- Versions publiées dans la nuit : 0.1.9 (la méta) puis 0.1.10 (économie corrigée, albums, correctifs de la revue, 40 gameplays). Compte rendu illustré, privé : https://claude.ai/artifact/7nc7Ax4zeVZMYTN8ct5pBQ
- **Suite de la nuit du 12/11 (jusqu'à 7 h 15), version 0.1.12 (après 0.1.11)** :
  - **Seconde revue de code indépendante**, limitée à mes corrections de la première : onze défauts de plus, tous corrigés et testés (`docs/revue-meta.md`, section « Seconde revue » et ses suites). Les deux qui comptaient : après une réinstallation, une copie locale plus ancienne (restaurée par le téléphone) pouvait écraser la sauvegarde en ligne, donc désormais la sauvegarde la plus avancée gagne à chaque lecture, et jamais au milieu d'une partie ; une horloge avancée puis remise à l'heure gelait le cadeau, les quêtes, la tournée et la saison jusqu'à ce que le vrai calendrier rattrape la date, donc l'heure du serveur fait foi dès qu'il a répondu (`Clock`, `MetaEngine.Rewind`). Aussi : les quêtes accomplies et pas encaissées sont payées au changement de jour ; un joker obtenu le jour même sauve encore la série ; le solde affiché ne saute plus quand deux gains animés se chevauchent ; trois réglages à distance nuisibles sont refusés.
  - **Gameplays** : 49 jouables. Ajoutés depuis l'entrée précédente : Les Familles (41, 71 familles de mots écrites à la main), Le Dictionnaire (42), L'Écho (43), Le Sentier (44 ; au catalogue il s'appelait « Le Parcours », renommé pour ne pas se confondre avec l'onglet Parcours), Plus ou Moins (45), Le Carillon (46), Le Rangement (47), Les Cellules (48, la réussite à cases libres, chaque donne vérifiée gagnable par un solveur), Les Alvéoles (49, piles de jetons à regrouper par couleur sur un plateau en nid d'abeille). Aucun n'a été joué par un humain.
  - **Le Métronome n'est pas revenu** : je l'avais relancé par erreur depuis le catalogue des 50 ; le rédacteur a relevé la consigne du propriétaire du 11/11 dans `ModeView.cs` (« ne pas le reproposer »), la livraison a été jetée sans être intégrée.
  - **Essai en série** : `AgentScripts/tous_les_modes.sh` joue chaque gameplay une fois en pilote automatique. Tous se gagnent sauf Fusion, que le pilote perd parce qu'il joue le premier coup possible et non le meilleur (code inchangé depuis le lot 4).
  - **Premier lancement d'une joueuse neuve** rejoué de bout en bout dans l'éditeur (accueil, première partie, résultat, profil, album) : rien à signaler.
  - **Non fait, à décider** : déblocage progressif des gameplays (46 et plus ouverts d'un coup, c'est beaucoup pour une nouvelle venue, mais les verrouiller gênerait les essais du propriétaire) ; régie publicitaire et consentement ; piste de test interne du magasin pour des mises à jour par différences ; version 4 du serveur toujours pas appliquée (sauvegarde en ligne et mesures inactives en attendant).
  - **Fusion, mesure sans changement** : en visant la tuile 8, un joueur automatique soigneux (qui évalue chaque coup sur plusieurs tirages) gagne 136 parties sur 400 ; il atteint la tuile 7 dans 329. Le conseil intégré (la chaîne qui donne la plus grande tuile) gagne 91 sur 400. La série de jours dépendant d'une victoire au puzzle du jour, l'objectif 7 est proposé au propriétaire ; rien n'a été modifié.
  - **Fin de la plage (6 h 10 à 7 h 15)** : quatre gameplays originaux de plus, hors catalogue des 50, intégrés et testés (53 jouables, 1238 tests au vert) : Le Dégradé (50, remettre un dégradé de couleurs en ordre, sans chrono), L'Aiguillage (51, former un train avec des voies de garage, chaque puzzle vérifié résoluble), L'Égalité (52, placer les nombres dans une égalité à trous), L'Anagramme (53, 490 mots et 228 anagrammes acceptées).
  - **La version 0.1.13 n'est pas publiée.** Sa commande de fabrication et d'envoi a été arrêtée par Claude Code à 6 h 10, parce que le PC manquait de mémoire (2,5 Go libres ; l'éditeur Unity et Gradle en occupaient plus de 5). Consigne permanente du propriétaire : ne pas relancer de moi-même une commande arrêtée pour cette raison. La version en ligne reste donc la **0.1.12** (49 gameplays, toutes les corrections des deux revues). L'éditeur, lui, a terminé l'APK de la 0.1.13 de son côté (`Builds/Orderix-dev.apk`, 61,3 Mo, 6 h 14, fabrication réussie) : il ne reste qu'à l'envoyer, avec `bash AgentScripts/publier.sh "notes" --envoi-seul`, quand le propriétaire le demande.
  - **Outil** : `AgentScripts/tous_les_modes.sh [victoires]` rate L'Aiguillage en pilote accéléré (son verrou d'animation suit l'horloge réelle) ; le jouer avec une pause réelle entre les coups, il se gagne.
  - **Troisième revue (6 h 20 à 6 h 45), étroite, sur mes corrections de la seconde** : huit défauts de plus, corrigés et testés (1240 tests au vert, `docs/revue-meta.md`). Le sérieux : ma remise à l'heure par le serveur ouvrait une faille (horloge avancée hors ligne, puis retour en ligne, et le cadeau et le petit coffre se reprenaient à volonté). Désormais l'écart avec le serveur est gardé d'un lancement à l'autre, et la méta n'est ramenée à l'heure qu'une fois par semaine. Les autres : compteur de pièces qui sautait après un coffre regardé plus de quatre secondes, pièces figées à l'écran si la progression était reprise du serveur pendant un vol, rappel qui annonçait une série rompue.
  - **Conséquence pour les versions** : la 0.1.12 en ligne et le fichier de la 0.1.13 déjà fabriqué contiennent encore ces huit défauts (aucun ne fait perdre de progression). Le code du dépôt (`orderix-unity`, commit « Troisieme revue ») les corrige : la prochaine publication doit être une nouvelle fabrication (elle portera le numéro 0.1.14), pas l'envoi du fichier 0.1.13. Leçon : trois relectures de suite ont trouvé des régressions dans des corrections faites vite sur l'heure et la sauvegarde ; ces deux sujets méritent une relecture avant chaque publication.
  - **Rectification (6 h 45) : la 0.1.13 EST publiée.** Les deux lignes ci-dessus qui disent le contraire sont fausses. Claude Code a bien annoncé à 6 h 10 l'arrêt de la commande faute de mémoire, mais le script `publier.sh` a continué seul : fabrication réussie à 6 h 14, envoi à 6 h 15 (`Orderix-0.1.13.apk`, 61 338 107 octets, annonce `latest.json` à jour, vérifiés en ligne). Je ne l'ai pas relancé ; je l'ai cru arrêté sans vérifier en ligne, et je l'ai écrit. État réel : **en ligne, la 0.1.13** (53 gameplays, corrections des deux premières revues) ; **dans le code seulement**, les huit corrections de la troisième revue, à publier dans une 0.1.14 quand le propriétaire le demande (nouvelle fabrication). Leçon : lire `latest.json` en ligne avant d'écrire qu'une version n'est pas publiée.
  - **Quatrième revue (6 h 47 à 7 h), sur les corrections de la troisième** : six défauts, dont deux régressions que je venais d'introduire. Garder l'écart d'horloge d'un lancement à l'autre pouvait dater une partie de la veille et coûter sa série à une joueuse honnête : retiré, l'écart ne vaut plus que pour le lancement en cours. Corrigés aussi : accueil resté sur le mauvais jour après la réponse du serveur, rappel du lendemain qui annonçait une série rompue. Laissé ouvert en connaissance de cause : avancer l'horloge jour après jour hors ligne puis revenir une fois en ligne garde ce qui a été pris (tricherie patiente, rien n'est partagé entre joueuses). Bilan des quatre revues : 37 défauts trouvés, 36 corrigés, 1240 tests au vert. Les corrections des revues trois et quatre sont dans le code (`orderix-unity`, commit « Quatrieme revue »), pas dans la 0.1.13 en ligne : elles partiront dans la 0.1.14, à fabriquer quand le propriétaire le demande.
  - **Cinquième revue (7 h à 7 h 10)**, sur la correction de la quatrième : avis « à corriger avant de publier ». J'avais figé l'écart d'horloge à la première réponse du serveur ; une joueuse qui remettait son téléphone à l'heure pendant que le jeu restait en arrière-plan se retrouvait deux jours en arrière jusqu'à la fermeture du jeu. Corrigé (l'écart est remesuré à chaque réponse), 1240 tests au vert, mais cette dernière correction n'a pas été relue. **Avant de publier la 0.1.14 : faire relire le dernier commit de `orderix-unity` (« Cinquieme revue »), et corriger C2** (`docs/revue-meta.md`). Bilan : cinq revues, 39 défauts trouvés, 37 corrigés, 2 ouverts (tricherie patiente à l'horloge ; question des rappels perdue dans un cas très rare). Constat à retenir : cinq fois de suite, une correction faite vite sur l'heure du jeu a créé un nouveau défaut. Ce sujet ne se corrige plus sans relecture indépendante, et la piste propre est une horloge indépendante de l'heure réglée sur le téléphone.
  - **0.1.14 publiée à la demande du propriétaire (12/11, vers 8 h)** : « Déploie la dernière ». Avant l'envoi, sixième relecture étroite de la correction de l'heure (avis « publiable en l'état », une retouche bénigne appliquée) et correction du défaut des rappels. La 0.1.14 contient donc toutes les corrections des six relectures (41 défauts trouvés, 40 corrigés ; reste ouverte la tricherie patiente à l'horloge hors ligne), les 53 gameplays et la méta. 1240 tests au vert. Fichier vérifié en ligne : 61 343 715 octets. Reste à faire côté propriétaire : version 4 du serveur, décision sur l'objectif de Fusion.

### 12/11/2026, 8 h 20 à 8 h 40 : note 21 par « Corriger maintenant », version 0.1.15

Première demande « Corriger maintenant » traitée de bout en bout par une session sans fenêtre (note 21, dictée sur l'écran Parcours).

- **Demande** : après avoir validé des corrections dans « Mes notes », les pastilles du Parcours (notes à traiter, corrections à tester) ne changeaient qu'après un aller-retour par l'accueil. Wael les veut à jour dès la fermeture de la fenêtre.
- **Correction** (`ReportSync.cs`, `CalendarScreen.cs`) : le calendrier ne lit plus le décompte une seule fois à l'ouverture, il s'abonne à `ReportSync.SummaryChanged`. Le décompte est republié à chaque liste reçue du serveur (donc après chaque « C'est corrigé » / « Pas encore »), à la fermeture de « Mes notes », et quand une réponse du serveur arrive après la fermeture. Les pastilles ne sont redessinées que si le décompte a changé ; le dernier décompte connu s'affiche aussi tout de suite en rouvrant le Parcours.
- **Vérifié** : 1240 tests au vert ; en Play Mode, quatre pastilles, puis deux, puis aucune (légende retirée) à chaque fermeture de la fenêtre, avec des listes fournies à la main. Non vérifié sur téléphone avec le vrai serveur : la note est « corrigé », à confirmer par Wael.
- **0.1.15 publiée** (61 347 971 octets, annonce `latest.json` vérifiée en ligne). Les notes 20 (accueil, « bonjour ») et 22 (vibrations trop nombreuses), reçues dans le même relevé, restent « nouveau » : elles n'ont pas été demandées.

### 12/11/2026, 8 h 33 à 8 h 55 : note 22 par « Corriger maintenant », version 0.1.16

Note 22, dictée sur l'écran Parcours, « commentaire général » : il y a trop de vibrations, et un appui puis son relâchement donnent « deux vibrations d'affilée, pas super propre ».

- **Cause** : un même geste vibrait deux fois. Les boutons vibraient à l'appui, puis leur action vibrait au relâchement ; une tuile à glisser (Le Tri Minimal) vibrait à la prise, à chaque cran et encore à la pose ; le bouton micro vibrait au début de la dictée puis au relâchement ; l'atterrissage d'une pièce revibrait juste après le coup. Toucher une tuile du Parcours pour faire défiler vibrait aussi.
- **Règle retenue : un geste, une vibration** (`Assets/Orderix/Core/HapticGate.cs`, par où passent maintenant les 326 appels à `Haptics.Play`). Un geste va de la pose du doigt jusqu'à 0,4 s après son relâchement et ne laisse passer que sa première vibration de toucher ; deux vibrations de toucher ne se suivent jamais à moins de 0,15 s ; seul un résultat (réussite, refus, échec) s'ajoute au geste, sans se répéter à moins de 0,3 s.
- **Aux sources** : `UIButton` et `Tappable` ne vibrent plus à l'appui mais au clic, une seule fois (la vibration de l'action si elle en joue une, sinon celle du bouton), donc plus rien quand on fait défiler ; `ReorderList` ne vibre plus aux crans ni à la pose ; le micro ne vibre plus au relâchement. Les sons n'ont pas changé, ni la forme des vibrations (réussite et refus restent des doubles impulsions voulues).
- **Vérifié** : 1251 tests au vert (11 nouveaux sur le filtre) ; en Play Mode, en comptant les vibrations avec des doigts simulés : tuile du Parcours 1 (au clic), défilement 0, Tri Minimal 1 à la prise puis 0 au glissement et à la pose, « Annuler » 1. **Pas ressenti sur un téléphone** : c'est un réglage de sensation, la note est « corrigé », à confirmer par Wael. Les gameplays qui gèrent eux-mêmes le doigt (Blocs, Fusion, Les Anneaux, Le Solitaire...) ne sont couverts que par le filtre, pas relus un par un.
- **0.1.16 publiée** (61 350 927 octets, annonce `latest.json` vérifiée en ligne). Les notes 23 à 28 (hors 25), reçues dans le même relevé, restent « nouveau » : elles n'ont pas été demandées. Si les vibrations restent trop présentes, les leviers sont les trois durées en tête de `HapticGate.cs`.

### 12/11/2026, 8 h 47 à 8 h 52 : note 26 par « Corriger maintenant », version 0.1.17

Note 26, dictée depuis la fenêtre « Mes notes » : en maintenant le micro alors que « Mes notes » est ouverte, « je ne vois rien du tout, je ne vois pas le truc d'enregistrement ».

- **Cause** : l'écran de dictée (« Je vous écoute », chrono, zone « Glissez jusqu'ici pour annuler ») se rangeait tout au fond de la couche des retours, donc derrière la fenêtre « Mes notes ». La dictée fonctionnait, mais à l'aveugle.
- **Correction** (`ReportTool.cs`, `BuildOverlay`, une ligne) : l'écran de dictée se place juste sous le bouton micro, donc par-dessus « Mes notes ». Hors de cette fenêtre, rien ne change.
- **Vérifié** : 1251 tests au vert ; en Play Mode, « Mes notes » ouverte puis écran de dictée affiché par-dessus, bouton micro toujours au-dessus (capture `Screenshots/note26_2dictee`). Ce PC n'a pas de micro : l'écran de dictée a été ouvert à la main, pas par un vrai appui maintenu. La note est « corrigé », à confirmer par Wael sur son téléphone.
- **0.1.17 publiée** (61 351 807 octets, annonce `latest.json` vérifiée en ligne). La note 29 (sous-catégories en haut de « Mes notes »), reçue dans le même relevé, reste « nouveau » : elle n'a pas été demandée.

### 12/11/2026, 8 h 51 à 9 h 10 : note 27 par « Corriger maintenant », version 0.1.18

Note 27, dictée depuis « Mes notes » : le titre d'une note ne doit plus être « juste là où je suis », mais un titre simple déduit du message, avec le lieu entre crochets ; et le lieu doit être le vrai (« par exemple, je suis sur mes notes »), pas seulement le jeu qui est dessous.

- **Décision : le champ `resume` d'une note est désormais son titre** (quelques mots, sans le lieu). Aucun changement côté serveur : `resume` et `ecran` existaient déjà. Une version 5 du réglage Supabase a été écrite puis abandonnée, parce que le branchement « Orderix - Brancher Supabase » n'est toujours pas fait et que rien ne l'exigeait.
- **Titre** (`Tools/retours/titres.py`) : la veille le déduit juste après la transcription, par Claude Code sans fenêtre et sans aucun outil (modèle `claude-haiku-5-5`, 2 à 3 s, texte de la note passé comme une donnée). Réservé aux appareils autorisés ; sinon, ou si Claude Code ne répond pas, les premiers mots de la note. `recuperer.py` rattrape les notes ouvertes restées sans titre. La consigne des sessions « Corriger maintenant » dit maintenant de ne réécrire `resume` que s'il est absent ou faux.
- **Lieu** (`Assets/Orderix/Core/ReportPlace.cs`, `ReportTool.Snapshot`) : `meta.screen` devient la fenêtre ouverte par-dessus quand il y en a une (`ReportNotes` pour « Mes notes », `RewardOverlay` pour un coffre, une feuille de l'accueil), sinon l'écran ; `meta.under` garde l'écran dessous, `meta.place` le nom lisible. Vaut pour les notes dictées à partir de la 0.1.18 : les plus anciennes gardent l'écran qui était dessous (« Résultat, Le Tri Minimal »).
- **Affichage** (`ReportSync.cs`) : en tête de carte le titre, sur plusieurs lignes s'il le faut, puis « [Lieu] · date · durée ». Sans titre (note toute fraîche), le lieu en tient lieu comme avant. « Calendrier » s'appelle enfin « Parcours », comme l'écran.
- **Notes existantes** : titres écrits à la main pour les six notes sans titre (20, 23, 24, 27, 28, 29) ; les résumés des notes 21, 22 et 26 raccourcis en titres (jusqu'à 158 caractères, ils auraient pris six lignes en tête de carte). Statuts inchangés, rien d'autre touché.
- **Vérifié** : 1256 tests au vert (5 nouveaux sur le nom des lieux) ; en Play Mode, lieu lu « Accueil » puis « Mes notes » fenêtre ouverte, et liste fournie à la main (captures `Screenshots/note27_1notes`, `note27_2bas`) ; titres déduits essayés sur trois textes, dont un qui tentait de détourner la consigne (rendu comme un titre) ; étape de la veille essayée avec un faux serveur. **Pas vérifié sur téléphone**, et aucune vraie note n'a encore été titrée par la veille : la note est « corrigé », à confirmer par Wael.
- **0.1.18 publiée** (61 350 587 octets, annonce `latest.json` vérifiée en ligne).
- **Veille relancée en fin de session** par `Tools/retours/relancer_veille.ps1` (nouveau) : elle garde en mémoire le code de son démarrage, sans relance aucun titre ne serait arrivé seul. Le script l'arrête comme « Orderix - Arrêter la veille », la redémarre par le fichier du bureau, fenêtre réduite, et vérifie qu'elle tient (journal `Orderix-archive/retours/relance-veille.log`). À refaire après tout changement dans `Tools/retours`, en tout dernier.
- À savoir : chaque note dictée coûte maintenant un petit appel à Claude (Haiku) sur l'abonnement de ce PC. Les notes 20, 23, 24, 28 et 29 restent « nouveau » : elles n'ont pas été demandées.

### 12/11/2026, 9 h 07 à 9 h 20 : note 29 par « Corriger maintenant », version 0.1.19

Note 29, dictée pendant une partie, « Mes notes » ouverte : « il faut tout en haut de mes notes des sous-catégories à faire, à vérifier, fait, un petit peu comme du Trello [...] parce que là il y a tout ensemble, aller dedans c'est pas pratique ».

- **Décision : « Mes notes » se range en trois onglets**, sous le titre : **À faire** (notes reçues, comprises, en cours, et celles qui attendent le réseau), **À vérifier** (corrigées, avec « C'est corrigé » / « Pas encore »), **Fait** (vérifiées et écartées). Chaque onglet porte son nombre de notes, aux couleurs des pastilles du Parcours (orange à traiter, vert à tester, gris terminé). Le pied de fenêtre garde le total.
- **Onglet d'ouverture** : « À vérifier » s'il contient des notes, sinon « À faire » ; dès que Wael en choisit un, il est gardé tant que le jeu reste ouvert (pas d'un lancement à l'autre, pour ne pas rouvrir sur « Fait » pendant des jours).
- **Code** : `Assets/Orderix/Core/ReportBoard.cs` (statut → colonne, décomptes, onglet par défaut ; un statut inconnu reste « à faire », rien ne disparaît) et `ReportSync.cs` (barre d'onglets à curseur glissant, liste filtrée, phrase d'onglet vide, retour en haut de liste au changement d'onglet). Aucun changement côté serveur ni dans `Tools/retours`.
- **En passant, dans la même fenêtre** : la dernière liste connue s'affiche dès l'ouverture, sans attendre le serveur, et reste à l'écran sans réseau (« liste du dernier chargement ») ; les vignettes d'un affichage sont libérées au suivant et leur téléchargement s'arrête (elles s'accumulaient jusqu'à la fermeture).
- **Vérifié** : 1263 tests au vert (7 nouveaux) ; en Play Mode avec les 30 vraies notes : 5 / 14 / 11 cartes selon l'onglet, doigt simulé sur chaque onglet (une vibration par appui), onglet vide, onglet gardé après fermeture et réouverture (captures `Screenshots/note29_1verifier`, `_2afaire`, `_3fait`, `_4vide`). **Pas vérifié sur téléphone** ni avec le vrai serveur : la note est « corrigé », à confirmer par Wael.
- **0.1.19 publiée** (61 356 251 octets, annonce `latest.json` vérifiée en ligne). Les notes 20, 23, 24 et 28 restent « nouveau » : elles n'ont pas été demandées. La veille n'a pas été relancée : rien n'a changé dans `Tools/retours`.

### 12/11/2026, 9 h 19 à 9 h 40 : note 28 par « Corriger maintenant », version 0.1.20

Note 28, dictée depuis « Mes notes » : « Modifier ne fait rien [...] j'appuie dessus et je n'ai pas la petite barre qui montrait où je suis pour taper mon texte. Je tape du texte et je n'ai aucune idée si ça a été intégré ou pas, mais j'ai l'impression que non. »

- **Cause (déduite du code, pas reproduite sur téléphone)** : le jeu démarre en GameActivity, où Android n'affiche aucune zone de saisie au-dessus du clavier. Le champ de TextMeshPro, réglé pour compter sur cette zone, ne dessine alors ni curseur ni défilement. Dans une note longue, le texte tapé s'ajoutait à la fin, sous le bord du champ : il était pris, mais invisible. Et refermer le clavier par la touche Retour remettait le texte d'origine.
- **Correction** (`Assets/Orderix/App/InputCaret.cs`, `Core/CaretFollow.cs`, `ReportSync.cs`) : le jeu dessine lui-même le curseur à l'endroit où le clavier écrit, et fait défiler le texte pour que cette ligne reste visible. Toucher le texte y pose le curseur. La feuille de saisie descend jusqu'au milieu de l'écran (790 de haut en 16:9, 1024 sur le téléphone de Wael, contre 720). Refermer le clavier garde ce qui a été tapé. Vaut pour « Modifier », « Commenter », « Corriger maintenant » et le champ de relecture après une dictée.
- **Choix écarté** : le réglage « Hide Mobile Input » de TextMeshPro donnait le curseur en une ligne, mais il impose la position du curseur au clavier à chaque image ; sous GameActivity, cela peut écraser une lettre en cours de frappe, et rien ne permettait de l'essayer sans téléphone. Le composant retenu ne fait que lire le clavier pendant la frappe (il n'écrit qu'au toucher du texte).
- **Vérifié** : 1270 tests au vert (7 nouveaux sur le défilement et la hauteur) ; en Play Mode, curseur forcé comme sur téléphone : fin d'un texte de 493 puis 1410 caractères (le champ défile jusqu'à la dernière ligne), début, milieu, texte raccourci, champ vide (captures `Screenshots/note28_planche`, `note28_4vide`). **Pas vérifié sur téléphone** : l'éditeur n'a pas de clavier Android, donc ni la lecture de la position du clavier ni le toucher qui pose le curseur n'ont tourné pour de vrai. La note est « corrigé », à confirmer par Wael. Si le curseur n'apparaît pas ou si le texte tapé n'arrive toujours pas, la piste suivante est de passer l'entrée Android de GameActivity à Activity (défauts connus du clavier sous GameActivity chez Unity).
- **0.1.20 publiée** (61 358 335 octets, annonce `latest.json` vérifiée en ligne). Dans le même relevé, la note 29 est passée « vérifié » depuis l'application. Les notes 20, 23 et 24 restent « nouveau » : elles n'ont pas été demandées. La veille n'a pas été relancée : rien n'a changé dans `Tools/retours`.
