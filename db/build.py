#!/usr/bin/env python3
"""
Build the GAA alternative-points tables from raw facts + editable parameters.

Source of truth : championship.json   (facts only, no points)
Parameters      : params.json         (edit these and re-run to re-query)
Outputs (CSV)   : output/results_long.csv      one row per (year, county)
                  output/points_matrix.csv      county x year grid of points
                  output/standings_overall.csv  cumulative + per-year-average
                  output/standings_by_era.csv   one column per format era

Scoring rule: BEST FINISH ONLY. A county's points in a year =
    max(provincial-result points, All-Ireland-series stage points).
This is applied automatically, so beaten provincial finalists who go deep
via the back door are scored at their deepest stage, not at 1.

Usage:  python build.py
"""
import json, csv, os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "output")
os.makedirs(OUT, exist_ok=True)

# Static county -> province lookup (used for All-Ireland-series teams that were
# NOT provincial finalists, e.g. qualifier-route runs). Finalists' province is
# read directly from the provincial_finals block, so this is only a fallback.
COUNTY_PROVINCE = {
    # Connacht
    "Galway":"Connacht","Mayo":"Connacht","Roscommon":"Connacht","Sligo":"Connacht",
    "Leitrim":"Connacht","London":"Connacht","New York":"Connacht",
    # Leinster
    "Dublin":"Leinster","Meath":"Leinster","Kildare":"Leinster","Laois":"Leinster",
    "Offaly":"Leinster","Westmeath":"Leinster","Wexford":"Leinster","Louth":"Leinster",
    "Longford":"Leinster","Carlow":"Leinster","Wicklow":"Leinster","Kilkenny":"Leinster",
    # Munster
    "Kerry":"Munster","Cork":"Munster","Limerick":"Munster","Clare":"Munster",
    "Tipperary":"Munster","Waterford":"Munster",
    # Ulster
    "Tyrone":"Ulster","Armagh":"Ulster","Donegal":"Ulster","Derry":"Ulster",
    "Monaghan":"Ulster","Down":"Ulster","Cavan":"Ulster","Antrim":"Ulster",
    "Fermanagh":"Ulster",
}

# Map the JSON stage-list keys to the params.json point keys.
STAGE_LISTS = {
    "semi_final_losers":   "semi_final_loser",
    "quarter_final_losers":"quarter_final_loser",
    "super8_group_exits":  "super8_group_exit",
    "prelim_qf_losers":    "prelim_qf_loser",
    "group_exits":         "group_exit",
}

ERA_LABELS = {
    "foundation":"foundation era (1887-1927)",
    "sam_maguire":"Sam Maguire knockout (1928-1989)",
    "pre_qualifier":"pre-qualifier (1990-2000)",
    "qualifier":"qualifier/back-door (2001-17, 2022)",
    "super8":"Super 8s (2018-19)",
    "knockout_covid":"COVID knockout (2020-21)",
    "round_robin":"round-robin (2023-25)",
}

def load(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return json.load(f)

def province_of(county, prov_finals):
    for prov, fin in prov_finals.items():
        if county in (fin.get("winner"), fin.get("loser")):
            return prov
    return COUNTY_PROVINCE.get(county, "?")

def score_year(yobj, params):
    """Return {county: {province, format, prov_finish, ai_finish, points}}."""
    ai_pts = params["all_ireland_stage_points"]
    prov_pts = params["provincial_points"]
    fmt = yobj["format"]
    pf = yobj["provincial_finals"]
    ai = yobj["all_ireland"]

    rows = {}
    def ensure(c):
        if c not in rows:
            rows[c] = {"province":province_of(c, pf), "format":fmt,
                       "prov_finish":"", "ai_finish":"", "points":0}
        return rows[c]

    # provincial results
    for prov, fin in pf.items():
        if fin.get("winner"):
            ensure(fin["winner"])["prov_finish"] = "champion"
        if fin.get("loser"):
            ensure(fin["loser"])["prov_finish"] = "runner_up"

    # all-ireland-series results
    if ai.get("champion"):
        ensure(ai["champion"])["ai_finish"] = "champion"
    if ai.get("runner_up"):
        ensure(ai["runner_up"])["ai_finish"] = "runner_up"
    for list_key, pt_key in STAGE_LISTS.items():
        for c in ai.get(list_key, []):
            ensure(c)["ai_finish"] = pt_key

    # best-finish-only scoring
    for c, r in rows.items():
        p_prov = prov_pts.get(r["prov_finish"], 0) if r["prov_finish"] else 0
        p_ai = ai_pts.get(r["ai_finish"], 0) if r["ai_finish"] else 0
        r["points"] = max(p_prov, p_ai)
    return rows

def score_total(s):
    """Convert a GAA score string 'g-pp' to total points (goal = 3). None-safe."""
    if not s or "-" not in s:
        return None
    try:
        g, p = s.split("-")
        return int(g) * 3 + int(p)
    except ValueError:
        return None

def main():
    data = load("championship.json")
    params = load("params.json")
    years = data["years"]
    try:
        league = load("national_league.json")["league_finals"]
    except FileNotFoundError:
        league = {}

    # ---- results_long.csv + gather totals ----
    long_rows = []
    cumulative = defaultdict(int)
    by_era = defaultdict(lambda: defaultdict(int))   # era -> county -> pts
    years_played = defaultdict(int)                   # county -> count of years scoring >0
    year_totals = {}
    matrix = defaultdict(dict)                        # county -> {year: pts}
    all_years = [y["year"] for y in years]

    # roll-of-honour + finals accumulators (richer-data queries)
    finals_rows = []
    titles = defaultdict(int)        # All-Ireland titles
    ai_runner_ups = defaultdict(int)
    ai_semis = defaultdict(int)      # beaten All-Ireland semi-finalists (3-pt tier)
    prov_titles = defaultdict(int)   # provincial championships won
    prov_runner_ups = defaultdict(int)

    for y in years:
        yr = y["year"]; era = y["format"]
        ai = y["all_ireland"]
        fin = ai.get("final", {})
        ch, ru = ai.get("champion"), ai.get("runner_up")
        titles[ch] += 1
        if ru:
            ai_runner_ups[ru] += 1
        for c in ai.get("semi_final_losers", []):
            ai_semis[c] += 1
        for p, rec in y["provincial_finals"].items():
            if rec.get("winner"):
                prov_titles[rec["winner"]] += 1
            if rec.get("loser"):
                prov_runner_ups[rec["loser"]] += 1
        ct, rt = score_total(fin.get("champion_score")), score_total(fin.get("runner_up_score"))
        margin = (ct - rt) if (ct is not None and rt is not None) else ""
        finals_rows.append([
            yr, era, ch, fin.get("champion_score") or "", ru,
            fin.get("runner_up_score") or "", margin,
            fin.get("venue") or "", fin.get("attendance") if fin.get("attendance") is not None else "",
            "yes" if fin.get("replay") else "", fin.get("captain") or "", fin.get("manager") or "",
        ])

        scored = score_year(y, params)
        ytot = 0
        for county, r in sorted(scored.items()):
            long_rows.append([yr, era, county, r["province"],
                              r["prov_finish"], r["ai_finish"], r["points"]])
            cumulative[county] += r["points"]
            by_era[era][county] += r["points"]
            matrix[county][yr] = r["points"]
            if r["points"] > 0:
                years_played[county] += 1
            ytot += r["points"]
        year_totals[yr] = ytot

    # Seed every known competing team so teams that contested the championship but
    # never reached a points-scoring stage (e.g. New York in the Connacht SFC) still
    # appear in the standings at 0 rather than vanishing.
    for c in COUNTY_PROVINCE:
        cumulative[c] += 0
        years_played[c] += 0

    with open(os.path.join(OUT,"results_long.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year","format","county","province","prov_finish","ai_finish","points"])
        w.writerows(long_rows)

    # ---- points_matrix.csv (county x year) ----
    with open(os.path.join(OUT,"points_matrix.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["county"]+all_years+["total"])
        for county in sorted(cumulative, key=lambda c:(-cumulative[c], c)):
            w.writerow([county]+[matrix[county].get(yr,0) for yr in all_years]+[cumulative[county]])

    # ---- standings_overall.csv ----
    n_years = len(all_years)
    with open(os.path.join(OUT,"standings_overall.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rank","county","total_points","years_scoring","avg_per_year_all","avg_per_scoring_year"])
        rank = 0
        for county in sorted(cumulative, key=lambda c:(-cumulative[c], c)):
            rank += 1
            tot = cumulative[county]; ys = years_played[county]
            w.writerow([rank, county, tot, ys,
                        round(tot/n_years,2), round(tot/ys,2) if ys else 0])

    # ---- standings_by_era.csv ----
    eras = [e for e in ERA_LABELS if e in by_era] + [e for e in by_era if e not in ERA_LABELS]
    with open(os.path.join(OUT,"standings_by_era.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["county"]+[ERA_LABELS.get(e,e) for e in eras]+["total"])
        for county in sorted(cumulative, key=lambda c:(-cumulative[c], c)):
            w.writerow([county]+[by_era[e].get(county,0) for e in eras]+[cumulative[county]])

    # ---- finals.csv (every All-Ireland final, with margin/venue/attendance) ----
    with open(os.path.join(OUT,"finals.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year","era","champion","champion_score","runner_up","runner_up_score",
                    "margin","venue","attendance","replay","captain","manager"])
        w.writerows(finals_rows)

    # ---- roll_of_honour.csv (titles / runner-ups / semis / provincial titles) ----
    honour = sorted(set(titles)|set(ai_runner_ups)|set(prov_titles)|set(ai_semis),
                    key=lambda c:(-titles[c], -ai_runner_ups[c], -prov_titles[c], c))
    with open(os.path.join(OUT,"roll_of_honour.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["county","ai_titles","ai_runner_ups","ai_semi_finals",
                    "provincial_titles","provincial_runner_ups"])
        for c in honour:
            w.writerow([c, titles[c], ai_runner_ups[c], ai_semis[c],
                        prov_titles[c], prov_runner_ups[c]])

    # ---- national_league.csv + doubles.csv (league record + league/championship doubles) ----
    nl_titles = defaultdict(int); nl_runner_ups = defaultdict(int)
    for yr_s, rec in league.items():
        nl_titles[rec["winner"]] += 1
        if rec.get("runner_up"):
            nl_runner_ups[rec["runner_up"]] += 1
    with open(os.path.join(OUT,"national_league.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["county","nfl_division1_titles","nfl_division1_runner_ups"])
        for c in sorted(set(nl_titles)|set(nl_runner_ups), key=lambda c:(-nl_titles[c], c)):
            w.writerow([c, nl_titles[c], nl_runner_ups[c]])

    ai_champ_by_year = {y["year"]: y["all_ireland"]["champion"] for y in years}
    with open(os.path.join(OUT,"doubles.csv"),"w",newline="",encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year","county","note"])
        for yr in all_years:
            lr = league.get(str(yr))
            if lr and lr["winner"] == ai_champ_by_year.get(yr):
                w.writerow([yr, lr["winner"], "National League + All-Ireland in the same year"])

    # ---- console summary + checksums ----
    print(f"Years loaded: {min(all_years)}-{max(all_years)}  ({n_years} championships)")
    print("\nPer-year point totals (checksum aid):")
    for yr in all_years:
        print(f"  {yr}: {year_totals[yr]}")
    print(f"\nGrand total distributed: {sum(year_totals.values())}")
    print("\nPer-era totals:")
    for e in eras:
        print(f"  {ERA_LABELS.get(e,e)}: {sum(by_era[e].values())}")

    print("\nTop 15 overall:")
    rank=0
    for county in sorted(cumulative, key=lambda c:(-cumulative[c], c))[:15]:
        rank+=1
        print(f"  {rank:>2}. {county:<11} {cumulative[county]:>3}  "
              f"(avg/yr {cumulative[county]/n_years:.2f})")
    print(f"\nOutputs written to: {OUT}")

if __name__ == "__main__":
    main()
