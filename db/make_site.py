#!/usr/bin/env python3
"""
Generate docs/data.json for the GitHub Pages site from the database.
Reuses the scoring logic in build.py so the site can never drift from the CSVs.

Usage:  python make_site.py
"""
import json, os
from collections import defaultdict
from build import load, score_year, ERA_LABELS

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.normpath(os.path.join(HERE, "..", "docs"))
os.makedirs(DOCS, exist_ok=True)

UPDATED = "2026-06-21"

def main():
    data = load("championship.json")
    params = load("params.json")
    years = data["years"]
    all_years = [y["year"] for y in years]

    cumulative = defaultdict(int)
    by_era = defaultdict(lambda: defaultdict(int))
    by_year = defaultdict(dict)
    years_played = defaultdict(int)
    year_totals = {}
    era_years = defaultdict(list)
    era_order = []

    for y in years:
        yr, era = y["year"], y["format"]
        if era not in era_order:
            era_order.append(era)
        era_years[era].append(yr)
        scored = score_year(y, params)
        ytot = 0
        for county, r in scored.items():
            p = r["points"]
            cumulative[county] += p
            by_era[era][county] += p
            by_year[county][yr] = p
            if p > 0:
                years_played[county] += 1
            ytot += p
        year_totals[yr] = ytot

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

    out = {
        "meta": {
            "span": f"{min(all_years)}-{max(all_years)}",
            "n_years": n, "grand_total": sum(year_totals.values()),
            "updated": UPDATED,
        },
        "params": params,
        "eras": eras,
        "years": all_years,
        "year_totals": year_totals,
        "standings": standings,
    }
    with open(os.path.join(DOCS, "data.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)
    print(f"Wrote {os.path.join(DOCS,'data.json')}  "
          f"({len(standings)} counties, {n} years, total {out['meta']['grand_total']})")

if __name__ == "__main__":
    main()
