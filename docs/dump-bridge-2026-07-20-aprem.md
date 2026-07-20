# Dump local — session bridge du 20/07/2026 après-midi (claude.ai, non écrite dans le JSONL)

> Sauvegarde manuelle du contenu de la conversation, car cette session est hébergée côté
> claude.ai et n'écrit PAS dans le JSONL local (voir journal du 20/07 après-midi).

## Chronologie de la session

1. **Test mémoire** (13:30) — Wael reprend contact depuis le téléphone (terminal fermé depuis
   le /exit de la session de midi). La session est une continuation bridge de la session
   `80a3948b-b692-4baf-8ad2-5e593d322baa` (celle de la refonte v2 de juin).
2. **Question `--continue`** — Vérification demandée : le JSONL local ne contient PAS les
   messages de la session bridge, seulement des marqueurs `bridge-session` (13:30, 14:30).
   Dernier vrai contenu local : le `/exit` du 14 juin.
3. **« Comment arrêter le bridge »** — Diagnostic initial ERRONÉ : `remoteControlAtStartup`
   passé à `false` dans `~/.claude/settings.json`. Wael a corrigé à juste titre : le flux
   téléphone→PC est son workflow voulu. **Réglage remis à `true` aussitôt.** (Au passage,
   `/model` a réécrit `model: claude-fable-5` dans les settings.)
4. **Vérifications successives** — même après `/remote-control` → « disconnected », et même
   avec le terminal ouvert et attaché à la conversation, RIEN ne s'écrit dans le JSONL :
   une session née côté cloud reste hébergée côté cloud ; le terminal attaché n'est qu'un client.
5. **Changelog vérifié (v2.1.215)** — l'architecture a réellement changé récemment :
   apparition/maturation du « background daemon » (sessions joignables terminal fermé,
   hébergées côté claude.ai, « terminal-hosted » vs daemon-hosted dans le changelog).
   Le comportement d'avant de Wael (téléphone → session terminal ouverte → tout en local)
   était réel ; le nouveau piège est le cas terminal fermé, pris en charge silencieusement.
6. **Aucune perte de travail** — vérifié : local = GitHub (tout poussé), journal commité,
   6 fichiers mémoire à jour, dump 68 Ko de la session terminal (13:23). Le travail vit
   dans git/journal/mémoire ; seuls les mots des conversations bridge vivent côté claude.ai
   (et y restent lisibles).

## Règles retenues (aussi au journal, commit 0bf5d9a)

- Le mode d'hébergement d'une session est **fixé à sa naissance** : née dans le terminal →
  locale pour toujours ; née côté cloud (téléphone avec terminal fermé) → cloud pour toujours,
  même rouverte ensuite dans le terminal.
- Pour une session locale : `claude` **tout court** dans le terminal (pas `--continue` /
  `--resume` qui peuvent rebrancher une session cloud).
- Test de localité en 10 s : taper un mot inventé puis
  `Select-String -Path "$env:USERPROFILE\.claude\projects\C--Users-w-hadjmouldi-Documents-GitHub-orderix\*.jsonl" -Pattern "<mot>" -SimpleMatch -List`
- Workflow téléphone conservé : session terminal **laissée ouverte** avec RC → les messages
  mobiles y entrent et s'écrivent en local (comportement historique, toujours valable).

## État Claude Code au moment du dump

- Version : 2.1.215, canal `latest` · `remoteControlAtStartup: true` (confirmé) ·
  modèle par défaut : `claude-fable-5`.
- Sessions JSONL du projet : `80a3948b…` (8,7 Mo, refonte v2 juin, figée au /exit du 14/06 +
  marqueurs bridge) ; les sessions terminal de juillet ont leurs propres fichiers.
