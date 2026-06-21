# GAA Football Championship — Alternative Points Analysis (1887–2025)

An alternative ranking of the **GAA Men's Senior Football All-Ireland Championship** that scores
every county by its **finishing position each year**, rewarding sustained contention rather than
titles alone — now spanning the **full history of the championship, 1887–2025 (138 finals)**, with
the complete finals record (scores, venues, attendances, captains, managers), an all-time roll of
honour, and the National League cross-reference.

**Live site:** _(GitHub Pages — see Deployment below)_

## The points system

Best finish only — a county scores its single highest placement each year.

| Points | Finishing position |
|--------|--------------------|
| 5 | All-Ireland champion |
| 4 | All-Ireland runner-up |
| 3 | Beaten All-Ireland semi-finalist |
| 2 | Beaten All-Ireland quarter-finalist (incl. Super 8s group exit, 2018–19) |
| 1 | Provincial finalist (winner or runner-up), or All-Ireland group-stage / preliminary-QF exit (2023–25) |

The championship's structure changed repeatedly over 138 years — foundation-era knockout (1887–1927),
the settled Sam Maguire knockout (1928–1989), pre-qualifier (1990–2000), qualifier/back-door,
Super 8s, COVID knockout and round-robin; the analysis maps the tiers onto each era. See the
**Method** tab on the site for the per-era detail.

## How it's built — a parameter-driven database

The whole thing is generated from a tiny, auditable database so the scoring can be re-queried without
touching the data:

```
db/
  sources/                  audited raw research, one file per dimension
    ai_finals.json          every final: scores, venue, attendance, replay, notes (1887–2025)
    provincial_finals.json  provincial final winner + beaten finalist, by province & year
    ai_semifinals_early.json beaten semi-finalists for the irregular 1887–1928 era
    captains_managers.json  winning captain + manager per year
  national_league.json      National League (Div 1) finals — the second competition
  assemble.py               stitches sources -> championship.json (with validation)
  championship.json         GENERATED facts: provincial finals + All-Ireland stages + final detail
  params.json               the editable scoring table — change values and re-run
  build.py                  applies the best-finish rule, emits CSV tables + checksums
  make_site.py              emits docs/data.json for the website
docs/                       the GitHub Pages site (index.html + app.js = the points analysis;
                            reference.html + reference.js = finals/records/league; style.css, data.json)
```

The historical record lives in the small, auditable `db/sources/` files. `assemble.py` merges them
into `championship.json`; for the settled 1928–1989 era it **derives** the two beaten semi-finalists
as the provincial champions who didn't reach the final (and validates that the champion and
runner-up were themselves provincial champions, warning on any anomaly).

### Re-running

```bash
cd db
python assemble.py     # rebuilds championship.json from db/sources/ (idempotent, prints warnings)
python build.py        # writes db/output/*.csv and prints per-year/era checksums
python make_site.py    # regenerates docs/data.json
```

To correct a historical fact, edit the relevant file in `db/sources/` and re-run all three. To try a
different scoring system (e.g. reward winning a province more), edit `db/params.json` and re-run the
last two. Every table on the site updates from `data.json`.

### Outputs (`db/output/`)

- `results_long.csv` — one row per (year, county): province, provincial result, All-Ireland stage, points
- `points_matrix.csv` — county × year grid of points
- `standings_overall.csv` — cumulative totals, plus per-year and per-scoring-year averages
- `standings_by_era.csv` — points split across the format eras
- `finals.csv` — every All-Ireland final: score, winning margin, venue, attendance, captain, manager
- `roll_of_honour.csv` — titles, runner-ups, beaten semi-finals and provincial titles per county
- `national_league.csv` — National League Division 1 titles & runner-ups per county
- `doubles.csv` — counties that won the National League and the All-Ireland in the same year
- `overall_performance.csv` — championship + National League points **added** per season (see below)

### Overall annual performance (championship + league)

The championship and the National League are separate competitions run in different parts of the
year, so the *overall* view **adds** their points within a season (rather than taking the best of the
two). Within each competition best-finish still applies (a county scores the highest league tier it
reached that year). The league is scored below the championship, tuned in `params.json` under
`league_points`:

| League result | Points | Equivalent |
|---|---|---|
| Division 1 champion | `2` | championship quarter-final |
| Division 1 runner-up | `1` | provincial final |
| Division 1 semi-final, or any lower-division title | `0.5` | the third tier |

A league title sits below an All-Ireland semi-final (3). The league dates from 1926 (Division 1
semi-finalists where a semi-final stage existed; lower-division titles from 1999 for Division 2 and
2008 for Divisions 3–4), so earlier seasons are championship-only. This rewards league-strong
counties: Mayo rise to 3rd overall on the second-richest league record, and New York register on
their league titles alone. (Combined totals can carry a `.5`.)

## Deployment (GitHub Pages)

The site is the `docs/` folder on the default branch. In **Settings → Pages**, set the source to
*Deploy from a branch*, branch `main`, folder `/docs`. (GitHub Pages on a **private** repository
requires a GitHub Pro/Team/Enterprise plan; on a free plan, make the repository public to publish.)

## Sources & data quality

Per-year All-Ireland and provincial championship records, the lists of All-Ireland finals, winning
captains and managers, and National League finals (Wikipedia), cross-checked round by round. Data
covers the 138 completed championships 1887–2025; the 2026 series is in progress and not yet included.

The champion, runner-up and provincial-title counts reconcile exactly with the canonical roll of
honour (Kerry 39 titles, Dublin 31, Galway 9, …). For 1928–1989 the beaten semi-finalists are derived
and machine-validated; the irregular foundation era (1887–1927) — home/away finals, London and New
York contesting finals, byes and walkovers — was researched year by year, and a handful of
beaten-finalist names in the sparsest early years carry mild uncertainty (flagged in the `notes` of
the relevant `db/sources/` files). Managers are recorded from 1981, when the structured source begins.
These caveats touch a tiny share of points and do not affect the modern standings.
