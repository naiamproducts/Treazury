# Proposal: Import/Export Pivot — USDC Settlement + Commercial Docs

## Intent

Serve **import/export agencies** as the crypto alternative to SWIFT for settling client
trade cross-border. SWIFT: 2–5 days, fees+spreads+intermediaries, low visibility. USDC:
minutes, self-custody, traceable.

## Scope

**In**: order → draft commercial invoice + packing list; editable HS code, Incoterm,
origin, buyer/seller, weight, packages; PDF (primary) + CSV; payment↔document binding
released on `orders.status='paid'`; partner system (signup attribution, visible fee,
agency panel volume+commission); single-locale `en` i18n; English SWIFT landing.

**Out**: customs brokerage, SIM integration, tariff/tax calculation, bills of lading,
deep KYC/AML.

## Capabilities

New: `commercial-documents`, `document-release-gate`, `partner-attribution`, `web-i18n-en`,
`swift-alternative-landing`. Modified: None.

## Guardrails

- Buyer pays seller directly; no agency passthrough/custody or agency-as-intermediary.
- Agency = tenant; no cross-tenant RLS redesign.
- Documents commercial, not customs; disclaimer on every document.
- Release gated idempotently on `orders.status='paid'`.
- Separate numbering; `next_invoice_number()` fiscal-only.

## Approach

Explore **Approach 2**: separate `commercial_docs`; fiscal `invoices`/VE engine/numbering
untouched. New `src/modules/commercial-docs/`; idempotent gates at `markChargePaid` +
`verify-payment`. Attribution on `tenant_members`. Client-side PDF/print + CSV; xlsx deferred.

**First slice**: table + draft gen → editable fields → PDF → paid gate → attribution +
panel → EN landing + i18n.

## Data/Schema Deltas (additive)

- New `commercial_docs` (tenant_id, order_id, doc_type, own sequence, status, jsonb snapshot, pdf_path) + `next_commercial_doc_number()`.
- `products`: nullable `hs_code`, `country_of_origin`, `weight_kg`, `packages`; `tenant_members`: nullable `attributed_partner_tenant_id`.
- Existing tenant RLS; no cross-tenant access.

## Affected Areas

|Area|Impact|Description|
|---|---|---|
|`supabase/migrations/*`|New|commercial_docs, sequence|
|`src/modules/commercial-docs/`|New|Renderer, PDF/CSV|
|`src/store/index.ts`|Modified|Draft gen; `markChargePaid` gate|
|`verify-payment` edge fn|Modified|Idempotent release|
|`src/components/dashboard/*`|Modified|Doc editor, agency panel|
|`LandingPage.tsx`, `index.html`|Modified|English landing copy|

## Risks

|Risk|Likelihood|Mitigation|
|---|---|---|
|Fiscal numbering corruption|Low|Separate table + sequence|
|Non-idempotent release|Med|Unique order+doc constraint|
|VE assumptions misfire|Med|Bypass fiscal engine|
|Spanish strings (~120–150)|High|Landing first, then app|

## Assumptions

1. PDF primary, CSV secondary; xlsx deferred.
2. Separate `commercial_docs`, not invoices extension.
3. New commercial renderer; no fiscal engine change.
4. Partner fee = % of settled volume.
5. Incoterm at header; HS/origin/weight at line.
6. Weight per line (net/gross)+packages, totalled.
7. Disclaimer: "Commercial document. Not a customs declaration or transport document. Customs clearance requires a licensed broker."
8. i18n: landing first, then app shell.
9. `pdf_url/xml_url` stay fiscal; commercial uses `pdf_path`.

## Rollback Plan

Additive migrations → drop new table/columns/sequence; revert gate hooks and UI. Fiscal
path untouched; i18n layer stays.

## Dependencies

Existing Supabase, wagmi/viem USDC flow, Circle SDKs. Optional PDF/CSV library if
client-side insufficient.

## Success Criteria

- [ ] Agency drafts/edits invoice + packing list from a paid order; exports PDF.
- [ ] Docs unavailable before `orders.status='paid'`; release idempotent.
- [ ] Agency sees attributed signups, fee, volume, commission.
- [ ] No Spanish copy; landing tells SWIFT→USDC story.
- [ ] `bun run check` passes; fiscal sequence unmodified.
