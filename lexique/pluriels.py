# Ajoute aux mots courants de 5 lettres les pluriels (mot de 4 lettres + S) des mots courants de 4 lettres les plus fréquents,
# quand le pluriel est une forme valide (acceptes.txt) et n'est pas écarté par exclus.txt. Relançable : n'ajoute que ce qui manque.
# Usage : python -I Tools/lexique/pluriels.py [nombre de mots de 5 lettres visé, 800 par défaut]
# À relancer après fabriquer.py (qui réécrit courants.txt sans ces pluriels).
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__)).replace("\\", "/")
REPO = os.path.dirname(os.path.dirname(HERE))
RES = REPO + "/Assets/Orderix/Resources/Lexique"
TARGET = int(sys.argv[1]) if len(sys.argv) > 1 else 800

exact, stems = set(), []
for line in open(HERE + "/exclus.txt", encoding="utf-8"):
    for w in line.split("#")[0].split():
        if w.endswith("*"): stems.append(w[:-1])
        else: exact.add(w)

accepted = {l.strip() for l in open(HERE + "/acceptes.txt", encoding="utf-8")}
rows = [l.rstrip("\n") for l in open(HERE + "/courants.txt", encoding="utf-8") if l.strip()]
have = {r.split("\t")[0] for r in rows}
five = sum(1 for w in have if len(w) == 5)
need = TARGET - five
cands = []
for r in rows:
    w, f = r.split("\t")[0], float(r.split("\t")[1])
    if len(w) != 4 or w[-1] in "SXZ": continue
    p = w + "S"
    if p in have or p not in accepted or p in exact or p.startswith(tuple(stems)): continue
    cands.append((f, p))
cands.sort(reverse=True)
add = cands[:max(0, need)]
print("5 lettres avant :", five, "- candidats :", len(cands), "- ajoutés :", len(add))
if add:
    rows += ["%s\t%.2f" % (p, f * 0.4) for f, p in add]
    rows.sort(key=lambda r: (len(r.split("\t")[0]), r.split("\t")[0]))
    out = "\n".join(rows) + "\n"
    for path in (HERE + "/courants.txt", RES + "/courants.txt"):
        open(path, "w", encoding="utf-8", newline="\n").write(out)
print("5 lettres après :", sum(1 for r in rows if len(r.split("\t")[0]) == 5))
