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
| 3 | hurling | senior | championship (AI+Lein+Mun) | 2014–2025 | 331 | round-robin from 2018; qualifier era 2014-17; some provincial pages 404→sourced from AI page |

Running total: **7091 matches** (football 1887–2025 champ + NFL 2008–2025; hurling SHC 2014–2025).
Wave 3 in progress — hurling SHC (Liam MacCarthy). Joe McDonagh / lower tiers excluded (optional
later). Next: hurling SHC 2008–2013, then back to ~1887. Then wave 4 (hurling NHL),
wave 5+ (Tailteann Cup, U20/U21, minor).
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
