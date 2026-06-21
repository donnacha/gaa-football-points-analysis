# Match-level archive — extraction manifest & progress

Scope agreed 2026-06-21: **football + hurling, all grades, all competitions** (championship +
National League + secondary cups), as deep as sources allow, using all sources for coverage.
Provenance recorded per match (`source_url`). See `SCHEMA.md` for the data model and
`../SOURCES_REGISTER.md` for the source catalogue.

This is a large, multi-wave build. Extraction agents write directly into
`db/matches/<sport>/<grade>/<year>.json`; `compile_matches.py` validates and compiles.

## Priority order (waves)

1. **Football senior championship** (All-Ireland + 4 provincial), 2025 → 1990 → … → 1887. *(in progress)*
2. **Football senior National League**, modern (full match-level) ~2008 → 2025, then finals/standings back.
3. **Hurling senior championship** (All-Ireland + Leinster/Munster + others), 2025 → back.
4. **Hurling senior National League**, modern → back.
5. **Tailteann Cup** (football, 2022→) and other secondary inter-county cups.
6. **Under-20 / U21** football & hurling championships.
7. **Minor** football & hurling championships.
8. **Junior/Intermediate** inter-county where available.

Within each wave: modern years first (richest fields), working backwards; spot-check against a
second source (JTurek CSV 2016–23, gaa.world, HoganStand) where available.

## Progress log

| Wave | Sport | Grade | Competition | Years done | Matches | Notes |
|------|-------|-------|-------------|-----------|---------|-------|
| 1 | football | senior | championship (AI+prov) | **1887–2025 COMPLETE** | **4796** | every season, validated (0 warnings) |

✅ **Wave 1 complete: football senior championship 1887–2025 — 4796 matches, 139 seasons, 0 warnings.**
Field completeness: venue 98%, date 95%, referee 57%, attendance 33% (early decades sparse).
Compiler validator skips winner/score check for notes containing penalt / source-score-disputed /
objection / awarded / era-scoring, and for null-winner rows (abandoned/void).

| 2 | football | senior | National League (all divs) | 2008–2025 | 1964 | full match-by-match; 2008 partial (page lists only Div1 RR + 4 finals) |

Running total: **6760 matches** (football championship 1887–2025 + NFL 2008–2025).
✅ Wave 2 essentially complete to the limit of reliable match-level data (2008–2025). **Pre-2008
NFL** (two-year en-dash seasons) is finals/standings-only on Wikipedia — DEFERRED as an optional
later finals-only sub-wave (db/matches… `<year>_nfl.json`), not worth full waves now.
| 3 | hurling | senior | championship (AI+Lein+Mun) | **1887–2025 COMPLETE** | **2029** | every season; founding open-draw era + abandoned 1888; Ulster SHC excluded |

✅ **Wave 3 complete: hurling senior championship 1887–2025 — 2029 matches, 0 warnings.**
✅✅ Both senior championships (football + hurling) now fully archived 1887–2025.

Running total: **8789 matches across 296 files** (football champ 1887–2025; football NFL 2008–2025;
hurling SHC 1887–2025). Zero validation warnings.
| 4 | hurling | senior | National League (all divs) | 2008–2025 | 1619 | Div structure varies; lower divs thin to finals/standings 2008-10 (match-level floor) |

✅ **Wave 4 complete to the match-level limit: hurling NHL 2008–2025.**
🎯 **Archive past 10,000 matches.** Both senior codes now have championship + league archived to the
data floor: football senior 6760, hurling senior 3648.

Running total: **10408 matches across 314 files** (football champ 1887–2025 + NFL 2008–2025;
hurling SHC 1887–2025 + NHL 2008–2025). Zero validation warnings.
| 5 | football | senior | Tailteann Cup (tier 2) | 2022–2025 | 85 | inaugural 2022 knockout; 2024 group stage not on Wikipedia (knockout only) |

✅ Wave 5 complete (Tailteann Cup 2022–2025).

| 6 | football | under20 | championship (AI+prov) | 2018–2025 | 337 | U20 football began 2018; full provincial+AI |
| 6 | football | under21 | championship (AI+prov) | 2010–2017 | 171 | U21 predecessor; provincial coverage patchy on Wikipedia some years |

| 6 | football | under21 | championship (AI+prov) | 2002–2017 (partial) | 189 | pre-2010 sparse: many years AI-series-only or no Wikipedia page |

Running total: **11019 matches across 339 files**. Zero validation warnings.

**Coverage finding (lower grades):** U21 football per-year Wikipedia pages don't exist for several
pre-2010 years (2000-01, 2003, 2005-06 = 404) and most others carry only the All-Ireland series.
Per-year extraction hits diminishing returns pre-~2008 for lower grades. **Strategy for deep history:
use the "List of All-Ireland <grade> <sport> Championship finals" pages** (one fetch = every final)
rather than ~60 near-empty per-year fetches. Modern years (2008/2018+) still extracted per-year (rich).

| 6 | hurling | under20 | championship (AI+Lein+Mun) | 2019–2025 | 170 | U20 hurling began 2019 (2018 was still U21); often AI final only (no AI semis) |
| 6 | hurling | under21 | championship (AI+Lein+Mun) | 2008–2018 | 144 | Ulster U21 hurling excluded (out of scope) |

| 6 | football | minor | championship (AI+prov) | 2018–2025 | ~424 | U17; rich provincial+AI |
| 6 | hurling | minor | championship (AI+Lein+Mun) | 2018–2025 | ~282 | U17; Leinster tiered groups feed one knockout |

🎯 **Archive past 12,000 matches.** Modern era (2018+) now complete across all four lower-grade/sport
combos (U20/U21 + minor, football + hurling).
Running total: **12039 matches across 373 files**. Zero validation warnings.

| 7 | football/hurling | under21/minor | All-Ireland FINALS (deep history) | minor 1928/29–2017, U21 1964–2017 | ~299 | finals-only; date often null (year in notes); dedup vs per-year copies |

Running total: **12330 matches across 377 files**. Zero validation warnings (10 null-date final
dupes auto-removed). Compiler now de-duplicates (null-date finals collapse into dated per-year copies;
two dated records only collapse on identical date).

✅ Wave 7 done: lower grades now have finals-level deep history (minor back to 1928/29, U21 to 1964).

| 8 | football/hurling | senior | NFL/NHL Division 1 FINALS (deep history) | 1925-26 → 2006-07 | ~140 | finals-only; winner-only for some early league-table seasons; dedup vs 2008+ |

Running total: **12482 matches across 379 files**. Zero validation warnings.
✅ Wave 8 done: both national leagues now have Division 1 finals back to 1925-26. **Primary
competitions (championship + league, both codes, all grades) are now complete to the limit of
Wikipedia coverage.**

| 9 | hurling | senior | Joe McDonagh Cup (tier 2) | 2018–2025 | 111 | round-robin + final (no semis); relegation play-offs included |

| 9 | hurling | senior | Christy Ring Cup (tier 3) | 2018–2025 | 114 | group/RR + knockout + final; walkovers, penalties, play-offs handled |

| 9 | hurling | senior | Nicky Rackard Cup (tier 4) | 2018–2025 | 111 | group/RR + knockout + final; draws/walkovers handled |
| 9 | hurling | senior | Lory Meagher Cup (tier 5) | 2018–2025 | 91 | lowest tier; small fields; 2020 COVID-reduced (4 matches) |

🏑 **Full modern hurling tier pyramid complete** (senior SHC + Joe McDonagh + Christy Ring + Nicky
Rackard + Lory Meagher, 2018–2025): every county fielding a hurling team is now in the database.
Running total: **12909 matches across 411 files**. Zero validation warnings.

| 9 | hurling | senior | Christy Ring Cup deep history | 2005–2017 | ~227 | back to 2005 inception; full group stages early years; → Christy Ring total 341 (2005–2025) |

| 9 | hurling | senior | Nicky Rackard Cup deep history | 2005–2017 | ~192 | back to 2005 inception; → Nicky Rackard total 303 (2005–2025) |

🎯 **Archive past 13,000 matches.** Running total: **13328 matches across 437 files**. Zero warnings.
Next: **Lory Meagher back to 2009**, plus the **Tommy Murphy Cup** (football tier-2, 2004–2008,
pre-Tailteann). Then modern competition coverage is essentially exhausted.
Deferred (needs newspaper archives, not on Wikipedia): pre-1920 provincial early rounds; full
provincial brackets for lower grades pre-modern; league match-by-match pre-2008.

### Spot-check / verify later (added)
- 1918 Leinster SF Wexford 1-0 v Offaly 6-0: score implies Offaly but Wexford contested the
  Leinster final — likely a mis-transcribed score; recorded as-sourced (winner=Offaly), verify later.
Compiler skips the winner/score check for null-winner rows (abandoned/void) and for notes
containing "objection"/"awarded"/"penalt"/"source-score-disputed".

### Spot-check / verify later (added)
- 1939 Ulster final: first game (Cavan 2-6, Armagh 2-4) abandoned (crowd encroachment, Cavan
  leading) → winner null; replay 13 Aug won by Cavan. Verified against source.

### Spot-check / verify later (added)
- 1955 Leinster SF Dublin v Offaly: Wikipedia score (Dublin 2-3, Offaly 1-9) contradicts the fact
  that Dublin advanced and won the Leinster final; winner set to Dublin, score kept as-sourced and
  tagged `[source-score-disputed]` (compiler skips the winner/score check for such rows). Find the
  correct scoreline from a second source when convenient. Then wave 2 (senior football National League),
wave 3+ (hurling, then lower grades). Note: ~6 Wikipedia prose winner-labels contradicted the
scorelines and were corrected by recomputing from goals*3+points (all caught by compile_matches.py).

_Update this table after each extraction wave (run `compile_matches.py` for counts)._

### Spot-check / verify later
- 2021 Ulster SF Armagh 2-21 v Monaghan 4-17: recorded as regular time per Wikipedia, but widely
  remembered as a.e.t./penalties — confirm against a second source.
- 2020.json wrote 32 valid matches (agent summary said 33 — its miscount; file is correct).

## Known data-quality notes
- Attendances frequently null on Wikipedia, esp. league/qualifier rounds and pre-1990; approximate-
  only figures are left null with a note.
- Some provincial referees missing for modern Leinster rounds.
- Pre-~1920 provincial early rounds are the biggest genuine gap → may require newspaper archives.
- League match-by-match only reliable from ~2008; earlier league years = finals/standings.
