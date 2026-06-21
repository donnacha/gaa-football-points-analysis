# GAA inter-county match archive

A sourced, match-level database of inter-county Gaelic football and hurling results,
built by trawling online archives (primarily Wikipedia, CC BY-SA). Every match records its
`source_url`. ~13,700 matches and counting.

## Layout

```
db/matches/<sport>/<grade>/<file>.json
```

- `<sport>` — `football` | `hurling`
- `<grade>` — `senior` | `under20` | `under21` | `minor` | `intermediate` | `junior`
- `<file>` — `<year>.json` for a season; `<year>_<comp>.json` for a secondary competition
  in the same folder (e.g. `2023_nfl.json`, `2021_christyring.json`); `finals_*.json` for a
  consolidated finals-only history.

Each file is a JSON array of match objects. See [`SCHEMA.md`](SCHEMA.md) for the 17-key match
object and [`../SOURCES_REGISTER.md`](../SOURCES_REGISTER.md) for the source catalogue.

## Coverage

| Sport | Grade | Competitions | Span |
|-------|-------|--------------|------|
| Football | senior | All-Ireland + 4 provincial championships | **every match 1887–2025** |
| Football | senior | National League (match-level) | 2008–2025 |
| Football | senior | National League Division 1 finals | 1925-26 → 2007 |
| Football | senior | Tailteann Cup (tier 2) | 2022–2025 |
| Football | senior | Tommy Murphy Cup (tier 2, historic) | 2004–2008 |
| Football | under20 / under21 | championship (match-level) | 2018–2025 / 2010–2017 |
| Football | under21 | All-Ireland finals (deep history) | 1964–2017 |
| Football | minor | championship (match-level) | 2018–2025 |
| Football | minor | All-Ireland finals (deep history) | 1929–2017 |
| Football | junior | All-Ireland finals (incl. overseas) | 1912–2025 |
| Hurling | senior | All-Ireland + Leinster/Munster championships | **every match 1887–2025** |
| Hurling | senior | National League (match-level) | 2008–2025 |
| Hurling | senior | National League Division 1 finals | 1925-26 → 2007 |
| Hurling | senior | Joe McDonagh / Christy Ring / Nicky Rackard / Lory Meagher Cups | full modern history |
| Hurling | under20 / under21 | championship (match-level) | 2019–2025 / 2008–2018 |
| Hurling | under21 | All-Ireland finals (deep history) | 1964–2017 |
| Hurling | minor | championship (match-level) | 2018–2025 |
| Hurling | minor | All-Ireland finals (deep history) | 1928–2017 |
| Hurling | intermediate | All-Ireland finals | 1997–2018 |
| Hurling | junior | All-Ireland finals (incl. overseas) | 1912–2004 |

**Known gaps** (need newspaper archives, not on Wikipedia): pre-~1920 provincial early rounds;
National League match-by-match before ~2008; full provincial brackets for the lower grades before
the modern era.

## Scoring convention

GAA scores are written `goals-points` (e.g. `2-14`). A goal is worth 3 points, so the total is
`goals*3 + points`; the higher total wins and **points can beat goals**. Drawn games are recorded
with `winner: "draw"` and (historically) a separate `Final replay` row.

## Building / validating

```sh
python compile_matches.py
```

Globs every `*/*/*.json`, validates the schema, **recomputes every total and independently checks
each winner against the scoreline** (flagging mismatches), de-duplicates, and writes
`output/matches.csv` plus summary breakdowns. The archive currently compiles with **zero validation
warnings**. The validator deliberately skips the winner/score check for rows whose `notes` mark a
penalty shootout, objection/awarded result, disputed source score, or historic scoring rule, and for
null-winner rows (abandoned/void games).

See [`MANIFEST.md`](MANIFEST.md) for the full extraction log, wave-by-wave.
