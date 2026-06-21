# GAA Football Championship — Alternative Points Analysis (1990–2025)

An alternative ranking of the **GAA Men's Senior Football All-Ireland Championship** that scores
every county by its **finishing position each year**, rewarding sustained contention rather than
titles alone.

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

The championship's structure changed five times since 1990 (pre-qualifier, qualifier/back-door,
Super 8s, COVID knockout, round-robin); the analysis maps the tiers onto each era. See the **Method**
tab on the site for the per-era detail.

## How it's built — a parameter-driven database

The whole thing is generated from a tiny, auditable database so the scoring can be re-queried without
touching the data:

```
db/
  championship.json   raw results only (provincial finals + All-Ireland stages), NO points
  params.json         the editable scoring table — change values and re-run
  build.py            applies the best-finish rule, emits CSV tables + checksums
  make_site.py        emits docs/data.json for the website
docs/                 the GitHub Pages site (index.html, style.css, app.js, data.json)
```

### Re-running

```bash
cd db
python build.py        # writes db/output/*.csv and prints per-year/era checksums
python make_site.py    # regenerates docs/data.json
```

To try a different system (e.g. reward winning a province more, or change the group-stage tier),
edit `db/params.json` and re-run both scripts. Every table on the site updates from `data.json`.

### Outputs (`db/output/`)

- `results_long.csv` — one row per (year, county): province, provincial result, All-Ireland stage, points
- `points_matrix.csv` — county × year grid of points
- `standings_overall.csv` — cumulative totals, plus per-year and per-scoring-year averages
- `standings_by_era.csv` — points split across the five format eras

## Deployment (GitHub Pages)

The site is the `docs/` folder on the default branch. In **Settings → Pages**, set the source to
*Deploy from a branch*, branch `main`, folder `/docs`. (GitHub Pages on a **private** repository
requires a GitHub Pro/Team/Enterprise plan; on a free plan, make the repository public to publish.)

## Sources

Per-year All-Ireland Senior Football Championship and provincial championship records (Wikipedia),
cross-checked round by round. Data covers the 36 completed championships 1990–2025; the 2026 series is
in progress and not yet included.
