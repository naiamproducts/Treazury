---
dept: F.D
scope: ar
kind: research
status: provisional
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:13-94 (PARAMS), :117-139 (cost fns)
 - /home/kiox/treazury/docs/F.D/global/corridor-economics.md (input ledger, A1/A2/A4)
 - /home/kiox/treazury/docs/F.D/ar/ar-counterfactual.py (this report's computations)
 - /home/kiox/treazury/docs/L.D/ar/profile.md:28-80 (surrender duty, MCF channel, PSAV licensing — L.D confirmed 2026-10-27)
 - https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7506.pdf (Com A 7506, 05/05/2022 — bank crypto ban, accessed 2026-10-28)
 - https://www.iproup.com/finanzas/72239-el-bcra-extiende-el-cepo-cripto-pero-bancos-avanzan-en-otro-negocio (2026-10-12 — ban stays this mandate; USDC 46% of AR stablecoin volume, accessed 2026-10-28)
 - https://www.boletinoficial.gov.ar/detalleAviso/primera/340665/20260413 (Com A 8417/2026, 09/04/2026 — liquidation flexibilisation, accessed 2026-10-28)
 - https://abogados.com.ar/novedades-en-materia-de-exterior-y-cambios/38893 (2026-04-14 — Com A 8417 summary, accessed 2026-10-28)
 - https://www.despachantesargentinos.com/detalle_noticia.php?id=45489 (Com A 8417 — 365d extension, USD 200M related-party threshold, accessed 2026-10-28)
 - https://www.bcra.gob.ar/regimen-de-bandas-cambiarias/ (band regime since 11/04/2025, accessed 2026-10-28)
 - https://www.enteratenoticias.com.ar/economia/el-dolar-mayorista-toco-un-nuevo-record-nominal-de-1-528-mientras-el-bcra-sostiene-las-compras-de-divisas (2026-10-24 — mayorista 1,528, band ceiling 1,943.56, accessed 2026-10-28)
 - https://www.infobae.com/economia/2026/10/22/el-salto-del-riesgo-pais-no-altero-al-dolar-pero-empieza-a-impactar-en-la-brecha-cambiaria (2026-10-22 — CCL 1,638 ~6% over oficial; riesgo país 674-710bps, accessed 2026-10-28)
 - https://www.rankia.com.ar/blog/dolar-hoy/6731536-impacto-cepo-cambiario-precio-dolar-blue (updated 2026-08-09 — post-cepo brecha ~0% in 2025-26, accessed 2026-10-28)
 - https://tn.com.ar/economia/2026/10/27/dolar-oficial-hoy-y-dolar-blue-a-cuanto-cotizan-este-martes-27-de-octubre/ (2026-10-27 — cripto 1,672.88-1,675.37 vs oficial 1,560, accessed 2026-10-27)
 - https://www.cotizacion-dolar.com.ar/cotizacion-hoy.php (2026-10-27 — BNA venta 1,560; BCRA promedio 1,506.87/1,559.94, accessed 2026-10-28)
 - https://www.bis.org/publications/working-paper-1385-competing-rails-crossborder-payments-banks-fintechs-and-stablecoins (BIS WP 1385, 2026-10-19, accessed 2026-10-27)
 - https://www.bis.org/events/20260626/25th-bis-annual-conference/25th-annual-conference-du.pdf + -adrian.pdf + -yogo.pdf (conference version + discussions, 2026-06, accessed 2026-10-28)
---

# Treazury — AR counterfactual: what the FX-control regime costs, and who it benefits

F.D/ar deliverable for aven (founder question: "if not for the
law… what cost and time improvements?"). Location note: written under
`docs/F.D/ar/` (not `docs/F.D/global/` as the task literally said) because
Rule 1 of `docs/C.O/global/info-architecture.md:49-58` forbids
country-specific content in a `global` artifact; cross-linked from
`corridor-economics.md` §7.

Tagging: **SOURCED** = URL + date or `path:line`. **INFORMATIONAL** = model
output or stated assumption. Every scenario cell below is INFORMATIONAL by
construction; the arithmetic is CONFIRMED (the engine asserts equality with
`corridor-model.py` at baseline — `ar-counterfactual.py:BASELINE EQUALITY`).
Reproduce: `python3 docs/F.D/ar/ar-counterfactual.py`.

## 0. Bottom line

- **CONFIRMED — "no law" is not one scenario.** Four independent constraints
 are toggled separately below: export-surrender duty (S1), the dual-rate
 regime/brecha (S2), PSAV licensing (S3), all three (S4), plus honest
 variants. Each produces a different, sometimes opposite, answer.
- **PROMISING — AR→US flips to USDC under S1/S4… but only just, and only
 while banks keep fat FX markups.** S1/S4: USDC $393 (1.57%) vs SWIFT $499
 (1.99%) at $25k → **+$106 for USDC**; +$110 at $100k. The win is a
 **fixed-fee** advantage (USDC slope 1.5500% ≈ SWIFT slope 1.5548%), not a
 variable-cost one. If free-regime competition compresses the AR bank FX
 markup to fintech-class 0.60% (S4-compact), **USDC loses again** (−$119 /
 −$790).
- **REJECTED — "removing the brecha makes USDC win by 7%."** S2 alone leaves
 **both AR corridors losing** (AR→US −$44/−$490; AR→CN −$231/−$1,220). The
 gap was only part of the crypto stack; the platform fee + ramps still
 exceed a bank's wire economics at ICP tickets. The binding single
 constraint is **S1 (the surrender duty / MCF-channel dependency)**, not the
 rate duality.
- **REJECTED — "crypto wins the free-regime AR market."** AR→CN loses in
 **every** scenario at ICP tickets unless the payee accepts USDC directly
 (S1-native: +$119/+$180) — the assumed 0.80% CN off-ramp + 1.5% platform
 fee is structurally above bank SWIFT on a USD-invoiced flow. And in the
 S1-wire-bis variant (payer already holds USDC, alternative = plain USD
 wire) **SWIFT wins both corridors by $269–$2,120** — at ICP tickets the
 fixed-fee stack of a $45+$20+$15 wire beats our 1.5% on USD-in/USD-out
 flows (same finding as case B in `corridor-economics.md` A2).
- **CONFIRMED — the counterfactual's real prize is not the wire line, it is
 the surrender loss.** Liquidating an export at the official rate forfeits
 **6.82% of market USD value** (1,559.94 vs 1,674.12, 2026-10-27): $1,705
 on a $25k collection, $6,821 on $100k — **~5–10× the entire rent inside
 the SWIFT wire stack** (~$270, 1.07%). S1/S4 remove that transfer; that is
 the largest cost improvement in the whole counterfactual, and it lands on
 the exporter, invisible in any payment-fee table.
- **CONFIRMED — the regime's beneficiary is not only BNA.** The channel rents
 are: (i) the brecha transfer to whoever accesses official-rate dollars
 (importers/quota holders), (ii) bank FX spreads on mandated/retail
 conversion (~1.7% one-way observable on BNA vs mayorista), (iii) the
 **crypto ban that bars ALL regulated institutions — BNA included — from
 offering stablecoins** (Com A 7506/7759), which protects the bank fee
 model from substitution but does NOT hand banks the crypto rent (that goes
 to VASPs), and (iv) international correspondent rents, which exist in free
 markets too. Full decomposition in `rent-decomposition.md`.

## 1. What the law actually is today (the baseline the counterfactual removes)

The founder's premise ("if the law were not like this") needs precision: the
2019-style full cepo ended, but a mixed regime remains. Each item is a
scenario anchor.

| Constraint in force (2026-10) | Instrument | Tag |
|---|---|---|
| Export proceeds must be ingressed/negotiated via the FX market (MCF), with liquidation deadlines (15/30/180d; up to 365d for some exports; **natural persons partially exempt since 09/04/2026**, but agencies = legal persons are NOT) | Decreto 609/2019 art. 1; BCRA TO Secc. 7.1; Com A 8417 (Boletín Oficial 2026-04-13) | SOURCED (`L.D/ar/profile.md:28-32,61-66`; boletinoficial + law-firm summaries 2026-04) |
| FX operations must be executed in the Mercado Libre de Cambios through BCRA-authorised entities (banks, casas de cambio) | Decreto 260/02 arts. 1-2 (Ley 27.444 art. 132), via bcra.gob.ar/normativa-de-exterior-y-cambios | SOURCED |
| Crawling band (floor/ceiling set by BCRA; ceiling $1,943.56 on 2026-10-23), BCRA intervenes at edges and bought USD 770M in Aug-2026 | BCRA "Régimen de bandas cambiarias" (since 11/04/2025); enteratenoticias 2026-10-24; BCRA mercado-de-cambios report 2026-09-25 | SOURCED |
| **"Cepo cripto": banks AND payment providers may not offer crypto/digital-asset services to clients**; government stated it stays this mandate (second-mandate review) | BCRA Com A 7506 (05/05/2022) + Com A 7759 (2023, PSPs); iproup 2026-10-12 (superintendente Curutchet) | SOURCED |
| Dual-rate gap alive and widening: cripto 1,672.88–1,675.37 vs oficial 1,559.94 → brecha **7.24–7.45%** (2026-10-27); CCL ≈ cripto; blue–oficial only ~2-3% | tn.com.ar 2026-10-27 09:24; valordolarblue.ar; cotizacion-dolar.com.ar 2026-10-27 | SOURCED |
| Card/tourist FX at ~1,995–2,002 (≈30% over oficial) — residual tax wedge after Impuesto PAIS ended Jan-2026; composition unverified | tn.com.ar 2026-10-19; Rankia 2026-08-09 | SOURCED quotes / composition INFORMATIONAL |

Natural-experiment evidence that the brecha is a **product of the regime**
(and of risk appetite), not a permanent feature: after the April-2025 cepo
lift the official–parallel gap collapsed to ~0% (Rankia, updated 2026-08-09);
it re-widened to ~5–7.5% in Oct-2026 as riesgo país jumped to 674–710 bps
(infobae 2026-10-22) — i.e. today's gap = **residual-control premium +
country-risk premium**. A full free regime removes the first component; the
risk premium survives any law change. The exact split is INFORMATIONAL —
cannot be sourced to a single number.

## 2. Scenario definitions (each a set of model toggles)

Applied to `corridor-model.py` mid band (arithmetic in `ar-counterfactual.py`):

| Scenario | Removed constraint(s) | Model toggles (USDC path) | Model toggles (SWIFT path) |
|---|---|---|---|
| **S1** no export-surrender duty | Decreto 609/2019 / TO 7.1 liquidation duty — exporter keeps USDC | onramp AR → 0, spread → 0, gap → 0 (payer settles from USDC proceeds) | unchanged (official-rate wire remains an alternative) |
| **S2** single free FX rate | dual-rate regime: brecha disappears | gap → 0 | fx markup **kept at model mid 1.5%** (a bank margin over the single mid — BIS observes 200–400bps for banks) |
| **S3** no PSAV/licensing friction | CNV RG 1172/2026 registration + min net worth (USD 35k/75k/150k by category, 50% if <USD 2.5M volume — `L.D/ar/profile.md:70`) | **no rail-cost change** (capital/feasibility effects, §5) | unchanged |
| **S4** full free regime | S1+S2+S3 | as S1 | as S2 |

Variants (the honest corners):

| Variant | Meaning |
|---|---|
| **S1-native** | payee accepts USDC directly — off-ramp → 0 (tests the CN-off-ramp dependency) |
| **S1-wire-bis** | payer already holds USDC, so the SWIFT alternative is a USD wire with **no AR FX conversion** (fx → 0; case-B arithmetic from `corridor-audit.py`) |
| **S4-compact** | free regime **plus** competitive compression of the AR bank markup to fintech-class 0.60% (ASSUMED: BIS fintech all-in 40–150bps, bottom of range at ≥$10k) |

## 3. Scenario results (mid band, INFORMATIONAL; engine equality CONFIRMED)

| Scenario | Corridor | Ticket | SWIFT $ (%) | USDC $ (%) | Δ vs SWIFT (+ = USDC cheaper) | Δ vs current USDC | Verdict |
|---|---|---|---|---|---|---|---|
| baseline | AR→US | 25k | 499 (1.99%) | 1,293 (5.17%) | **−794** | 0 | SWIFT |
| baseline | AR→US | 100k | 1,665 (1.66%) | 5,155 (5.16%) | **−3,490** | 0 | SWIFT |
| baseline | AR→CN | 25k | 509 (2.03%) | 1,490 (5.96%) | **−981** | 0 | SWIFT |
| baseline | AR→CN | 100k | 1,695 (1.70%) | 5,915 (5.92%) | **−4,220** | 0 | SWIFT |
| **S1** | AR→US | 25k | 499 (1.99%) | **393 (1.57%)** | **+106** | −900 | **USDC** |
| **S1** | AR→US | 100k | 1,665 (1.66%) | **1,555 (1.56%)** | **+110** | −3,600 | **USDC** (BE: every size) |
| S1 | AR→CN | 25k | 509 | 590 (2.36%) | −81 | −900 | SWIFT |
| S1 | AR→CN | 100k | 1,695 | 2,315 (2.32%) | −620 | −3,600 | SWIFT (BE $13,650: USDC only below) |
| **S2** | AR→US | 25k | 499 | 543 (2.17%) | **−44** | −750 | SWIFT |
| **S2** | AR→US | 100k | 1,665 | 2,155 (2.16%) | **−490** | −3,000 | SWIFT |
| S2 | AR→CN | 25k | 509 | 740 (2.96%) | −231 | −750 | SWIFT |
| S2 | AR→CN | 100k | 1,695 | 2,915 (2.92%) | −1,220 | −3,000 | SWIFT |
| S3 | both | both | = baseline | = baseline | = baseline | 0 | rail cost unchanged by design |
| **S4** | AR→US | 25k / 100k | 499 / 1,665 | 393 / 1,555 | **+106 / +110** | −900 / −3,600 | **USDC** |
| **S4** | AR→CN | 25k / 100k | 509 / 1,695 | 590 / 2,315 | −81 / −620 | −900 / −3,600 | SWIFT |
| S4-compact | AR→US | 25k / 100k | 274 (1.09%) / 765 (0.76%) | 393 / 1,555 | **−119 / −790** | −900 / −3,600 | **SWIFT** |
| S4-compact | AR→CN | 25k / 100k | 284 / 795 | 590 / 2,315 | −306 / −1,520 | — | SWIFT |
| S1-native | AR→US | 25k / 100k | 499 / 1,665 | **380 (1.52%) / 1,505 (1.51%)** | **+119 / +160** | −913 / −3,650 | **USDC every size** |
| S1-native | AR→CN | 25k / 100k | 509 / 1,695 | **390 (1.56%) / 1,515 (1.52%)** | **+119 / +180** | −1,100 / −4,400 | **USDC every size** |
| S1-wire-bis | AR→US | 25k / 100k | **124 (0.49%) / 165 (0.16%)** | 393 / 1,555 | **−269 / −1,390** | — | **SWIFT** |
| S1-wire-bis | AR→CN | 25k / 100k | 134 / 195 | 590 / 2,315 | −456 / −2,120 | — | SWIFT |

Worked arithmetic (S1, AR→US, $25k, mid) — every input labelled:
`USDC = (platform 1.50% [SOURCED usdc-arc.ts:52-53] + offramp US 0.05% [SOURCED Circle express, help.circle.com 2026-10-19] + onramp 0 [S1 toggle] + gap 0 [S1 toggle]) × 25,000 + ($0.02 gas [ASSUMED] + $5 offramp fixed [ASSUMED]) = 1.55% × 25,000 + $5.02 = $392.5`.
`SWIFT = (fx 1.50% [ASSUMED band, BIS-anchored] + float 2d×10%/yr = 0.0548% [ASSUMED rate, days mid 2, corridor-model.py:54]) × 25,000 + ($45 sender [SOURCED bracket: BofA $45/Chase $40/Wells $30] + $20 intermediary [SOURCED range/ASSUMED single hop] + $15 beneficiary [SOURCED Chase/Wells incoming] + $30 repair [ASSUMED]) = 1.5548% × 25,000 + $110 = $498.7`.

**Live-gap cross-check (the model is kind to the current regime):** at the
SOURCED 2026-10-27 gap of 7.24–7.45% instead of the model's 3% mid, current-
regime USDC all-in is **9.50–10.31%** on both corridors — the published
baseline understates today's pain by $1,086 (25k) / $4,345 (100k) per
payment. Direction of every verdict is unchanged (SWIFT wins baseline harder).

## 4. The binding constraint — and why "the comparison basis changes"

**Single binding constraint: S1, the export-surrender duty (MCF channel
dependency).** S2 alone (kill the brecha, keep the duty) leaves AR→US losing
by $44 at $25k and AR→CN by $231 — the duty's removal is what kills the gap
**and** the on-ramp at once (the exporter holds USDC; no ARS→crypto purchase
exists to tax). S3 binds nothing on cost — it binds *feasibility* (§5).
AR→CN is not bound by any Argentine law at all: its blocker is the **CN
off-ramp assumption (0.80% mid) + our 1.5% fee**, visible in S1-native where
removing the off-ramp flips it.

**The comparison-basis point, tested and confirmed:** the model's baseline
prices the AR payer against the *official* rate while the market price of
USDC is the cripto/CCL rate — the 3–7.4% "gap" is an opportunity cost
relative to a **privileged channel**, not a cost of the crypto rail. In a
free regime the privileged channel ceases to exist, the gap metric itself
dissolves, and the comparison becomes rail-vs-rail at a single mid: bank fx
margin (model 1.5%; BIS observes 200–400bps for banks globally) + wire
fixed fees vs platform 1.5% + ramps. So the counterfactual answer is **not**
"USDC wins by 7%" — it is "USDC wins AR→US by ~$106 (0.4pp) **iff banks
keep charging 1.5%+ on conversion**; at competitive bank pricing it loses."
The 7% was never ours to win; it was the exporter's surrender loss.

## 5. Does SWIFT still beat USDC in the free regime? (honest answer)

Three answers, one per payer configuration — all at ICP tickets:

1. **ARS-sourced payer, banks keep mid markups (S4):** USDC wins AR→US by a
 **thin fixed-fee margin** (~$105 per payment at any size; slopes are
 1.5500% vs 1.5548% — a 0.005pp difference, i.e. **cost parity** at
 scale). AR→CN still loses (CN off-ramp).
2. **ARS-sourced payer, competitive banks (S4-compact):** SWIFT/MTO rails win
 both corridors (−$119/−$790 on AR→US). A 1.5%-priced platform cannot beat
 a 0.6%-all-in rail — **our fee, not the law, is the binding cost** in that
 world. (Connects directly to pricing option P3 — fixed fee — in
 `corridor-economics.md` §3: at a $75–150 fixed fee the crypto rail wins
 every ticket in every regime.)
3. **USDC-funded payer settling USD-invoiced trade (S1-wire-bis):** SWIFT
 wins both corridors by $269–$2,120 — the same "case B" collapse already
 documented in `corridor-economics.md` A2. For USD-in/USD-out flows the
 $110 wire stack beats 1.5% above ~$7k.

**Honest headline:** in the free regime the cost story is *parity-to-close*
on AR→US and *still-loses* on AR→CN — **not** a crypto cost win. What the
free regime genuinely and robustly delivers for AR corridors is (a) removal
of the 6.8% surrender loss (§6 of `rent-decomposition.md`), (b) 24/7
settlement with minutes-level finality on the chain leg, (c) removal of the
liquidation-compliance tail, and (d) platform feasibility (S3).

## 6. Time counterfactual

| Factor | Current regime | Free regime (S1–S4) | Tag |
|---|---|---|---|
| SWIFT network settlement AR→US / AR→CN | 1.5–4 / 2–5 business days (mid 2 / 3, `corridor-model.py:51-59`) | identical — no law changes the correspondent network | INFORMATIONAL (ASSUMED bands) |
| USDC chain leg | minutes, 24/7 (atomic `depositWithPermit`, testnet CONFIRMED, `PaymentRouter.sol:309-324`) | identical | CONFIRMED (testnet) |
| End-to-end to a bank account | UNKNOWN — no LicensedRail contracted (`rails.licensedPartners: []`); "2–6h" stays quarantined | UNKNOWN — same | CONFIRMED absence (`T.D/crypto-rails-benefit.md:114`) |
| Compliance tail | ingreso/liquidación obligation within 15/30/180d (up to 365d; Com A 8417) + MCF-channel steps + export-declaration gate before docs release (`L.D/ar/profile.md:121-126`) | **removed** (no duty, no MCF, no PSAV) | SOURCED |
| After-hours/cut-off exposure | Friday-after-cut-off wire waits until Monday+ | chain leg moves; fiat legs revert to partner hours | INFORMATIONAL |

Net time improvement of the free regime vs today: **~0 on the wire itself,
large on the operational tail** (no liquidation runway, no channel steps,
no licensing lead time) — and the sellable "hours not days" claim still
depends on contracting an off-ramp, which no law scenario changes.

## 7. S3 quantified (feasibility, not rail cost)

- PSAV min net worth: USD 35k / 75k / 150k by category, halved under USD 2.5M
 annual volume (RG 1172/2026 arts. 1, 10 — SOURCED via
 `L.D/ar/profile.md:70`). At the model's 10%/yr capital cost (ASSUMED,
 same as `corridor-model.py:14`): **$3.5k–15k/yr of capital charge** —
 0.27–1.15% of a $1.3M/yr volume base (weekly $25k tickets), falling to
 0.007–0.03% at $50M/yr. Material for a seed-stage platform, immaterial at
 scale. INFORMATIONAL.
- S3 also removes the fee-on-value block and the extraterritorial nexus risk
 (RG 1172/2026 art. 4), which is what actually enables %-based pricing to be
 *collected* in AR (see `corridor-economics.md` §3, P3 as legal default).
 Revenue-side effect, not a rail-cost effect.

## 8. Not sourced / open

| Gap | Impact | Resolves it | Owner |
|---|---|---|---|
| Post-liberalisation AR bank FX markup (the S4 vs S4-compact fork) | decides whether AR→US flips | observe spreads 6–12m after any liberalisation, or price a real AR wire RFQ | F.D |
| Split of today's 7.24–7.45% brecha into control-premium vs country-risk-premium | sizes how much of the gap any law change actually removes | event study around the 2025-04 lift (daily oficial/CCL series) | F.D (needs BCRA+market data pull) |
| AR→MX corridor | UNVALIDATED — no model row exists | extend corridor-model with ARS→MXN stack + MX off-ramp quote | F.D if founder wants |
| Whether the ICP agencies hold/export via legal persons vs personas humanas | determines who is still bound by the liquidation duty post-Com A 8417 | one question in M.D's interview script | M.D via COO |
| BNA FX profit/volume share as MCF intermediary | names the rent-capture magnitude per institution | BNA financial statements segment note / BCRA entidad-level FX volumes | F.D (partially blocked on data access) |
