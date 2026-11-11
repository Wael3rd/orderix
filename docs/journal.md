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
