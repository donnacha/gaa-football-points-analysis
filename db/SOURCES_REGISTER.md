# Source Register — inter-county GAA match-level results

Purpose: catalogue every online source evaluated for building a **match-level** database of
inter-county Gaelic football results (every match, not just finals), with coverage, fields,
access/licence, and extractability recorded so the data is auditable and reproducible.

_Compiled 2026-06-21 from a four-strand reconnaissance (structured datasets · Wikipedia depth ·
dedicated results sites · historical/newspaper archives). Every URL below was fetched live during
research unless flagged otherwise._

## Headline verdict

- **No single free, clean, machine-readable, complete match database exists.** It has to be built.
- **Primary backbone:** Wikipedia per-year *All-Ireland Senior Football Championship* articles
  (these embed the four provincial championships too) via the **MediaWiki API** — `CC BY-SA 4.0`,
  match-level back to ~1905, field-rich (date, teams, score, venue, attendance, referee, scorers)
  from the mid-20th century on.
- **Structured skeleton:** Wikidata (`CC0`, ~7,287 Gaelic-football match items with date/teams/venue,
  but **no scores** — join scores in from Wikipedia).
- **League** match-by-match is only reliably complete from ~2008; finals/standings go deeper.
- **Pre-~1920** the road-to-the-final (early provincial rounds) is the real gap → newspaper archives
  (paywalled, manual) and Croke Park minute books (in-person) are the fallback layer.

---

## Tier 1 — primary extraction targets (open licence, machine-extractable)

### Wikipedia (English) — per-year championship articles  ★ backbone
- **URLs:** `https://en.wikipedia.org/wiki/{YEAR}_All-Ireland_Senior_Football_Championship` ·
  finals list `…/List_of_All-Ireland_Senior_Football_Championship_finals` ·
  API `https://en.wikipedia.org/w/api.php?action=parse&page={ARTICLE}&prop=wikitext&format=json`
- **Coverage:** All-Ireland SFC 1887→2025; **provincial championship matches are embedded in the same
  per-year page** (don't scrape standalone provincial pages — they only exist from ~2010). Hurling has
  full equivalents.
- **Per-match fields:** date, teams, score (`g-pp`), venue, attendance, referee, scorers, round/stage.
  Richness degrades pre-1960 (attendance/referee become sporadic) but date/teams/score/venue are
  consistent back to ~1905; comprehensive from ~1930s. 1887–~1900 sparse.
- **Format:** semi-structured wikitext — bracket templates + per-match info blocks + wikitables.
  Parse via API (tolerant parser needed; not a clean table).
- **Access / licence:** free · **CC BY-SA 4.0** (attribution + share-alike). robots: use `/w/api.php`
  (sanctioned); recursive mirroring banned.
- **Assessment:** highest depth + accuracy + cleanest licence for republishing. ~3,000–4,000+
  championship matches extractable. Spot-check obscure/old matches. **Primary source.**

### Wikidata — structured match items
- **URLs:** SPARQL `https://query.wikidata.org/sparql` · dumps `https://dumps.wikimedia.org/wikidatawiki/`
  · match class Q18536594, All-Ireland SFC Q1474330.
- **Coverage:** ~**7,287** Gaelic-football match items (verified via live SPARQL): date (P585),
  teams (P1923), often venue/round.
- **Gap:** **no scoreline / attendance / referee / winner** for most items.
- **Access / licence:** free · **CC0** (public domain). SPARQL + dumps both allowed.
- **Assessment:** cleanest *structured* fixtures skeleton; pair with Wikipedia for scores. Good for
  cross-validating that we haven't missed matches.

---

## Tier 2 — useful supplements / cross-checks

### JTurek708/Gaelic_Football (GitHub CSV)
- **URL:** `https://github.com/JTurek708/Gaelic_Football` → `…/raw/main/GAA_Results.csv`
- **Coverage:** senior football, **2016-05-01 → 2023-07-30**, **1,268 matches** — Allianz League (Div 1–4),
  4 provincial championships, All-Ireland SFC (incl. qualifiers/prelim QF), Tailteann Cup.
- **Fields:** date, competition, home/away team, home/away goals+points, totals. **No venue/attendance/
  referee/explicit round.**
- **Access / licence:** free download · **no LICENSE file** → all-rights-reserved by default (no reuse
  grant). Stale (last push 2024-01; data stops mid-2023).
- **Assessment:** cleanest ready-made modern CSV; useful as a *validation cross-check* against our
  Wikipedia extraction, but **licence blocks republishing** — do not ship its rows; use to verify.

### GAA official records PDF — "Full GAA Records 1887–2021"
- **URL:** `https://www.gaa.ie/api/images/image/upload/t_q-best/t8bphnbixyanijooj1un.pdf` (11.8 MB, verified 200).
- **Coverage:** authoritative, football+hurling, all grades, 1887–2021.
- **Format:** PDF (needs OCR/table parsing; round-by-round depth vs finals-only unconfirmed).
- **Access / licence:** free · GAA copyright (no open licence).
- **Assessment:** gold-standard for honours/finals validation; not a bulk import.

### HoganStand — hoganstand.com
- **URLs:** `/Results`, `/Fixtures/`, `/LeagueTables/`, per-county e.g. `/Roscommon`.
- **Coverage:** very broad (football/hurling/camogie/ladies/club/U20/minor/Sigerson); archive **~May 2000→**.
- **Fields:** scores, venue, status (FT/AET/pens). **No attendance/referee**, limited round detail.
- **Format:** chronological **plain text** (regex parse). **robots.txt: fully open** (`Disallow:` empty).
- **Assessment:** deepest dedicated *results-site* archive (~2000+), crawler-friendly; good secondary
  cross-check. Confirm exact archive URL pattern by live browsing.

### Provincial council sites (Munster/Leinster/Ulster/Connacht) — shared Servasport backend
- **URLs:** `munster.gaa.ie` (year selector 2019→2026) · `leinstergaa.ie` · `ulster.gaa.ie` (adds
  **referees**) · `connachtgaa.ie`. AJAX: `…/fixtures-results-ajax/?owner={id}&compID={id}&resultsOnly=Y`.
- **Coverage:** Servasport era only (~2017→present); scores, venues, round, league tables. No attendances.
- **Access / licence:** free, no login; results paths not robots-blocked; GAA copyright (no stated reuse).
- **Assessment:** good modern redundancy (esp. Ulster referees); HTML fragments not JSON; needs compID
  harvesting; useless pre-2017.

### Wikidata-adjacent / county depth
- **gaa.world (Eirball):** free; All-Ireland + provincial + league tables by county; good free
  cross-check (early-coverage start unstated → corroborate).
- **mft.ie (Mayo Football Talk):** Mayo-only but **1902→**, searchable; robots open. Best-in-class
  single-county validator; similar per-county blogs likely exist.
- **gaalore.ie:** Pádraig Ferguson's 1887–2022 archive — the most complete ever compiled, **currently
  "under construction"**, migrating into gaa.ie. **Watch list — likely the eventual definitive source.**

---

## Tier 3 — historical primary sources (pre-~1920 gap-fill; manual/paywalled)

| Source | URL | Covers | Access | Use |
|---|---|---|---|---|
| Irish Newspaper Archives | irishnewsarchive.com | 290+ Irish titles, 1880s→ | subscription (free in NLI/libraries); OCR images | best Irish provincial early reports; transcribe by hand |
| British Newspaper Archive | britishnewspaperarchive.co.uk | ~293 Irish titles incl. Belfast | subscription; OCR (403 to bots) | best Ulster/northern + cross-check |
| NLI newspapers | nli.ie/collections | access point to INA+BNA | free in reading room | cost-free route to the above (in person) |
| GAA Museum Library & Archive | crokepark.ie/library | minute books/convention reports 1887→ | free, in-person by appt | **arbiter** for disputed early results (objections/walkovers) |
| RTÉ Archives / IFI GAA Collection | rte.ie/archives · ifiarchiveplayer.ie | football highlights 1947–59, radio 1926→ | free online | context/verification, not scorelines |
| "The GAA: A People's History" | archive.org/details/gaapeopleshistor0000cron | narrative history | borrowable scan | dating structural changes, not results |

---

## Earliest reliable year for match-level data (online)

| Competition | Finals | Full bracket / early rounds |
|---|---|---|
| All-Ireland SFC | 1887 | ~1905 reasonable, fully reliable ~1920s+ |
| Provincial SFCs | ~1888 (patchy) | consistent only ~1920s+ (pre-final rounds = biggest gap) |
| National Football League | 1925–26 (inaugural) | full match-by-match only ~2008+ |

Genuine uncertainties: pre-1910 provincial early rounds; foundation-era disputed outcomes
(objections, illegal players, walkovers); early scoreline/venue/attendance nulls; OCR errors in
newspaper transcription.

---

## Recommended extraction strategy

1. **Backbone:** programmatic MediaWiki-API pull of `{YEAR}_All-Ireland_Senior_Football_Championship`
   (1905→2025) → parse match blocks → normalised rows. (+ NFL pages for league, modern years.)
2. **Skeleton check:** Wikidata SPARQL to confirm match coverage / catch omissions.
3. **Cross-validate:** JTurek CSV (2016–23) and gaa.world for a sample of years; flag disagreements.
4. **Historical fill:** newspaper archives / Croke Park only for specifically contested early matches.
5. **Record provenance per match** (source + retrieval date) in the schema.

**Licensing note for republishing:** the live site is public, so prefer **CC BY-SA (Wikipedia)** and
**CC0 (Wikidata)** as the shipped data; treat the GitHub CSV, HoganStand, provincial sites and the GAA
PDF as *verification-only* (no open reuse grant).
