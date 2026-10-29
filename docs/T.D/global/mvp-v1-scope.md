---
dept: T.D
scope: global
kind: scope
status: draft
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/M.D/global/nocustody-pivot.md:68-195 (Ledger Gate/Shield/Corridor Desk concepts, P3 pricing, beachhead, WTP pre-registered thresholds)
 - /home/kiox/treazury/docs/M.D/global/corridors.md:76,85-102,164-209 (US→MX +$297 @ $25k, corridor ranking, ICP, falsification interviews)
 - /home/kiox/treazury/docs/M.D/global/cashabroad-teardown.md:118-149 (no document-gating product, 2-4 employees custodial)
 - /home/kiox/treazury/docs/L.D/global/red-lines.md:35-85 (items 1-4, 22-24: no non-custodial claim pre-fix, no partner claims, commercial-not-customs, unknown profile never ships)
 - /home/kiox/treazury/docs/L.D/global/non-custody-boundary.md (PSAV frontier; no key faculty, no relayer)
 - /home/kiox/treazury/docs/L.D/global/flow-matrix.md:38-84 (MX/US no-delta; OrderVault unsellable anywhere; no corridor ships until profile ported)
 - /home/kiox/treazury/docs/L.D/ar/export-flow-escrow.md:48-160 (escrow-until-cumplido BLOCKED, cumulative 20bd clock)
 - /home/kiox/treazury/docs/F.D/ar/crypto-utility-verdict.md (imports AR REJECTED; P3 +$101.01/payment invoiced-apart)
 - /home/kiox/treazury/docs/T.D/global/adr-001-jurisdiction-engine.md:147-172 (engine not wired yet; port confirmed profiles in same change as wire-up)
 - /home/kiox/treazury/AGENTS.md:149,196-203 (custody decision table, PA-R5, hard rules), :214-240 (tech stack, onchain facts)
 - /home/kiox/treazury/contracts/PaymentRouter.sol:74-128,185-192,394-411 (OrderVault, refund-any-recipient, fee sweep — CUSTODIAL)
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:52-53,246-274 (fee constants 1%+0.5%, vault branches, direct fallback)
 - /home/kiox/treazury/src/modules/jurisdiction/index.ts:147-159 (fail-closed engine), profiles/mx.ts:1-30 (skeleton all-unknown), profiles/ar.ts
 - /home/kiox/treazury/docs/L.D/mx/profile.md:20-35 (status confirmed, buyerToSellerDirect permitted), docs/L.D/us/profile.md:24-40 (status provisional, base flow permitted)
 - /home/kiox/treazury/supabase/functions/check-payment/index.ts:1-40,483 (primary reorg-gated verification; order→paid), verify-payment/index.ts:42 (MIN_CONFIRMATIONS=12)
 - /home/kiox/treazury/supabase/functions/verify-payment/index.ts:1-30 (Alchemy webhook = best-effort; proved unreliable on Arc Testnet)
 - /home/kiox/treazury/src/store/index.ts:1167-1202 (markChargePaid), src/i18n/en.ts:29-31, index.html:12,19 (2–6h claims live — red-line 2)
 - /home/kiox/treazury/openspec/changes/import-export-pivot/tasks.md:61-79 (phases 3-5 unbuilt: draft gen, export, release gate), specs/document-release-gate/spec.md (DRG requirements)
 - /home/kiox/treazury/scripts/test-jurisdiction.ts (19 tests, run 2026-10-28: 19 passed)
 - aven (this task, ref KQV3); aven (pivot decision, status=todo, priority=urgent — SUPERSEDED-ASSUMED here)
 - Engram topic: naiam-si/treazury/tech.mvp-v1
---

# Treazury MVP V1 scope — Ledger Gate, non-custody, MX/US beachhead

Decision-support for the founder. Verdict vocabulary: `VALIDATED / PROMISING /
UNVALIDATED / REJECTED`. **Supuesto (assumption): the founder accepts the
no-custody pivot (aven, still `todo`)** — kill OrderVault/fee-sweep,
beachhead MX/US, WTP interviews. Every decision below that depends on it says
so explicitly; if is rejected, Slice 1 must be rescoped before any
build starts.

## 1. Hypothesis and V1 success metric

**Falsifiable hypothesis:** triangular-trade / merchanting operators on the
MX/US corridor (tickets $15K–200K) will pay the P3 fixed fee, invoiced apart
($75 ≤$50K / $150 >$50K), for a non-custodial layer that (i) verifies the
buyer's USDC payment on-chain, (ii) releases the commercial document pack on
confirmation, (iii) tracks collection deadlines.

**Primary metric (pre-registered by M.D, `nocustody-pivot.md:173-186`):**
≥3/10 written pre-orders at full fee within 14 days, without negotiating the
fee down >50% → P3 `VALIDATED`; ≤1/10 → `REJECTED`. Channel: customs-broker /
freight-forwarder referrals in MX and US. This metric is interview-time, not
build-time — the experiment does not wait for V1.

**V1 build metric (what this scope must deliver):** a demoable end-to-end
Ledger Gate on Arc testnet — order → payment link → buyer USDC direct →
`check-payment` marks paid → docs `draft → released` → export — such that the
founder can run all 10 interviews with a live product, and the first pre-order
can be fulfilled without rework. Gate: `bun run check` green + affected e2e
passing (`AGENTS.md` verification rule).

## 2. Feature scoring (RICE) and cut line

Scorer: `skills/02-mvp-scoping/scripts/mvp_scorer.py`, CSV in header note.
Reach = number of V1 demo/pre-order flows the feature touches (10 = every
interview candidate). Effort in person-weeks (solo CTO).

| # | Feature | Reach | Impact | Conf | Effort | RICE | V1? |
|---|---------|-------|--------|------|--------|------|-----|
| 1 | Buyer wallet payment UI (ConnectKit/wagmi, direct transfer) | 10 | high | 90% | 0.25 | 108.00 | **IN** (reuse, built) |
| 2 | Merchant payout address + charge creation | 10 | high | 90% | 0.25 | 108.00 | **IN** (reuse, built) |
| 3 | Direct payment link, no vault, no on-flow fee | 10 | high | 90% | 0.5 | 54.00 | **IN** (strip vault branches) |
| 4 | Whitelist onboarding + manual approval | 10 | medium | 95% | 0.5 | 38.00 | **IN** (reuse, built) |
| 5 | On-chain payment verification, reorg-safe (check-payment) | 10 | huge | 90% | 1.5 | 30.00 | **IN** (reuse; primary path) |
| 6 | Landing/claims red-line quarantine (kill 2–6h, bank-payout claims) | 10 | high | 90% | 1 | 27.00 | **IN** (compliance, red-line 2) |
| 7 | Doc pack released exactly once on payment + export (PDF/CSV) | 10 | huge | 85% | 3 | 14.17 | **IN** (core job ii) |
| 8 | Commercial doc pack auto-drafted on confirm, editable | 10 | high | 85% | 2 | 12.75 | **IN** (prereq of #7) |
| 9 | In-product P3 fee invoice record | 10 | high | 60% | 1.5 | 12.00 | OUT — manual invoice for first 10 |
| 10 | Jurisdiction gate wired fail-closed + MX/US profiles ported | 10 | high | 75% | 2 | 11.25 | **IN** (compliance, red-line 4) |
| 11 | Plazos/deadline tracking per order (due date + countdown) | 8 | medium | 70% | 2 | 5.60 | **IN** (core job iii, minimal) |
| 12 | Spanish locale (ES) for MX users | 6 | medium | 70% | 2.5 | 3.36 | OUT — V1.1, reopen if ≥3/10 ask |
| 13 | Notifications (email) on payment + doc release | 6 | medium | 50% | 2 | 3.00 | OUT — manual monitoring for alpha |
| 14 | Reconciliation view for agency | 5 | medium | 55% | 3 | 1.83 | OUT |
| 15 | Per-client live ledger (multi-entity) | 4 | medium | 60% | 4 | 1.20 | OUT — P5 pain, post-WTP |
| 16 | Partner referral tracking (`?ref=`) | 3 | low | 50% | 2 | 0.75 | OUT — openspec phase 6 |
| 17 | Fiat off-ramp / FX partner integration | 6 | high | 20% | 6 | 0.60 | OUT — red-line 2, no partner |
| 18 | Shield Protocol multi-sig escrow (customer keys) | 3 | huge | 30% | 8 | 0.56 | OUT — V2 moat, needs L.D bless |
| 19 | Tangem card as signer option | 2 | medium | 25% | 4 | 0.25 | OUT — depends on #18 |
| 20 | AR corridor + escrow-until-cumplido | 2 | high | 10% | 8 | 0.08 | OUT — BLOCKED/REJECTED |

**Cut line (MUST-HAVE test):** the core job is "verify payment → release docs
→ track deadlines". #1–8, 10–11 serve it or are compliance prerequisites —
challenged once each and kept: #4 is already built (marginal effort 0.5), #6
is two-file copy surgery required before any interview demo shows the landing,
#10 is red-line 4 (an unwired gate = unknown MX profile ships a corridor).
Everything below the line is LATER/CUT regardless of score. RICE tiers from
the script are relative to the top score; the cut line is drawn by the job,
not by tier (script output retained in this task's aven note).

## 3. Out of scope for V1 (frozen)

- **AR corridor, importaciones AR, escrow-until-cumplido, SECOEXPO cumulative
 clocks** — REJECTED (`F.D/ar/crypto-utility-verdict.md`), BLOCKED
 (`L.D/ar/export-flow-escrow.md:52`); never pitched.
- **Fideicomiso** — different product line (`L.D/ar/fideicomiso-viability.md`).
- **Any custody behavior:** OrderVault, refunds, fee-sweep (1%+0.5%),
 fiat conversion, relayer/paymaster signing, key custody — PA-R5
 (`AGENTS.md:202-203`), red-lines 1/22/23/24. **Supuesto.**
- **P3 fee on-flow / netted fees** — pricing is invoiced apart, off-flow
 (`M.D/nocustody-pivot.md:76`); in-product fee invoicing deferred.
- **Shield Protocol escrow + Tangem signer integration** — V2 only, and only
 after L.D confirms a customer-controlled shape; Tangem in V1 = at most a
 copy line "the client may hold keys on their own Tangem", zero integration.
- **FX/ramp partner, named rails, settlement-time claims** — red-line 2 until
 contracted.
- **Multi-country beyond MX/US** — unknown profiles fail closed anyway
 (`jurisdiction/index.ts:147-159`).
- **ES locale, email notifications, reconciliation, multi-entity ledger,
 partner program, xlsx, own backend, mainnet** — LATER or already excluded
 (`AGENTS.md` pending list).

## 4. Acceptance criteria (measurable, per V1 feature)

**A. Direct payment link (no vault)** — Given an order, when the merchant
copies the payment link, then it contains `?amount=&to=` and never `?vault=`;
when the buyer pays, funds hit the tenant `walletAddress` with zero contract
calls to PaymentRouter (no vault deploy in network log); grep
`PLATFORM_FEE_BPS|DEV_FEE_BPS` in `src/` returns 0 hits after Slice 1.

**B. On-chain verification** — Given a buyer tx of the exact amount to the
charge destination with ≥12 confirmations (`verify-payment/index.ts:42`) and
all three reorg gates passing (`check-payment/index.ts:20-40`), when
`check-payment` is invoked, then charge → `paid` and order → `paid`
(`check-payment/index.ts:483`); given wrong amount/address, a reorg split, or
a replay, then status stays/returns `paid` exactly once (idempotency,
`check-payment/index.ts:238-239`) and never flips a non-matching charge.

**C. Doc pack auto-draft** — Given an order transitions
`pending_payment → invoiced`, when the store hook runs, then exactly 2
`commercial_docs` rows exist (invoice + packing list) numbered via
`next_commercial_doc_number()`; re-confirm creates no duplicates; fiscal
`next_invoice_number()` untouched (CD-R1S1/S2, CD-R6). e2e `05` passes
(`openspec/.../tasks.md:61-67`).

**D. Doc pack release + export** — Given an unpaid order, then export is
refused (`status !== 'released'`); given `paid` via `markChargePaid`
(`store/index.ts:1167`) or `check-payment`, then `draft → released` exactly
once and a duplicate paid signal changes nothing (DRG-R1S1, DRG-R3,
`specs/document-release-gate/spec.md`); released export HTML contains every
field + the commercial-not-customs disclaimer (CD-R3, CD-R5), CSV emits one
row per line item (CD-R4). e2e `06`, `07` pass.

**E. Plazos tracking** — Given an order with `due_date` (new column,
migration), when viewed in OrdersView, then a days-remaining badge renders and
an overdue badge renders when `due_date < now` (e2e assertion with a fixed
clock); zero country-specific clock logic in `src/` (AR clocks are out of
scope — no `cumplido`/`20bd` literals outside `docs/`).

**F. Claims quarantine** — `grep -r "2–6 hours\|2–6h\|to their bank"` over
`src/i18n/en.ts` and `index.html` returns 0 hits; landing claims reduced to
implemented, non-partner behaviors (red-lines 1–2 satisfied); `bun run check`
green.

**G. Jurisdiction gate** — Given charge creation, when
`assertCorridorAllowed(country, 'buyerToSellerDirect')` runs, then MX with
the ported confirmed profile (`docs/L.D/mx/profile.md:20-35`) permits, an
unregistered country or non-permitted flow refuses (fail-closed, never warns);
existing 19 jurisdiction tests stay green and ≥3 new tests cover the wire-up
(port + gate in the same change, `adr-001:153-156`).

**H. Onboarding (reuse)** — Existing whitelist regression only: signup →
`is_approved=false` → approval screen; e2e `01` passes.

## 5. Architecture V1 (ADR-lite)

**Forces:** PA-R5 zero custody (`AGENTS.md:202-203`); red-lines 1–32; solo
CTO + 14-day WTP timebox; existing Vite+Supabase+Arc stack; beachhead MX/US
no-delta (`flow-matrix.md:58-63`).

**Decision 1 — `contracts/PaymentRouter.sol` + OrderVault: ARCHIVE, not
hard-fork, not ignore.** Move the active build path off them: strip the vault
branches (`usdc-arc.ts:246-274`, 31 vault refs), drop `VITE_ROUTER_OWNER_KEY`
from the flow, keep `?to=` direct mode as the only path; the .sol file moves
to `contracts/legacy/` (kept in git, not deployed, not imported). Rationale:
the refund path (`PaymentRouter.sol:185-192`) and sweep (`:394-411`) make the
"non-custodial" claim unsellable (red-line 1) and the 1%+0.5% fee contradicts
invoiced-apart P3. *Supuesto: if rejected, rescope Slice 1.*

**Decision 2 — `src/modules/jurisdiction/`: INTEGRATE, not leave
provisional.** Wire `assertCorridorAllowed` at charge creation; port the MX
profile from the confirmed `docs/L.D/mx/profile.md` into `profiles/mx.ts` in
the same change (ADR-001's own rule); port US only at its confirmed status
(see open question 4). Engine stays pure TS (no viem/Supabase), tests in
`scripts/test-jurisdiction.ts` remain the gate.

**Decision 3 — Chain: Arc testnet for V1.** The whole verified stack is
Arc-specific: generated `onchain-facts.ts`, USDC `0x3600…0000` (6 decimals),
reorg gates tuned to the Oct-2026 Arc split (`check-payment/index.ts:20-40`),
deployed testnet router, e2e. Mainnet is already out of scope
(`AGENTS.md` pending list) and the WTP experiment validates demand, not
production settlement. Production-chain selection is a post-`VALIDATED`
stack decision (skill 03), not a V1 blocker.

**Decision 4 — i18n: EN-only for V1.** Single-locale `t()` exists with no
provider machinery (`src/i18n/en.ts:7`); MX/US cross-border trade documents
are conventionally English. ES = V1.1, reopen trigger: ≥3/10 interviewees
request it.

**Decision 5 — Document-release trigger: client-submitted tx hash via
`check-payment` (primary), webhook as best-effort.** Evidence: Alchemy's
Address Activity pipeline silently drops transfers on Arc Testnet — the repo
already demoted it (`verify-payment/index.ts:20-30`, `check-payment/index.ts:
1-19`), and the buyer page already reports the tx (`PaymentPage.tsx:149-159`).
No oracle: a USDC transfer to a known address is a self-verifiable on-chain
fact. Release executes as the same idempotent `draft → released` UPDATE at
both attach points (store `markChargePaid` + edge fn), per DRG.

**Module map:** REUSE — `commercial-docs` module (factory/CSV; renderers to
finish), jurisdiction engine, `check-payment`/`verify-payment`, PaymentPage/
PayWithWallet, store, `t()`, whitelist, e2e harness. NEW — store draft-gen
(phase 3), `CommercialDocsView` editor (3b), HTML renderers + export UI
(phase 4), release gate (phase 5), `due_date` column + plazos badge, MX
profile port + gate wire-up, claims quarantine. ARCHIVE — PaymentRouter/
OrderVault active path, vault branches, fee constants, owner-key env.

Flow: `buyer wallet → tx → check-payment (3 reorg gates) → orders.paid →
release gate → commercial_docs.released → export UI`; merchant side never
touches funds: `payment link ?to= → buyer → seller wallet direct`.

## 6. Build sequence

| Slice | Content | Est | Unlocks |
|---|---|---|---|
| **1 — De-custodize the path** | Archive PaymentRouter/OrderVault from the runtime path; strip vault+fee branches (`usdc-arc.ts`), remove owner-key dependency; claims quarantine (`en.ts`, `index.html`). *Depends: supuesto.* | **M** | Honest non-custodial demo (red-line 1); clean base for every later slice |
| **2 — Doc pipeline end-to-end** | Draft gen on invoiced (3a) → editor (3b) → HTML/CSV export with released-guard (4) → release gate at both attach points (5); e2e 05/06/07 | **L** | Core job (ii) demoable: "documents release when the money lands" |
| **3 — Gate + plazos** | Port MX profile (confirmed md → `.ts`), wire `assertCorridorAllowed` at charge creation; `due_date` column + OrdersView badge; e2e refusal paths | **M** | Red-line 4 compliance for the beachhead; core job (iii) |
| **4 — WTP demo readiness** | Seed demo data, interview runbook, full `bun run check` + e2e on Arc testnet, founder handoff | **S** | The 14-day WTP experiment with a live product |

Order rationale: Slice 1 first because every public claim and demo depends on
custody removal; Slice 2 is the hypothesis' differentiator (the CashAbroad
gap); Slice 3 before showing any corridor; Slice 4 packages it. The WTP
interviews themselves can start in parallel (founder time, no build) — V1
exists to convert and fulfill.

## 7. Open questions for the founder (max 5)

1. **Document pack authorship:** does the platform generate the pack from
 order data (current design: `commercial_docs` draft-gen), or does the
 agency upload/sign its own documents? Changes what "release" means
 (unlock platform-generated rows vs. unlock an upload slot).
2. **FX partner before V1?** Is V1 purely verification + docs with FX
 explicitly out (my recommendation — red-line 2 forbids naming a rail
 until contracted), or do you want a contracted FX/ramp partner before
 demos? I cannot contract one; you decide whether the pitch needs it.
3. **Plazos semantics:** what starts the deadline clock for MX/US merchanting
 — order confirmation, invoice date, or a mutually agreed date in the
 notes? And is a simple due date + overdue badge enough for V1, or do you
 expect AR-style multi-clock tracking (currently out of scope)?
4. **US profile timing:** `docs/L.D/us/profile.md` is `provisional`. Ship the
 gate with MX confirmed + US provisional ported (base flow only, other
 flows fail closed), or hold the US side until L.D confirms? Holding blocks
 half the beachhead; porting provisional ships on L.D's draft.
5. **P3 fee visibility:** keep the $75/$150 fee entirely off-product (manual
 invoice for the first 10 — what this scope assumes), or show a fee badge
 on the payment-confirmation screen? Pricing display is product copy you
 own (pricing itself = CFO).
