# SSOT — Scoring methodology: provincial rounds as All-Ireland bracket

**Single source of truth for *why* the points system is shaped the way it is.** The *what* lives in
code (`db/params.json` for the dials, `db/build.py` for the scoring, `db/assemble.py` for the facts);
this document records the thinking, the structural options we weighed, and the considerations that
decided them, so the design can be revisited without re-deriving the argument.

Status: **current default is "provincial-bracket credit ON"** (the 2s and 1s). Adopted after the
cross-era points-per-year analysis below.

---

## 1. The problem this system exists to solve

We rank counties across the **full history of the All-Ireland Senior Football Championship
(1887–2025)** by *finishing position each year*, rewarding sustained contention rather than titles
alone. The hard part is that the competition's **structure changed repeatedly** over 138 years, so
"how far you got" means different things in different eras. The scoring has to map every era onto one
comparable ladder.

The ladder (best finish only — a county scores its single highest placement each year):

| Points | Finishing position |
|-------:|--------------------|
| 5 | All-Ireland champion |
| 4 | All-Ireland runner-up |
| 3 | Beaten All-Ireland semi-finalist |
| 2 | Beaten All-Ireland quarter-finalist (or era-equivalent) |
| 1 | Lowest scoring tier — preliminary / group-stage / provincial-final exit (or era-equivalent) |

The recurring difficulty is the **2-tier and 1-tier**, because not every era *had* an All-Ireland
quarter-final or a preliminary round. That is the subject of this document.

---

## 2. The structural insight

In the **pure-knockout eras** the four provincial champions went *straight* to the two All-Ireland
semi-finals. There was **no real All-Ireland quarter-final** — so on a naïve reading, "nobody scores
a 2," and the 2-tier sits empty for those decades.

But the provincial championships are not separate from the All-Ireland bracket — they **are its lower
rounds**. Eight teams contest the four provincial finals; four winners advance to the two All-Ireland
semis. That 8→4 round is, structurally, exactly a quarter-final. One round deeper, the provincial
semi-finals are the de-facto preliminary round (16→8). So the bracket, extended downward through the
provincial rounds, is:

| All-Ireland bracket position | Who actually contests it (knockout eras) | Tier |
|---|---|---:|
| Final | the two finalists | 5 / 4 |
| Semi-final loser | the 2 provincial champions who missed the final | 3 |
| **de-facto quarter-final loser** | **beaten provincial finalist** | **2** |
| **de-facto preliminary loser** | **beaten provincial semi-finalist** | **1** |
| below that (provincial QF / 1st-round losers) | — | 0 |

This maps cleanly onto the existing `quarter_final_loser: 2` and `prelim_qf_loser: 1` tiers — **no new
point values are invented**, only a rule that routes provincial-round losers to them in the eras that
lack a real All-Ireland equivalent.

---

## 3. The structural options we weighed

The choice hinges on **what the number is meant to measure**:

| Option | Beaten provincial finalist | Beaten provincial semi-finalist | Reading |
|---|---|---|---|
| **A. All-Ireland progression only** | 1 (provincial runner-up) | 0 | The series *starts* at the All-Ireland semi; provincial competitions are separate. "No 2s" is correct. |
| **B. Finalists-only credit** | 2 | 0 | Promote the provincial final to a de-facto QF, but go no deeper. |
| **C. Full bracket credit (CHOSEN)** | 2 | 1 | The provincial rounds *are* the lower All-Ireland rounds; ladder fully populated 3→2→1. |

Note the 1-tier was **already occupied** under Option A — by the beaten provincial finalists. Option C
does two things: it *promotes* those finalists from 1 to 2, and it *introduces* the beaten provincial
semi-finalists as the new occupants of the 1-tier (a group that previously scored nothing).

### Considerations that bore on the choice

- **Province-size asymmetry (argues against a clean bracket reading).** A real quarter-final round is
  symmetric — eight equal teams. The provinces were not: Leinster/Ulster ran more teams (more rounds)
  than Munster/Connacht, so "beaten provincial finalist" did not represent a uniform depth of
  achievement across the four provinces. We accept this as a known imperfection; it is second-order
  next to the cross-era distortion in §4.
- **Qualifier-era integrity (argues for limiting the credit to no-QF eras).** From 2001 a beaten
  provincial finalist could re-enter via the back door and reach the *real* All-Ireland quarter-final
  or beyond. That depth is already captured by best-finish. Crediting the provincial round as a QF in
  those eras would double-count, so the credit must be **scoped to eras with no real All-Ireland QF**.
- **Best-finish makes the credit purely additive.** Because a county always scores its single highest
  placement, the credit can only ever *raise* a county's points, never lower them. Promoting a
  provincial champion is moot (they score 3+ via the All-Ireland semi anyway); the credit only bites
  for teams whose deepest run *was* the provincial final or semi-final.

---

## 4. Why Option C is the default — cross-era fairness

The decisive evidence is **how many points each era distributes per championship**. If the
no-QF eras hand out fewer points than the modern formats, every pre-2001 county is structurally
penalised in the all-time cumulative table (and in any per-year average).

| Era | Yrs | pts/yr — Option A (off) | pts/yr — Option C (default) |
|---|---:|---:|---:|
| foundation 1887–1927 | 40 | 17.6 | 17.6 |
| Sam Maguire knockout 1928–89 | 62 | 19.0 | **30.8** |
| pre-qualifier 1990–2000 | 11 | 19.0 | **31.0** |
| qualifier / back-door 2001–17, 22 | 18 | 25.7 | 25.7 |
| Super 8s 2018–19 | 2 | 25.5 | 25.5 |
| COVID knockout 2020–21 | 2 | 19.0 | **31.0** |
| round-robin 2023–25 | 3 | 31.0 | 31.0 |

Under Option A the knockout eras gave out **19 pts/yr** against the round-robin era's **31** — a county
in 1955 played for two-thirds of the points available to a county in 2024. Option C lifts the no-QF
eras to **~31 pts/yr, level with the round-robin era**, removing the bias.

**Effect on the table:** grand total distributed rises **2736 → 3624** (+888). The redistribution
rewards the perennial "nearly" counties the old scheme flattened to 1s and 0s — biggest gainers:
Tipperary +55, Sligo +54, Roscommon +48, Cork +47, Clare +43, Leitrim +40. The head of the table is
stable (Kerry, Dublin); the mid-table compresses.

---

## 5. Era-by-era mapping (as implemented)

| Era | Format key | Real All-Ireland QF? | Provincial-bracket credit |
|---|---|---|---|
| 1887–1927 foundation | `foundation` | irregular | **No** — see §6 |
| 1928–1989 Sam Maguire knockout | `sam_maguire` | No | **Yes** (2s + 1s) |
| 1990–2000 pre-qualifier | `pre_qualifier` | No | **Yes** (2s + 1s) |
| 2001–2017, 2022 qualifier | `qualifier` | Yes | No — scored directly |
| 2018–2019 Super 8s | `super8` | Yes (group of 8) | No — scored directly |
| 2020–2021 COVID knockout | `knockout_covid` | No | **Yes** (2s + 1s) |
| 2023–2025 round-robin | `round_robin` | Yes (+ prelim QF) | No — scored directly |

---

## 6. Open considerations / future structural questions

- **Foundation era (1887–1927) is now the low outlier (17.6 pts/yr).** It is deliberately excluded:
  irregular formats, London/New York entrants, and no clean four-province bracket, plus it is the
  least-certain data in the database. If cross-era fairness is the goal, this is the next era to
  examine — but it needs a bespoke mapping, not the §2 rule applied blindly.
- **Qualifier & Super 8s eras sit slightly *below* the no-QF eras now (25.7/25.5 vs 31).** They reach a
  lower per-year total because they credit no provincial semi-finalists *and* have no deep group stage.
  This is defensible (those were genuinely narrower formats), but if exact parity is wanted, the
  candidate move is to extend a provincial-semi-final ("1") credit into the qualifier era too. Not
  done — flagged for discussion.
- **Province-size asymmetry (§3)** remains an accepted imperfection. A weighting by province size was
  considered out of scope.

---

## 7. The toggle — how to change the policy without touching data

All of the above is governed by one block in `db/params.json`; edit it and re-run the pipeline to
re-query. The facts never change.

```jsonc
"provincial_bracket_credit": {
  "enabled": true,
  "eras": ["sam_maguire", "pre_qualifier", "knockout_covid"],
  "count_provincial_final_as_qf": true,          // the 2s
  "count_provincial_semifinal_as_prelim": true,  // the 1s
  "final_loser_tier": "quarter_final_loser",      // which tier the 2s route to
  "semifinal_loser_tier": "prelim_qf_loser"       // which tier the 1s route to
}
```

- **Revert to Option A:** `enabled: false`.
- **Option B (finalists-only):** `count_provincial_semifinal_as_prelim: false`.
- **Add/remove an era** (e.g. extend to the qualifier era, or drop COVID): edit `eras`.

The two `count_*` switches are independent, and the `*_tier` keys let the credit point at any tier in
`all_ireland_stage_points` without code changes.

---

## 8. Data provenance — where the 1s come from

The **2s** (beaten provincial finalists) were always in the facts:
`championship.json → provincial_finals[<prov>].loser`.

The **1s** (beaten provincial semi-finalists) are **derived from the match archive**
(`db/matches/football/senior/<year>.json`) by `assemble.py` and written into
`championship.json → provincial_finals[<prov>].semi_final_losers` for the no-QF eras (1928–2000 and
2020–21). Derivation rule: *teams that contested a provincial semi-final, minus the two provincial
finalists* — robust to drawn-and-replayed semis. This is the first place the match archive "feeds"
the finishing-position analysis, as its schema always anticipated.

---

## 9. Regenerating after a change

```bash
cd db
python assemble.py     # rebuild championship.json facts (needed only if eras/data scope change)
python build.py        # re-score from params.json -> output/*.csv
python make_site.py     # refresh docs/data.json for the live site
```

`build.py` prints per-year and per-era checksums; `assemble.py` validates the derived semi-finalists
and warns on any anomaly.
