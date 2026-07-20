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

- **Uplift UI** : phase E (FTUE éclair : onboarding 3 écrans → 1 ou 0) et F (pastilles tabbar
  + thème sombre gratuit).
- **OAuth** : créer les apps dans Google Cloud Console / Meta (côté Wael — docs/todo-wael.html).
- Backlog gameplay : multi-guichets pour La File (#12, seule issue feedback ouverte).
- Epics restants : voir docs/epics.html (7/9 verts au 19/07).
- Campagne de re-test février : verdicts à donner en jouant (cases dans l'app).
