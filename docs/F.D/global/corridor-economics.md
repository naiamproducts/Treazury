---
dept: F.D
scope: global
kind: report
status: provisional
as_of: 2026-10-27
sources:
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:13-94 (PARAMS), :96-106 (corridors), :117-139 (cost fns)
 - /home/kiox/treazury/docs/F.D/global/corridor-audit.py (this audit's computations, added 2026-10-27)
 - /home/kiox/treazury/docs/T.D/global/crypto-rails-benefit.md:62-105
 - /home/kiox/treazury/docs/L.D/global/flow-matrix.md:38-84
 - /home/kiox/treazury/docs/M.D/global/corridors.md:83-209
 - /home/kiox/treazury/contracts/PaymentRouter.sol:19-20,30,394-407
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:52-53
 - https://info.bankofamerica.com/en/digital-banking/wire-transfers (accessed 2026-10-27)
 - https://www.chase.com/personal/fees/premier-plus-checking (accessed 2026-10-27)
 - https://www.wellsfargo.com/mobile-online-banking/service-fees/ (eff. 2026-09-11, accessed 2026-10-27)
 - https://bitso.com/fees (accessed 2026-10-27)
 - https://help.circle.com/s/article/USDC-redemption-structure (eff. 2026-10-19, accessed 2026-10-27)
 - https://www.bis.org/publications/working-paper-1385-competing-rails-crossborder-payments-banks-fintechs-and-stablecoins (BIS WP 1385, 2026-10-19, accessed 2026-10-27)
 - https://tn.com.ar/economia/2026/10/27/dolar-oficial-hoy-y-dolar-blue-a-cuanto-cotizan-este-martes-27-de-octubre/ (accessed 2026-10-27)
 - https://valordolarblue.ar/dolar-historico (2026-10-27, accessed 2026-10-27)
 - https://transferfees.io/chase-wire-transfer-fees (accessed 2026-10-27)
 - /home/kiox/treazury/AGENTS.md (partner fee decision, product-decisions table)
 - 
---

# Treazury — corridor economics: audit, crossover tickets, pricing options

Scope note (Rule 1 reconciliation, same pattern as `docs/T.D/global/crypto-rails-benefit.md:26-29`):
this is a multi-corridor **cost/pricing model**, not a regulatory artifact. No
jurisdictional claim is made here; legal verdicts are pointers to
`docs/L.D/global/flow-matrix.md` and `docs/L.D/<cc>/profile.md`, which win on
anything country-specific.

Tagging: **SOURCED** = URL + access date or `path:line`. **INFORMATIONAL** =
assumption, range, or model output under stated parameters — not a verified
fact. Every model output below is INFORMATIONAL by construction; the input
ledger (§1b) says which inputs are SOURCED vs ASSUMED. Reproduce everything
with `python3 docs/F.D/global/corridor-audit.py` (which loads
`corridor-model.py` and asserts against the published T.D table).

## 0. Bottom line

- **CONFIRMED — the arithmetic of `corridor-model.py` is correct.** All 11
 published T.D headline figures reproduce to the dollar
 (`corridor-audit.py` S1; T.D `crypto-rails-benefit.md:62-74`). The 1.5%
 platform fee is CONFIRMED in code (1% + 0.5%: `usdc-arc.ts:52-53`, netted in
 `_sweep` `PaymentRouter.sol:398-400`).
- **PROMISING — the headline corridor verdicts hold at mid assumptions, with
 deltas:** CO→US +$309/+$935 at $25k/$100k; US→MX +$297/+$903; MX→US
 +$64/−$28 (flips at $77,091); AR→US −$794/−$3,490; AR→CN −$981/−$4,220
 (positive = USDC cheaper; all INFORMATIONAL, mid band).
- **REJECTED — the T.D break-even sentence** (`crypto-rails-benefit.md:102-105`):
 it has the direction backwards and misattributes the scenario. AR→CN/AR→US
 break-evens are tickets *below which* USDC wins — and USDC keeps losing those
 corridors at every ICP ticket even with the AR gap removed (§1, A1).
- **UNVALIDATED — the cost claim in the no-FX case.** If the ICP settles
 USD-invoiced, USD-accounted payments (both ends bank in USD), SWIFT's cost
 collapses to $100–113 fixed + ~0.05% float (plus 0.4% GMF on CO) and
 **USDC loses the entire $15K–200K
 ICP range by ~$330 (at $25k) to ~$1,600 (at $100k) per payment**
 (§2, case B). Whether the ICP's real invoices carry an FX leg is a
 one-question test that must go into M.D's interview script.
- **The whole cost win is a bet on bank FX markup ≥ ~1.7–2.4%** (§2, fx*
 thresholds). BIS WP 1385 observed 2–4.7% (SOURCED, 2026-10-19) — mid is
 empirically defensible, but at the low end of that range every corridor flips
 to SWIFT at large tickets, and fintech MTOs (also BIS: substantially cheaper
 than banks) are not in the model at all — the model compares vs **bank
 SWIFT only**.

## 1. Audit of the existing model

### A1 — T.D's break-even sentence is wrong (REJECTED)

`crypto-rails-benefit.md:102-105` says: *"USDC beats SWIFT above ~$2,269
(AR→CN) and ~$2,920 (AR→US) **if the AR gap were absent**; with the gap priced
in, USDC never wins those corridors at any size."* Both halves are wrong
(arithmetic in `corridor-audit.py` S6):

| Claim | What the model actually computes | Verdict |
|---|---|---|
| "beats **above** ~$2,269" (AR→CN) | $2,269 is the break-even **with** the gap priced in (mid 3%); below it USDC is cheaper (fixed $15 vs $113), above it SWIFT is cheaper (slope 5.90% vs 1.58%) | REJECTED — direction inverted |
| "$2,269 if the gap were absent" | gap-free break-even is **$7,435** (slope 2.90% vs 1.58%) — and still "USDC wins below, SWIFT above" | REJECTED — wrong scenario number |
| "with the gap, USDC never wins at any size" | USDC wins **below $2,269** (micro-tickets only) — just not at any ICP ticket | SUSPICIOUS — right for the ICP, wrong as stated |
| same for AR→US | with gap $2,920 (USDC below); gap-free $17,638 (USDC below) | REJECTED, same two errors |

Root cause: the model's own output is right; the prose read the positive
break-even as "USDC wins above". The deeper truth the sentence misses: **even
without the AR gap, SWIFT's official-rate FX markup (1.5% mid) is lower than
the USDC stack (2.90% AR→CN / 2.15% AR→US)** — the AR gap is not the only
reason crypto loses those corridors; the 1.5% platform fee + CN off-ramp alone
(2.30%) already exceed a tight bank FX spread.

### A2 — The no-FX case is missing (material, changes ICP verdicts)

`corridor-model.py` always applies a bank FX markup (`fx_pct`, `:32-37`) —
correct when a conversion is needed, **wrong when both parties bank in USD**,
which is the normal state for the triangular-trade ICP (`corridors.md:175-189`:
US/MX operating accounts, USD trade invoicing). Case B in `corridor-audit.py`
S2/S3 recomputes with FX = 0 on the SWIFT side and a USD→USDC→USD crypto stack:

- SWIFT all-in falls to **0.15–0.91%** at $25k–$100k (fixed $100–113 dominates).
- USDC all-in stays **~1.80–2.26%** (the 1.5% fee + ramps dominate).
- Break-even: **$5,257–$6,360** — USDC wins only below it; **the entire
 $15K–200K ICP range loses on cost**, by −$316…−$338 at $25k and
 −$1,590…−$1,630 at $100k, per corridor (INFORMATIONAL, mid).

This does not kill the product (time + documents still differ), but it kills
the *cost* claim for any USD-USD flow. **The founder must know today:** the
savings pitch is conditional on an FX leg existing in the flow.

### A3 — The win is band-fragile: adverse corner flips every corridor

The T.D prose "USDC cheaper at every size" is a **mid-band** statement. In the
adverse cross-band (SWIFT low fees/FX vs USDC high ramps) the break-even drops
to **$294 (AR→CN), $375 (AR→US), $1,492 (MX→US), $3,088 (CO→US), and
$2,132/$2,181/$2,381 (US→CO / US→MX / US→AR)**
(`corridor-audit.py` S3b) — i.e. USDC wins only micro-tickets. Not a model
error (the T.D table does show "bands overlap"), but the headline sentence
overstates robustness. Same-band low-band break-evens: US→MX $16,850,
US→CO $10,070, US→AR $8,939 — inside the ICP range even without crossing bands.

### A4 — Input ledger: what is SOURCED, what is ASSUMED, what is stale/wrong

SWIFT baseline:

| Input | Model value (`corridor-model.py`) | Status | Evidence |
|---|---|---|---|
| Sender wire fee US | (30, 45, 60) | **SOURCED** | BofA intl USD $45 (info.bankofamerica.com, 2026-10-27); Chase $40 online/$50 branch (chase.com fee schedule, accessed 2026-10-27); Wells Fargo business digital intl USD $30 (wellsfargo.com, eff. 2026-09-11) — brackets CONFIRMED |
| Sender wire fee AR/MX/CO | (25–60) | **ASSUMED** (INFORMATIONAL) | "assumed similar or higher" (`:22-28`); no LatAm bank schedule collected |
| Correspondent/intermediary | (0, 20, 40), **one** charge | **SOURCED range / ASSUMED count — undercount** | $15–50 **per hop** (transferfees.io, 2026-10-27); model applies a single hop. AR→CN/AR→US likely ≥2 hops → SWIFT understated $15–50 there. Does not flip any verdict (AR→CN gap is $981) |
| Beneficiary fee US | (0, 15, 25) | **SOURCED** | Chase intl incoming $15, Wells incoming $15 (same dates as above) |
| Beneficiary fee CN/MX/CO/AR | (0, 15, 25) | **ASSUMED** (INFORMATIONAL) | no schedule collected |
| FX markup over mid | AR (0.5/1.5/3.0), MX (1.5/2.25/3.0), CO (2/3/4), US_OUT (1.5/2.5/4) | **SOURCED range, band placement ASSUMED** | BIS WP 1385: bank FX markups **≈2–4.7%** in a small sample even for liquid pairs, before wire fees (bis.org, 2026-10-19). Model mid sits in range; model **lows (0.5–1.5%) sit below the observed floor** — the crypto-friendly corner |
| Nostro float | 10%/yr × days (`:14,125`) | **ASSUMED**, single rate, no range; conceptual **double-count** (bank FX margin already covers bank nostro costs) | magnitude 0.04–0.16% — **immaterial to every verdict**; would need 10× error to matter |
| Repair gross-up | (0, 30, 80) | **ASSUMED** (INFORMATIONAL) | unsourced (`:60-62`) |
| Settlement days | 1.5–6 by corridor | **ASSUMED**, anchored to BIS fast/slow routes | `:49-59` |

USDC stack:

| Input | Model value | Status | Evidence |
|---|---|---|---|
| Platform fee | 1.5% (1% + 0.5%) | **SOURCED — CONFIRMED** | `usdc-arc.ts:52-53`, `PaymentRouter.sol:398-400` |
| On-ramp taker Bitso MX/CO/AR | MX (0.585/0.728/0.780), CO (0.17/0.47/0.65), AR (0.45/0.45/0.60) | **base tiers SOURCED, specific mid tiers SUSPICIOUS** | bitso.com/fees (2026-10-27): MXN taker 0.780% base → 0.130% top tier; COP 0.650% base → 0.470% (>75M); ARS 0.600% base → 0.500% (>8.1M). Model mids bracket the schedule but 0.728/0.45 were not found verbatim; at $25k volume the MX tier is 0.741% vs model mid 0.728 (close) |
| Exchange spread | 0.05–0.40% | **ASSUMED** (not published) | `:73-75` — correctly labelled in the model |
| USD on-ramp | 0% (Circle Mint) | **SOURCED** | circle.com/legal/usdc-terms: no fee to tokenize USD (accessed 2026-10-27) |
| Gas | ~$0.02/transfer | **ASSUMED** — unverified for Arc mainnet (only Arc Testnet deployed, `AGENTS.md` onchain section) | dust-scale but real; Arc gas token is USDC (18 dec) |
| Off-ramp US | (0, 0.05, 0.30) | **SOURCED low/mid, high ASSUMED** | Circle redemption structure eff. 2026-10-19: Standard **0 bps but up to 2 business days**, Express 5 bps (help.circle.com, 2026-10-27). **Audit note:** the 0% band is not instant — cheapest off-ramp = slowest; the model's cost table and the time story trade off against each other |
| Off-ramp MX/CO | Bitso taker + SPEI free | **partial SOURCED** | SPEI withdrawal free (bitso.com/fees/transactions, 2026-10-27); taker as above |
| Off-ramp CN | 0.40–1.50% | **ASSUMED** (no CN VASP at scale) | `:86-87` — correctly labelled |
| AR official-vs-crypto gap | (0, 3.0, **5.83**) `:79` | **STALE** — high band understated | model cites 1640.38 vs 1550.00 on 2026-10-25; **refreshed 2026-10-27: dolar cripto 1,672.88–1,675.37 vs oficial venta 1,560 → brecha 7.24–7.45%** (tn.com.ar 09:24, valordolarblue.ar, both 2026-10-27). Verdict-invariant (AR corridors lose either way) but the high band should read ~7.4%. Counter-note: cripto ≈ CCL (1,683), so vs CCL-access payers the gap ≈ 0 — model's 0% low band already covers them (INFORMATIONAL) |
| GMF (CO) 0.4%, both paths | `:83` | **SOURCED statute / ASSUMED application to crypto leg** | DIAN art.870-881 via T.D; whether a stablecoin purchase triggers GMF is an open L.D question — if it does not, CO→US crypto improves 0.4pp |

### A5 — Two incompatible cost-allocation stories are mixed

`usdc_cost` charges on/off-ramp fees **to the payer** (so the payer's all-in
includes rail + 1.5%), while the margin section (`:213-228`) subtracts rail
costs **from platform revenue** (so the platform absorbs them). Both cannot be
true. Reality today: **no ramp integration exists in `src/`** (T.D §1), so the
only implemented story is pass-through (customer's own exchange account) —
regime A. Regime B (absorbed) requires contracted `LicensedRail` partners
(`rails.licensedPartners: []`). All pricing math below states which regime it
uses. The margin section also hardcodes rail numbers that don't match `PARAMS`
(e.g. US spread 0.10% at `:218` vs params US spread 0.00 at `:75`) — minor,
labelled here rather than editing the cited file.

### A6 — Other findings (no verdict change)

- **Platform-fee gross-up omitted** from the all-in: fee is netted from
 principal (`_sweep`), so a payer who must deliver the invoice in full pays
 1.523% grossed up, not 1.5% (+0.02pp — immaterial; model shows the gross-up
 at `:249-252` but doesn't feed it back).
- **Dev fee is a cost, not our revenue**: `_sweep` pays 0.5% to `devWallet`
 (`PaymentRouter.sol:399-401`). Whether that wallet is company-controlled is
 unknown — **open question for the founder**; it moves every margin figure by
 0.5pp of value.
- **Order-book impact at $200k unmodelled**: taker fee + slippage on
 USDC→MXN/COP depth can exceed the assumed 0.15–0.40% spread at ICP-top
 tickets (INFORMATIONAL — needs a real quote).
- **AR transfer taxes, LatAm wire surcharges, fintech alternatives**: not in
 the model. The alternative set is **bank SWIFT only**; BIS WP 1385 shows
 fintech MTOs "substantially reduce" costs vs bank wires ($40–60 median on
 $10k US transfers to developed markets) — a cheaper non-bank alternative
 would compress every "win" computed here (SOURCED bis.org, 2026-10-19).
- **No file `corridor-economics.md` existed** — only `corridor-model.py`
 (this document is the economics report the task referred to; `corridor-model.py`
 is deliberately **not edited** so T.D/M.D line citations into it stay valid).

## 1b. Verdict on the model itself

| Claim | Verdict |
|---|---|
| Arithmetic / reproduction of published figures | **CONFIRMED** (S1, 11/11) |
| Headline: "USDC clearly beats SWIFT only on CO→US; AR loses; mirrors win" (mid band) | **PROMISING** — correct under stated mid inputs; bands overlap on every corridor; inputs partly ASSUMED |
| "USDC cheaper at every size" (CO→US + mirrors, mid) | **PROMISING** (mid-band only — see A3) |
| T.D break-even sentence | **REJECTED** (A1) |
| Cost claim for USD-USD flows | **REJECTED** in case B (A2) — UNVALIDATED until ICP invoices are checked |
| 1.5% platform fee | **CONFIRMED** in code |

## 2. Crossover ticket size per corridor (Deliverable 2)

All cells: model output under mid band, **INFORMATIONAL** (S3/S3b/S4 of
`corridor-audit.py`). Positive break-even direction: USDC wins **below** the
ticket, SWIFT above (crypto's variable cost is higher; its fixed cost is
lower). ICP = $15K–200K (`corridors.md:179-182`, INFORMATIONAL market signal).

| Corridor | Case A BE (mid) | Case A BE low band | Case B BE (no FX leg) | Verdict at $15k / $25k / $100k / $200k (case A, mid) | Inside ICP? |
|---|---|---|---|---|---|
| AR→CN | $2,269 | $1,462 (high $2,957) | $6,360 | S / S / S / S | **Loses whole ICP** — crossover below floor |
| AR→US | $2,920 | $2,055 (high $3,689) | $6,085 | S / S / S / S | **Loses whole ICP** |
| MX→US | **$77,091** | $3,364 (high: none — USDC wins all) | $5,505 | U / U / TIE / S | **Crossover sits INSIDE the ICP** — wins bottom half, loses top half |
| CO→US | none (USDC wins all) | none | $5,795 | U / U / U / U | Wins whole ICP at mid; case B flips it |
| US→MX | none | $16,850 (high: none) | $5,257 | U / U / U / U | Wins whole ICP at mid; adverse band flips above $16.9k; case B flips it |
| US→CO | none | $10,070 | $5,257 | U / U / U / U | same pattern |
| US→AR | none | $8,939 | $5,300 | U / U / U / U | same pattern; legal wall on seller side anyway |

Legend: U = USDC cheaper, S = SWIFT cheaper, TIE = |Δ| < 0.05% of ticket or
<$25. Case A = FX leg present (as modelled); case B = USD-invoiced,
USD-accounted both ends.

**Answer to the founder's question — where the claim holds and where it does not:**

1. **Holds (mid):** any corridor with a real FX leg priced near mid bank
 markups, at any ICP ticket — CO→US, US→MX, US→CO, US→AR; MX→US below $77k.
2. **Does not hold:** AR→CN, AR→US at any ICP ticket (even gap-free);
 MX→US above $77k; **every corridor above ~$5.3–6.4k when there is no FX
 leg** (case B); every corridor above ~$0.3–3.1k in the adverse
 bank-low/crypto-high corner.
3. **FX sensitivity (S4):** USDC wins at size iff bank FX markup > fx*:
 US→MX 1.69%, US→AR 1.87%, US→CO 1.90%, CO→US 2.17%, MX→US 2.37%,
 AR→US 5.10%, AR→CN 5.82%. Model mid: 2.50 / 2.50 / 2.50 / 3.00 / 2.25 /
 1.50 / 1.50. **MX→US loses at size on the model's own mid (2.25 < 2.37);
 AR corridors need markups no bank charges.** BIS observed 2–4.7% — mid is
 defensible, the low band is where the claim dies.

**ICP vs economics — the disagreement to surface today:** the CMO's ICP floor
($15k) sits above every case-B crossover and above both AR crossovers, and the
ICP ceiling ($200k) sits above the MX→US crossover. So: *for the upper half of
our own ticket range (and for any USD-USD flow), "crypto is cheaper than
SWIFT" is not true at 1.5%.* The pitch for those flows must be time +
documents (both themselves quarantined: no off-ramp exists, T.D §3), or the
price must move (§3).

## 3. Pricing options (Deliverable 3) — RECOMMENDATION, founder decides

Verdict per skill 21: **UNVALIDATED** — no willingness-to-pay data exists
(no Van Westendorp survey anywhere in the repo; grep 2026-10-27), no competitor
price anchors (CashAbroad rates "not disclosed", `cashabroad-teardown.md:65`),
no `dict/finance.json` / `{{pricing_anchor}}` in this venture. What follows is
triangulated against **cost floor (our model) + legal portability (L.D)** only.

Two cost-allocation regimes (A5): **A = rails pass-through** (customer's own
exchange account — the only thing implementable today), **B = rails absorbed**
(needs contracted LicensedRails — none exist).

### Option P1 — status quo: flat 1.5% (1% + 0.5%)

| Corridor | Ticket | Revenue | Rail cost (mid) | Margin A (pass-through) | Margin B (absorbed) | Payer A all-in | SWIFT all-in | Cost win? |
|---|---|---|---|---|---|---|---|---|
| US→MX | $25k | $375 | $80 | $375 | $295 | 1.82% | 3.01% | USDC |
| US→MX | $100k | $1,500 | $275 | $1,500 | $1,225 | 1.78% | 2.68% | USDC |
| MX→US | $25k | $375 | $237 | $375 | $138 | 2.45% | 2.70% | USDC |
| MX→US | $100k | $1,500 | $933 | $1,500 | $567 | 2.43% | 2.40% | **SWIFT** |
| CO→US | $25k | $375 | $185 | $375 | $190 | 2.24%* | 3.87% | USDC |
| CO→US | $100k | $1,500 | $725 | $1,500 | $775 | 2.23%* | 3.56% | USDC |

All cells INFORMATIONAL (mid band). *excludes 0.4% GMF (pass-through both
sides). Payer A all-in excludes GMF/gap. Defensible where the win is ≥ ~1pp
(US→MX, CO→US); **not defensible on MX→US at $100k+ where we are the more
expensive rail at full price.**

### Option P2 — corridor-tiered: 1.5% on win corridors, 0.9% on MX→US

Changes MX→US only (others identical to P1). All cells INFORMATIONAL (mid band):

| Corridor | Ticket | Revenue | Margin A | Margin B | Payer A | SWIFT | Cost win? |
|---|---|---|---|---|---|---|---|
| MX→US | $25k | $225 | $225 | **−$12** | 1.85% | 2.70% | USDC (by 0.85pp) |
| MX→US | $100k | $900 | $900 | **−$33** | 1.83% | 2.40% | USDC (by 0.57pp) |

Stretch variant (INFORMATIONAL): CO→US at **1.6%** keeps the payer cheaper
than SWIFT at both tickets (payer A 2.34%/2.33% vs 3.87%/3.56%) and adds
$25/$100 revenue — value-priced where the modelled win is largest. Cost: −$60
revenue vs P1 on a corridor with evidenced competitor pull (Mandioca, EFY —
`corridors.md:104-113`), so treat as optional, not automatic.

### Option P3 — fixed platform fee invoiced separately + rails pass-through

Candidate schedule (ASSUMED, needs WTP test): **$75 per settlement ≤$50k,
$150 >$50k** (0.30% at $25k, 0.15% at $100k). All cells INFORMATIONAL (mid band):

| Corridor | Ticket | Revenue | Margin A | Payer A | SWIFT | Cost win? |
|---|---|---|---|---|---|---|
| US→MX | $25k / $100k | $75 / $150 | $75 / $150 | 0.62% / 0.43% | 3.01% / 2.68% | USDC (big) |
| MX→US | $25k / $100k | $75 / $150 | $75 / $150 | 1.25% / 1.08% | 2.70% / 2.40% | USDC (big) |
| CO→US | $25k / $100k | $75 / $150 | $75 / $150 | 1.04% / 0.88% | 3.87% / 3.56% | USDC (big) |

P3 makes the cost claim **win at every ticket on every corridor** (payer A
≤1.25% vs SWIFT ≥2.40%) because our variable cost collapses to rail + fixed
fee. Margin under regime B is negative on every corridor (absorbing $80–933
of rail on a $75–150 fee) — **P3 requires regime A (pass-through)**.

### The fee-stack interaction (why P3 is also the legal default)

- `platformChargesFeeOnValue` is **blocked in AR and CO**, conditional in
 MX/US/EU/BR, unknown in CL/VE (`flow-matrix.md:40-47`), and the
 vault+netting carrier of the coded 1.5% is **blocked/unknown in all eight**
 (`flow-matrix.md:73-77`). So today a %-of-value fee has no legal collection
 path anywhere, and in AR/CO it has no path even when invoiced — the L.D
 workaround named in T.D (`crypto-rails-benefit.md:146`) is exactly **"SaaS
 fee invoiced separately" = P3's structure.** Caveat (INFORMATIONAL): those
 verdicts were written around the *exporter* collection; CO→US is an import
 direction and the profile doesn't cover it (`corridors.md:71`,
 `co/profile.md:110` open question) — L.D must confirm before we price CO
 either way.
- **Dev + partner stack eats any differentiated price.** Coded outflows are
 0.5% dev (`PaymentRouter.sol:399`) + default 1% partner
 (`tenants.partner_fee_bps` = 100 bps, AGENTS.md decisions) = **1.5% of
 value — the entire P1 take.** Arithmetic: P1 margin A $375 − partner $250 −
 dev $125 = **$0 at $25k** on referred flow; P2 MX→US $225 − $375 − $125 =
 **−$275**; P3 $75 − $250 − $125 = **−$300**. Any structure below 1.5%
 requires restructuring dev/partner off %-of-value (flat partner fee, lower
 bps, or referral-only attribution) — **founder call, with COO/CMO.**

### Recommendation (not a decision)

1. **Adopt P2 as the target structure**: keep 1.5% where the modelled win is
 ≥ ~1pp (US→MX, CO→US; optional 1.6% stretch on CO→US), cut to 0.9% on
 MX→US (converts a cost-loss at $100k+ into a 0.57pp payer win for −$600
 revenue per $100k payment), AR corridors: no cost story exists — do not
 price them on savings.
2. **Implement collection as P3's invoiced fixed fee wherever
 fee-on-value is blocked/conditional** (AR, CO — and everywhere until the
 vault question is resolved), migrating to %-invoicing only where
 L.D clears it. Practically: P3 structure now, P2 percentages as the
 commercial anchor when the first no-delta corridor opens.
3. **Ship a documents-only free tier** (invoice + packing list, no
 settlement): differentiates in the crowded US→MX rail (M.D's own finding),
 has ~zero marginal cost, zero fee-on-value exposure, and is the cheapest
 funnel for the WTP test below.
4. **Before any price ships**: Van Westendorp n≥30 among ICP interviews (the
 falsification test M.D already owes: 10 operators, `corridors.md:201-209`)
 — until then every price above is **UNVALIDATED**.

## 4. Unit-economics guardrail (Deliverable 4)

**LTV:CAC and CAC payback cannot be computed — no acquisition-cost data
exists.** Explicit search, 2026-10-27: `grep -ri "cac|acquisition cost|
marketing spend|ad spend"` over `docs/`, `dict/`, `src/` → no matches beyond
unrelated text; aven board search (`--db /home/kiox/.local/state/aven/db.sqlite`)
→ no Treazury task carrying spend or customer counts; no `dict/finance.json`
in this venture; revenue = $0 (alpha, no settled payment has paid a fee).
Nothing is invented below.

**Thresholds that would trip (from skill 22 — rules of thumb, ASSUMED, not
facts):** LTV:CAC ≥ 3× = healthy; payback ≤ 12 months = healthy (segment-
dependent); **LTV < CAC = REJECTED — every acquired customer loses money,
fix before scaling spend.** Single-period/partly-assumed inputs cap the
verdict at **PROMISING** even once data exists; actuals across ≥2 periods
needed for VALIDATED.

**Data required to compute it (exact list):**

1. **S&M spend per month by channel** (paid + content + BD), same window as (2).
2. **New paying tenants per month** — define "paying" = ≥1 fee-bearing
 settlement, not signup (alpha signups are approval-gated, `AGENTS.md`).
3. **ARPU**: payments/tenant/month × average ticket × take % — take comes from
 §3's chosen option; payments frequency and ticket are ICP assumptions until
 measured (`corridors.md:179-182`: weekly/monthly, $15k–200k — borrowed,
 INFORMATIONAL).
4. **Gross margin % per payment** — from §3: regime A ≈ take (0.9–1.5%);
 regime B ≈ take − rail (0.55–1.22pp at mid).
5. **Monthly churn (or avg. tenant life)** — alpha has zero history; first
 cohorts only.
6. **CAC definition** — blended vs paid-only, stated before computing.

Algebra for the founder once data exists: `LTV = ARPU × GM% / churn`,
`max CAC = LTV / 3`, `payback months = CAC / (ARPU × GM%)`. Because GM% is
**0.9–1.5pp of payment volume**, contribution per tenant is small relative to
typical B2B CAC — the ratio will be driven by (3) volume per tenant, not by
price. The single highest-leverage lever is **volume per tenant**
(corridor depth), owner: CMO via COO; second is take (§3, founder).

## 5. Data I could not source — and what would resolve it

| Gap | What it blocks | What resolves it | Owner |
|---|---|---|---|
| ICP invoice currency / FX-leg incidence (case B share) | whether the cost claim exists at all for the ICP | add one question to M.D's 10-operator interview: "last5 cross-border payments — invoice currency, payer/payee account currencies" | M.D via COO |
| LatAm sender wire schedules (AR/MX/CO) | SWIFT fixed band for local senders | collect 2 bank fee schedules per country | F.D |
| Fintech/stablecoin competitor prices (Wise-class, CashAbroad, Bitso Business) | whether SWIFT is even the right baseline | competitor price scrape — M.D owns (`cashabroad-teardown.md` notes rates undisclosed) | M.D |
| Bitso Business vs retail tiers; real $200k quote incl. slippage | rail cost at ICP-top tickets | one RFQ to Bitso Business | F.D with T.D |
| Contracted LicensedRail fees + `settlementWindowHours` | turns ASSUMED off-ramp rows into SOURCED; enables regime B | partner contracts (L.D profile fields) | L.D with T.D |
| GMF applicability to stablecoin conversion (CO) | ±0.4pp on CO→US both absolute cost and margin | L.D opinion on DIAN art.870-881 scope | L.D |
| Whether `devWallet` is company-controlled | ±0.5pp on every margin figure | founder statement | Founder |
| WTP (price sensitivity) | every verdict in §3 stays UNVALIDATED | Van Westendorp n≥30 in ICP interviews | F.D with M.D |
| CAC/churn/ARPU actuals | §4 impossible | instrument first cohorts + S&M ledger | F.D |
| `dict/finance.json` / `{{pricing_anchor}}` absent in this venture | no canonical pricing term to reference | create via `dict.py set` when the founder picks an anchor (lock protocol) | F.D (blocked on founder decision) |

## 6. Reconciliation with the CMO's top-3 (`corridors.md:83-113`)

**AGREE with the ranking order — with three loud caveats.**

- **#1 US→MX — AGREE.** Mid: USDC wins at every ICP ticket (+$297/+$903),
 no-delta both ends. Caveat (loud): the win is FX-leg-dependent — adverse
 band flips it above ~$16.9k, and **USD-USD flows lose the entire range**
 (case B −$338/−$1,622). If M.D's interviews find USD-USD invoices are the
 norm, #1's cost rationale collapses to documents+time and the ranking must
 be re-argued on those.
- **#2 MX→US — AGREE only below $77k.** The M.D "cost tie" is ticket-
 dependent: +$64 at $25k, −$28 at $100k, −$151 at $200k (mid). **At the top
 half of our own ICP we are the more expensive rail at full 1.5% price.**
 Either sell #2 on documents/on-chain visibility (as M.D already frames it)
 or move to P2's 0.9% — do not sell #2 on savings for $100k+ tickets.
- **#3 CO→US — AGREE, strongest cost case.** Largest deltas (+$309/+$935),
 wins at every size at mid, fx* 2.17% sits below the BIS-observed bank floor
 (2%) — the most robust cost corridor. Caveats: GMF ±0.4pp pending L.D;
 adverse band flips above $3,088 (S3b); legal target = importers, not
 exporters (`corridors.md:104-113`, L.D open question).
- **No corridor outside the top 3 beats it on combined economics+law:**
 AR→CN/AR→US are REJECTED on cost (this audit) *and* heaviest legal delta;
 US→CO/US→AR win on cost but hit the seller-side surrender wall
 (`flow-matrix.md:40-41`); MX→CN/BR→US/CL→CN have no model row (UNVALIDATED).

**Where F.D speaks louder than M.D:** the top-3 order is right, but the
*justification* "USDC saves money" must be conditionalized exactly as in §2 —
FX leg present, bank markup ≥ ~1.7–2.4%, mid-band — and the $77k MX→US flip
plus the case-B collapse must appear in the founder-facing synthesis, not
buried in model output.

## 7. Files changed

| File | Change |
|---|---|
| `docs/F.D/global/corridor-economics.md` | **created** — this report (the file named in the task did not exist) |
| `docs/F.D/global/corridor-audit.py` | **created** — reproducible audit: S1 reproduction asserts, case B, crossovers, adverse band, FX sensitivity, pricing margins, T.D claim check |
| `docs/F.D/global/corridor-model.py` | **untouched** — arithmetic verified correct; stale AR-gap high band (5.83% → 7.24%) and margin-block hardcodes documented here instead of edited, so T.D/M.D line citations into it remain valid |
| `docs/F.D/ar/ar-counterfactual.md` + `ar-counterfactual.py` | **created 2026-10-28** — AR counterfactual scenarios S1–S4: the surrender duty (S1) is the binding constraint; AR→US flips (+$106/+$110) only under S1/S4 at model-mid bank markups; AR→CN never flips at ICP tickets unless the payee takes USDC. Scope `ar` per Rule 1 |
| `docs/F.D/ar/rent-decomposition.md` + `rent-decomposition.py` | **created 2026-10-28** — service-vs-rent split of the AR wire stack (central ≈45%/55%; rent band 45–85%) + the off-wire surrender transfer (6.82%, ~5–10× the wire rent); BNA and international-bank named answers |
| code, landing copy, pricing in `src/`/`contracts/` | **not touched** (out of scope) |
