# Match-level archive — schema

Goal: a sourced, match-by-match record of inter-county GAA games — **football and hurling, all
grades, all competitions** (championship, National League, secondary cups), as far back as sources
allow. Distinct from the finishing-position analysis in `db/` (which this can eventually feed).

## Storage layout

```
db/matches/<sport>/<grade>/<year>.json
```
e.g. `db/matches/football/senior/2024.json`. Each file is a JSON **array** of match objects for
that sport+grade+year, across all competitions. League seasons that straddle two calendar years
(pre-2007) place each match in the calendar year it was actually played (by its date).

Why per (sport, grade, year): keeps files small and append-friendly, gives clean diffs, and lets a
single year be re-extracted in isolation. Provenance is preserved at the match level via
`source_url`, so files can mix competitions freely.

## Match object

| key | type | notes |
|-----|------|-------|
| `sport` | string | `football` \| `hurling` |
| `grade` | string | `senior` \| `under20` \| `under21` \| `minor` \| `junior` \| `intermediate` |
| `competition` | string | `all_ireland`, `connacht`/`leinster`/`munster`/`ulster` (provincial), `nfl_div1`..`nfl_div4` / `nhl_*` (league), `tailteann`, etc. |
| `stage` | string | round label, e.g. `Final`, `Semi-final`, `Quarter-final`, `Group 1 Round 2`, `Preliminary quarter-final`, `Round 4 qualifier` |
| `date` | string\|null | ISO `YYYY-MM-DD`; null if the source gives no date |
| `team1`, `team2` | string | county / team name (canonical, e.g. `New York`, `London`) |
| `t1_g`,`t1_p`,`t2_g`,`t2_p` | int\|null | goals and points **stored separately**; total = goals*3 + points (computed in build) |
| `winner` | string | winning team name, or `draw` |
| `venue` | string\|null | as given |
| `attendance` | int\|null | exact figure only; approximate-only figures left null and noted |
| `referee` | string\|null | as given (often `Name (County)`) |
| `notes` | string | replay / after extra time / on penalties / walkover / objection, else `""` |
| `source_url` | string | exact page the match was taken from |

Conventions: do not invent values — use `null`. Record drawn match **and** its replay as two
objects. Scores are Gaelic `goals-points`.

## Pipeline

```bash
cd db/matches
python compile_matches.py     # validates all year files, writes output/matches.csv + summary, prints checks
```

`compile_matches.py` merges every `*.json`, recomputes totals/winner (flagging any mismatch with the
recorded `winner`), and emits a master CSV plus coverage and field-completeness summaries. See
`MANIFEST.md` for the extraction work-queue and what has been collected so far.
