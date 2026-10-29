---
dept: T.D
scope: global
kind: research
status: provisional
as_of: 2026-10-26
sources:
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:13-94
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:52-53
 - /home/kiox/treazury/contracts/PaymentRouter.sol:394-411
 - /home/kiox/treazury/src/onchain-facts.ts:62-82
 - /home/kiox/treazury/AGENTS.md:5-6
 - https://www.americanbanker.com/payments/news/swift-the-federal-reserve-push-fixes-for-cross-border-payments
 - https://uniteller.com/ut-blog/smbs-overpay-for-international-b2b-payments/
 - https://crossborderfees.com/calculate-true-cross-border-payment-costs/
 - https://www.xflowpay.com/blog/swift-wire-transfer
 - /home/kiox/treazury/docs/L.D/ar/profile.md
---

# Crypto rails vs SWIFT — cost/time benefit per corridor

Decision-support for the founder. Every number is tagged **CITED** (source in
`sources` or inline path:line) or **INFORMATIONAL** (assumption, range, or
model output under stated parameters — not a verified fact).

Scope note: this is a multi-corridor comparison, not a regulatory artifact.
No legal rule is stated here; country-specific legal content lives only in
`docs/L.D/<cc>/profile.md` and is referenced via `CountryRegulatoryProfile`
field paths (see the Argentina delta section at the bottom).

## 1. What is actually built (baseline honesty)

CONFIRMED in code today:

- The only settlement rail is USDC on **Arc Testnet** (`onchain-facts.ts:62-65`;
 mainnet Arc facts exist at `onchain-facts.ts:84-102` but no mainnet deploy
 is verified — `AGENTS.md:137-142`).
- Platform fee: **1% platform + 0.5% dev = 1.5% of settled value**, deducted
 inside `_sweep` (`PaymentRouter.sol:398-400`; deployment constants
 `usdc-arc.ts:52-53`, `AGENTS.md:139-140`).
- **No fiat off-ramp exists in `src/`** — no bank payout, no partner API, no
 SPEI/ACH/PIX integration (payments module inventory: `AGENTS.md:109-113`;
 the only provider is `providers/usdc-arc.ts`). The landing line "to their
 bank in 2–6 hours" (`AGENTS.md:5-6`) is marketing copy — **UNVALIDATED as
 an implemented flow**, and this doc does not use it as a fact anywhere below.
- No licensed local partner is contracted yet (profile field
 `rails.licensedPartners` is `[]` in both shipped profiles,
 `src/modules/jurisdiction/profiles/ar.ts:64-66`, `mx.ts:66-68`).

So every "USDC path" number below is the **target architecture** (on-ramp →
USDC transfer → off-ramp through a `LicensedRail`, see ADR-001), not a
measured end-to-end Treazury transaction. Measured today: only the on-chain
leg.

## 2. Cost table — mid assumptions, $25k and $100k tickets

Source: `docs/F.D/global/corridor-model.py` (F.D, reproducible — every
parameter labelled CITED/ASSUMED inside the model; run
`python3 docs/F.D/global/corridor-model.py`). All figures INFORMATIONAL unless
noted; they are model output, not measurements.

| Corridor | Ticket | SWIFT all-in | USDC all-in (target arch.) | Delta | Verdict (mid band) |
|---|---|---|---|---|---|
| AR→CN | $25,000 | $509 (2.03%) | $1,490 (5.96%) | −$981 | **SWIFT cheaper** (bands overlap) |
| AR→CN | $100,000 | $1,695 (1.70%) | $5,915 (5.92%) | −$4,220 | **SWIFT cheaper** |
| MX→US | $25,000 | $676 (2.70%) | $612 (2.45%) | +$64 | TIE on mid |
| MX→US | $100,000 | $2,405 (2.40%) | $2,433 (2.43%) | −$28 | TIE on mid |
| CO→US | $25,000 | $969 (3.87%) | $660 (2.64%) | +$309 | USDC cheaper (bands overlap) |
| CO→US | $100,000 | $3,560 (3.56%) | $2,625 (2.63%) | +$935 | USDC cheaper |
| AR→US | $25,000 | $499 (1.99%) | $1,293 (5.17%) | −$794 | **SWIFT cheaper** |
| AR→US | $100,000 | $1,665 (1.66%) | $5,155 (5.16%) | −$3,490 | **SWIFT cheaper** |
| US→MX (mirror) | $25,000 | $752 (3.01%) | $455 (1.82%) | +$297 | USDC cheaper |
| US→CO (mirror) | $25,000 | $852 (3.41%) | $610 (2.44%) | +$243 | USDC cheaper |
| US→AR (mirror) | $25,000 | $756 (3.02%) | $505 (2.02%) | +$251 | USDC cheaper |

The uncomfortable finding, stated plainly: **on the four requested corridors
with a local-currency sender, USDC only clearly wins CO→US, ties MX→US, and
LOSES AR→CN and AR→US** — the AR official-vs-crypto rate gap (model input
`ar_official_gap_pct` mid 3%, high 5.83%, `corridor-model.py:76-79`,
CITED live gap 1640.38 vs 1550.00 on 2026-10-25) eats the whole rail saving
when the payer buys USDC on the crypto market. The mirror direction — a
**USD holder paying a LatAm seller** — is where the USDC rail wins at every
ticket size (no positive break-even, model output). The product's landing
story ("crypto alternative to SWIFT" for import/export agencies, `AGENTS.md:3-4`)
is economically strongest in the mirror corridors; the founder should treat
that as a positioning input (hand: CMO) and a corridor-priority input.

### Component breakdown (per model `PARAMS`, `corridor-model.py:20-94`)

| Component | SWIFT | USDC rail | Tag |
|---|---|---|---|
| Sender/outgoing fee | $25–60 wire fee by country (`corridor-model.py:24-29`; US avg $45 out / $15 in, UniTeller 2025-09-16) | on-ramp taker fee: AR 0.45%, MX 0.585–0.78%, CO 0.17–0.65%, US Circle Mint 0% (`corridor-model.py:67-72`, cites bitso.com/fees + Circle) | CITED ranges, INFORMATIONAL per-tier mapping |
| FX spread | banks mark up 1.5–4% over mid-market (crossborderfees 2025-09-27; xflowpay 2025-07-09; model 0.5–4% by country `corridor-model.py:32-37`) | exchange spread 0.05–0.40% (`corridor-model.py:74-75`, ASSUMED — not published) | CITED (banks) / ASSUMED (crypto spread) |
| Correspondent/intermediary | $15–30 per hop, deducted from principal under SHA (UniTeller 2025-09-16; model mid $20 `corridor-model.py:40`) | none — the on-chain leg has no intermediary (transfer is direct to vault/merchant) | CITED |
| Platform fee | n/a | **1.5% of settled value** (1% + 0.5%, `PaymentRouter.sol:398-400`, `usdc-arc.ts:52-53`) — CITED, CONFIRMED in the deployed constants | CITED |
| Gas / chain | n/a | ~$0.02 per transfer, ASSUMED L2-class (`corridor-model.py:81`); Arc gas is USDC at 18 decimals (`onchain-facts.ts:70-74`) — dust-sized but real | INFORMATIONAL |
| Beneficiary/receiving fee | $0–30 by country (`corridor-model.py:42-48`; $10–25 typical, crossborderfees) | off-ramp partner fee: US 0–0.30% (Circle standard 0%/express 0.05%), MX Bitso+SPEI 0.13–0.73%, CO 0.17–0.65%, AR 0.20–0.60%, CN 0.40–1.50% ASSUMED no direct CN VASP (`corridor-model.py:85-92`) | CITED (Circle/Bitso schedules) / ASSUMED (CN) |
| Partner/licensing fee | n/a | none contracted yet (`rails.licensedPartners: []`); model assumes rail cost only | INFORMATIONAL |
| Payment-repair gross-up | $0–80 when OUR/shortfall re-invoicing is needed (`corridor-model.py:62`, ASSUMED) | n/a — deposit/receipt are atomic (`PaymentRouter.sol:290-324`) | INFORMATIONAL |
| GMF (CO stamp tax) | applies to both paths (`corridor-model.py:83`, CITED DIAN art.870-881) | same | CITED |

Break-even tickets (mid, model output): USDC beats SWIFT above ~$2,269
(AR→CN) and ~$2,920 (AR→US) *if* the AR gap were absent; with the gap priced
in, USDC never wins those corridors at any size. CO→US and all three mirror
corridors: USDC cheaper at every size.

## 3. Time table

| Factor | SWIFT | USDC rail | Tag |
|---|---|---|---|
| Network settlement | 2–5 business days typical (ibanfirst 2025-03-31; model per-corridor 1.5–6 days `corridor-model.py:51-59`; BIS median <2h on fast routes, >2d slow — noted in model comment) | on-chain finality: Arc Testnet blocks in seconds; single-tx `depositWithPermit` settles the payment intent atomically (`PaymentRouter.sol:309-324`) | CITED (SWIFT days) / CONFIRMED (on-chain leg, testnet) |
| Cut-offs | daily wire cut-offs at the sending bank; a Friday-after-cut-off payment waits until Monday+ (INFORMATIONAL — standard banking behavior, not corridor-measured) | none on the crypto leg — 24/7 (INFORMATIONAL: property of public EVM chains; Arc Testnet uptime not independently audited here) | INFORMATIONAL |
| Weekends/holidays | no interbank movement Sat/Sun or bank holidays in either jurisdiction (INFORMATIONAL) | crypto leg moves; **fiat legs (on/off-ramp) revert to partner banking hours** — partner settlement windows belong in `rails.settlementWindowHours` and are only sellable when evidenced (contract field, `country-regulatory-profile.md:73-76`) | INFORMATIONAL |
| End-to-end to bank account | 2–5 business days (above) | **UNKNOWN — do not quote.** No off-ramp exists in `src/` (§1); no partner SLA is contracted (`rails.licensedPartners: []`). The landing "2–6 hours" (`AGENTS.md:5-6`) must not be repeated as fact until a LicensedRail with an evidenced `settlementWindowHours` is live | CONFIRMED absence in code |

## 4. Pre-funding and float

- SWIFT: correspondent chains run on **nostro pre-funding** — the sending
 bank (or its SMB customer, baked into the FX margin) carries balances at
 intermediaries; float cost is modeled at 10%/year on the in-flight amount
 × days (`corridor-model.py:14,125`, ASSUMED rate). On a 3-day AR→CN wire
 that is ~0.08% of ticket — small, but it is capital the agency cannot use.
- USDC rail: no pre-funding of foreign nostro accounts; capital moves as the
 token in one atomic transaction (CONFIRMED by the vault design,
 `PaymentRouter.sol:273-324`). The counterpart cost is the platform's own
 working capital: fees accrue as `pendingClaims` and only reach the
 treasury when someone calls `claimFees` (`PaymentRouter.sol:345-351`) —
 claim latency is an internal treasury operation, not a corridor delay.
- Bank last mile: whichever LicensedRail is chosen will likely need local
 liquidity or pre-funded payout accounts in the destination country
 (INFORMATIONAL — standard for local payout rails; to be evidenced per
 partner during selection, output feeds `rails.licensedPartners`).

## 5. Argentina process delta — as profile fields

The AR "process delta" (what changes for an AR corridor versus the generic
buyer→seller flow) is **not** a branch in code — it is the AR profile's
answers to contract fields, consumed by the ADR-001 state machine. Field
paths below; legal citations live only in `docs/L.D/ar/profile.md` (L.D,
confirmed 2026-10-25) and are deliberately not duplicated here:

| Delta (from L.D profile "Process delta") | Profile field that expresses it | Engine stage it gates |
|---|---|---|
| Direct wallet settlement cannot be the settlement of an AR export | `flows.buyerToSellerDirect.verdict` | Stage 3 (flow) — refuses the base flow for AR-origin orders |
| MCF/liquidation step required, or restrict to non-resident entities | `fxControl.required`, `fxControl.channel`, `flows.licensedPartnerConversion.condition` | Stage 5 (payment intent) — binds the licensed-partner condition |
| Vault + fee netting must not run on the export collection; SaaS fee invoiced separately | `flows.platformHoldsFunds.verdict`, `flows.platformChargesFeeOnValue.verdict` | Stages 3 and 6 (flow, on-chain transfer) — **interacts with the open custody decision aven**: whichever vault model survives must be legal under these two verdicts for AR-origin orders |
| Order not "settled" until liquidation/export declaration exists; document is a release gate | `docs.customsRequires`, plus stage-7 evidence (declaration ref persisted with the order) | Stage 8 (docs release) — commercial docs stay `draft` without the evidence |
| Segment AR explicitly (merchanting/triangulation is a separate product line) | origin-country selection at order creation + `licensing.agency` | Stage 1 (order) |

Because the `.ts` mirror `profiles/ar.ts` is still the all-`unknown`
skeleton (status `provisional`), every one of these gates currently refuses
— fail-closed, correct default. Porting L.D's confirmed markdown into the
mirror is the joint L.D/T.D next step (ADR-001 consequences; 
note).

## 6. What would make these numbers decision-grade

1. Contract one `LicensedRail` per priority corridor; record its real fee
 schedule and evidenced `settlementWindowHours` in the profile (owner: L.D
 with T.D) — turns §2/§3 ASSUMED rows into CITED.
2. Re-run `corridor-model.py` with measured partner fees; publish the delta
 table per corridor (owner: F.D).
3. Only then revisit the landing time claim and corridor pricing (owner: CMO
 / CoCEO) — T.D recommendation: keep the "2–6 hours" claim quarantined
 until §3's UNKNOWN cell is evidenced.
