#!/usr/bin/env python3
"""
Assemble the extended championship.json (1887-2025) from the auditable source
files in db/sources/.  This is the ONLY place the historical record is stitched
together; build.py / make_site.py consume the result and never see the sources.

Inputs (db/sources/):
    ai_finals.json            champion / runner-up / score / venue / attendance per final
    provincial_finals.json    provincial final winner + beaten finalist, by province & year
    ai_semifinals_early.json  beaten semi-finalists for the irregular 1887-1928 era
    captains_managers.json    winning captain + manager per year
Plus the existing db/championship.json, whose 1990-2025 year objects are taken
verbatim (facts unchanged) and merely enriched with final detail.

For 1929-1989 the two beaten All-Ireland semi-finalists are DERIVED, not
researched: in the clean four-province knockout era they are exactly the two
provincial champions who did not reach the final.  The script validates this
(expects exactly two) and cross-checks that the champion and runner-up were
themselves provincial champions, warning on any anomaly.

Output: db/championship.json (1887-2025, ascending), preserving the schema
build.py expects and adding all_ireland.final = {scores, venue, attendance,
replay, captain, manager, notes}.

Usage:  python assemble.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sources")
PROVINCES = ["Connacht", "Leinster", "Munster", "Ulster"]

# Foundation era ends 1927; the Sam Maguire Cup was first presented in 1928.
def format_for(year):
    if year <= 1927:
        return "foundation"
    if year <= 1989:
        return "sam_maguire"
    return None  # 1990+ keep their existing format from championship.json

def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def final_block(fin, capman):
    """Build the all_ireland.final detail from the finals + captains sources."""
    cm = capman or {}
    return {
        "champion_score": fin.get("champion_score"),
        "runner_up_score": fin.get("runner_up_score"),
        "venue": fin.get("venue"),
        "attendance": fin.get("attendance"),
        "replay": fin.get("replay", False),
        "captain": cm.get("captain"),
        "manager": cm.get("manager"),
        "notes": fin.get("notes", ""),
    }

def main():
    ai = load(os.path.join(SRC, "ai_finals.json"))["finals"]
    prov = load(os.path.join(SRC, "provincial_finals.json"))
    early = load(os.path.join(SRC, "ai_semifinals_early.json"))
    capman = load(os.path.join(SRC, "captains_managers.json"))["by_year"]
    existing = load(os.path.join(HERE, "championship.json"))["years"]
    existing_by_year = {y["year"]: y for y in existing}

    early_sf = early["semi_final_losers"]
    early_qf = early["quarter_final_losers"]
    warnings = []
    years_out = []

    # ---- historical years 1887-1989 (1888 has no champion -> skip) ----
    for year in range(1887, 1990):
        ys = str(year)
        if ys not in ai:
            continue  # e.g. 1888

        fin = ai[ys]
        champion = fin["champion"]
        runner_up = fin["runner_up"]

        # provincial finals present this year, cleaning walkover placeholders
        pf = {}
        prov_champs = []
        for p in PROVINCES:
            rec = prov[p].get(ys)
            if not rec:
                continue
            w = rec.get("winner")
            l = rec.get("loser")
            if l == w:           # walkover: no real beaten finalist
                l = ""
            pf[p] = {"winner": w, "loser": l}
            if w:
                prov_champs.append(w)

        # beaten semi-finalists
        if year <= 1928:
            sf_losers = list(early_sf.get(ys, []))
            qf_losers = list(early_qf.get(ys, []))
        else:
            # derive: provincial champions minus the two finalists
            sf_losers = [c for c in prov_champs if c not in (champion, runner_up)]
            qf_losers = []
            if len(sf_losers) != 2:
                warnings.append(
                    f"{year}: derived {len(sf_losers)} semi-final losers "
                    f"{sf_losers} (expected 2); prov champs={prov_champs}, "
                    f"final={champion} v {runner_up}")
            # sanity: finalists should be provincial champions in this era
            for who in (champion, runner_up):
                if who not in prov_champs:
                    warnings.append(
                        f"{year}: finalist {who} is not among provincial "
                        f"champions {prov_champs}")

        years_out.append({
            "year": year,
            "format": format_for(year),
            "provincial_finals": pf,
            "all_ireland": {
                "champion": champion,
                "runner_up": runner_up,
                "semi_final_losers": sf_losers,
                "quarter_final_losers": qf_losers,
                "prelim_qf_losers": [],
                "super8_group_exits": [],
                "group_exits": [],
                "final": final_block(fin, capman.get(ys)),
            },
        })

    # ---- existing years 1990-2025: keep facts verbatim, add final detail ----
    # Guard to >=1990 so re-running on an already-extended file stays idempotent.
    for year in sorted(existing_by_year):
        if year < 1990:
            continue
        obj = existing_by_year[year]
        ys = str(year)
        fin = ai.get(ys)
        if fin:
            obj["all_ireland"]["final"] = final_block(fin, capman.get(ys))
        else:
            warnings.append(f"{year}: no final detail in ai_finals.json")
        years_out.append(obj)

    years_out.sort(key=lambda y: y["year"])

    out = {
        "_README": (
            "Raw placement FACTS for the GAA All-Ireland Senior Football "
            "Championship, 1887-2025 (1888 omitted: championship unfinished). "
            "Contains NO points - points are derived by build.py from params.json. "
            "Each year lists the provincial finals (winner/beaten finalist) and the "
            "All-Ireland series finishing stages, plus all_ireland.final detail "
            "(scoreline, venue, attendance, replay, captain, manager). "
            "GENERATED by assemble.py from the audited files in db/sources/ - edit "
            "those, not this file, then re-run assemble.py. 'best finish only' is "
            "applied at scoring time. Stage lists: semi_final_losers, "
            "quarter_final_losers (early-era extra rounds + 2023+ preliminary QFs "
            "are prelim_qf_losers), super8_group_exits (2018-19), group_exits "
            "(2023+ round-robin). For 1929-1989 the two semi_final_losers are "
            "derived as the provincial champions who did not reach the final."
        ),
        "years": years_out,
    }
    with open(os.path.join(HERE, "championship.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    n = len(years_out)
    print(f"Wrote championship.json: {n} championships "
          f"{years_out[0]['year']}-{years_out[-1]['year']}")
    if warnings:
        print(f"\n{len(warnings)} validation warning(s):")
        for w in warnings:
            print("  ! " + w)
    else:
        print("No validation warnings.")

if __name__ == "__main__":
    main()
