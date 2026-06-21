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
| 1 | football | senior | championship (AI+prov) | 1930–2024 | 3730 | full field set, validated (0 warnings) |

Running total: **3730 matches** (football senior championship, 1930–2024).
Next: continue wave 1 backwards (1920s → 1887, via /loop). The 1920s are genuinely messy
(finals played years late, incomplete provinces, objections) — verify heavily.
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
