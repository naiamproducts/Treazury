---
dept: F.D
scope: ar
kind: analysis
status: draft
as_of: 2026-10-28
sources:
 - docs/F.D/ar/crypto-utility-verdict.py (this document's engine; every table below is reproduced by it, asserts at the bottom of the file; run `python3 docs/F.D/ar/crypto-utility-verdict.py`)
 - docs/F.D/ar/ar-counterfactual.{md,py} (scenario engine: baseline / S1 no surrender duty / S2 single free FX rate / S3 no PSAV licensing; mid band, published deltas)
 - docs/F.D/global/corridor-economics.md:76-86,210-211 (break-evens with the gap priced in; the inverted "beats above" phrase REJECTED)
 - docs/F.D/ar/rent-decomposition.md:130-142 (6.82% surrender loss: oficial venta 1,559.94 vs cripto mid 1,674.12, SOURCED 2026-10-27)
 - docs/F.D/ar/revenue-projection-1b.md:1-12,125,340-343 (INDEC ICA 2026-01-20: CY2025 exports 87,077 / imports 75,791; MULC 2025 68,549 → the $1B = 1.46% share; G2/G5 gates)
 - docs/L.D/ar/profile.md:29-46,66,113 (buyerToSellerDirect / platformHoldsFunds / platformChargesFeeOnValue / platformPaysSupplier = blocked; licensedPartnerConversion = conditional; liquidation 30/60/180/365 cd + 20 bd from fecha de cobro, Com A 8481 vig. 15/09/2026)
 - docs/L.D/global/flow-matrix.md:38,73 (same verdicts in matrix form; not sellable today)
 - docs/L.D/global/red-lines.md:71 (item 21 — never present a structure as eliminating/bypassing exchange-control obligations)
 - docs/M.D/global/corridors.md:175-200 (operational ICP: triangular-trade / merchanting intermediary, $15K–$200K per payment, recurring)
 - docs/L.D/ar/fideicomiso-viability.md §6 (precedent: claim-by-claim review format; the legal screen for proposal/marketing claims lives there, not here)
 - Atradius Payment Practices Barometer, B2B payment practices trends Western Europe 2025 (bad debts affect 6% of B2B invoices) · https://group.atradius.com/knowledge-and-research/reports/b2b-payment-practices-trends-western-europe-2025 · read 2026-10-28
 - Atradius Statistical Appendix Western Europe 2026 (bad-debt write-off distribution: 51% of firms <0.5%, 17% 0.5–1%, 13% 1–2%, 11% 2–5%, 6% 5–10%, 2% >10%) · https://atradiuscollections.com/dam/jcr:942e0209-14e8-459d-ab9a-802fefa7b4e1/statistical-appendix-western-europe-2026-en%203.pdf · read 2026-10-28
 - Atradius, B2B payment practices trends North America 2026 (nearly half report bad debt <1% of receivables; <1 in 4 above 2%) · https://atradius.us/knowledge-and-research/reports/b2b-payment-practices-trends-in-north-america-2026 · read 2026-10-28
 - Atradius FAQ, What is Trade Credit Insurance (payout "often up to 90% of the debt") · https://atradius.us/our-solutions/frequently-asked-questions/what-is-trade-credit-insurance · read 2026-10-28
 - OCBC Business Banking SG, Export Letter of Credit (handling fee 0.125% of the bill, minimum S$75; advising S$30) · https://www.ocbc.com/business-banking/smes/trade/export-letter-of-credit · read 2026-10-28
 - CIMB Standard Trade Finance Tariffs, Export (handling 0.125% or min S$75; confirmation/acceptance commission min S$300) · https://www.cimb.com.sg/en/business/help-support/rates-charges/fees-charges/standard-trade-finance-tariffs/export.html · read 2026-10-28
 - Mashreq Hong Kong tariff sheet HK-SOC-01-04-2025 (export LC bill handling first USD 100k @ 0.25%, balance @ 0.125%, min USD 150; LC confirmation min USD 175) · https://www.mashreq.com/-/jssmedia/pdfs/hong-kong/HK-SOC-01-04-2025-en.ashx · read 2026-10-28
 - aven (this task; claims under review were briefed there, not reproduced in the repo)
---

# AR — Is crypto actually useful for Argentine foreign trade? Importaciones vs exportaciones

Decision-support for the founder. Not legal advice. Every claim carries a
verdict (CONFIRMED / SUSPICIOUS / INFORMATIONAL for facts;
VALIDATED / PROMISING / UNVALIDATED / REJECTED for financial claims). Numbers
are reproduced by `crypto-utility-verdict.py`; uncited inputs are marked
**ASSUMED** in the ledger at §8.

## 0. Direct answer (one line)

**Importaciones: NO — crypto loses at every ICP ticket and in every scenario,
because the official-rate dollar is a ~6.82% subsidy the importer captures and
USDC cannot match. Exportaciones: PROMISING — crypto wins only once the escrow's
default-risk protection is priced in, and only if the fee is invoiced off-flow;
on today's rails it sells $0.**

## 1. The verdict table

| | Importaciones (importer pays supplier abroad) | Exportaciones (exporter collects from abroad) |
|---|---|---|
| Direction of the regime's money | Importer **buys** USD in the MCF at the official rate — a subsidized dollar | Exporter **sells** USD at the official rate — surrenders the market premium |
| Dominant number | USDC loses **−$794 / −$3,490** per $25k / $100k payment (AR→US, mid) — script §1 | The 6.82% surrender loss (**$1,705 / $6,821** per $25k / $100k) is **common to both channels** — script §3 |
| Does crypto change it? | No. USDC wins only **below $2,920** (AR→US) / **$2,269** (AR→CN) — micro-tickets, zero ICP overlap | Not the surrender loss — but it can cut rail + compliance cost and add default protection |
| Differential at ICP tickets ($15k–$200k) | Negative in baseline, S2, S4-compact; positive only in S1-AR→US (a world with no surrender duty, which is not this world) | **+$80.63 / +$61.36 / −$52.42** net of P3 at $25k / $49.9k / $100k without the risk term (script §4); positive at all tickets once default EV is added (script §5) |
| **Verdict** | **REJECTED** (at the ICP, in the current regime) | **PROMISING** (conditional: invoiced fee, contracted escrow, default-rate ≥ ~0.4–0.7%) |

Same platform, opposite economics: the exchange-control regime **subsidizes the
importer and taxes the exporter**, and a crypto rail only helps the party the
regime taxes — and only for the part of the bill the rail touches, not for the
6.82% the regime takes.

## 2. Importaciones — the model, reaffirmed

Mid band, published scenario deltas (`ar-counterfactual.md:133-148`; +
= USDC cheaper):

| Corridor | Ticket | SWIFT all-in | USDC all-in | Δ |
|---|---|---|---|---|
| AR→US | $25,000 | $499 | $1,293 | **−$794** |
| AR→US | $100,000 | $1,665 | $5,155 | **−$3,490** |
| AR→CN | $25,000 | $509 | $1,490 | **−$981** |
| AR→CN | $100,000 | $1,695 | $5,915 | **−$4,220** |

Break-even (with the gap priced in, mid): **$2,920 (AR→US)** and **$2,269
(AR→CN)** — USDC wins *below*, SWIFT above (`corridor-economics.md:210-211`;
the "beats above" phrasing in `crypto-rails-benefit.md:102-105` stays
**REJECTED** as inverted). Scenario sweep (script §1):

| Scenario | AR→US $25k / $100k | AR→CN $25k / $100k | Reading |
|---|---|---|---|
| S1 no surrender duty | +106 / +110 | −81 / −620 (BE $13,650) | Only if the exporter never had to surrender — counterfactual, not AR |
| S2 single free FX rate | −44 / −490 | −231 / −1,220 | Free regime removes most of the brecha; **still negative at ICP tickets** |
| S3 no PSAV/licensing | −794 / −3,490 | −981 / −4,220 | Licensing is not the binding cost — the FX gap is |
| S4-compact (bank fx 0.60%) | −119 / −790 | −306 / −1,520 | Even a bank that drops its markup to 0.60% still wins |

Why: an Argentine importer's alternative is not "SWIFT vs USDC" but "official
dollar vs market dollar". Paying by wire in the MCF lets them source the dollar
at 1,559.94; a USDC route sources it at the crypto mid 1,674.12
(`rent-decomposition.md:130-139`). The importer is **paying a 6.82% premium to
get out of a subsidized channel** — crypto cannot arbitrage that away, it can
only charge for the privilege. S2 shows even total deregulation does not flip
the sign at ICP tickets. **Importaciones verdict: REJECTED.**

## 3. Exportaciones — where the case actually lives

### 3.1 The 6.82% is the same in both channels

The exporter must ingress and liquidate the collection at the official rate
(`profile.md:29-32`, Decreto 609/2019 art. 1 + TO §7.1; 30/60/180/365 calendar
days + 20 business days from fecha de cobro under Com A 8481,
`profile.md:66,113`). Receiving USDC in an offshore wallet does **not**
discharge that duty (Engram #1439, REJECTED; red-line item 21,
`red-lines.md:71` forbids claiming otherwise). So the surrender loss —
**6.82% of market USD** at the official *venta* side (**$1,705 / $3,403 /
$6,820** on $25k / $49.9k / $100k; compra side 9.99%, INFORMATIONAL caveat) —
is charged identically to a wire exporter and to a USDC exporter. It is not a
competitive variable; it is the price of being Argentine. What *is* a
competitive variable: rail cost, compliance cost, collection time, and default
risk.

### 3.2 Channel A vs channel B, central (script §4)

Channel A = bank wire US→AR (mid: $110 fixed, 3 business days float, plus an
ASSUMED $150 of asesor cambiario/abogado per collection).
Channel B = escrow + P3, excluding P3's fee (ASSUMED $30 of platform document
review):

| Ticket | A (wire+float+compliance) | B excl. fee | Rail+compliance saving | − P3 fee | Net |
|---|---|---|---|---|---|
| $25,000 | $280.55 | $124.92 | +$155.63 | $75 | **+$80.63** |
| $49,900 | $301.01 | $164.65 | +$136.36 | $75 | **+$61.36** |
| $100,000 | $342.19 | $244.61 | +$97.58 | $150 | **−$52.42** |

Read this honestly: **on rail + compliance alone, P3 does not pay for itself at
$100k**, and the saving shrinks as tickets grow (fixed fees amortize). The
escrow case is not a cost case. It is a risk case.

### 3.3 The default-risk term is what makes it work (script §5)

B2B default incidence: bad debts affect **6% of B2B invoices** in Western
Europe (Atradius 2025), with the 2026 distribution showing **~30% of firms
writing off ≥1% of sales and ~19% writing off ≥2%** (Statistical Appendix WE
2026); North America is tighter — nearly half below 1%, fewer than 1 in 4 above
2% (Atradius NA 2026). Trade-credit insurance pays "often up to 90% of the
debt" (Atradius FAQ), i.e. recovery on a bad B2B invoice typically lands at
0–90%, modelled here at **0% (central) / 40% (conservative)**.

| Corner (d, recovery) | Fee ceiling at $25k / $49.9k / $100k | vs P3 ($75/$75/$150) | Exporter net |
|---|---|---|---|
| conservative (1.0%, 40%) | $125.63 / $255.76 / $517.58 | **1.7x / 3.4x / 3.5x** covered | +$50.63 / +$180.76 / +$367.58 |
| central (2.5%, 0%) | $780.63 / $1,383.86 / $2,597.58 | 10.4x / 18.5x / 17.3x | +$705.63 / +$1,308.86 / +$2,447.58 |
| upper (5.0%, 0%) | $1,555.63 / $2,781.36 / $5,247.58 | 20.7x / 37.1x / 35.0x | +$1,480.63 / +$2,706.36 / +$5,097.58 |

The break-even default rate at which P3 becomes value-neutral (conservative
rail, 40% recovery) is **d\* = 0.662% / 0.396% / 0.387%** of the book. Atradius
observes 1–6% bad-debt incidence and ~30% of firms above 1% — so **any default
rate in the observed range pays for the escrow**, and the P3 fee is 3.3x–40x
covered at recovery 0%. This is the strongest number in the deliverable, and it
is also the softest evidence: we have **zero first-party data on AR-exporter
default rates** — only global B2B benchmarks. **UNVALIDATED, PROMISING.**

### 3.4 Time: the rail is not the bottleneck (script §6)

Rail-vs-rail, mid: bank 3 days vs escrow **4 days** (Circle express ~1d + an
ingress wire into AR) — **crypto is 1 day slower on rails alone**. The
scenario-level time savings (+11 / +29 / +45 days low/mid/high) come entirely
from documentary + compliance turnaround, not from settlement speed. Valued at
the model's 10%/yr that is $75–$794 per payment; at an ASSUMED Argentine
working-capital rate of 40%/yr, $301–$3,178. **The "hours not days" claim is
therefore quarantined**: no contracted rail exists (`rails.licensedPartners: []`,
`revenue-projection-1b.md:340` G2), so delivery-time promises violate our own
red line and stay **REJECTED as a sellable claim until a named partner signs**
(`corridor-economics.md` A5; `revenue-projection-1b.md:343` G5). The day-count
values are deliberately **not** added to the §3.3 ceiling.

## 4. Claim check — "a flat fee is immune to banks dropping their markup"

Free regime (no brecha), bank markup 0.60% (what an Argentine bank charges to
convert and remit), P3 $75 ≤ $50k / $150 > $50k (script §7):

| Config | $25k | $49.9k | $100k | $1M | Verdict |
|---|---|---|---|---|---|
| Payer already holds USDC | −$188 | −$345 | −$587 | −$6,277 | Crypto wins **everywhere** (slope 0.70% vs 0.68%) |
| Payer must buy USDC (on-ramp 0.45% + 0.15% spread) | −$38 | −$46 | **+$13** | −$277 | Wins ≤ $50k, **loses $50k–$139,849**, wins above |
| 1.5%-of-value fee, payer buys USDC | +$262 | +$627 | +$1,363 | +$14,573 | Break-even **$7,152** — never at ICP tickets |
| With today's brecha priced in (baseline) | — | — | — | — | Break-even **$2,920 / $2,269** — never at ICP tickets |

So the immunity claim is **SUSPICIOUS**: true only if the payer already holds
USDC (i.e. an exporter or an offshore-dollar holder — not the average importer
paying in pesos), and only against a bank that leaves its markup at ≥0.60%. It
is false for a peso payer in the $50k–$140k window, false at our own 1.5%
pricing, and irrelevant while the brecha exists. The flat fee's real defence is
legal, not economic: `platformChargesFeeOnValue: blocked`
(`profile.md:39-42`) — a percentage taken from the collection itself is not
available to us at all.

## 5. Unit economics and volume (script §8)

INDEC CY2025 goods exports **$87,077M** (`revenue-projection-1b.md:8`, ICA
2026-01-20). At distribution A (mean $49,900/payment, blended take 0.203%):

| Capture of exports | Volume | Payments/yr | P3 revenue/yr |
|---|---|---|---|
| 0.50% | $435M | 8,725 | $883,421 |
| 1.00% | $871M | 17,450 | $1,766,843 |
| **1.46%** (the share the import model assumed, 1,000/68,549) | $1,271M | 25,477 | **$2,579,591** |
| 2.00% | $1,742M | 34,901 | $3,533,686 |

The $1B/yr import scenario yields **$2,029,058/yr**; the export case at the
*same* share yields **1.27x** that. Same platform, larger pool, and the only
one where the customer's alternative is worse.

Contribution per payment as the code charges it: **+$101.01** (fee invoiced,
config A) vs **−$148.49** (dev fee 0.5% on value) and **−$647.49** (partner
100bps + dev). The negative stacks are not a pricing accident — they charge a
fee *on the value of a flow the legal profile blocks us from touching*
(`platformChargesFeeOnValue: blocked`). **The only contribution-positive
configuration is also the only legal one: invoice the fee separately, off-flow.**
Sellable volume today is **$0** (fail-closed, provisional profiles, empty
licensed-partner rails) — every revenue cell above is a conditional projection,
not a forecast.

## 6. Four claims, audited economically

(Claim wording as briefed for aven; the *legal* screen for proposal
claims — including the "eliminando la burocracia cambiaria" family — is
`fideicomiso-viability.md` §6 and red-line item 21. What follows is the
financial audit.)

| # | Claim | Verdict | Economic basis |
|---|---|---|---|
| 1 | Settlement "en minutos" | **REJECTED** (as availability: true only for the on-chain leg between two crypto-native wallets, false for "el beneficiario lo recibe en su banco") | Escrow leg is 4 days best-case vs 3 days on rails (script §6); no contracted rail exists, so the delivery promise is quarantined (G5) |
| 2 | Devaluation protection "Total" | **REJECTED** | USDC holds *dollar* value, but the exporter's exposure is the official-vs-market rate — a **6.82%** surrender loss charged in both channels — and the country-risk component survives any regime change (ar-counterfactual natural experiment, `ar-counterfactual.md:100-108`). Crypto removes zero points of that 6.82% |
| 3 | Flat fee immune to bank markup competition | **SUSPICIOUS** | §4: wins everywhere only in the holds-USDC config; loses $50k–$139,849 as a peso payer; never wins at 1.5% pricing; irrelevant under the brecha |
| 4 | "Asesores a cero" (no FX advisers/lawyers needed) | **SUSPICIOUS** | Compliance is 53% of channel A's mid cost at $25k and 44% at $100k (ASSUMED $150/collection); the legal path requires a BCRA-authorised MCF entity and, for the crypto leg, a CNV-registered PSAV (`profile.md:43-60`) — professional intermediation is structural, software only re-prices it ($30 in channel B), it does not erase it |

## 7. Verdict ledger

| Claim | Verdict |
|---|---|
| "Crypto is useful for Argentine **importations** at ICP tickets" | **REJECTED** — negative in baseline, S2, S4-compact; positive only in the counterfactual S1-AR→US |
| "Crypto is useful for Argentine **exportations** at ICP tickets" | **PROMISING** — rail+compliance saving small/negative on big tickets; works once default-risk is priced in (d\* 0.39–0.66%) and the fee is invoiced off-flow |
| "The 6.82% surrender loss dominates every other number on the table" | **CONFIRMED** as arithmetic (6.4x the entire on-wire rent, `rent-decomposition.md:138`); the causal split control-premium vs country-risk is **UNVALIDATED** (event study, backlog) |
| "Escrow is faster than SWIFT on rails" | **REJECTED** — −1 day at mid; time savings are documentary, not rail |
| "Flat fee is immune to a bank that cuts its markup to 0.60%" | **SUSPICIOUS** — holds-USDC config only |
| "Contribution is positive at any fee configuration that touches the flow" | **REJECTED** — on-flow fee configs are −$148 to −$647 per payment *and* legally blocked |
| Default rates used (1% / 2.5% / 5%, recovery 0–40%) | **INFORMATIONAL** — global B2B benchmarks (Atradius), zero first-party AR data |
| WTP for the P3 fee ($75/$150) | **UNVALIDATED** — no Van Westendorp survey, no interviews; ceiling in §3.3 is a *value-based maximum*, not evidence anyone pays it |

## 8. Decisions that are the founder's (options, not commitments)

1. **Pricing shape.** (a) Keep P3 flat $75/$150 invoiced separately — legal,
 contribution-positive, but WTP unvalidated; (b) flat only above $50k
 (drop the $75 tier) — tests price elasticity at the ICP's modal ticket, at
 the cost of the micro-ticket margin; (c) raise to $150/$300 — the §3.3
 ceiling shows 10–17x headroom *if* the default bet holds, but we have no
 willingness-to-pay evidence for it. Trade-off: (a) is safe and unproven,
 (b) is the cheapest experiment, (c) maximizes take on an unvalidated bet.
2. **Where to sell.** Imports (REJECTED at ICP tickets) vs exports/merchanting
 (PROMISING) vs the agency-as-operator secondary segment
 (`corridors.md:175-200`). The economics say exports; M.D's already
 points the same way.
3. **Validate the two soft numbers before pricing publicly**: (i) the $150/collection
 compliance cost (ASSUMED — one quote from an AR asesor cambiario turns it
 CONFIRMED or kills channel A's stack); (ii) AR-exporter default incidence
 (10 payment logs beat all of Atradius).

## 9. Assumption ledger

| Input | Value | Status |
|---|---|---|
| Official venta 1,559.94 / cripto mid 1,674.12 → surrender loss 6.82% | SOURCED 2026-10-27 | CONFIRMED as rates; causal split UNVALIDATED |
| Wire rates, fixed $45/$20/$15/$30, days 2/3/6, float 10%/yr | `corridor-model.py` unchanged | CONFIRMED (model of record) |
| US_OUT fx markup 2.5% | Shown in table only, **excluded** from the export differential (double-counts the 6.82%) | Methodological choice, stated |
| Channel A compliance $150/collection; channel B $30 | ASSUMED | INFORMATIONAL — see §8.3 |
| Default d = 1/2.5/5%, recovery 0–40% | ASSUMED from Atradius benchmarks | INFORMATIONAL |
| Escrow leg 4 days (Circle express 1d + wire 3d) | ASSUMED | INFORMATIONAL |
| Working-capital rate 40%/yr for the time valuation | ASSUMED (model rate 10% shown alongside) | INFORMATIONAL |
| INDEC CY2025 exports 87,077 / imports 75,791; MULC 2025 68,549 | SOURCED (ICA 2026-01-20; BCRA balance Aug-2026) | CONFIRMED |
| P3 $75/$150, blended take 0.203% at dist A | `revenue-projection-1b.py` as coded | CONFIRMED as the model, UNVALIDATED as a price |
