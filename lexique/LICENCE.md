# Lexique français du jeu : source et licence

## Source

- **Lexique Grammalecte / Dicollecte, « Lexique français, liste des formes fléchies », version 7.7** (2025), d'Olivier R. et de ses contributeurs.
- Page : <https://grammalecte.net/> (rubrique Dictionnaires) ; fichier lu : <https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip>
  (12 325 782 octets, SHA-256 `bdccf2065e252010253171000a38de84581407896b6bc60aca7d4d69dab7e4d2`, lu le 2026-11-27).
- Contenu : 515 000 formes fléchies avec lemme, étiquettes grammaticales, notes d'usage et fréquences (Wikipédia, Wikisource, littérature, Google 1-grams).

## Licence

**Mozilla Public License 2.0** (<http://www.mozilla.org/MPL/2.0/>), déclarée en tête du fichier du lexique (« # Licence : MPL v2.0 ») et dans
`README_lexique.txt` du zip. Usage commercial permis. Copyleft au niveau du fichier : les listes dérivées (`acceptes.txt`, `courants.txt`)
restent sous MPL 2.0 ; le code du jeu qui les lit n'est pas touché (« Larger Work »). Obligations, quand le jeu est distribué :

1. donner aux joueuses la mention de la licence et de la source (texte ci-dessous, dans Réglages > mentions) ;
2. tenir la forme source des fichiers dérivés accessible à qui reçoit le jeu : publier `acceptes.txt` et `courants.txt` (et ce script) en clair, par exemple dans un dépôt public ;
3. l'avis de licence MPL doit figurer dans chaque fichier ou, si c'est impraticable, là où on le cherche : les listes sont des fichiers de mots lus ligne à ligne par le jeu, l'avis est donc ici et dans la mention du jeu.

## Texte de la mention (Core/LegalText.cs, section « Les mots du jeu »)

> Les listes de mots des jeux de lettres viennent du lexique français de Grammalecte (Dicollecte), version 7.7, d'Olivier R. et de ses
> contributeurs, publié sous la licence Mozilla Public License 2.0 (mozilla.org/MPL/2.0). Orderix en a tiré des listes de mots qui restent
> sous cette même licence ; leur texte est publié avec le jeu et peut être copié, avec cette mention.

## Fabrication

`python -I Tools/lexique/fabriquer.py` télécharge le zip, vérifie sa somme et réécrit :

- `acceptes.txt` : 161 605 formes de 3 à 9 lettres (3 : 519, 4 : 2 166, 5 : 6 966, 6 : 16 447, 7 : 30 423, 8 : 46 389, 9 : 58 695) ; formes fléchies
  comprises ; ni noms propres (majuscule initiale), ni prénoms, sigles, abréviations, symboles, unités, nombres romains, préfixes ou fautes
  (étiquettes `npr patr prn sig abr symb unit nbro pfx sfx err`), ni trait d'union, ni apostrophe ;
- `courants.txt` : les mots à trouver (lemmes : noms, adjectifs, infinitifs, adverbes, hors familier, vieilli, rare, régional, néologisme,
  anglais...), classés par fréquence d'usage (moyenne géométrique des taux dans Wikipédia, Wikisource et la littérature ; Google 1-grams écarté, il
  mêle l'anglais), haut du classement relu en entier : `exclus.txt` retire ce qui choque ou que personne ne connaît, `ajouts.txt` repêche des
  mots courants plus bas ; 4 lettres : 390, 5 lettres : 696, 6 lettres : 761 ; format `MOT<tab>occurrences par million` ;
- les copies que le jeu charge : `Assets/Orderix/Resources/Lexique/{acceptes,courants}.txt` (+ `.meta`).

Format : A à Z, sans accent ni cédille, `œ` écrit `OE`, `æ` écrit `AE`.
Poids : 1,4 Mo en clair, 450 Ko compressé (le paquet du jeu compresse les ressources).

## Sources écartées (voir le rapport de la session du 2026-11-27)

Lexique 4 (CC BY-SA 4.0, partage à l'identique et corpus de recherche), Wiktionnaire / kaikki (CC BY-SA 4.0 + GFDL), Morphalou (licence à
conditions à vérifier selon la version), Lefff (LGPL-LR) : voir le tableau du rapport ; Grammalecte retenue pour la clarté de sa licence,
son contenu de formes fléchies et ses fréquences.
