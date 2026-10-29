---
dept: F.D
scope: ar
kind: research
status: provisional
as_of: 2026-10-28
sources:
 - https://www.indec.gob.ar/uploads/informesdeprensa/ica_01_26ABE4F7373E.pdf (INDEC ICA press release, pub. 2026-01-20 — CY2025 goods exports 87,077 / imports 75,791, monthly table)
 - https://www.indec.gob.ar/uploads/informesdeprensa/i_argent_02_265E3E313643.pdf (INDEC, preliminary 2025 merchandise data — imports USD 75,791M, +24.7%)
 - https://www.indec.gob.ar/uploads/informesdeprensa/ica_10_263F42E3F39F.pdf (INDEC ICA press release, pub. 2026-10-19 — Sep-2026 imports 7,060; Jan–Sep 2026 imports 56,069, −2.5%; monthly table incl. Oct/Nov/Dec 2025: 7,150 / 5,598 / 5,556)
 - https://www.indec.gob.ar/uploads/informesdeprensa/ica_09_266E5973E036.pdf (INDEC ICA, pub. 2026-09-18 — Aug-2026 imports 6,696; Jan–Aug 2026 48,999)
 - https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/informes/informe-mercado-cambios-balance-cambiario-2026-08.pdf (BCRA balance cambiario Aug-2026, read 2026-10-28 — MULC import payments 5,618; goods FOB 6,304; alternative settlement mechanisms ~260; staged FX-access schedule for import payments referenced)
 - https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/informes/Informe-mercado-cambios-balance-cambiario-2026-06.pdf (BCRA Jun-2026 — MULC payments 6,420; alternatives ~180)
 - https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/informes/informe-mercado-cambios-balance-cambiario-2026-04.pdf (BCRA Apr-2026 — MULC payments 5,381; alternatives ~360)
 - https://monitorargy.com/serie/pagos_impo (aggregator of BCRA balance cambiario, updated 2026-10-16 — monthly MULC import-payment series Sep-2024…Aug-2026; 2025 and 2026 monthly values summed here; individual 2026 months verified against the four BCRA PDFs above)
 - https://datos.gob.ar/dataset/sspm-cobros-pagos-por-bienes-por-modalidad-pago---balance-cambiario/archivo/sspm_183.1 (official monthly cobros/pagos por modalidad series — primary location of the BCRA series)
 - https://aimport.ar/importprice (ARCA-derived import-operation count: 1,917,471 operations Oct-2025…Sep-2026 — SUSPICIOUS secondary source, operation definition unverified)
 - /home/kiox/treazury/docs/L.D/ar/profile.md:39-43 (platformChargesFeeOnValue blocked), :55-60 (licensedPartnerConversion conditional), :71 (RG 1172/2026 net-worth floors USD 150k/75k/35k, 50% if <USD 2.5M volume), :106-108 (rails.licensedPartners: []), :110-118 (open questions — export-centric profile)
 - /home/kiox/treazury/docs/F.D/global/corridor-economics.md:289-302 (P3 schedule $75/$150 and regime requirement), :304-324 (fee-stack interaction: dev 0.5% + partner 1%), :346-383 (no CAC/churn/ARPU data anywhere in repo — explicit search 2026-10-27), :206 (ICP $15k–200k)
 - /home/kiox/treazury/docs/F.D/ar/ar-counterfactual.md:229-241 (S3 quantified: capital charge on PSAV net-worth floors)
 - /home/kiox/treazury/docs/F.D/ar/rent-decomposition.md:15,81 (Wise marginal-cost benchmark via BIS WP 1385 Table 14: GBP 0.24/transfer = rail 0.02 + support 0.11 + compliance 0.06)
 - /home/kiox/treazury/docs/M.D/global/corridors.md:175-196 (operational ICP: US$15K–200K per payment, weekly/monthly — borrowed INFORMATIONAL market signal)
 - /home/kiox/treazury/src/modules/jurisdiction/index.ts:225-246 (only `status: 'confirmed'` profiles sellable; unknown verdict → blocked; provisional → unconfirmed-status)
 - /home/kiox/treazury/src/modules/jurisdiction/profiles/ar.ts:20-33 (code AR profile: status provisional, every flow `unknown`)
 - /home/kiox/treazury/docs/T.D/global/adr-001-jurisdiction-engine.md:74,149 ("zero corridors are offerable until L.D confirms profiles — correct fail-closed default")
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:52-53 (PLATFORM_FEE_BPS 100, DEV_FEE_BPS 50)
 - /home/kiox/treazury/AGENTS.md:140,154 (platformFeeBps 100 / devFeeBps 50; `tenants.partner_fee_bps` default 100 bps)
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:14 (10%/yr capital cost — ASSUMED rate reused for the PSAV capital charge)
 - https://bitso.com/fees (2026-10-27, via corridor-economics.md A4 — ARS taker base 0.600%) ; https://help.circle.com/s/article/USDC-redemption-structure (eff. 2026-10-19 — express redemption 5 bps)
 - /home/kiox/treazury/docs/F.D/ar/revenue-projection-1b.py (this report's computations — every table reproduced)
 - aven (task ref)
---

# Treazury — revenue projection on USD 1,000M/yr of AR import payments (P3, ratified)

F.D/ar deliverable for aven. Founder question: *what would annual
revenue be if Treazury processed USD 1.000.000.000 per year of Argentine
import payments, under the ratified P3 fixed fee — and what would it take to
get there?* Location under `docs/F.D/ar/` per Rule 1
(`docs/C.O/global/info-architecture.md:49-58`). Reproduce every figure with
`python3 docs/F.D/ar/revenue-projection-1b.py`.

**This projection is CONDITIONAL, not a forecast.** Zero corridors are
sellable today (§6): the jurisdiction engine refuses money movement on
provisional/unknown profiles (`src/modules/jurisdiction/index.ts:236-246`,
`profiles/ar.ts:24,32`; ADR-001:149 "zero corridors are offerable until L.D
confirms profiles"). Revenue today is $0. Every dollar below sits behind a
named legal gate.

Tagging: **SOURCED** = URL + date or `path:line`. **INFORMATIONAL** = stated
assumption, scenario, or model output. **ASSUMED** = an INPUT that is an
assumption (every model cell inherits INFORMATIONAL). Verdicts:
VALIDATED / PROMISING / UNVALIDATED / REJECTED (financial claims),
CONFIRMED / SUSPICIOUS / INFORMATIONAL (factual findings).

## 0. Bottom line

- **CONDITIONAL / UNVALIDATED — USD 1,000M at P3 is ≈ USD 2,03M per year, not
 USD 10M.** ICP-typical mix (mean ticket $49,900 → 20,040 payments/yr):
 **$2,029,058/yr**, blended **$101.25 per payment**, effective take **0.203%**.
 Small-ticket-heavy mix (mean $22,450 → 44,543 payments/yr): **$3,507,795/yr**,
 **$78.75 per payment**, take **0.351%** (arithmetic CONFIRMED by script
 asserts; distributions are stated inputs — UNVALIDATED as forecasts).
- **CONFIRMED (arithmetic) — P3 earns 13,5%–23,4% of the 1,5%-of-value
 counterfactual.** A 1.5% fee on $1,000M would have produced **$15,000,000/yr**;
 that structure is **not lawful in AR** (`platformChargesFeeOnValue` blocked —
 `docs/L.D/ar/profile.md:39-43`) and exists here only to price the tradeoff:
 P3 forgoes ~$11,5M–13,0M/yr of (unavailable) revenue at this volume.
- **REJECTED — you cannot reach $10M/yr at P3 without ~5× this volume.**
 $10M/yr needs 98,765 payments/yr at the blended $101.25 → **$4,928M volume =
 6,6% of all Argentine goods imports of the last 12 months** (INDEC, §1). At
 $1,000M this is a low-single-digit-millions business.
- **REJECTED — as currently coded, contribution is negative at every volume.**
 If the router's 0,5% dev fee stays on %-of-value, contribution is **−$148,49
 per payment** (mean $49,9k); with the default 100 bps partner fee it is
 **−$647,49**; absorbing rails (0,45–0,90%) instead is **−$148 to −$348**.
 P3 only works as: invoiced fixed fee + rails pass-through + fee-stack
 restructured off %-of-value — a FOUNDER decision (`corridor-economics.md:317-324`).
- **UNVALIDATED — costs are mostly assumed; break-even ≈ $29,6M–$197,6M
 volume** (fixed opex ASSUMED $60k/$180k/$400k; mid: $88,9M at the ICP mix,
 $51,5M at the small-ticket mix). PSAV net-worth capital (floors SOURCED,
 `profile.md:71`) is immaterial: ≤ 0,74% of P3 revenue at $1,000M. **CAC,
 churn and ARPU do not exist anywhere in this repo** (documented search,
 `corridor-economics.md:348-353`) — no LTV:CAC can be computed or shown to
 investors until the data list in §5c is collected.
- **CONFIRMED — the whole projection is gated, and gate G1 is legal, not
 commercial:** today the code AR profile is `provisional` with every flow
 `unknown`, and the engine's own rule is "only 'confirmed' profiles are
 sellable" (`index.ts:236-240`). Ramp numbers in §6 are scenarios attached to
 gates, never a forecast.

## 1. Market sizing (sourced first — then the segment cut)

### 1a. Argentine goods imports (SOURCED)

| Metric | Value | Tag | Source |
|---|---|---|---|
| Goods imports, calendar 2025 | **USD 75.791M** (+24,7% y/y) | SOURCED | INDEC ICA, pub. 2026-01-20 (`ica_01_26…pdf`); same figure in INDEC preliminary-2025 English release |
| Goods imports, Jan–Sep 2026 | **USD 56.069M** (−2,5% y/y) | SOURCED | INDEC ICA, pub. 2026-10-19 (`ica_10_26…pdf`) |
| Goods imports, Oct-2025…Sep-2026 (trailing 12m) | **USD 74.373M** = 18.304 (Oct–Dec 2025, INDEC monthly table) + 56.069 | SOURCED inputs, arithmetic ours | same two INDEC releases |
| 2026 annualised (Jan–Sep × 12/9) | ≈ USD 74.759M | INFORMATIONAL projection | arithmetic |
| Sep-2026 alone | USD 7.060M (−1,8% y/y) | SOURCED | INDEC ICA 2026-10-19 |

### 1b. Import payments actually made (the settlement base, not the customs base)

Customs value ≠ payments made. The BCRA *balance cambiario* publishes monthly
**payments of goods imports through the FX market (MLC/MULC)**:

| Metric | Value | Tag | Source |
|---|---|---|---|
| MULC import payments, 2025 (sum of 12 months) | **≈ USD 68.549M** | SOURCED series, aggregator | monitorargy.com/serie/pagos_impo (BCRA balance cambiario, updated 2026-10-16); official series location: datos.gob.ar sspm_183.1 |
| MULC import payments, Jan–Aug 2026 (sum of 8) | **≈ USD 42.830M** → annualised ≈ **USD 64.245M** | SOURCED series, aggregator + arithmetic | same; individual 2026 months (Mar 5.592 / Apr 5.381 / May 4.975 / Jun 6.420 / Aug 5.618) **verified against the BCRA monthly PDFs** — match within rounding |
| Aug-2026 MULC payments | USD 5.618M vs goods FOB USD 6.304M | SOURCED | BCRA informe 2026-08 |
| Non-MULC settlement (bursátil ops + BOPREAL + commercial-debt cancellation) | ≈ USD 180–360M/month (Mar–Aug 2026) | SOURCED range | BCRA informes 2026-03/04/05/06/08 |
| Payments made from the agency's **foreign** accounts (no AR FX leg) | not in any AR statistic | INFORMATIONAL — invisible in the data | — |

So the honest settlement base for AR-related goods import payments is
**≈ USD 64–70B/yr** (MULC ≈ 64–69B + alternative mechanisms ≈ 2–4B/yr),
INFORMATIONAL arithmetic on SOURCED monthly inputs.

### 1c. What USD 1.000M represents (arithmetic)

| Base | USD 1,000M as share | Arithmetic |
|---|---|---|
| MULC import payments CY2025 (68.549M) | **1,46%** | 1000 ÷ 68.549 |
| MULC import payments, 2026 annualised (64.245M) | **1,56%** | 1000 ÷ 64.245 |
| Goods imports trailing 12m (74.373M) | **1,34%** | 1000 ÷ 74.373 |
| Monthly equivalent | **USD 83,3M/month ≈ 1,56% of all MULC import payments in a month** (≈ 1 payment in every 64 of value) | 1000÷12 ÷ 5.354 (2026 Jan–Aug monthly mean) |

All shares: INFORMATIONAL (arithmetic over SOURCED inputs).

### 1d. What is NOT the TAM here — checked, not assumed

1. **AR goods imports are not our TAM — they are one leg of it.** Our ICP is
 the triangular-trade/merchanting operator + the agency serving it
 (`corridors.md:175-196`), whose flows include non-AR corridors (US→MX,
 CO→US …) that AR import statistics never see. USD 1,000M of AR imports is
 therefore *inside* the addressable flow, not equal to it.
2. **The agency share of AR import payments is unknown and cannot be sourced
 here.** No statistic splits MULC import payments by "paid directly by the
 importer vs executed through an import/export agency" → INFORMATIONAL gap
 (§8, item 1). The segment base is therefore *bounded above* by 64–70B and
 has *no sourced floor*.
3. **Imports ≠ payments timing.** BCRA's own report notes a staged FX-access
 schedule for import payments by sector (30/60/90 days; referenced in the
 2026-08 informe — exact communication number OCR-garbled in the PDF text,
 SUSPICIOUS, L.D to confirm) — payment timing rules are part of gate G1.
4. **Cross-check on ticket size (SUSPICIOUS):** ARCA-derived import-operation
 count of 1.917.471 operations over the same 12 months (aimport.ar,
 secondary source, operation definition unverified) implies an average
 customs operation of **≈ USD 38.8k** (74.373M ÷ 1.917.471). Directionally
 supports a tens-of-thousands ticket — it does NOT validate the payment
 distribution below (operations ≠ payments; batched payments break the
 mapping either way).

## 2. The volume waterfall — USD 1,000M → payments → ticket size

Both distributions are **stated inputs (INFORMATIONAL, ASSUMED)** — no payment-
size distribution is published anywhere (§8, item 2). Distribution A is pinned
to the cited ICP range/mean (`corridors.md:179-182`: US$15K–200K per payment,
weekly/monthly, mean target ≈ $50K as requested); Distribution B is a
small-ticket stress case that extends below the ICP floor.

### Distribution A — ICP-typical (mean = **$49.900**, 65% of payments ≤ $50k)

| Bucket | Count share | Range | Bucket mean | Payments @ $1,000M | Volume carried |
|---|---|---|---|---|---|
| A1 | 30% | $15k–30k | $22.000 | 6.012 | $132,3M |
| A2 | 35% | $30k–50k | $38.000 | 7.014 | $266,5M |
| A3 | 25% | $50k–100k | $70.000 | 5.010 | $350,7M |
| A4 | 10% | $100k–200k | $125.000 | 2.004 | $250,5M |
| **Σ** | 100% | $15k–200k | **$49.900** (Σ share×mean) | **20.040** | $1.000,0M |

Arithmetic: `N = 1.000.000.000 ÷ 49.900 = 20.040 payments/yr` (1.670/month).
Tier split: ≤$50k = A1+A2 = 65% → 13.026 payments; >$50k = A3+A4 = 35% → 7.014.

### Distribution B — small-ticket heavy (mean = **$22.450**, 95% ≤ $50k)

| Bucket | Count share | Range | Bucket mean | Payments @ $1,000M | Volume carried |
|---|---|---|---|---|---|
| B1 | 45% | $3k–15k | $8.000 | 20.044 | $160,4M |
| B2 | 30% | $15k–30k | $22.000 | 13.363 | $294,0M |
| B3 | 20% | $30k–50k | $40.000 | 8.909 | $356,3M |
| B4 | 5% | $50k–150k | $85.000 | 2.227 | $189,3M |
| **Σ** | 100% | $3k–150k | **$22.450** | **44.543** | $1.000,0M |

Arithmetic: `N = 1.000.000.000 ÷ 22.450 = 44.543 payments/yr` (3.712/month).
Tier split: ≤$50k = 95% → 42.316; >$50k = 5% → 2.227.

### Payments per year under both, by volume

| Volume | Payments/yr — A (mean $49,9k) | Payments/yr — B (mean $22,45k) |
|---|---|---|
| $250M | 5.010 | 11.136 |
| $500M | 10.020 | 22.272 |
| $1.000M | **20.040** | **44.543** |

All cells INFORMATIONAL (V ÷ stated mean).

## 3. P3 revenue math (ratified schedule: **$75 ≤ $50k, $150 > $50k**)

P3 is given input, founder-ratified (`corridor-economics.md:289-302`,
ratification per aven standing orders) — re-arguing the price is out
of scope. Revenue = (payments in tier × tier fee) summed. Explicit arithmetic:

```
Dist A @ $1,000M: 20.040 × (0,65 × $75 + 0,35 × $150)
 = 20.040 × ($48,75 + $52,50) = 20.040 × $101,25 = $2.029.058
Dist B @ $1,000M: 44.543 × (0,95 × $75 + 0,05 × $150)
 = 44.543 × ($71,25 + $7,50) = 44.543 × $78,75 = $3.507.795
```

| Volume | P3 revenue — Dist A | P3 revenue — Dist B | Blended $/payment (A/B) | Effective take A / B | Counterfactual 1,5% of value |
|---|---|---|---|---|---|
| $250M | **$507.265** | **$876.949** | $101,25 / $78,75 | 0,203% / 0,351% | $3.750.000 |
| $500M | **$1.014.529** | **$1.753.898** | $101,25 / $78,75 | 0,203% / 0,351% | $7.500.000 |
| $1.000M | **$2.029.058** | **$3.507.795** | $101,25 / $78,75 | 0,203% / 0,351% | $15.000.000 |

All P3 cells INFORMATIONAL (arithmetic over stated distributions; script
asserts the tier-sum identity). Counterfactual column is **labelled
counterfactual — it is NOT available in AR**: fee-on-value collection is
blocked in AR (`profile.md:39-43`) and P3 exists precisely because of that
(`corridor-economics.md:304-316`). It is here only to show the pricing
tradeoff: **P3 yields 13,5% (A) / 23,4% (B) of what 1,5% would have produced.**

Tier direction note (the pricing tradeoff made explicit): P3's effective take
falls as tickets grow — $75 on a $15k payment is 0,50%, $150 on a $200k
payment is 0,075%. **P3 monetises payment COUNT, not value**, which is why the
small-ticket mix (B) produces 73% MORE revenue on the same $1,000M.

## 4. The honest headline

- **USD 1.000M/yr processed at P3 is a ~USD 2,0M/year business** (ICP-typical
 mix: **$2.029.058/yr**) — or **~USD 3,5M/year** under a small-ticket-heavy
 mix (**$3.507.795/yr**). It is **not** a $10M/year business. It is not even
 a $2M business at $250M of volume ($507k/yr — under $1M until volume passes
 ≈ $500M at the ICP mix).
- **Implied revenue per payment: $101,25 (A) / $78,75 (B).** Effective take on
 value: **0,20% / 0,35%** — an order of magnitude below the 1,5% the code can
 charge and cannot lawfully collect in AR.
- **To make $10M/yr at P3 you need ≈ $4.928M of annual volume** — 98,765
 payments/yr × $101,25 — **6,6% of every goods-import dollar Argentina spent
 in the last 12 months**, i.e. ~5× the founder's scenario. Context: 1,5% ×
 that same $4,93B would be $74M; the gap between the two is the price of the
 AR legal constraint.
- **Scale in operating terms** (INFORMATIONAL arithmetic): $1,000M/yr ≈
 1.670 settlements/month ≈ **33 agencies paying 50 settlements/month, or ~167
 agencies at 10/month** (dist A). Distribution B needs ~74–371 agencies.
 There is no pipeline, LOI, or paying tenant behind any of this today
 (alpha; zero fee-bearing settlements — `corridor-economics.md:352-353`).

Verdict on the projection itself: **UNVALIDATED** — arithmetic is CONFIRMED
(script), but volume is gated (§6), distributions are stated, and no
willingness-to-pay or traction data exists.

## 5. Cost side — what it costs to serve $1,000M

### 5a. Per-payment costs (inputs tagged)

| Cost component | Value | Regime | Tag |
|---|---|---|---|
| Gas per transfer | ~$0,02 | ours only if we push the tx | ASSUMED (`corridor-economics.md` A4) |
| AML/compliance screening | $0,08/transfer benchmark, up to $1,00 for AR-grade PSAV diligence | ours | benchmark SOURCED (Wise compliance £0,06 ≈ $0,08, BIS WP 1385 Table 14 via `rent-decomposition.md:81`); upper end ASSUMED |
| Support/doc rendering | $0,14/transfer benchmark | ours | benchmark SOURCED (Wise support £0,11); B2B trade-doc support likely higher — ASSUMED |
| **→ variable cost band** | **$0,24 – $1,16 per payment** | required regime (pass-through) | mixed as stated |
| Off-ramp (if WE absorb) | 0,05% express (Circle, eff. 2026-10-19) to 0,30% high → **$25–$150 on $50k** | regime B absorbed | SOURCED low / ASSUMED high |
| On-ramp (if WE absorb the payer's USDC acquisition) | Bitso ARS taker 0,45–0,60% → **$225–$300 on $50k** | regime B absorbed | SOURCED base tier (bitso.com/fees 2026-10-27); tier ASSUMED |
| Partner fee | 100 bps of value → **$500 on $50k** | only on referred flow | SOURCED (`AGENTS.md:154`, `tenants.partner_fee_bps` default 100) |
| Dev fee | 0,5% of value → **$250 on $50k** | every router sweep | SOURCED (`usdc-arc.ts:52-53`, `AGENTS.md:140`) |
| PSAV net-worth capital | USD 35k / 75k / 150k floor by category, **halved only below USD 2,5M annual volume** — at $1,000M the **full floor** applies; charge at 10%/yr = **$3.500 / $7.500 / $15.000 per year** (0,00035–0,0015% of volume; **0,17%–0,74% of P3 revenue** at $1,000M dist A) | ours if we (not a partner) hold the registration | floors SOURCED (`profile.md:71`, RG 1172/2026 arts. 1, 10); 10%/yr charge ASSUMED (`corridor-model.py:14`); **which category applies to Treazury = unknown (§8, item 5)** |
| Engineering / fixed opex | **$60k (low) / $180k (mid) / $400k (high) per year** | fixed | **ASSUMED estimate — no burn, payroll, or `dict/finance.json` exists in this venture**; anchors: alpha tiny team (`treazury AGENTS.md`), 1 FTE eng + infra + AML tooling + part-time counsel at mid |

### 5b. Contribution per payment and break-even

Contribution per payment = P3 fee − variable cost − any %-of-value stack
applied. Four regimes at the stated mixes (all INFORMATIONAL):

| Regime | Dist A (mean $49,9k) | Dist B (mean $22,45k) | Verdict |
|---|---|---|---|
| **Required:** P3 invoiced + rails **pass-through** + fee-stack restructured off %-of-value | **+$100,09 … +$101,01** (≈99% contribution margin) | **+$77,59 … +$78,51** | PROMISING (arithmetic over sourced fee) — UNVALIDATED (no realized payment) |
| Pass-through but router sweep kept (dev 0,5% on value) | **−$148,49** | **−$33,74** | **REJECTED — no break-even at any volume** |
| + partner 100 bps (all flow referred) | **−$647,49** | **−$258,24** | **REJECTED — no break-even at any volume** |
| P3 with rails **absorbed** (on-ramp 0,45–0,60% + off-ramp 0,05–0,30%) | **−$148 … −$348** | **−$34 … −$124** | **REJECTED — P3 mathematically requires regime A pass-through** (consistent with `corridor-economics.md:301-302`) |

Break-even **only under the required regime** (variable $0,24–$1,16/pay;
fixed opex ASSUMED range):

| Distribution | Fixed $60k (low) | Fixed $180k (mid) | Fixed $400k (high) |
|---|---|---|---|
| A (594 / 1.782 / 3.960 payments per yr) | **$29,6M volume** | **$88,9M volume** | **$197,6M volume** |
| B (764 / 2.293 / 5.095 payments per yr) | **$17,2M volume** | **$51,5M volume** | **$114,4M volume** |

Formula shown by the script: `volume_break-even = fixed ÷ (fee − variable) ×
mean ticket`. Worst-case variable shifts break-even < 1% (mid A: $88,9M →
$89,7M). As-coded stacks: contribution < 0 → **the script asserts no
break-even exists at any volume.** Reading: at assumed mid opex, P3 needs
**~9% of the scenario volume (dist A)** or ~5% (dist B) to cover fixed costs —
*if and only if* the fee-stack is restructured (gate G4). Verdict:
**UNVALIDATED** (fixed opex and distributions are assumptions; nothing is
measured).

### 5c. CAC / churn / ARPU — stated honestly: they do not exist

No CAC, churn, ARPU, S&M spend, or customer count exists anywhere in this
repo — explicit search documented 2026-10-27 (`corridor-economics.md:346-383`:
grep over `docs/`, `dict/`, `src/`; aven board search; revenue = $0). This
venture also has **no `dict/finance.json`** (the `dict/` directory does not
exist), so there is no canonical `{{pricing_anchor}}`/MRR to reference.
**Verdict: UNVALIDATED — no LTV:CAC or payback figure may be presented to
investors until the following exist, all per `corridor-economics.md:365-376`:**

1. S&M spend per month by channel (paid + content + BD), same window as (2);
2. New *paying* tenants per month (≥1 fee-bearing settlement, not signup);
3. ARPU = payments/tenant/month × average ticket × take (take = P3 blended);
4. Gross margin % per payment (from 5b: ≈99% under required regime);
5. Monthly churn / average tenant life (alpha has zero history);
6. CAC definition declared before computing (blended vs paid-only).

Algebra once data exists: `LTV = ARPU × GM% / churn`, `max CAC = LTV/3`,
`payback months = CAC ÷ (ARPU × GM%)`. Because contribution is ~$100 per
*payment* rather than per tenant, the ratio will be driven by **volume per
tenant**, not by price (same conclusion as `corridor-economics.md:379-383`).

## 6. Ramp & gating — CONDITIONAL scenario, never a forecast

**Today: sellable volume = $0, revenue = $0. CONFIRMED.** The code AR profile
is `status: 'provisional'` with every flow `unknown`
(`profiles/ar.ts:24,32`); the engine refuses: "only 'confirmed' profiles are
sellable" and unknown verdict → blocked (`index.ts:236-246`); ADR-001 records
the design intent: "zero corridors are offerable until L.D confirms profiles"
(`adr-001:74,149`). The markdown profile `docs/L.D/ar/profile.md` is
`confirmed` but **not yet ported**, and it is export-centric — the IMPORT
direction (our whole question here) sits in its open-questions list
(`profile.md:110-118`).

| Gate | Legal/commercial event | What it unlocks | Conditional volume scenario → P3 revenue (dist A, INFORMATIONAL) |
|---|---|---|---|
| **G0 — today** | none: provisional profile, unknown flows, `licensedPartners: []` (`profile.md:106-108`) | nothing — engine blocks money movement | **$0 → $0/yr** (CONFIRMED) |
| **G1 (legal)** | L.D answers the **import-direction** verdicts (payer-side FX rules incl. the staged FX-access schedule BCRA reports for import payments; whether invoiced-fixed-fee collection to the agency is clean on the import leg) **and** the confirmed profile is ported into `src/modules/jurisdiction/profiles/ar.ts` in the same change (ADR-001:150-156) | AR import settlements become *sellable at all*; pilot on USD-in/USD-out pass-through flows | pilot **$10M–$50M/yr → $20.290 – $101.463/yr** |
| **G2 (legal/partner)** | contract a BCRA-authorised MCF entity (+ CNV-registered PSAV for any crypto leg) — `licensedPartnerConversion` is *conditional* on exactly this (`profile.md:55-60`) and `rails.licensedPartners` must become non-empty | conversion/settlement legs; "hours not days" becomes deliverable | **$100M–$500M/yr → $202.905 – $1.014.529/yr** |
| **G3 (legal/compliance)** | RG 1172/2026 posture resolved: registration (our own or partner's) + **net-worth floor USD 35k/75k/150k, full floor above $2,5M volume** (`profile.md:71`) + extraterritorial art. 4 nexus answer (open question `:115`) | sustains volume above the $2,5M halving threshold; removes the licensing barrier risk | enables the $500M–$1,000M band |
| **G4 (founder, commercial)** | restructure dev/partner fees off %-of-value (flat or non-existent partner fee; sweep disabled on AR flows) — **founder decision with COO/CTO, `corridor-economics.md:317-324`** | contribution turns positive (**+$101 vs −$148/−$647 per payment**) — without it, growth *increases* losses | **$1.000M → $2.029.058/yr with ~+$2,03M contribution before fixed opex** |
| **G5 (contract/product)** | contracted off-ramp partner (none exists; 2–6h claim quarantined, `corridor-economics.md` A5/T.D §3) | the delivery-time differentiator can be sold | — |

Reading of the scenario columns: they are **arithmetic attached to gates, not
forecasts** — no pipeline, LOI, or paying tenant exists to base a probability
on. The whole projection is **CONDITIONAL**. A projection that ignored G0
would be worthless, because at G0 the answer is exactly zero.

## 7. Sensitivity — the three inputs that move the answer most

Each varied low/mid/high with the others held at mid (dist A, $1,000M where
applicable). Interdependence noted where it exists.

| # | Input | Low | Mid | High | Effect on the answer |
|---|---|---|---|---|---|
| 1 | **Sellable volume (gates G1–G4)** — dominant input | **$0** (today, CONFIRMED) | $250M | $1.000M | P3 revenue **$0 → $507.265 → $2.029.058**; a gate failure multiplies everything by 0 — no other input can do that |
| 2 | **Mean ticket size** (payment count; tier mix held 65/35) | **$100k** → 10.000 pay | **$50k** → 20.000 pay | **$25k** → 40.000 pay | at $1,000M: **$1.012.500 → $2.025.000 → $4.050.000/yr** (revenue moves OPPOSITE to ticket size under a per-payment fee). Correlated sub-lever: tier mix ≤$50k at fixed N=20.040: 40% → $2.404.800, 65% → $2.029.058, 95% → $1.578.150 — mix cannot move freely without moving the mean, so treat the band as one lever |
| 3 | **Fee-stack realization** (contribution, mean $49,9k) | restructured pass-through: **+$101,01/pay** (break-even $88,9M @ mid opex) | dev 0,5% sweep kept: **−$148,49/pay** (no break-even at any volume) | + partner 100 bps: **−$647,49/pay** (no break-even) | flips the business from ~99% contribution margin to structurally loss-making at every volume — a founder decision, not a market variable |

Not in the top 3 but material: fixed opex (ASSUMED $60k/$180k/$400k) moves
break-even $29,6M / $88,9M / $197,6M — an input we control. PSAV capital
never matters (≤0,74% of revenue). Verdict on all cells: **UNVALIDATED**
(assumed inputs; no measured data).

## 8. Data I could not source — and what would resolve it

| # | Gap | Blocks | What resolves it | Owner |
|---|---|---|---|---|
| 1 | **Agency share of AR import payments** (segment TAM floor) | §1c/§2 share claims stay INFORMATIONAL; "AR imports are the TAM" cannot be confirmed or rejected | M.D interview script question; or ARCA/BCRA payer-type breakdown; even 10 agency payment logs | M.D via COO |
| 2 | **Payment counts and ticket-size distribution** (BCRA publishes values, not counts/sizes) | both distributions are stated, not measured → revenue verdict capped at UNVALIDATED | BCRA microdata of MULC payment operations by size; else first-party pilot data (the cheapest honest route) | F.D with T.D |
| 3 | **CAC / churn / ARPU / S&M spend** | no LTV:CAC, no payback — nothing for the deck | the 6-item list in §5c (instrument first cohorts + S&M ledger) | F.D |
| 4 | **Fixed opex / burn** (no `dict/finance.json`; `dict/` absent in this venture) | break-even is built on an ASSUMED $60–400k band | founder statement of current monthly burn + hiring plan; create `dict/finance.json` via `dict.py set` when the founder picks canonical finance keys | Founder → F.D |
| 5 | **Which RG 1172/2026 net-worth category applies to Treazury** ($35k/75k/150k) | capital charge band | L.D opinion against RG 1172 arts. 1, 10 | L.D |
| 6 | **Import-direction legal verdicts for AR** (profile is export-centric; staged FX-access schedule for import payments; exact BCRA communication number garbled in the informe PDF — SUSPICIOUS) | gate G1 — the projection cannot leave scenario status | L.D answers on `profile.md:110-118` + a port into `profiles/ar.ts` | L.D |
| 7 | **Whether `devWallet`/dev fee is company-controlled, and partner referral share of future flow** | ±$250–$750 per payment — the single largest cost swing (sensitivity #3) | founder statement + commercial decision with COO | Founder |
| 8 | **Non-MULC and foreign-account agency payment volume** (invisible in AR statistics) | the settlement base in §1b is a lower bound, not a ceiling | first-party data only | F.D |
| 9 | **`dict/core.json` does not exist in this venture** (no `{{startup_name}}`/`{{icp}}`/`{{pricing_anchor}}` canonical terms) | this report references terms it cannot look up | CPO/COO arbitration per workspace contract — a gap, not an inline invention | CPO/COO |

## 9. Files created / touched

| File | Change |
|---|---|
| `docs/F.D/ar/revenue-projection-1b.md` | **created** — this report (aven) |
| `docs/F.D/ar/revenue-projection-1b.py` | **created** — reproduces every table; asserts tier-sum identity and "as-coded stack has no break-even" |
| everything outside `docs/F.D/` | **not touched** (code, landing copy, other departments read-only) |
