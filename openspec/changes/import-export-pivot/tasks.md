# Tasks: Import/Export Pivot — USDC Settlement + Commercial Docs

Scenario codes below: domain prefixes CD / DRG / PA / I18N / L, `R#=requirement, S#=scenario` (24 reqs, 32 scenarios).

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2,800–3,600 (7 slices) |
| 800-line budget risk | Medium (High for slices 3 and 7 unless split) |
| Chained PRs recommended | Yes |
| Suggested split | PR1→PR9: design slices 1–7, slice 3 → 3a/3b, slice 7 → 7a/7b |
| Delivery strategy | auto-forecast (auto-chain; no ask on risk) |
| Chain strategy | pending — not cached; orchestrator asks before apply |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|----|----------------------|-----------------|-------------------|
| 1 | Migration 006 + commercial-docs skeleton | PR1 | `bun run check` | N/A — SQL+types only, no UI surface | revert `006_commercial_docs.sql`, delete `src/modules/commercial-docs/` |
| 2 | i18n layer + EN landing | PR2 | `bunx playwright test e2e/04-landing-en.spec.ts` | load landing, assert locale/copy | revert `src/i18n/`, `LandingPage.tsx`, `index.html`, `DESIGN.md` §0 |
| 3a | Draft gen in store | PR3a | `bunx playwright test e2e/05-commercial-drafts.spec.ts` | order → pending_payment flow | revert store draft-gen hook |
| 3b | Doc editor UI | PR3b | `bun run check && bunx playwright test e2e/05-commercial-drafts.spec.ts` | edit+save draft doc | revert `CommercialDocsView.tsx`, OrdersView hook |
| 4 | Export PDF/CSV + released-only guard | PR4 | `bunx playwright test e2e/06-commercial-export.spec.ts` | export released vs draft doc | revert `renderers/`, `csv.ts`, export UI |
| 5 | Release gate, both attach points | PR5 | `bunx playwright test e2e/07-release-gate.spec.ts` | markChargePaid + verify-payment calls | revert gate hooks in store + edge fn |
| 6 | Partner attribution + panel | PR6 | `bunx playwright test e2e/08-partner.spec.ts` | `?ref=` signup, panel open | revert RPCs, `AuthPage.tsx` ref, `PartnerPanel.tsx` |
| 7a | App-shell EN sweep part 1 | PR7a | `bun run check && bunx playwright test e2e/` | render dashboard views | revert per-file string commits |
| 7b | Errors namespace + final sweep | PR7b | `bunx playwright test e2e/` | invalid form → English error | revert errors-namespace commits |

## Phase 1: Migration + Module Skeleton (PR 1 — blocks all)

- [x] 1.1 Create `docs/migrations/006_commercial_docs.sql`: `commercial_docs` table + enums, `UNIQUE(tenant_id,doc_number)`, partial unique `(tenant_id,order_id,doc_type) WHERE status<>'voided'`, product cols (`hs_code, country_of_origin, weight_net_kg, weight_gross, packages`), `tenant_members.attributed_partner_tenant_id`, `tenants.partner_fee_bps`, RLS `member_tenant_isolation` pattern. Accept: CD-R7 (cross-tenant read denied), CD-R6 foundation.
- [x] 1.2 Add `next_commercial_doc_number()` in 006 mirroring 002 (SECURITY DEFINER, tenant from `auth.uid()`, REVOKE PUBLIC, burn-on-failure); no statement calls `next_invoice_number()`. Accept: CD-R6 (fiscal sequence untouched).
- [x] 1.3 Add SECURITY DEFINER RPCs `attribute_signup(p_partner uuid)` and `partner_panel_stats()` to 006 — no RLS relaxation, partner validated != own tenant. Accept: PA-R1, PA-R2, PA-R3 (DB side).
- [x] 1.4 Create `src/modules/commercial-docs/{interface,factory,csv}.ts` + `renderers/` stubs; `CommercialDoc`/`CommercialLine` types per design, fixed disclaimer constant (exact spec text, CD-R5); factory = sole concrete import. Verify: `bun run check`.

## Phase 2: i18n Skeleton + EN Landing (PR 2 — independent)

- [x] 2.1 Create `src/i18n/{en.ts,t.ts}`: flat dotted catalog (~150 keys, 11 namespaces), pure `t(key, vars?)`. Accept: I18N-R2 foundation. Verify: `bun run check`.
- [x] 2.2 RED: write `e2e/04-landing-en.spec.ts` — English agency hero (L-R1), SWIFT-vs-USDC contrast on speed/cost/visibility (L-R2), payment→document-release statement (L-R3), no Spanish + locale `en` (L-R4 scoped, I18N-R1). **L-R4 SCOPE: scan covers landing-owned copy; `AccessRequestForm` Spanish remains deferred to 7.2 (deviation documented in the e2e header; full landing L-R4 acceptance at 7.4).**
- [x] 2.3 GREEN: rewrite `src/components/LandingPage.tsx` EN agency copy (luxe-dark tokens), remove WhatsApp/Vendify; `index.html` `lang="en"` + EN title/OG (I18N-R3). **GUARDRAIL: `src/modules/invoicing/engines/venezuela.ts` Spanish fiscal HTML stays UNTOUCHED — guardrail outranks i18n.**
- [x] 2.4 Update `DESIGN.md` §0 language rule Spanish→English. Verify: `bunx playwright test e2e/04-landing-en.spec.ts`.

## Phase 3: Draft Gen + Doc Editor (PR 3a → 3b; largest slice)

- [ ] 3.1 (3a) RED: write `e2e/05-commercial-drafts.spec.ts` — drafts on confirm (CD-R1S1), no dup on re-confirm (CD-R1S2), retry path: order confirmed, gen failed, retry → docs appear, no burn beyond partial-unique guarantee (CD-R1), fiscal invoice numbers unchanged after gen (CD-R6), cross-tenant read denied (CD-R7).
- [ ] 3.2 (3a) GREEN: `src/store/index.ts` draft gen at `pending_payment→invoiced` beside fiscal trigger (~L1150): best-effort try/catch, skip-if-exists, burns 2 via `next_commercial_doc_number()`. Verify: `bunx playwright test e2e/05-commercial-drafts.spec.ts`.
- [ ] 3.3 (3b) RED: extend `05-commercial-drafts.spec.ts` — edit persists after reload (CD-R2S1), negative/non-numeric weight rejected with EN error (CD-R2S2), drafts visible+editable pre-paid while export stays locked (design D7 reconciliation).
- [ ] 3.4 (3b) GREEN: `src/components/dashboard/CommercialDocsView.tsx` editor (HS code, Incoterm, origin, buyer/seller, weight, packages) + OrdersView hook-in. Verify: `bun run check` + `bunx playwright test e2e/05-commercial-drafts.spec.ts`.
  SPLIT OPTION: if 3a+3b >800 lines, ship PR3a (store) and PR3b (UI) separately — they already are separate work units.

## Phase 4: Export (PR 4)

- [ ] 4.1 RED: write `e2e/06-commercial-export.spec.ts` — PDF/printable HTML contains all fields (CD-R3), CSV one row per line item (CD-R4), disclaimer present on every render/export (CD-R5), export blocked until paid (DRG-R1S1).
- [ ] 4.2 GREEN: `src/modules/commercial-docs/renderers/{invoice,packing-list}.ts` (English HTML) + `csv.ts`; disclaimer emitted by every render path.
- [ ] 4.3 GREEN: export UI in `CommercialDocsView.tsx` — client print/save-as-PDF, CSV Blob download, guard `status==='released'`. Verify: `bun run check` + `bunx playwright test e2e/06-commercial-export.spec.ts`.

## Phase 5: Release Gate (PR 5)

- [ ] 5.1 RED: write `e2e/07-release-gate.spec.ts` — blocked before paid (DRG-R1S1), released when paid via `markChargePaid` (DRG-R1S2, DRG-R4S1), unsettled charge does not release (DRG-R2S2), payment→release on one event (DRG-R2S1), duplicate paid signal → no new release/state change (DRG-R3).
- [ ] 5.2 GREEN: idempotent release `UPDATE commercial_docs SET status='released', released_at=now() WHERE order_id=:id AND status='draft'` in `src/store/index.ts` `markChargePaid` (~L1167, under RLS).
- [ ] 5.3 GREEN + own test: same UPDATE in `supabase/functions/verify-payment/index.ts` after order→paid (~L407, service_role, no RLS) with order-scoped idempotency test run as service_role (DRG-R4S2, DRG-R3). Verify: `bunx playwright test e2e/07-release-gate.spec.ts`.

## Phase 6: Partner (PR 6)

- [ ] 6.1 RED: write `e2e/08-partner.spec.ts` — `?ref=` signup records `attributed_partner_tenant_id` (PA-R1S1), no ref → null, signup proceeds (PA-R1S2), fee % shown (PA-R2), panel totals (PA-R3S1), zeros without error (PA-R3S2), partner cross-tenant read denied (PA-R4).
- [ ] 6.2 GREEN: `src/components/AuthPage.tsx` capture `?ref=` → signup metadata → `attribute_signup` RPC (idempotent, once-only).
- [ ] 6.3 GREEN: `src/components/dashboard/PartnerPanel.tsx` via `partner_panel_stats()` + anti-custody copy (direct buyer→seller, no agency custody — PA-R5 narrative). Verify: `bun run check` + `bunx playwright test e2e/08-partner.spec.ts`.
- [ ] 6.4 Static check: `git diff` on schema/store shows no agency wallet/custody structures; buyer→seller path unchanged (PA-R5S1). FLAG: on-chain fund-flow scenario not e2e-testable (no chain harness; `forge test` untouched) — covered by design invariant + static check.

## Phase 7: App-Shell EN Sweep (PR 7a → 7b; largest slice)

- [ ] 7.1 (7a) RED: write `e2e/09-app-locale.spec.ts` — active locale `en` (I18N-R1S2), spot-check rendered views contain no Spanish (I18N-R1S1).
- [ ] 7.2 (7a) GREEN: sweep heaviest files into `t()` — `OrdersView.tsx` (~27), `AuthPage.tsx` (~14), `AccessRequestForm.tsx` (~14), `CatalogView.tsx` (~14).
- [ ] 7.3 (7b) GREEN: remaining dashboard views + `errors` namespace — invalid form shows English error (I18N-R4). **GUARDRAIL: `venezuela.ts` untouched — verify `git diff --stat -- src/modules/invoicing/` is empty.**
- [ ] 7.4 Final verification: `bun run check`, `bunx playwright test e2e/`, `forge test` (must stay untouched/pass), grep spot-check for residual Spanish outside `venezuela.ts` + fiscal snapshots.
  SPLIT OPTION: 7a (~90 strings) and 7b (~60 strings + errors) ship as separate PRs if either >800 lines.

## Coverage Map (24 reqs / 32 scenarios)

- CD: R1→3.1,3.2 | R2→3.3,3.4 | R3→4.1–4.3 | R4→4.1–4.3 | R5→1.4,4.2 | R6→1.2,3.1 | R7→1.1,3.1
- DRG: R1→4.1,5.1 | R2→5.1 | R3→5.1,5.3 | R4→5.1,5.2,5.3
- PA: R1→1.3,6.1,6.2 | R2→1.3,6.1,6.3 | R3→1.3,6.1,6.3 | R4→6.1 (app), 1.1 (RLS) | R5→6.3,6.4
- I18N: R1→2.2,7.1 | R2→2.1,7.2 | R3→2.3 | R4→7.3
- L: R1–R4→2.2,2.3 (L-R3 payment→document string required in 2.2)

Untestable flags: PA-R5S1 (on-chain fund flow — no chain harness), DRG-R4S2 edge path (test via 5.3 service_role test; e2e call only if function reachable from harness), I18N-R1 full-string inspection (covered by grep spot-check 7.4, not exhaustive automation).
