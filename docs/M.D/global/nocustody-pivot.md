---
dept: M.D
scope: global
kind: strategy
status: draft
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/M.D/global/corridors.md:67-120,164-209 (corridor table, top-3, inverted ICP, falsification test)
 - /home/kiox/treazury/docs/M.D/global/cashabroad-teardown.md:44-155 (product, rails, custody T&C, gaps §5, threat verdicts)
 - /home/kiox/treazury/docs/F.D/ar/crypto-utility-verdict.md:36-52,91-161,210-235 (import REJECTED / export PROMISING, P3 break-evens, claim audit, verdict ledger)
 - /home/kiox/treazury/docs/L.D/ar/export-flow-escrow.md:48-160 (escrow-offshore BLOCKED, cumulative clocks, Treazury-trustee REJECTED, CONDITIONAL restructure)
 - /home/kiox/treazury/docs/L.D/ar/fideicomiso-viability.md (fideicomiso = different product, out of scope)
 - /home/kiox/treazury/docs/L.D/cn/profile.md (China crypto: BLOCKED, 银发〔2026〕42号)
 - /home/kiox/treazury/docs/L.D/global/flow-matrix.md:38-84 (platformHoldsFunds blocked/unknown in all 8; MX/US no-delta)
 - /home/kiox/treazury/docs/L.D/global/red-lines.md:35-85 (items 1, 2, 5, 6, 7, 21 — the never-say list)
 - AGENTS.md (treazury repo):202-203 (PA-R5 no-custody hard rule)
 - https://tangem.com/en/partnership/ (accessed 2026-10-28: reseller program, 6M cards, 141 countries, 54 reseller countries, 9 years)
 - https://tangem.com/en/blog/post/tangem-partnership-opportunities/ (2025-03-20: reseller / co-branding / referral programs; up to 40% discount)
 - https://tangem.com/en/co-branded-wallets/ (accessed 2026-10-28: co-brand = artwork/packaging only, chip+firmware+app standard, EAL6+)
 - https://pub.dev/documentation/tangem_sdk/latest/ + https://github.com/tangem (accessed 2026-10-28: MIT-licensed Tangem SDK, iOS/Android/JVM/Flutter/RN — card signing in third-party apps)
 - https://tangem.com/en/blog/post/business-crypto-wallet/ (2026-05-06: multi-card same-wallet team model; Tangem+Gnosis Safe multi-sig combo recommended by Tangem)
 - https://getblock.io/case-studies/tangem/ (accessed 2026-10-28: infra providers, swaps via 1Inch, WalletConnect — integration posture)
 - https://wantapply.com/tech-lead-investment-growth-at-tangem (accessed 2026-10-28: SBI $15M 2019 — INFORMATIONAL, secondary source)
 - aven (this task, ref 0P2E)
 - Engram topic: naiam-si/treazury/market.nocustody-pivot
---

# Treazury — no-custody pivot concept (crypto on the rail, zero PSAV exposure)

Decision-support for the founder. Not legal advice. Verdict vocabulary:
market/positioning claims → `VALIDATED / PROMISING / UNVALIDATED / REJECTED`;
factual findings → `CONFIRMED / SUSPICIOUS / INFORMATIONAL`. L.D is drawing
the legal frontier in parallel (`export-flow-escrow.md`, `red-lines.md`) —
this document only states which behaviours a product does **not** execute; it
renders no legal verdicts.

**Headline verdict: YES, the pivot exists.** Sell the *document + verification
layer* over customer-held USDC rails on the no-delta MX/US merchanting
corridors, and add a customer-controlled (optionally Tangem-hardware) escrow
protocol as the crypto-native differentiator. Treazury never custodies,
converts, signs, or retains. AR stays out of the beachhead.

## A. Where the real pain is — sorted by whether crypto helps without custody

Pain inventory from `corridors.md`, `cashabroad-teardown.md`,
`crypto-utility-verdict.md`; classification: (i) pure software, no crypto
needed · (ii) crypto on the rail, **no Treazury custody** (customer knows/pays
the address, we trace and gate) · (iii) requires custody → **FUERA** (never
pitched).

| # | Pain (ICP = triangular-trade / merchanting firm) | Class | Notes |
|---|---|---|---|
| P1 | Buyer default after shipment — bad debts hit ~6% of B2B invoices; break-even default for the escrow fee is 0.39–0.66% of the book | **(ii) conditional** | The protection case is PROMISING (`crypto-utility-verdict.md:127-147`) but only if the retained value sits in a *customer-controlled* key (hardware multi-sig) or a licensed fiduciary — never Treazury's. Treazury's role: protocol, tracing, document gate (`export-flow-escrow.md:130-145`). The Treazury-as-trustee variant is REJECTED (PA-R5) → (iii) |
| P2 | Payment takes 3–5 days and nobody can prove it happened (MX↔US wires; 40% of LatAm cross-border payments >4 days) | **(ii)** | Buyer pays USDC directly to the seller's known wallet; Treazury verifies on-chain and timestamps. US→MX is USDC-positive at every ticket (+$297 @ $25k, `corridors.md:76`); MX→US is a cost tie — sell documents + visibility, not savings (`corridors.md:93-102`) |
| P3 | Commercial document pack (invoice, packing list, HS code, Incoterm) detached from payment — re-keyed from email/WhatsApp | **(i)** (+ii as release gate) | CashAbroad demonstrably has none (`cashabroad-teardown.md:118-124`). Crypto's contribution: release the pack when the on-chain payment confirms, not when someone "feels paid" |
| P4 | Collection-deadline chaos (SECOEXPO clocks, 30/60/180/365 from cumplido + 20 bd from cobro are cumulative) | **(i)** | Deadline tracking + document-gate readiness is software. The documentary/compliance savings are worth +$98–$156/payment (`crypto-utility-verdict.md:116-122`) — they come from the paperwork, not the rail |
| P5 | Agency opacity — the triangular intermediary juggles many clients/entities and cannot show each one a live ledger | **(i)** | Multi-tenant agency model is an identified gap CashAbroad does not serve (`cashabroad-teardown.md:130-132`) |
| P6 | AR brecha / surrender loss (6.82%) "solved with crypto" | **(iii) FUERA** | The loss is common to both channels (`crypto-utility-verdict.md:93-106`); offshore hold-until-cumplido is BLOCKED (`export-flow-escrow.md:52`); claiming otherwise is red-line 21. Never in any pitch |
| P7 | Paying Chinese suppliers from Argentina in crypto | **(iii) FUERA** | Importaciones REJECTED at every ICP ticket (`crypto-utility-verdict.md:38-42,89`); China rails everything crypto (`cn/profile.md`, 银发〔2026〕42号) |
| P8 | MXN↔USDC 24/7 conversion | **(iii) for Treazury** | `platformConvertsToFiat: blocked` in MX (`flow-matrix.md:42`). Licensed bank/OTC partner does it, outside our product; never advertise an MX conversion (`red-lines.md:106-108`) |
| P9 | Letters of credit / trade finance | **(iii) FUERA** | Balance-sheet product; fideicomiso = different product line (`fideicomiso-viability.md`) |

**Brutal summary:** the only crypto-native pain that survives the no-custody
filter is P1 (default protection, via customer-held keys) plus P2's
verification signal. Everything else is software — and that is fine: P3–P5 are
exactly the gap CashAbroad cannot close (`cashabroad-teardown.md:116-139`).

## B. Product concepts (ranked)

| | **A — Ledger Gate** (core) | **B — Shield Protocol** (differentiator on top of A) | **C — Corridor Desk** (fallback) |
|---|---|---|---|
| One-liner | Non-custodial settlement-and-documents layer: verify the buyer's USDC payment on-chain, release the commercial doc pack, track collection clocks, per-client ledger | Customer-controlled conditional release: buyer's USDC sits in a multi-sig/escrow whose keys the *customer* holds (optionally Tangem cards); Treazury defines the condition set, traces the lock, and gates the documents — release is executed by the customers' own signers or a licensed fiduciary | Merchanting ops console: multi-entity invoices, payment links pointing at the client's own wallet, reconciliation, deadline tracking — no escrow layer |
| User | Triangular-trade / merchanting firm ($15K–$200K tickets) and the import/export agency operating for many such clients (`corridors.md:175-199`) | Same, plus the foreign buyer willing to pre-pay against conditional release | Same as A, lighter — agencies first |
| Crypto on the rail | USDC wallet→wallet (buyer → seller's address); on-chain payment verification; we never touch it | USDC locked in customer-keyed multi-sig (Gnosis-Safe-style; Tangem cards as signers per Tangem's own business-treasury guidance); lock/unlock conditions documented | USDC payment links + on-chain receipt visibility |
| Treazury does NOT | custody, convert, sign, retain funds, net fees from flows, pay suppliers, hold keys, promise settlement times | all of the left, **plus**: operate the escrow, hold release authority, hold the signing device | all of the left |
| Pricing (P3 baseline) | $75/payment ≤$50k, $150 >$50k, **invoiced separately, off-flow** (the only contribution-positive AND legal config, +$101.01/payment, `crypto-utility-verdict.md:200-205`) | Same P3 + candidate $150 flat premium for the escrow protocol (WTP UNVALIDATED — see D) | P3 $75/$150 invoiced; or SaaS seat for the agency (pricing = CFO via COO, not set here) |
| Why it survives without PSAV (product behaviours, not legal verdicts) | No `platformHoldsFunds`, no `platformConvertsToFiat`, no `platformPaysSupplier`, no fee-on-value — every flow the matrix blocks is absent from the product (`flow-matrix.md:38-47`) | Treazury holds no keys and no release power; the retention lives entirely in customer-controlled or licensed-operator arrangements (`export-flow-escrow.md:55-57,130-145`); for AR clients the product ships deadline tracking and documentation only until L.D confirms any escrow shape | Identical to A minus the escrow layer |
| Evidence status | Documents-on-payment gap CONFIRMED as CashAbroad-missing; corridor economics PROMISING (borrowed demand) | Default-protection economics PROMISING (break-even 0.39–0.66% vs Atradius 1–6% observed); escrow mechanics UNVALIDATED first-party | Weakest differentiation — generic invoicing risk |

**Recommendation:** build A as the core (it *is* today's product with the
vault/fee-sweep build removed and the audience inverted), layer B as the
crypto-native moat once L.D blesses a customer-controlled shape, keep C only
if B stalls. A+B together are the only combination where crypto is on the rail,
custody is zero, and the value is PROMISING-rated by our own work.

## C. Tangem partnership

1. **What Tangem is:** Swiss company (HQ Zug, founded 2017), NFC hardware
 wallet — no battery, no display, EAL6+ chip co-developed with Samsung
 Semiconductor; 6M cards sold, customers in 141 countries, resellers in 54
 (`tangem.com/en/partnership`, accessed 2026-10-28). Explicitly
 **self-custody**: keys are generated in the chip and never leave it —
 Tangem itself does not custody. (SBI Holdings $15M investment 2019 —
 INFORMATIONAL, secondary source.)
2. **Programs that exist:** reseller (up to 40% discount), co-branding
 (artwork/packaging only — chip, firmware, app stay standard), referral
 (`tangem.com` partnership blog 2025-03-20; co-branded page). An MIT-licensed
 SDK (iOS/Android/JVM/Flutter/React Native) lets third-party apps drive card
 signing (`pub.dev/documentation/tangem_sdk`, `github.com/tangem`).
3. **What is NOT verified:** no public enterprise/API program for fintech
 integrations, no white-label custody offer, no evidence of B2B trade-flow
 partnerships — **UNVALIDATED**. Their business posture is multi-card
 same-wallet teams + Gnosis Safe multi-sig combos (their own 2026-05-06
 business-wallet post), i.e. hardware-as-signer, not custody-as-a-service.
4. **Why Tangem wins:** a new B2B segment (merchanting treasuries) beyond
 retail; co-branded "trade desk" cards; a case study where their hardware is
 the trust anchor of a trade flow. Why Treazury wins: hardware that *makes
 credible* the "we never touch your keys" claim — our copy can't say
 "non-custodial" publicly until the OrderVault refund path is removed
 (red-line 1), and customer-held Tangem cards sidestep that dependency for
 the escrow layer entirely.
5. **Is "Tangem keys + Treazury software + licensed bank/OTC FX" sellable
 conjointly?** PROMISING as a story to merchanting firms: each element maps
 to a party that keeps its own licence/keys, and the stack matches every
 `blocked` cell in the flow matrix. Gaps before it can ship: (a) a
 contracted FX/ramp partner (none — `licensedPartners: []`, red-line 2);
 (b) L.D confirmation of the customer-controlled escrow shape; (c) a real
 Tangem channel contact. Competitor scan found no one pairing hardware
 self-custody keys with trade-document software (Portafino/Rach/STATER/
 Traidefi are software-led, several custodial) — **INFORMATIONAL**, thin
 evidence, re-check before pitching.

## D. Positioning, beachhead, WTP experiment

**Positioning statement (skill 12 front-runner; scores: credibility 4,
differentiation 5, clarity 4 — PROMISING, untested with real buyers):**

> For triangular-trade and merchanting companies moving US$15K–200K per
> payment who cannot afford an unverifiable buyer and paperwork that lags the
> money, Treazury is a non-custodial settlement-and-documents layer that
> verifies the buyer's USDC payment on-chain and releases the commercial
> document pack — while your keys stay on your side (optionally on Tangem
> hardware) and FX stays with your licensed bank. Unlike CashAbroad (custodial,
> opaque per-operation pricing) or bank wires (documents detached from
> payment), Treazury never holds a dollar of your funds — and we publish the
> corridor math.

**Category frame:** "new Y" — a *settlement-and-documents layer for
merchanting*, not "better cross-border payments" (we lose rails-vs-rails to
Bitso/CashAbroad incumbents; we win the document layer, `corridors.md:89-91`).
Search/alternative set we compete against: bank wire + Excel/WhatsApp document
flow (primary), CashAbroad (secondary).

**Three messaging pillars (each with a proof point):**

1. **"Your keys, your dollars."** We never custody, convert, sign, or retain
 (PA-R5; matrix blocks absent from the product). Proof: architecture —
 buyer pays the seller's own address; escrow keys, if used, are the
 customer's cards. *Prerequisite: OrderVault refund path removed before the
 word "non-custodial" ships publicly (red-line 1).*
2. **"Documents release when the money lands."** Commercial invoice + packing
 list with HS/Incoterm, gated on verified payment. Proof: `commercial_docs`
 design + the confirmed CashAbroad gap (teardown §5.1).
3. **"The math, published."** Per-corridor cost-vs-SWIFT from our own model
 (US→MX +$297 @ $25k; CO→US +$309/+ $935). Proof: F.D model. *Founder/CFO
 call to publish (teardown §5.5).*

**Three claims we never say:** (1) "riesgo cero" / any zero-risk promise
(`export-flow-escrow.md:177`); (2) "24–48h", "2–6h a tu banco", "en minutos"
— no contracted rail exists (red-line 2; claim audit rows 1/7); (3) "elimina
la burocracia cambiaria", "CUIT limpio", "el 6.82% se elimina" — red-line 21,
verdict REJECTED (audit rows 3/5).

**Beachhead: MX/US merchanting FIRST; AR not first.** Rationale: both ends
no-delta (`flow-matrix.md:58-63`), US→MX is the only corridor that is
simultaneously legal-clean, economic-positive, and demand-proven
(`corridors.md:85-91`); CashAbroad is HIGH-threat but beatable on exactly our
gaps — 2–4 people, ~$20K funding, custodial posture exposed, no documents
(teardown §6). AR enters second wave as *export-side escrow protection* only
after L.D confirms the customer-controlled shape and a fiduciary/PSAV partner
exists — never as a rail-savings or brecha pitch.

**WTP experiment for P3 (breaks the UNVALIDATED, `crypto-utility-verdict.md:235`):**

- *Hypothesis:* stating the invoiced fee ($75 ≤$50k / $150 >$50k) during the
 10-operator falsification interviews already mandated by `corridors.md:201-209`
 will convert ≥3/10 triangular-trade operators to a written pre-order ("route
 one real ≥$50K payment at this fee") without negotiating the fee down >50%.
- *ICE:* Impact 8 (pricing blocks every revenue cell), Confidence 6 (direct
 buyer evidence, proven method; capped by zero traffic/LOI base), Effort 4
 (founder/sales interview time, no build) → **ICE = 6.0**. Stage: revenue.
- *Pre-registered thresholds (write before running):* SUCCESS ≥3/10 pre-orders
 at full fee → P3 `VALIDATED`, price page ships. KILL ≤1/10 → P3 `REJECTED`;
 fall back to fee-only-above-$50k or re-price via a real Van Westendorp.
 Timebox: 14 days. Channel: customs-broker / freight-forwarder referrals in
 MX and US (per `corridors.md:202-204`).

## Open decisions (founder, surfaced via COO)

1. Kill the OrderVault/fee-sweep build now (required for pillar 1 and for any
 MX/US launch; `flow-matrix.md:73-77` says it is unsellable anywhere).
2. Authorize the Tangem approach (reseller contact + ask for an enterprise
 channel) or hold until an FX/ramp partner is contracted first.
3. Green-light the WTP experiment with the founder's own interview time —
 P3 cannot ship publicly while its price is UNVALIDATED.
