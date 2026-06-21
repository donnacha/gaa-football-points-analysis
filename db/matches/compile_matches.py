#!/usr/bin/env python3
"""
Compile the match-level archive: validate every db/matches/<sport>/<grade>/<year>.json,
recompute totals/winner, and emit a master CSV + coverage/quality summaries.

Usage:  python compile_matches.py
"""
import json, csv, os, glob, re
from collections import defaultdict, Counter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "output")
os.makedirs(OUT, exist_ok=True)

REQUIRED = ["sport","grade","competition","stage","date","team1","team2",
            "t1_g","t1_p","t2_g","t2_p","winner","venue","attendance","referee","notes","source_url"]

def total(g, p):
    if g is None or p is None:
        return None
    return g*3 + p

def main():
    files = sorted(glob.glob(os.path.join(HERE, "*", "*", "*.json")))
    matches, warnings = [], []
    for fp in files:
        rel = os.path.relpath(fp, HERE)
        try:
            with open(fp, encoding="utf-8") as f:
                arr = json.load(f)
        except json.JSONDecodeError as e:
            warnings.append(f"{rel}: INVALID JSON ({e})"); continue
        if not isinstance(arr, list):
            warnings.append(f"{rel}: not a JSON array"); continue
        for i, m in enumerate(arr):
            miss = [k for k in REQUIRED if k not in m]
            if miss:
                warnings.append(f"{rel}[{i}]: missing keys {miss}")
            t1, t2 = total(m.get("t1_g"), m.get("t1_p")), total(m.get("t2_g"), m.get("t2_p"))
            # winner consistency check (only when both totals known and not a draw note)
            if t1 is not None and t2 is not None:
                exp = "draw" if t1 == t2 else (m.get("team1") if t1 > t2 else m.get("team2"))
                w = m.get("winner")
                note = (m.get("notes") or "").lower()
                # penalties/extra-time can override a level full-time score; skip those
                if w and t1 == t2 and w not in ("draw", m.get("team1"), m.get("team2")):
                    warnings.append(f"{rel}[{i}]: winner '{w}' but scores level")
                elif (w and t1 != t2 and w != exp and "penalt" not in note
                      and "source-score-disputed" not in note and "objection" not in note
                      and "awarded" not in note and "era-scoring" not in note):
                    warnings.append(f"{rel}[{i}]: winner '{w}' != score-implied '{exp}' "
                                    f"({m.get('team1')} {t1}-{t2} {m.get('team2')})")
            m["_t1_total"], m["_t2_total"] = t1, t2
            base = os.path.splitext(os.path.basename(fp))[0]
            ym = re.match(r"(\d{4})", base)        # season year from leading digits
            m["_year"] = ym.group(1) if ym else base
            matches.append(m)

    # master CSV (chronological; undated sink to end)
    matches.sort(key=lambda m: (m.get("date") or "9999", m.get("competition","")))
    cols = ["date","sport","grade","competition","stage","team1","t1_g","t1_p","_t1_total",
            "team2","t2_g","t2_p","_t2_total","winner","venue","attendance","referee","notes","source_url"]
    with open(os.path.join(OUT,"matches.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f); w.writerow([c.lstrip("_") for c in cols])
        for m in matches:
            w.writerow([m.get(c,"") if m.get(c) is not None else "" for c in cols])

    # summaries
    by_sg = Counter((m["sport"],m["grade"]) for m in matches)
    by_comp = Counter(m["competition"] for m in matches)
    by_year = Counter(m["_year"] for m in matches)
    def filled(k): return sum(1 for m in matches if m.get(k) not in (None,"",))
    n = len(matches)

    print(f"Match archive — {n} matches across {len(files)} file(s)")
    print("\nBy sport/grade:")
    for (s,g),c in sorted(by_sg.items()): print(f"  {s:<8} {g:<12} {c}")
    print("\nBy competition:")
    for comp,c in sorted(by_comp.items(), key=lambda x:-x[1]): print(f"  {comp:<14} {c}")
    print("\nBy year:")
    for y,c in sorted(by_year.items()): print(f"  {y}: {c}")
    if n:
        print("\nField completeness:")
        for k in ["date","venue","attendance","referee"]:
            print(f"  {k:<11} {filled(k)}/{n} ({100*filled(k)//n}%)")
    print(f"\nValidation warnings: {len(warnings)}")
    for wmsg in warnings[:40]:
        print(f"  ! {wmsg}")
    if len(warnings) > 40:
        print(f"  ... and {len(warnings)-40} more")
    print(f"\nWrote {os.path.join(OUT,'matches.csv')}")

if __name__ == "__main__":
    main()
