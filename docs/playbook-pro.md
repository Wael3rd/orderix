# Playbook Orderix : une app pro autour du jeu

Adapté du playbook Model 2. Sources : Blockudoku 3.25 pour l'enrobage, brawler 0.0.44 pour le feedback et le debug.
Lus le 06/11/2026 par analyse statique, sans rien exécuter. « (déduit) » marque ce qui vient de noms et non d'une preuve directe.

## But et règles
- Une app de qualité pro autour du jeu : démarrage, pilotage, mesure, robustesse, finition, boucle de test. Le gameplay n'est pas concerné.
- Les références se lisent et ne se copient pas : ni code, ni image, ni texte, ni nom, ni look. Orderix garde son identité.
- Les APK de référence ne vont jamais dans le dépôt. Aucun secret dans un APK.
- Chaque étape se prouve sur un vrai téléphone de milieu de gamme, pas seulement en jsdom.
- On prend les pratiques, pas l'échelle : Orderix a un seul développeur.

## Connaître les références et le point de départ
**Blockudoku** : Unity 2022.3 + IL2CPP, aucune WebView pour le jeu. Une coque fine posée sur une plateforme interne partagée entre les jeux de l'éditeur (déduit). Le contenu embarqué est minuscule, le reste se télécharge (déduit). Les SDK de pub pèsent environ 39 % des classes Java.

**brawler** : un émulateur enrobé d'un excellent outillage de test. Fort sur le feedback et la distribution. Faible sur la capture de crash (aucune), la télémétrie (locale seulement) et les sessions (file en mémoire seulement). Son geste clé : un retour à voix haute, transcrit, qui emporte les dernières secondes de jeu.

**Orderix au 06/11** :
- 14 000 lignes de JS en scripts globaux, 41 fichiers de modes, `main.js` de 903 lignes.
- Aucun numéro de build repéré dans `www/` ; `versionName` figé à 1.0, `package.json` à 2.0.0.
- 96 `Math.random` dans 46 fichiers, aucune seed : pas de replay possible.
- Analytics et erreurs JS journalisés en local, jamais envoyés.
- Feedback en fin de partie seulement (verdict, commentaire, file locale), envoyé à GitHub avec un jeton embarqué dans l'APK.
- Calendrier écrit dans le code : d'après `state.js`, vide depuis le 26/09.
- CI : smoke-test puis APK. La QA sur émulateur n'y est pas.

## Le choix de la pile
- **Décision de Wael (11/11) : Unity en natif.** Tous les gameplays actuels sont réécrits, avec une finition professionnelle partout, menus et récompenses compris. Le prototype comparatif est abandonné.
- L'argument de juin (« les jeux Easybrain sont des WebViews ») était faux : Blockudoku est en Unity, comme la plupart des références du genre.
- Ce qui rend Unity tenable pour un développeur seul assisté par Claude : le Unity CLI et le paquet Pipeline (`com.unity.pipeline`). Ils permettent de compiler, lancer les tests, passer en Play Mode, faire des captures et construire depuis le terminal.
- Installé le 11/11 : Unity 6.3 LTS (6000.3.28f1) avec le module Android complet, le Unity CLI et les skills Unity pour Claude.
- Coûts acceptés : réécriture de tous les modes, APK plus lourd, licences d'outils et d'assets à prévoir.
- Ce qui reste de la version web : le backend (Supabase, GAS), le calendrier et le contenu, les données des joueurs, la connaissance des modes. L'app web reste en ligne en l'état pendant la refonte.
- Aucun moteur ne remplace la direction artistique : illustration et mascotte restent le plus gros manque relevé le 20/07.

## L'étude sur appareil
- L'analyse statique ne montre ni les enchaînements, ni le rythme, ni le ressenti : les scènes de Blockudoku ne sont pas lisibles sans outil Unity.
- Filmer sur téléphone le premier lancement, jusqu'à la première partie et sa fin. Relever les durées, les étapes, ce qui attend et ce qui n'attend pas.
- Garder ces constats dans `docs/etude.md`, sans images du jeu dans le dépôt. Ils servent de base à la grille de finition.

## La plateforme
Blockudoku a trois couches : modules natifs avec un pont vers le jeu, une quarantaine de bibliothèques partagées, puis le jeu qui les branche par adaptateurs. Pour Orderix :
- `platform/` : config, consentement, analytics, stockage, sync, notifications, feedback, mise à jour, i18n, son, haptique, composants UI.
- `meta/` : accueil, calendrier, événements, pass, trophées.
- `game/modes/` : un fichier par mode, un seul contrat : `start(ctx)` renvoie un résultat. `ctx` fournit `rng`, `clock`, `haptics`, `sound`, `log`.
- Un mode ne touche jamais au stockage, au réseau, à `Math.random` ni à `Date`. La règle est vérifiée par le lint.
- En Unity : une assembly (`.asmdef`) par couche. Un mode ne référence que l'assembly du contexte, ce qui rend la règle vérifiable à la compilation.
- Modèles de données décrits par un schéma unique : sauvegarde, sync et validation en découlent.

## Démarrage et coque native
- Splash natif, consentement, config avec attente maximale, accueil. Orderix a déjà le cache et le délai de 4 s : à garder et à mesurer.
- Tout service tiers est désactivé par défaut et activé par le code après consentement.
- Temps jusqu'à l'écran interactif mesuré à chaque build.
- Liens profonds de QA en build dev seulement : ouvrir un jour, un mode ou un état donné.
- Cleartext interdit, orientation verrouillée, règles de sauvegarde Android explicites. À vérifier : ce que l'Auto Backup couvre du stockage de la WebView.

## Pilotage à distance
- Config en triplets clé, valeur, valeurs valides : le serveur envoie, le client valide, une valeur par défaut est embarquée.
- Un drapeau par fonction, un mode maintenance, une version minimale, un lancement progressif.
- A/B simple : groupe calculé depuis l'identifiant d'installation, attente bornée au démarrage. À n'ajouter qu'une fois les joueurs là.
- Le contenu vient du serveur : petits packs versionnés, somme de contrôle, cache, jouables hors ligne.
- Une alerte quand il reste moins de 14 jours de contenu. Le calendrier vide n'aurait pas eu lieu.
- Une seule source de vérité par donnée.

## Mesure
- Blockudoku décrit 322 événements dans une table, avec une colonne par destination et le traitement RGPD. Le routage est une donnée, pas du code.
- Orderix : un CSV `analytics_events.csv`, une ligne par événement. Un script génère les constantes ; un nom inconnu fait échouer la CI.
- Commencer à 20 ou 30 événements : session, jour, mode, méta, technique. Ajouter des jalons (`solved_N`, `start_session_N`).
- File locale, envoi par lots, reprise, identifiant anonyme, consentement respecté. Le journal local actuel sert de base.
- Questions à trancher : D1 et D7, tunnel de la première session, taux de victoire, d'abandon et durée par mode.

## Méta
Formes vues dans Blockudoku, à transposer sans le look :
- Accueil en widgets classés par priorité, pas figé.
- Défi du jour avec calendrier mensuel, récompense du mois, tutoriel et notification dédiés.
- Un cycle de vie commun à tous les événements : présentation, tutoriel, progression, clôture.
- Demande de note pilotée par config, repoussée après un crash ou un ANR récent, avec une fenêtre de feedback (déduit pour le filtrage).
- Réglages complets : langue, support, suppression des données.
- Orderix a déjà série, événements et pass : les aligner sur ces cycles avant d'en ajouter.

## Robustesse
- Sauvegarde avec numéro de schéma et migrations nommées, chacune testée sur un fichier de chaque ancienne version.
- Sauvegardes tournantes et écriture atomique.
- Sync avec une règle de fusion par champ (meilleur temps, union des jours joués). Les erreurs deviennent des événements.
- Erreurs JS envoyées avec plafond. Crashs natifs captés aussi : ni brawler ni Orderix ne le font.
- Jamais de blocage hors ligne, et un message clair quand un téléchargement manque.
- Sonde de santé sur le backend et les jetons à durée limitée. Prévoir le plan payant pour la prod : le plan gratuit met en pause.

## Finition
C'est la priorité du projet, pas un bonus de fin. Elle se valide à chaque étape.
- Grille écrite à partir de l'étude sur appareil, appliquée à chaque écran : entrée et sortie animées, réponse à chaque toucher (image, son, haptique), états vide, chargement et erreur soignés, récompense mise en scène, aucun saut de mise en page, fluidité tenue sur un téléphone de milieu de gamme.
- Comparaison côte à côte avec les vidéos de l'étude pour le niveau d'exigence, jamais pour le look. Wael valide sur son téléphone, écran par écran.
- Un vocabulaire unique : durées et courbes en jetons, haptique nommée (`succes`, `erreur`, `tap`) au lieu de motifs bruts, son par catégorie avec volumes.
- DOTween pour les animations d'interface, un outil de « juice » (Feel ou équivalent) et les particules Unity. Blockudoku s'appuie sur DOTween, Spine et une haptique à 7 types.
- Illustration, mascotte, sons : un budget d'assets à décider tôt, c'est le plus gros manque relevé le 20/07. La règle du 19/07 reste : pas d'assets dessinés maison.
- Textes extraits dès maintenant. Blockudoku a 18 langues ; Orderix peut rester en français au départ.
- Mise en page de référence téléphone et tablette, zones sûres gérées partout, listes longues virtualisées.

## Feedback
Repris de brawler :
- Un seul geste, disponible partout, même en pleine partie : le jeu se fige et on parle à voix haute. La voix est le canal principal, l'écrit un repli.
- La note emporte les X dernières secondes de jeu, en données et non en vidéo : brawler n'a aucun encodeur vidéo, seulement une fenêtre de frames (`window_frame`, `press_frame`), la voix en `.m4a`, des captures PNG et `meta.json`. Durée et contenu exact de la fenêtre non déterminés.
- Pour Orderix : un tampon circulaire, toujours actif en build de test, garde les actions et l'état des 30 dernières secondes (à régler). Le développeur revoit ce moment par rejeu : aucune vidéo à encoder, quelle que soit la pile.
- Contexte joint automatiquement : build, env, jour, mode, seed, état, appareil, identifiant d'installation.
- Capture d'écran annotable au doigt, en rouge.
- Voix transcrite côté serveur, texte corrigé par le testeur avant envoi. Service de transcription à choisir. Micro via la classe `Microphone` de Unity et la permission `RECORD_AUDIO`.
- File sur disque, vidée au lancement et à intervalles réguliers. Un refus du serveur classe la note à part au lieu de la perdre.
- Écran « Mes retours » : statuts, réponses, « Corrigé / Toujours cassé » à confirmer, cartes de décision avec images avant et après.
- Bannière de test « À faire / Attendu » avec un bouton Suivant : le développeur envoie un test précis au testeur.
- Le jeton sort de l'APK : une fonction serveur reçoit la note et crée l'issue.

## Déterminisme et replay
- Toute source d'aléa et de temps passe par `ctx`. `rng` est initialisé depuis la seed du jour et de la partie.
- Une session : seed, build, actions horodatées, hash de l'état à chaque étape, résultat. Elle part avec la note, sur disque d'abord.
- Rejeu en tests EditMode (Unity Test Framework), lancés par le CLI en local et en CI. Une divergence de hash est signalée.
- Un bug confirmé devient un test du corpus de replays, qui tourne en CI.
- Le replay ne voit pas l'image : vérifier aussi l'écran sur appareil.
- La fenêtre d'une note se rejoue depuis son état de départ, sans repartir du début de la partie.
- Pas de somme de contrôle de RAM comme sur Model 2 : le hash d'état en tient lieu.

## Debug et télémétrie
- En build dev seulement, avec un test qui prouve leur absence en prod : surcouche build, jour, mode, seed, fps et tâches longues ; menu caché pour aller à un jour, charger un état, réinitialiser. « Rejouer (test) » existe déjà.
- Scénario par note : chaque retour peut recharger l'état où il a été émis.
- Compteurs en mémoire uniquement pendant le jeu, envoi en fin de session : écart entre frames, tâches longues (`PerformanceObserver`), délai entre toucher et réaction, temps de démarrage, modèle de GPU.
- Envoyer ces compteurs au serveur, contrairement à brawler : les téléphones des testeurs sont hors de portée.

## Distribution aux testeurs
- Build, version et numéro viennent de la CI (`run_number`) et vont dans `versionCode`, `versionName`, la config de build, l'en-tête de chaque requête et l'écran.
- Canaux `live` et `test`. Code d'invitation et tag par appareil, revérifiés au lancement : tag retiré, build coupé. Pas de compte obligatoire pour le public.
- Version minimale côté serveur : brawler n'en a pas.
- Mise à jour automatique de l'APK en build dev seulement : vérification, reprise, SHA-256, `PackageInstaller` via un plugin natif à écrire. À revérifier : Google Play interdit à une app distribuée sur le store de se mettre à jour en dehors de lui.
- Publier avant de tester sur appareil : une app qui se met à jour réinstalle le build publié.

## Tests et CI
- Tests EditMode sur la logique pure et les générateurs, tests PlayMode sur les écrans, corpus de replays, sur chaque push via le Unity CLI.
- QA sur émulateur en CI, avec les images de référence jamais recapturées dans le même passage que la vérification.
- Ajouter à un test chaque bug corrigé.

## Ce qu'on ne prend pas
- La médiation pub à une vingtaine de réseaux. Le jour où la pub arrive, un seul médiateur.
- Le backend à plusieurs services : un projet Supabase et quelques fonctions suffisent.
- Tournois avec bots, promo croisée, compte nominatif pour le public.

## Pièges déjà vécus
- « 16/16 » le 24/06 : les images de référence avaient été recapturées dans le même passage, et les seuils élargis juste avant.
- Le Google Sheet qui écrasait le calendrier du code (17/07).
- Un jeton de 90 jours sans rappel, un contenu avec une date de fin sans alerte.
- Un projet Supabase en pause ne répond plus au DNS : on croit à une suppression.
- Un replay qui saute la même chose que l'enregistrement « valide » une partie cassée.

## Ordre de travail
Le socle d'abord, puis une tranche verticale qui fixe la barre de finition, puis la boucle de feedback qui accélère tout le reste. La finition se valide à chaque étape.

| # | Étape | Fini quand |
|---|---|---|
| 1 | Socle Unity : licence, CLI connecté, projet, dépôt, paquets (Pipeline, DOTween, TextMeshPro), build Android en CI | Un APK Unity se construit en CI et le CLI pilote l'éditeur |
| 2 | Tranche verticale : accueil, un mode, victoire et récompense, au niveau visé | Wael la valide sur son téléphone ; elle devient la grille de finition |
| 3 | Boucle de feedback : geste partout, gel, voix transcrite, X dernières secondes, contexte, capture, file disque, « Mes retours » | Une note vocale envoyée d'un téléphone arrive avec son contexte et sa fenêtre, et la réponse revient dans l'app |
| 4 | Déterminisme et replay | Chaque mode porté se rejoue avec le même hash en test EditMode |
| 5 | Plateforme, méta, puis portage de tous les modes par lots | Chaque mode porté passe ses tests et la grille de finition |
| 6 | Pilotage et contenu distant | Le calendrier change sans nouvel APK, et l'alerte de contenu fonctionne |
| 7 | Consentement et mesure | Le tunnel de première session et le D1 se lisent sur un tableau de bord |
| 8 | Sauvegardes versionnées, sync, reprise de la progression des joueurs web | Une sauvegarde de chaque ancienne version migre en test, et un conflit se résout sans perte |
| 9 | Publication sur le Play Store | Build signé accepté en test interne |
