#!/usr/bin/env python3
"""
Generate docs/data.json for the GitHub Pages site from the database.
Reuses the scoring logic in build.py so the site can never drift from the CSVs.

Emits the standings (unchanged) plus the richer-data sections that power the
new site tabs: every All-Ireland final (score, margin, venue, attendance,
captain, manager), an all-time roll of honour, the National League record with
league+championship "doubles", and a handful of record lists.

Usage:  python make_site.py
"""
import json, os
from collections import defaultdict
from build import load, score_year, score_total, ERA_LABELS, COUNTY_PROVINCE

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.normpath(os.path.join(HERE, "..", "docs"))
os.makedirs(DOCS, exist_ok=True)

UPDATED = "2026-06-21"

def main():
    data = load("championship.json")
    params = load("params.json")
    league = load("national_league.json")["league_finals"]
    years = data["years"]
    all_years = [y["year"] for y in years]

    cumulative = defaultdict(int)
    by_era = defaultdict(lambda: defaultdict(int))
    by_year = defaultdict(dict)
    years_played = defaultdict(int)
    year_totals = {}
    era_years = defaultdict(list)
    era_order = []

    # richer-data accumulators
    finals = []
    titles = defaultdict(int); ai_runner_ups = defaultdict(int); ai_semis = defaultdict(int)
    prov_titles = defaultdict(int); prov_runner_ups = defaultdict(int)
    ai_champ_by_year = {}

    for y in years:
        yr, era = y["year"], y["format"]
        if era not in era_order:
            era_order.append(era)
        era_years[era].append(yr)

        ai = y["all_ireland"]; fin = ai.get("final", {})
        ch, ru = ai["champion"], ai.get("runner_up")
        ai_champ_by_year[yr] = ch
        titles[ch] += 1
        if ru: ai_runner_ups[ru] += 1
        for c in ai.get("semi_final_losers", []): ai_semis[c] += 1
        for p, rec in y["provincial_finals"].items():
            if rec.get("winner"): prov_titles[rec["winner"]] += 1
            if rec.get("loser"): prov_runner_ups[rec["loser"]] += 1
        ct, rt = score_total(fin.get("champion_score")), score_total(fin.get("runner_up_score"))
        finals.append({
            "year": yr, "era": era, "champion": ch, "champion_score": fin.get("champion_score"),
            "runner_up": ru, "runner_up_score": fin.get("runner_up_score"),
            "margin": (ct - rt) if (ct is not None and rt is not None) else None,
            "combined": (ct + rt) if (ct is not None and rt is not None) else None,
            "venue": fin.get("venue"), "attendance": fin.get("attendance"),
            "replay": fin.get("replay", False), "captain": fin.get("captain"),
            "manager": fin.get("manager"),
        })

        scored = score_year(y, params)
        ytot = 0
        for county, r in scored.items():
            p = r["points"]
            cumulative[county] += p
            by_era[era][county] += p
            by_year[county][yr] = p
            if p > 0: years_played[county] += 1
            ytot += p
        year_totals[yr] = ytot

    # Seed every known competing team so contesters that never scored (e.g. New York)
    # still appear in the standings/matrix at 0.
    for c in COUNTY_PROVINCE:
        cumulative[c] += 0
        years_played[c] += 0

    n = len(all_years)
    standings = []
    for rank, county in enumerate(sorted(cumulative, key=lambda c:(-cumulative[c], c)), 1):
        tot, ys = cumulative[county], years_played[county]
        standings.append({
            "rank": rank, "county": county, "total": tot,
            "years_scoring": ys,
            "avg_all": round(tot/n, 2),
            "avg_scoring": round(tot/ys, 2) if ys else 0,
            "by_era": {e: by_era[e].get(county, 0) for e in era_order},
            "by_year": {yr: by_year[county].get(yr, 0) for yr in all_years},
            "best": max((p for p in by_year[county].values()), default=0),
        })

    eras = [{"key": e, "label": ERA_LABELS.get(e, e),
             "years": era_years[e], "total": sum(by_era[e].values())}
            for e in era_order]

    # ---- roll of honour ----
    honour = sorted(set(titles)|set(ai_runner_ups)|set(prov_titles)|set(ai_semis),
                    key=lambda c:(-titles[c], -ai_runner_ups[c], -prov_titles[c], c))
    roll = [{"county": c, "ai_titles": titles[c], "ai_runner_ups": ai_runner_ups[c],
             "ai_semi_finals": ai_semis[c], "provincial_titles": prov_titles[c],
             "provincial_runner_ups": prov_runner_ups[c]} for c in honour]

    # ---- National League record + doubles ----
    nl_titles = defaultdict(int); nl_runner_ups = defaultdict(int)
    for ys, rec in league.items():
        nl_titles[rec["winner"]] += 1
        if rec.get("runner_up"): nl_runner_ups[rec["runner_up"]] += 1
    nl = [{"county": c, "nfl_titles": nl_titles[c], "nfl_runner_ups": nl_runner_ups[c]}
          for c in sorted(set(nl_titles)|set(nl_runner_ups), key=lambda c:(-nl_titles[c], c))]
    doubles = [{"year": yr, "county": league[str(yr)]["winner"]}
               for yr in all_years
               if str(yr) in league and league[str(yr)]["winner"] == ai_champ_by_year.get(yr)]

    # ---- overall annual performance (championship + National League, added) ----
    lp = params.get("league_points", {"champion": 0, "runner_up": 0})
    league_total = defaultdict(int)
    for ys, rec in league.items():
        league_total[rec["winner"]] += lp.get("champion", 0)
        if rec.get("runner_up"):
            league_total[rec["runner_up"]] += lp.get("runner_up", 0)
    for c in COUNTY_PROVINCE:
        league_total[c] += 0
    combined = {c: cumulative[c] + league_total[c] for c in set(cumulative) | set(league_total)}
    overall = []
    for rank, c in enumerate(sorted(combined, key=lambda c:(-combined[c], c)), 1):
        tot = combined[c]
        overall.append({
            "rank": rank, "county": c, "championship": cumulative[c],
            "league": league_total[c], "combined": tot,
            "league_share": round(100*league_total[c]/tot, 1) if tot else 0,
        })

    # ---- record lists ----
    played = [f for f in finals if f["margin"] is not None]
    att = [f for f in finals if f["attendance"]]
    records = {
        "biggest_margins": sorted(played, key=lambda f:-f["margin"])[:8],
        "tightest_finals": sorted([f for f in played if f["margin"] > 0],
                                  key=lambda f: f["margin"])[:8],
        "highest_scoring": sorted([f for f in finals if f["combined"] is not None],
                                  key=lambda f:-f["combined"])[:8],
        "biggest_crowds": sorted(att, key=lambda f:-f["attendance"])[:8],
    }
    most_titles = roll[0]

    out = {
        "meta": {
            "span": f"{min(all_years)}-{max(all_years)}",
            "n_years": n, "grand_total": sum(year_totals.values()),
            "updated": UPDATED,
            "most_titles": {"county": most_titles["county"], "n": most_titles["ai_titles"]},
            "n_doubles": len(doubles),
        },
        "params": params,
        "eras": eras,
        "years": all_years,
        "year_totals": year_totals,
        "standings": standings,
        "overall": overall,
        "league_points": params.get("league_points", {}),
        "finals": finals,
        "roll_of_honour": roll,
        "national_league": nl,
        "doubles": doubles,
        "records": records,
    }
    with open(os.path.join(DOCS, "data.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"Wrote {os.path.join(DOCS,'data.json')}  "
          f"({len(standings)} counties, {n} years {out['meta']['span']}, "
          f"{len(finals)} finals, {len(doubles)} doubles)")

if __name__ == "__main__":
    main()
