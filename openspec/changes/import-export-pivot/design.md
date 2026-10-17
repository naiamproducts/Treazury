# Design: Import/Export Pivot — USDC Settlement + Commercial Docs

## Technical Approach

Exploration Approach 2: additive `commercial_docs` + new `src/modules/commercial-docs/`; fiscal `invoices`, VE engine and `next_invoice_number()` untouched. Drafts generated at the payment-link transition; release gate idempotent at `markChargePaid` + `verify-payment`; partner = tenant with attribution on `tenant_members` and stats via SECURITY DEFINER RPC (no RLS relaxation); in-house single-locale `t()` i18n, landing first. Specs are behavior source of truth (5 domains, 24 reqs).

## Architecture Decisions

| # | Decision | Options | Choice + Rationale |
|---|----------|---------|--------------------|
| 1 | PDF path | Client printable HTML; jsPDF/pdfmake; server renderer | **Client printable HTML + browser Save-as-PDF for MVP.** Matches existing `renderPDF` PoC (`venezuela.ts` returns HTML); zero bundle cost (no PDF lib in package.json); `pdf_path` column reserved (nullable, unused) for future server storage; `invoices.pdf_url/xml_url` stay fiscal-only. CSV: client Blob, no lib. xlsx deferred. |
| 2 | Schema | Extend invoices; separate table | **Separate `commercial_docs`** (fiscal isolation guardrail). DDL: `id, tenant_id FK, order_id FK, doc_type enum('commercial_invoice','packing_list'), doc_number int, status enum('draft','released','voided') DEFAULT 'draft', incoterm text, currency, seller_snapshot jsonb, buyer_snapshot jsonb, lines jsonb, weight_net_kg/gross numeric(12,3), packages_total int, released_at, pdf_path text NULL, timestamps`; `UNIQUE(tenant_id, doc_number)`; partial unique `(tenant_id, order_id, doc_type) WHERE status<>'voided'` (mirrors 004). RLS: `member_tenant_isolation` pattern (scope via `tenants.owner_id=auth.uid()`). |
| 3 | Payment↔doc binding | `commercial_doc_id` on charges/payments; order-mediated | **Order-mediated only — no new FK on charges/payments.** Binding chain `commercial_docs.order_id ↔ charges.order_id ↔ payments.charge_id`. One charge settles one order; adding doc_id (2 docs/order) creates fan-out ambiguity. |
| 4 | Numbering | Reuse fiscal seq; own seq | **Own sequence:** `tenants.next_commercial_doc_number int DEFAULT 0` + `next_commercial_doc_number()` mirroring 002 exactly (SECURITY DEFINER, tenant from `auth.uid()`, approved check, REVOKE PUBLIC, burn-on-failure). Stored as int, rendered `CD-00001`. |
| 5 | Draft generation | On confirm; lazy on view | **On payment-link transition** (`updateOrder`: `pending_payment`→`invoiced`, alongside fiscal trigger, best-effort try/catch). Idempotent via partial unique; skips if docs exist. Burns 2 commercial numbers. |
| 6 | Release semantics | Per-charge; per-order | **On `orders.status→'paid'` only.** `UPDATE commercial_docs SET status='released', released_at=now() WHERE order_id=:id AND status='draft'` — exactly-once by construction (repeat = 0 rows). Partial/`partial` charges never release. Same SQL both attach points (store under RLS; edge fn as service_role). |
| 7 | Pre-paid visibility | Invisible; visible-locked | **Drafts visible + editable to owning tenant (RLS); export and release locked until paid** (reconciles "not exportable" scenario with the edit-before-release requirement). Released docs freeze (updates rejected unless draft). |
| 8 | Products/line data | Columns vs jsonb | **Additive nullable product columns** `hs_code, country_of_origin (ISO alpha-2 text), weight_net_kg, weight_gross, packages` (`unit` exists). Copied into doc `lines` jsonb at draft gen; per-line edits are doc-local overrides. Incoterm header-level. |
| 9 | Partner fee + panel | Trigger table; RPC; code constant | **`tenants.partner_fee_bps int NULL` (config, app default fallback 100 bps) + SECURITY DEFINER RPC `partner_panel_stats()`** (derives partner from `auth.uid()`, returns attributed-signup count, settled `SUM(payments.amount)`, commission = volume×bps). Recompute = no double-count risk; no RLS relaxation; materialized `partner_commissions` deferred. |
| 10 | Signup attribution | Trigger metadata; explicit RPC | **URL `?ref={partnerTenantId}` → AuthPage → signup metadata → RPC `attribute_signup(p_partner uuid)`**: sets own `tenant_members.attributed_partner_tenant_id` if NULL, validates partner approved ≠ own tenant. Idempotent, once-only, testable. |
| 11 | Module shape | Country engine like invoicing; doc-type factory | **Doc-type factory** (`src/modules/commercial-docs/`: `interface.ts`, `factory.ts`, `renderers/invoice.ts`, `renderers/packing-list.ts`, `csv.ts`). Factory = sole concrete import (AGENTS.md contract). Future doc types register; no country registry; fiscal module untouched. |
| 12 | i18n | react-i18next; in-house t() | **In-house:** `src/i18n/en.ts` flat dotted catalog (~150 keys, namespaces: landing, auth, shell, orders, catalog, customers, charges, settings, docs, partners, errors) + `t(key, vars?)` pure function. Single locale → no provider/context/re-render machinery; react-i18next is dependency+boilerplate overkill. Landing first, then shell; migrate file-by-file so `bun run check` stays green. `index.html`: `lang="en"` + English title/OG. |

## Data Flow

    Buyer pays USDC ──→ verify-payment (service_role) ──→ charge=paid ──→ order=paid
    Merchant confirms ──→ markChargePaid (store, RLS) ─────────────┘         │
                                                                             ▼
    updateOrder(pending_payment) ──→ draft gen (2 docs, RLS)     release UPDATE … WHERE status='draft'
                                                                             ▼
    Doc editor (RLS, draft edits) ──→ export lock (status='released') ──→ printable HTML/PDF + CSV

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `docs/migrations/006_commercial_docs.sql` | Create | Table, enums, `next_commercial_doc_number()`, product cols, `attributed_partner_tenant_id`, `partner_fee_bps`, RLS, RPCs `attribute_signup`, `partner_panel_stats` |
| `src/modules/commercial-docs/{interface,factory,csv}.ts`, `renderers/*` | Create | Doc types, factory, HTML renderers, CSV builder |
| `src/i18n/{en.ts,t.ts}` | Create | Catalog + t() |
| `src/store/index.ts` | Modify | Draft gen, release call in `markChargePaid`, doc CRUD/export guards |
| `supabase/functions/verify-payment/index.ts` | Modify | Idempotent release UPDATE after order→paid (~L407) |
| `src/components/dashboard/{CommercialDocsView,PartnerPanel}.tsx` (+ OrdersView hook-in) | Create/Modify | Editor/export UI (light theme), partner panel (light theme) |
| `src/components/AuthPage.tsx`, `LandingPage.tsx`, `index.html` | Modify | ref capture; EN SWIFT→USDC agency copy (luxe-dark, DESIGN.md tokens); lang/title |
| Remaining dashboard views + `DESIGN.md` §0/Q4 | Modify | EN string sweep; DESIGN.md Spanish-copy rule → English alignment |

## Interfaces / Contracts

```ts
type CommercialDocType = 'commercial_invoice' | 'packing_list'
type CommercialDocStatus = 'draft' | 'released' | 'voided'
interface CommercialLine { productId?: string; description: string; quantity: number;
  unitPrice: string; subtotal: string; hsCode?: string; origin?: string;
  weightNetKg?: string; weightGrossKg?: string; packages?: number }
interface CommercialDoc { id: string; tenantId: string; orderId: string; docType: CommercialDocType;
  number: string; status: CommercialDocStatus; incoterm?: string; currency: string;
  seller: Party; buyer: Party; lines: CommercialLine[]; totals: DocTotals;
  disclaimer: string /* fixed spec text, every render */ }
interface CommercialDocFactory { register(t, r): void; generate(t, params): CommercialDoc;
  renderHTML(doc): string; toCSV(doc): string }
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit (via check) | t() interpolation, CSV shape, disclaimer presence, validation (negative weight) | `bun run check` (no unit runner configured; pure funcs keep oxlint/tsc green) |
| E2E | Drafts on confirm; no dupes; export locked pre-paid; release on both paths; idempotent re-release; EN-only landing; partner panel zeros | `bunx playwright test e2e/` (+ `forge test` untouched) |
| DB | Sequence isolation; RLS cross-tenant denial; unique partial index | SQL assertions in migration review + e2e via two tenants |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. (Release gate is pure DB+store logic; guardrails encoded as specs.)

## Migration / Rollout

Additive migration 006 only (new table/enums/cols/RPCs; no backfill). Ship in chained slices; fiscal path untouched → rollback = drop new objects + revert UI/gate hooks. `pdf_path`/`partner_commissions` future-reserved, unused in MVP.

## Sequencing (review slices, ~800-line budget each)

1. **Migration + module skeleton** (006, types, factory stubs) — everything depends on it.
2. **i18n skeleton + EN landing** (`en.ts`, `t()`, LandingPage, index.html, DESIGN.md alignment) — independent; lets all new UI ship in English.
3. **Draft gen + doc editor** (store trigger, CommercialDocsView, validation).
4. **Export** (printable HTML/PDF, CSV, disclaimer, released-only guard).
5. **Release gate** (markChargePaid + verify-payment, e2e both paths).
6. **Partner** (attribute_signup, panel RPC, PartnerPanel, anti-custody copy).
7. **App-shell EN sweep** (remaining ~150 strings, file-by-file).

Forecast for sdd-tasks: Decision needed before apply: No · Chained PRs recommended: Yes · 400-line budget risk: High (use ~800-line orchestrator budget; slices 3 and 7 are largest).

## Open Questions

- Default `partner_fee_bps` fallback value (suggest 100 bps = 1%) — product call, config-pluggable either way.
- Commercial doc number format prefix (`CD-`) — cosmetic; integer stored regardless.
