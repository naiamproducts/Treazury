# Treazury

> USDC settlement platform + commercial documentation for import/export
> agencies — "The crypto alternative to SWIFT". Alpha, invitation-only.
> Canonical copy lives in `src/i18n/en.ts` (landing hero keys): "Settle
> cross-border trade for your clients, in USDC — without SWIFT."
> (`index.html` carries different meta copy.)

Product source of truth: `openspec/changes/import-export-pivot/` (proposal,
design, tasks, specs). `openspec/specs/` is empty. The pre-pivot `docs/*.md`
files (2026-10-10) were removed on 2026-10-19; `docs/migrations/` is the only
thing left under `docs/`.

## Good practices

`GOOD_PRACTICES.md` is mandatory reading before any work in this repo.
- **Language**: English for all repo text; user-facing strings go through the
  i18n catalog (`src/i18n/en.ts` + `t()`), never hardcoded.
- **Commits**: work-unit commits — one deliverable per commit, Conventional
  Commits, tests/docs ride with their change, PRs under ~400 lines.
- **Verification**: `bun run check` green (it auto-fixes — review the diff) and
  affected e2e passing before closing a task.

## What this app does

Agency (tenant) flow after the pivot:
1. Product catalog, orders, customers, and USDC payment links (dashboard).
2. On order confirmation (`pending_payment → invoiced`) — pending, phase 3 —
   **draft commercial invoice + packing list** will be created in
   `commercial_docs`, editable (HS code, Incoterm, origin, weight, packages).
3. The **buyer pays USDC directly to the seller's wallet** (`PaymentPage` /
   `PayWithWallet`). The platform never custodies funds.
4. Design intent, pending phases 4–5: with `orders.status='paid'` (merchant via
   `markChargePaid` or edge fn `verify-payment`) the docs are released
   idempotently (`draft → released`) and exported as PDF/CSV. Not built yet —
   today no `commercial_docs` usage exists in `src/store/` or `src/components/`.

Hard guardrails (specs CD/DRG/PA): buyer→seller direct, no custody or
passthrough; documents are **commercial, not customs**, with a disclaimer on
every render; release only on `orders.status='paid'` (never partial); own
numbering `next_commercial_doc_number()` (`CD-00001`) — `next_invoice_number()`
is fiscal-only and must not be touched.

## Current state (2026-10-18)

> Build state is inventoried in both AGENTS.md and `arc-studio-plans/PLAN.md` —
> update both in the same change; when they disagree, `openspec/` wins.

Built (verified in git):
- Migration `docs/migrations/006_commercial_docs.sql`: `commercial_docs` table,
  RPCs `attribute_signup`/`partner_panel_stats`, product columns, RLS
  `commercial_doc_*` policies following the `member_tenant_isolation` pattern
  defined in migration 001 (tenant_members). Applied by an operator in the SQL
  Editor (no CI). Verify with `select to_regclass('public.commercial_docs');`
  — if null, apply `006_commercial_docs.sql` top-to-bottom manually. The table alone cannot detect a partial run — also require non-null from
  `select to_regprocedure('public.next_commercial_doc_number()'), to_regprocedure('public.attribute_signup(uuid)'), to_regprocedure('public.partner_panel_stats()');`.
  **Not idempotent** (CREATE TYPE/TABLE/POLICY lack IF NOT EXISTS) — before retrying a partial run, drop
  in this order: `DROP TABLE public.commercial_docs;` then `DROP TYPE commercial_doc_status,
  commercial_doc_type;` — the policies, index, and trigger go with the table. Both `002_*` files apply in any order after `001`.
- `src/modules/commercial-docs/`: interface + factory + CSV serializer
  (`csv.ts`, `factory.toCSV`); HTML renderers are stubs. The export wiring and
  its `status==='released'` guard are still pending.
- i18n single-locale EN (`src/i18n/{en.ts,t.ts}`, ~400 keys, 15 namespaces).
- English landing (SWIFT→USDC, luxe-dark) + complete app-shell EN sweep
  (phases 7a/7b).
- Supabase connected: `src/lib/supabase.ts` (typed, throws without env vars),
  `database.types.ts`, 4 edge functions, `access_requests` (005).
- Payments: `USDCArcProvider` (PaymentRouter + atomic in-app deposit),
  non-custodial SDK, Privy embedded wallets (merchant), wagmi/ConnectKit (buyer).
- Contracts (`contracts/`: Foundry PaymentRouter + OrderVault, CREATE2) + Playwright e2e 01–04, 09 (`e2e/`).

Pending (phases 3–6 and 7.4 of `tasks.md`): draft generation in the store +
`CommercialDocsView.tsx`; real PDF/CSV export with the `status==='released'`
guard; release gate in `markChargePaid` + `verify-payment`; partner (`?ref=` in
AuthPage + `PartnerPanel.tsx`). e2e `05`–`08` not written. xlsx, own backend,
and mainnet: out of scope.

Not production: Alpha invitation-only (`tenant.is_approved=false` → approval
screen; signup via `VITE_SHOW_REGISTER=true`).

## Tech stack

- Bun, Vite 6, React 18, TypeScript ~7.0, Tailwind 3 (tokens: `DESIGN.md`),
  Sonner, framer-motion, lucide-react, oxlint type-aware (`bun run check` — runs
  with `--fix`, so it rewrites files; review the diff)
- Supabase (Postgres + RLS + Auth + Edge Functions); migrations in
  `docs/migrations/` — SEVEN files with a duplicated `002_` prefix
  (`002_atomic_invoice_number.sql` and `002_country_onboarding.sql`), so the
  numbering is not a clean 001–006; edge fns in `supabase/functions/`
  (verify-payment, check-payment, circle-wallet, register-payout-address)
- Web3: wagmi v2 + viem v2 + ConnectKit (buyer); Privy embedded wallets
  (merchant, Privy-first, `VITE_PRIVY_APP_ID`); Circle SDKs (legacy)
- `src/onchain-facts.ts` and `src/onchain-money.ts` are GENERATED by Arc
  Studio: never edit them.
- Contracts: Foundry (PaymentRouter + OrderVault, CREATE2); no test framework — checks:
  `bun scripts/test-commercial-docs.ts` (offline, reliable) and `bun scripts/test-modules.ts` (live Arc
  RPC, may broadcast a testnet `createOrder`, stale exit code — see `GOOD_PRACTICES.md`); Playwright for e2e (`e2e/`); `forge test`

## Key structure

```
src/
  App.tsx                   # ?amount= + (?vault= or ?to=) → PaymentPage; else auth/dashboard
  i18n/                     # en.ts (catalog) + pure t() — single locale 'en'
  store/                    # Dashboard store (Supabase = source of truth)
  lib/                      # supabase.ts, database.types.ts, currency.ts
  modules/
    commercial-docs/        # interface, factory, csv, renderers/ (stubs)
    invoicing/              # interface, factory, engines/venezuela.ts (fiscal)
    payments/               # interface, factory, providers/usdc-arc.ts
    shared/types.ts         # Order, Tenant, Product, OrderLine, CountryCode
  components/
    LandingPage.tsx, AuthPage.tsx, AccessRequestForm.tsx, PendingApproval.tsx
    PaymentPage.tsx, PayWithWallet.tsx   # Buyer surface (luxe-dark)
    dashboard/              # Shell, Orders/Catalog/Customers/Charges/Settings
  sdk/                      # createPayStyleSDK (non-custodial; init() = legacy Circle)
  wallet/                   # Privy: config, PrivyWalletProvider, MerchantWalletContext
  onchain-facts.ts          # GENERATED — chains/USDC (do not edit)
  onchain-money.ts          # GENERATED — USDC decimal math (do not edit)

docs/migrations/            # 001–006 SQL (seven files, duplicate 002_), applied by an operator
supabase/functions/         # 4 edge functions
contracts/                  # PaymentRouter.sol + Foundry tests
openspec/changes/import-export-pivot/   # Source of truth for the pivot
e2e/                        # 01, 02, 03, 04, 09 (+ helpers)
```

Legacy notation: some comments still say "PayStyle" and `package.json` is named
`studio-app`.

## Onchain (verified only)

- Arc Testnet, chainId `5042002`; USDC ERC-20 `0x3600000000000000000000000000000000000000` (6 decimals). On Arc the
  gas token is ALSO USDC but at 18 decimals — mixing them up is a 10^12 error (`onchain-money.ts`).
- PaymentRouter deployed: `0x83DF8E097F2f8A5e19a291eb45FEff3A69bBF802` (Arc Testnet, redeployed Oct-2026: the
  per-order **OrderVault** contract gained `deposit`/`depositWithPermit` — those functions live on OrderVault, not
  on PaymentRouter — and `usdcToken` was fixed, since it pointed at Ethereum mainnet USDC). Fees:
  platformFeeBps 100 (1%), devFeeBps 50 (0.5%) — constants in `usdc-arc.ts`.
- Do not trust: `contracts/contract-metadata/PaymentRouter.json` (old deploy `0xb3a5646f…d29b`) nor the header of
  `contracts/PaymentRouter-design.md` ("Vendify", chain ID 2818). Treasury/owner of the redeploy: verify.

## Product decisions

| Decision | Value |
|---|---|
| Market | Import/export agencies; Argentina LIVE, VE·MX·CO·CL "coming soon" |
| Custody | Non-custodial: buyer → seller direct; the platform never signs or holds buyer/seller funds (the router owner key only signs order/vault transactions — see `VITE_ROUTER_OWNER_KEY`) |
| WhatsApp | Removed (it was part of the old Vendify proposal) |
| i18n | Single locale `en`, own `t()` catalog; exception: fiscal HTML of `venezuela.ts` in Spanish |
| Commercial docs | Own `commercial_docs` table, numbering separate from the fiscal one |
| Fiscal | `invoicing`/VenezuelaEngine untouched (IVA 16%, IGTF 3%, RIF); AR/MX out of scope |
| Partner | `?ref=` → `tenant_members.attributed_partner_tenant_id`; fee % `tenants.partner_fee_bps` (default 100 bps, UI pending) |
| Onboarding | Whitelist: signup creates tenant `is_approved=false`; `access_requests` (005); `VITE_SHOW_REGISTER` |
| Backend | No own backend; server logic = edge functions (service_role) |
| Multi-tenant | RLS `member_tenant_isolation`; `tenant_id` on every tenant-scoped table — exceptions: `tenants` (keyed by `owner_id`), pre-auth `access_requests` (005), `order_lines` (scoped via its parent order) |

## How to run it

```bash
bun install && bun run dev    # vite — requires VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (VITE_PRIVY_APP_ID optional)
bun run check                 # oxlint type-aware + tsc --noEmit — lint runs with --fix and REWRITES files; review the diff
bun run build && bun run lint # tsc + vite build; oxlint (lint also runs with --fix)
bun run contracts:build && bun run contracts:test   # forge
bunx playwright test e2e/                            # e2e (no npm script)
```

Additional env vars (full template: `.env.example`):
- `VITE_ROUTER_OWNER_KEY` — the **router owner's private key**, held client-side; it signs on-chain owner txs:
  `createOrder` requires `signer == owner()` (`contracts/PaymentRouter.sol:97`); `#deployVault` sends txs from
  that account (`usdc-arc.ts:8,156-161,341,387-393`). `VITE_*` is inlined into the public JS bundle →
  testnet/PoC only: NEVER a key holding real value and NEVER on mainnet; the testnet key needs only a dust
  Arc-USDC gas balance for `createOrder`, a client-sent state-changing tx with no paymaster, and Arc's gas
  token IS USDC (18 decimals — see Onchain). Production signing belongs in an edge function. Three paths in
  `createCharge` (`usdc-arc.ts:246-274`): a valid key → vault deployed via `#deployVault`; absent =
  unset/empty only (`ownerPrivateKey.length <= 2`, `:246`) → address only predicted (`computeVaultAddress`); a
  longer invalid-hex value takes the deploy branch, throws in `privateKeyToAccount` (`:341`), and lands on the
  fallback. Deploy throw (`:246-252`, `console.warn` at `:251`) and predict RPC failure (`:253-265`, empty
  catch `:262-264`, no log) both fall back to a direct `?to=<merchant>` transfer bypassing the vault, the
  router, and all fee accounting (`:267-274`) — detect it as `to=` vs `vault=` in the payment URL / network
  tab. Keyless mode is not a working payment mode: `?vault=` would point at a contract that does not exist yet
  (`PaymentPage.tsx:90-96`, `hasVault = isAddress` is syntactic), so a buyer's `depositWithPermit` to a
  code-less address executes as an EVM no-op that REPORTS SUCCESS while no USDC moves — keep a testnet key
  (dust gas) or expect deposits that report success without moving funds.
- `VITE_WALLETCONNECT_PROJECT_ID` — falls back to a dev placeholder (`src/config.ts`).

## Hard rules for agents

1. **Fiscal numbering untouchable**: `next_invoice_number()`, `invoices`, and
   `engines/venezuela.ts` (its Spanish HTML is legal printable output, not UI)
   stay intact; commercial docs use `next_commercial_doc_number()`.
2. **`factory.ts` is the sole import point for concrete implementations**
   (payments, invoicing, commercial-docs); never import providers/renderers
   from UI or store.
3. **Multi-tenant RLS**: `member_tenant_isolation` (scope via
   `tenants.owner_id = auth.uid()`); never relax RLS or read the same table
   inside a `USING` clause (infinite recursion).
4. **i18n**: new UI in English via `t()`; never hardcode strings; renaming keys
   requires migrating consumers (grep first). One stem per concept; errors are
   `<ns>.error.<verb>`.
5. **No custody**: never platform wallets, passthroughs, or structures that
   hold USDC (PA-R5).
6. **UI**: follow `DESIGN.md` (luxe-dark only inside `.luxe-landing`; dashboard
   in light theme).
7. **Never expose `tenant_id` in public URLs** — payment links carry an opaque
   charge id (`chargeId`, see `usdc-arc.ts:277`).
8. **`payments.raw_event` must never be exposed to the frontend.**
9. **Secrets never in the database**: private keys, entity secrets, and API keys live only in env vars,
   secret managers, and edge-function secrets — never in Postgres tables.
10. Before closing a task: `bun run check` green and affected e2e passing
    (docs-only changes state `N/A`) — details in `GOOD_PRACTICES.md`.
