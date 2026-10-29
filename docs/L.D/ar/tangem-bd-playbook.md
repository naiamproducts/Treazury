---
dept: L.D
scope: ar
kind: playbook
status: draft
as_of: 2026-10-28
sources:
 - docs/L.D/ar/tangem-revshare-analysis.md (aven, Engram #1481 — top-line CONDITIONAL at :31; scenarios :197-201; agency §4 :205-276; red-lines §5 :282-330; founder decisions :347-355)
 - docs/L.D/global/red-lines.md items 28-32 (:135-183; added from aven) — no new conduct found this pass, so no item 33+
 - docs/L.D/global/non-custody-boundary.md (aven) — escalation 3 at :318-320; Tangem art. 2 iv) posture :192-215
 - AR · CNV RG 1172/2026 (B.O. 15-10-2026), arts. 1 ¶3, 2 i)-iv), 4 (modalities 3/4), 9 (Cats 1/2/5), 33, 34, 38 ¶2, 45 — carried from tangem-revshare-analysis.md sources (:5-8)
 - AR · Ley 25.246 art. 4 bis; Ley 19.359 TO 1995 arts. 1 a), 2 f) — carried, cited in tangem-revshare-analysis.md:9, :225
 - CH · Tangem AG (Zug, UID CHE-390.112.525); public affiliate program 5-10 USDT/wallet — tangem-revshare-analysis.md:128-130; non-custody-boundary.md:194-204
 - AGENTS.md (treazury) hard rule 5 / PA-R5 at :202-203
 - aven (this task, 2026-10-28); aven (contract review, blocked pending draft) — Engram topic naiam-si/treazury/legal.tangem-bd-negotiation
---

# Tangem BD agreement — negotiation playbook (pre-draft)

**Purpose.** The founder has been offered a Business Development (BD)
relationship with Tangem AG; **no contract text exists yet**. This playbook
arms the founder for the pre-draft conversation (Section A) and for the
first draft (Sections B-C), and states what survives even a good contract
(Section D). It **prepares, and does not replace, the review**
under `33-contracts-review` (red-flag scan with path:line + clause triage +
verdict per conduct) once the document arrives — red-line 32
(`docs/L.D/global/red-lines.md:175-183`) still bars collecting or accruing
the rev-share before that review completes.

**Verdicts on this playbook.** The playbook's legal hooks are VALIDATED
against prior cited passes (rev-share CONDITIONAL,
`tangem-revshare-analysis.md:31`; red-lines 28-32 in force,
`red-lines.md:135-183`). The **contract itself remains UNVALIDATED** —
unseen; every clause call below is a question to be answered against the
actual text, not a finding. Jurisdictions: Argentina (CNV RG 1172/2026,
Ley 19.359) as the exposure side; Switzerland (Tangem AG, governing-law
question) as the contract side. **Non-lawyer limits:** decision-support by
a non-attorney agent; nothing here is legal advice or a binding commitment
— sign/walk calls are the founder's, informed by licensed counsel, surfaced
via the COO.

---

## A. Questions to ask BEFORE they draft

Each answer changes the legal analysis. Ask by email/call; keep the answers
in writing (they become context for).

1. **Revenue base.** Does the 30% base include **fiat on/off-ramp** revenue
 (card/bank buy-sell via Mercuryo/MoonPay/Simplex/Unlimit), or only AV↔AV
 swaps and staking? If fiat is included: over which **users' jurisdiction**
 is the base computed — worldwide, or filtered per residence?
 *Why it matters:* if the base includes fiat legs of AR residents, the
 AR-targeted version is BLOCKED (Ley 19.359 art. 1 a) family + Cat 1 —
 `tangem-revshare-analysis.md:200`).
2. **Role and territory.** Does the agreement designate us "agent",
 "representative", "authorized distributor", or grant territorial
 exclusivity in **Argentina**? *Why:* that wording is the agency
 argument (SUSPICIOUS, `tangem-revshare-analysis.md:245-260`) and the
 art. 4 modalities 3/4 "publicidad claramente dirigida" trigger plus
 Ley 19.359 art. 2 f) personal-liability tail
 (`tangem-revshare-analysis.md:225`).
3. **Promotion scope.** What exactly may we promote as BD — hardware/
 self-custody only, or also swaps/staking/buy-sell? Is there an approved
 goods/services list or brand-guideline annex? *Why:* red-line 28
 (`red-lines.md:135-147`) limits us to the self-custody angle for AR
 residents; a contract that obligates broader promotion conflicts with it.
4. **Payee.** Is the 30% paid to the **SAS** directly or to a person? What
 corporate data/KYC do they require (UID, tax forms)? *Why:* assignment
 mechanics (Section B.7) and the individual-vs-entity decision already
 resolved in favor of the entity.
5. **Governing law and disputes.** Swiss law? Where are disputes — Zug
 courts, ICC/LCIA/SIAC arbitration, seat, language, who pays
 arbitration costs? *Why:* enforcement cost against a small SAS from a
 Swiss seat is a real (INFORMATIONAL, CFO/counsel to price) barrier.
6. **Exclusivity.** Is the BD relationship exclusive (e.g., no other
 hardware-wallet partners — Ledger, Keystone)? *Why:* hardware is our
 product option, not our identity; exclusivity would concentrate
 dependency (Section D).
7. **Commitments.** Any minimum volume, minimum promotion, or KPI
 obligations? *Why:* minimums that require promoting swaps/staking to AR
 residents collide head-on with red-line 28 — this is a reject-or-
 renegotiate item (Section C.3).
8. **Assignment.** If Tangem already offered the deal to the founder
 personally, can the agreement be **assigned to the SAS** on signature,
 or does it need a separate novation/consent? *Why:* the founder
 registered the SAS precisely so the deal sits in the entity
 (`tangem-revshare-analysis.md:237-243`); a personal signature without a
 clean assignment path is a trap.

---

## B. Clauses to ASK FOR (wishlist)

For each: why we want it, which risk it covers.

1. **Limitation of liability + mutual reasonable indemnity.** Cap at fees
 paid/payable in the trailing 12 months; each party indemnifies only for
 its own breach, IP infringement, and wilful misconduct — **no uncapped
 "any and all" indemnity to Tangem**. Risk covered: one-sided indemnity
 is the standard vector for backfilling *their* compliance risk onto the
 promoter (agency-and-cross-border risk,
 `tangem-revshare-analysis.md:245-260`).
2. **Termination for convenience with reasonable notice (30-90 days), no
 penalty, plus an explicit survival clause.** State whether the rev-share
 **survives** termination (yes, ideally: earned amounts on users already
 attributed keep paying for a defined tail, e.g., 12-24 months) and what
 dies with it. Risk covered: silence on survival = they cut the stream
 the day we question scope (Section D.2).
3. **No unilateral change to the 30% base for already-referred users
 (grandfathering).** Changes apply prospectively only, with written
 notice (e.g., 30-60 days). Risk covered: `tangem-revshare-analysis.md`
 makes the whole CONDITIONAL analysis turn on the base definition
 (`:200`); a retroactive redefinition would move the analysis under us.
4. **Attribution clarity.** Defined attribution window (e.g., 30-90 days
 cookie/link), the tracking method, monthly reporting of attributed
 users and base computation, and a dispute-resolution mechanism for
 attribution conflicts. Risk covered: 30% of an undefined, unverifiable
 base is unenforceable in practice; reporting is our only audit right.
5. **No exclusivity — or exclusivity that is limited and compensated.**
 If Tangem insists, scope it (single country/product line), price it
 (minimum guaranteed payment), and carve out our non-Tangem hardware
 options. Risk covered: concentration + blocking partners (Section D.3).
6. **Mutual confidentiality** with standard carve-outs and a defined term;
 explicit permission for us to describe the relationship at the level of
 "referral/BD arrangement for hardware wallets" without their approval
 of our regulatory-compliance language. Risk covered: one-sided NDA
 clauses often gag the promoter from the very disclaimers art. 34
 requires us to keep (`red-lines.md:156-166`).
7. **Assignment to the SAS** — we may assign to an affiliate/successor
 entity on notice (not on consent-at-their-discretion); alternatively
 sign directly with the SAS from day one. Risk covered: the
 entity-vs-individual decision is already resolved; consent-gated
 assignment would freeze the deal in the founder's personal name
 (individual registration thresholds and Ley 19.359 art. 2 f)
 — `tangem-revshare-analysis.md:212-235`).
8. **Governing law that is neutral or favorable; if Swiss law, understand
 the real enforcement cost.** Ask for the seat, language, and fee
 allocation in writing; price a Swiss counsel review of their standard
 form before signing. Risk covered: knowing the exit cost before entry.
 *Accepting Swiss law is a founder decision (Section D).*

Also request (low-cost, high-value): an **annex defining the revenue base
in words** (inclusions/exclusions: swap fees, staking fees, ramp fees,
token spreads), a **list of approved marketing claims**, and confirmation
that payouts arrive to a wallet/account we designate (segregated —
red-line 31, `red-lines.md:167-174`).

---

## C. Clauses to REJECT on sight (deal-breakers)

If any of these appears, the founder says no or renegotiates hard before
line-editing anything else:

1. **Any "agent" / "representative" / "authorized distributor" /
 "official partner in Argentina" designation** — or any territorial
 grant framed as representation of Tangem in Argentina. This is the
 art. 4 modalities 3/4 trigger and the agency characterization
 (`tangem-revshare-analysis.md:198, :245-260`; red-line 30,
 `red-lines.md:156-166`). Non-negotiable wording change: we are a
 **referral/BD counterparty with no authority to bind Tangem**.
2. **Exclusivity without a guaranteed minimum compensation** — free
 exclusivity is uncompensated concentration (Section B.5/D.3).
3. **Minimum volume / minimum promotion / KPI commitments that require
 promoting swaps, staking, or fiat buy-sell to Argentine residents** —
 this forces red-line 28 conduct (`red-lines.md:135-147`) as a contract
 obligation. Reject; offer hardware/self-custody promotion KPIs instead.
4. **Unilateral amendment rights** (they change terms, fees, or base with
 notice-only or no notice) — reject or reduce to prospective changes
 with real notice (Section B.3).
5. **Uncapped indemnification in Tangem's favor** — reject; mutual, capped,
 fault-based only (Section B.1).
6. **Broad non-compete/non-solicit that touches our core** — we are a
 trade-docs SaaS; a clause barring us from other wallet, payment, or
 crypto relationships would block the product itself. Reject any
 non-compete not strictly scoped to "promoting competing hardware
 wallets under this BD program".
7. **Hostile or cost-prohibitive governing law + arbitration combo** —
 e.g., distant seat, foreign language, fee-shifting against the smaller
 party, or a forum with no practical enforcement path for a SAS.
 Reject or walk.
8. **Retroactive change rights over the 30% base** — any clause letting
 Tangem recompute or claw back earnings on users already attributed.
 Reject outright (Section B.3).

*(Missing-clause findings count too when the draft arrives: absence of a
limitation-of-liability, of termination, or of an assignment clause is
itself a negotiate/escalate finding under `33-contracts-review`.)*

---

## D. Residual risks even with a good contract — and what the founder must decide

**Risks the contract cannot neutralize (founder should read these before
negotiating):**

1. **Argentine law ignores contract labels.** Art. 38 ¶2
 (substance-over-form) and the art. 2 iii) influence test mean the CNV
 looks at *operatoria efectivamente desarrollada*, not at our recital
 that we are "merely a marketer" (`tangem-revshare-analysis.md:84-90,
 :198`). A perfectly drafted "not an agent" clause does not bind the
 CNV; our **conduct** (what we promote, to whom, and how linear our
 revenue is to AR-resident swap volume) is what counts.
2. **Product/change risk at the payer.** The stream depends on Tangem's
 own art. 2 iv) posture surviving its aggregator role, on third-party
 swap/staking providers staying in place, and on Tangem not retiring or
 re-pricing the in-app features — the contract's survival and
 grandfathering clauses (B.2/B.3) mitigate, never eliminate, this
 (`tangem-revshare-analysis.md:136-140`).
3. **Triple concentration.** Hardware option + 30% rev-share + BD role =
 one partner in three roles; a single disagreement can threaten product
 access, revenue, and distribution at once (Section B.5).
4. **Positioning — FOUNDER DECISION, not a legal verdict:** does Treazury
 want to be perceived as a **"Tangem partner"**, or as **its own product
 that offers Tangem as one hardware option**? The second posture keeps
 optionality, matches the non-custody stack thesis
 (`non-custody-boundary.md:192-215`), and reduces the agency optics;
 the first may open doors with Tangem but narrows us (and interacts with
 red-lines 27/30). Surface via the COO; no CLO verdict on which to pick.

**Open founder decisions (via COO, not decided here):** (i) accept Swiss
governing law or push for neutral (Section B.8); (ii) positioning —
Tangem partner vs. own product with Tangem as an option (D.4); (iii)
promotion scope beyond hardware — commission a licensed-AR-attorney
opinion first (rev-share analysis founder-decision 2,
`tangem-revshare-analysis.md:351-353`).

**Next step:** when Tangem sends a draft →, `33-contracts-review`
mechanical scan + clause triage against Sections B/C above, verdict per
conduct, escalation list for licensed counsel. Red-lines 28-32 remain in
force unchanged; no new red-line conduct was found in this pass (no item
33 added).
