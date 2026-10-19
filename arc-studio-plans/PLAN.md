# Treazury — Current Plan

> Rewritten 2026-10-19. This replaces the Vendify-era "PayLink SDK PoC" plan
> (2026-10-10), which described the pre-pivot product and is obsolete.

## Identity

Treazury is a USDC settlement platform + commercial documentation tool for
import/export agencies — "The crypto alternative to SWIFT". Alpha,
invitation-only. Canonical copy: `src/i18n/en.ts` (landing hero keys).

## Executed context: import/export pivot

The old Vendify/WhatsApp payment-link PoC was replaced by the import/export
pivot. Source of truth for the product:
`openspec/changes/import-export-pivot/` (proposal, design, tasks, specs).
This plan only tracks build state.

## What is built (verified 2026-10-18)

> Build state is inventoried in both AGENTS.md and `arc-studio-plans/PLAN.md` —
> update both in the same change; when they disagree, `openspec/` wins.

- Commercial docs foundation: `docs/migrations/006_commercial_docs.sql`
  (`commercial_docs` table, `attribute_signup`/`partner_panel_stats` RPCs,
  product columns, `commercial_doc_*` RLS policies after the 001 pattern),
  applied manually in the SQL Editor (no CI).
- `src/modules/commercial-docs/`: interface, factory, CSV serializer
  (HTML renderers are stubs).
- Single-locale English i18n (`src/i18n/`, ~400 keys) + complete app-shell
  English sweep.
- English SWIFT→USDC landing (luxe-dark).
- Supabase wired: typed client (`src/lib/supabase.ts`), database types,
  4 edge functions, `access_requests` onboarding (005).
- Payments: `USDCArcProvider` (PaymentRouter + OrderVault deposit on Arc
  Testnet), non-custodial SDK, Privy embedded merchant wallets,
  wagmi/ConnectKit buyer flow.
- Contracts (Foundry: PaymentRouter + OrderVault) + Playwright e2e 01–04, 09.

## What is pending

Per `openspec/changes/import-export-pivot/tasks.md`:

- **Phase 3** — draft doc generation in the store + `CommercialDocsView.tsx`
  editor (e2e 05).
- **Phase 4** — PDF/CSV export with the `status==='released'` guard (e2e 06).
  The CSV serializer exists; the export wiring does not.
- **Phase 5** — idempotent release gate on `orders.status='paid'`
  (`markChargePaid` + `verify-payment`, e2e 07).
- **Phase 6** — partner attribution (`?ref=` in AuthPage) + `PartnerPanel.tsx`
  (e2e 08).
- **Phase 7.4** — final verification sweep (`bun run check`, full e2e,
  `forge test`, residual-Spanish grep).

Out of scope: xlsx export (proposal.md:36 / design.md:11); own backend
(AGENTS.md product decisions); mainnet — Arc Testnet only (AGENTS.md Onchain
section and the `VITE_ROUTER_OWNER_KEY` bullet).

## Working practices

See `GOOD_PRACTICES.md` (mandatory): English for all repo text, work-unit
commits, and verification (`bun run check` + affected e2e) before closing a
task. Product rules live in `AGENTS.md`.
