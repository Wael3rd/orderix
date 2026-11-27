# Fabrique les listes de mots français du jeu à partir du lexique libre de Grammalecte / Dicollecte (MPL 2.0).
# Usage : python -I Tools/lexique/fabriquer.py [dossier de travail hors dépôt]
# Relançable : le zip n'est téléchargé qu'une fois, sa somme SHA-256 est vérifiée, les sorties sont réécrites à l'identique.
# Écrit :
#   Tools/lexique/acceptes.txt   toutes les formes valides de 3 à 9 lettres (une par ligne, MAJUSCULES sans accent)
#   Tools/lexique/courants.txt   les mots courants à trouver : MOT <tab> fréquence (occurrences par million de mots)
#   Assets/Orderix/Resources/Lexique/{acceptes,courants}.txt   copies chargées par le jeu (TextAsset) + leurs .meta
# Format du jeu : A à Z seulement ; é, è, ê, à, ç... perdent leur signe ; œ s'écrit OE, æ s'écrit AE.
import hashlib, io, os, re, sys, unicodedata, urllib.request, zipfile

VERSION = "7.7"
URL = "https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip"
SHA256 = "bdccf2065e252010253171000a38de84581407896b6bc60aca7d4d69dab7e4d2"   # somme du zip v7.7 lu le 2026-11-27
MEMBER = "lexique-grammalecte-fr-v7.7.txt"
MIN_LEN, MAX_LEN = 3, 9
TARGET_LENGTHS = (4, 5, 6)
TARGETS_PER_LENGTH = {4: 750, 5: 1250, 6: 1250}   # le haut du classement de fréquence, avant la relecture (exclus.txt retire le reste)

HERE = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
REPO = os.path.dirname(os.path.dirname(HERE))
RES = REPO + "/Assets/Orderix/Resources/Lexique"
WORK = (sys.argv[1] if len(sys.argv) > 1 else
        "C:/Users/Wael/AppData/Local/Temp/claude/66c7c759021cadcf/3928a0ce-b697-4a6f-836d-9d7a9266d4db/scratchpad/lexique-src").replace("\\", "/")

LETTERS = re.compile(r"^[a-zàâäçéèêëîïôöùûüÿœæ]+$")
# Étiquettes grammaticales qui ne sont pas des mots du jeu : noms propres, prénoms, sigles, nombres romains, préfixes, erreurs...
BAD_TAGS = {"npr", "patr", "prn", "nbro", "pfx", "sfx", "err", "div", "ponc", "titr", "sign", "loc.patr"}
BAD_NOTES = {"sig", "abr", "symb", "unit"}
# Notes qui écartent un mot des mots à trouver (jamais des mots acceptés) : familier, vieilli, rare, régionalismes, néologismes...
NOT_TARGET_NOTES = {"fam", "vx", "rare", "néo", "afr", "pel", "belg", "québ", "alt", "arg", "rég", "var", "hm", "cc", "fxa", "ord"}
NOT_TARGET_SEM = {"cité", "gent"}


def normalize(w):
    w = w.replace("œ", "oe").replace("æ", "ae")
    w = unicodedata.normalize("NFD", w)
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return w.upper()


def fetch():
    os.makedirs(WORK, exist_ok=True)
    path = WORK + "/lexique-grammalecte-fr-v%s.zip" % VERSION
    if not os.path.exists(path):
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (lexique-builder)"})
        with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
            f.write(r.read())
    data = open(path, "rb").read()
    got = hashlib.sha256(data).hexdigest()
    print("zip", path, len(data), "octets, SHA-256", got)
    if SHA256 != got:
        print("ATTENTION : somme différente de celle attendue (%s)" % SHA256)
    return zipfile.ZipFile(io.BytesIO(data)).read(MEMBER).decode("utf-8")


def load_exclusions():
    exact, stems = set(), []
    with open(HERE + "/exclus.txt", encoding="utf-8") as f:
        for line in f:
            line = line.split("#")[0].strip()
            for w in line.split():
                w = normalize(w.rstrip("*")) + ("*" if w.endswith("*") else "")
                if w.endswith("*"): stems.append(w[:-1])
                else: exact.add(w)
    return exact, tuple(stems)


def main():
    text = fetch()
    exact, stems = load_exclusions()
    # ajouts.txt : mots courants choisis à la main plus bas dans le classement (au-delà du haut du classement relu en entier)
    added = {normalize(w) for l in open(HERE + "/ajouts.txt", encoding="utf-8") for w in l.split("#")[0].split()}
    accepted = set()
    cands = {}      # mot normalisé -> fréquence (occurrences par million)
    for line in text.split("\n"):
        f = line.split("\t")
        if len(f) < 19 or not f[0].isdigit(): continue
        flex, lemma, tags, notes, sem = f[2], f[3], f[4].split(), f[7].split(), f[8]
        if not LETTERS.match(flex): continue          # majuscule (noms propres), trait d'union, apostrophe, point, chiffre
        if any(t in BAD_TAGS for t in tags) or any(n in BAD_NOTES for n in notes): continue
        n = normalize(flex)
        if not (MIN_LEN <= len(n) <= MAX_LEN) or not n.isascii() or not n.isalpha(): continue
        accepted.add(n)
        # mot à trouver : un lemme (nom au singulier, adjectif au masculin singulier, verbe à l'infinitif, adverbe)
        if len(n) not in TARGET_LENGTHS or flex != lemma: continue
        pos = [t for t in tags if t in ("nom", "adj", "adv") or t == "infi"]
        if not pos: continue
        if any(x in NOT_TARGET_NOTES for x in notes) or sem in NOT_TARGET_SEM: continue
        if len(f) > 11 and f[10].startswith("R") and "/" not in f[10]: continue   # graphie de la réforme de 1990 seule
        # Fréquence d'usage en français : moyenne géométrique des taux dans Wikipédia, Wikisource et la littérature (le corpus
        # « Google 1-grams » est écarté : il mêle l'anglais, « SLOW » ou « PLOT » y paraissent courants). Unité : occurrences par million.
        rates = [(float(f[i]) + 1.0) / tot for i, tot in ((12, 1091867445.0), (13, 569693331.0), (14, 144656241.0))]
        freq = (rates[0] * rates[1] * rates[2]) ** (1.0 / 3.0) * 1e6
        if freq > cands.get(n, 0): cands[n] = freq

    chosen = {}
    for n in TARGET_LENGTHS:
        ranked = sorted(((w, v) for w, v in cands.items() if len(w) == n), key=lambda p: (-p[1], p[0]))
        # le haut du classement, puis la relecture : exclus.txt retire ce qui choque ou que personne ne connaît
        keep = ranked[:TARGETS_PER_LENGTH[n]] + [p for p in ranked[TARGETS_PER_LENGTH[n]:] if p[0] in added]
        chosen[n] = [p for p in keep if p[0] not in exact and not p[0].startswith(stems)]

    acc_lines = sorted(accepted, key=lambda w: (len(w), w))
    cur_lines = []
    for n in TARGET_LENGTHS:
        for w, v in sorted(chosen[n], key=lambda p: p[0]):
            cur_lines.append("%s\t%.2f" % (w, v))
    for path_dir in (HERE, RES):
        os.makedirs(path_dir, exist_ok=True)
        for name, lines in (("acceptes.txt", acc_lines), ("courants.txt", cur_lines)):
            with open(path_dir + "/" + name, "w", encoding="utf-8", newline="\n") as f:
                f.write("\n".join(lines) + "\n")
    for name in ("acceptes", "courants"):     # .meta d'un TextAsset, guid stable
        guid = hashlib.md5(("orderix-lexique-" + name).encode()).hexdigest()
        meta = "fileFormatVersion: 2\nguid: %s\nTextScriptImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n" % guid
        with open(RES + "/%s.txt.meta" % name, "w", encoding="utf-8", newline="\n") as f: f.write(meta)
    if not os.path.exists(RES + ".meta"):
        guid = hashlib.md5(b"orderix-lexique-dossier").hexdigest()
        with open(RES + ".meta", "w", encoding="utf-8", newline="\n") as f:
            f.write("fileFormatVersion: 2\nguid: %s\nfolderAsset: yes\nDefaultImporter:\n  externalObjects: {}\n  userData: \n  assetBundleName: \n  assetBundleVariant: \n" % guid)
    by = {}
    for w in acc_lines: by[len(w)] = by.get(len(w), 0) + 1
    print("acceptés par longueur :", dict(sorted(by.items())), "total", len(acc_lines))
    print("courants par longueur :", {n: len(chosen[n]) for n in TARGET_LENGTHS})


if __name__ == "__main__":
    main()
