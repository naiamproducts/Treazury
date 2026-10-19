# Treazury

> Plataforma de settlement en USDC + documentación comercial para agencias de
> import/export — "The crypto alternative to SWIFT". Alpha invitation-only.
> Copy canónico (`src/i18n/en.ts`, `index.html`): "Settle cross-border trade for your
> clients, in USDC — without SWIFT."

Fuente de verdad del producto: `openspec/changes/import-export-pivot/` (proposal,
design, tasks, specs). `openspec/specs/` vacío. `docs/*.md` pre-pivot (2026-10-10): desactualizados.

## Qué hace esta app

Flujo de la agencia (tenant) post-pivot:
1. Catálogo de productos, órdenes, clientes y links de pago USDC (dashboard).
2. Al confirmar la orden (`pending_payment → invoiced`) se generarán (pendiente, fase 3)
   borradores de **factura comercial + packing list** en `commercial_docs`, editables
   (HS code, Incoterm, origen, peso, bultos).
3. El **comprador paga USDC directo a la wallet del vendedor** (`PaymentPage`/
   `PayWithWallet`). La plataforma nunca custodia fondos.
4. Con `orders.status='paid'` (merchant en `markChargePaid` o edge fn `verify-payment`)
   los docs se liberan idempotentemente (`draft → released`) y se exportan PDF/CSV.

Guardrails duros (specs CD/DRG/PA): buyer→seller directo, sin custodia ni passthrough;
documentos **comerciales, no aduaneros** con disclaimer en cada render; release solo en
`orders.status='paid'` (parciales nunca); numeración propia `next_commercial_doc_number()`
(`CD-00001`) — `next_invoice_number()` es fiscal-only y no se toca.

## Estado actual (2026-10-18)

Construido (verificado en git):
- Migración `docs/migrations/006_commercial_docs.sql`: tabla `commercial_docs`, RPCs
  `attribute_signup`/`partner_panel_stats`, columnas de producto, RLS
  `member_tenant_isolation`. Aplicada por operador en el SQL Editor (no hay CI).
- `src/modules/commercial-docs/`: interface + factory + csv (renderers HTML = stubs).
- i18n single-locale EN (`src/i18n/{en.ts,t.ts}`, ~400 keys, 15 namespaces).
- Landing EN (SWIFT→USDC, luxe-dark) + app-shell EN sweep completo (fases 7a/7b).
- Supabase conectado: `src/lib/supabase.ts` (tipado, lanza sin env vars),
  `database.types.ts`, 4 edge functions, `access_requests` (005).
- Pagos: `USDCArcProvider` (PaymentRouter + depósito atómico in-app), SDK no-custodial,
  Privy embedded wallets, comprador wagmi/ConnectKit.

Pendiente (fases 3–6 y 7.4 de `tasks.md`): draft gen en store + `CommercialDocsView.tsx`;
export PDF/CSV real con guard `status==='released'`; release gate en `markChargePaid` +
`verify-payment`; partner (`?ref=` en AuthPage + `PartnerPanel.tsx`). e2e `05`–`08` sin
escribir. xlsx, backend propio y mainnet: fuera de alcance.

No es producción: Alpha invitation-only (`tenant.is_approved=false` → pantalla de
aprobación; registro vía `VITE_SHOW_REGISTER=true`).

## Tech stack

- Bun, Vite 6, React 18, TypeScript ~7.0, Tailwind 3 (tokens: `DESIGN.md`), Sonner,
  framer-motion, lucide-react, oxlint type-aware (`bun run check`)
- Supabase (Postgres + RLS + Auth + Edge Functions); migrations en `docs/migrations/`
  (001–006); edge fns en `supabase/functions/` (verify-payment, check-payment,
  circle-wallet, register-payout-address)
- Web3: wagmi v2 + viem v2 + ConnectKit (comprador); Privy embedded wallets (merchant,
  Privy-first, `VITE_PRIVY_APP_ID`); Circle SDKs (legacy)
- `src/onchain-facts.ts` y `src/onchain-money.ts` GENERADOS por Arc Studio: no editar.
- Contratos: Foundry (PaymentRouter + OrderVault, CREATE2); Playwright e2e (`e2e/`,
  sin unit runner); `forge test`

## Estructura clave

```
src/
  App.tsx                   # ?vault=/&amount= → PaymentPage; si no, auth/dashboard
  i18n/                     # en.ts (catálogo) + t() pura — single locale 'en'
  store/                    # Dashboard store (Supabase = fuente de verdad)
  lib/                      # supabase.ts, database.types.ts, currency.ts
  modules/
    commercial-docs/        # interface, factory, csv, renderers/ (stubs)
    invoicing/              # interface, factory, engines/venezuela.ts (fiscal)
    payments/               # interface, factory, providers/usdc-arc.ts
    shared/types.ts         # Order, Tenant, Product, OrderLine, CountryCode
  components/
    LandingPage.tsx, AuthPage.tsx, AccessRequestForm.tsx, PendingApproval.tsx
    PaymentPage.tsx, PayWithWallet.tsx   # Superficie del comprador (luxe-dark)
    dashboard/              # Shell, Orders/Catalog/Customers/Charges/Settings
  sdk/                      # createPayStyleSDK (no-custodial; init() = legacy Circle)
  wallet/                   # Privy: config, PrivyWalletProvider, MerchantWalletContext
  onchain-facts.ts          # GENERADO — chains/USDC (no editar)
  onchain-money.ts          # GENERADO — decimal math USDC (no editar)

docs/migrations/            # 001–006 SQL aplicadas por operador
supabase/functions/         # 4 edge functions
contracts/                  # PaymentRouter.sol + tests Foundry
openspec/changes/import-export-pivot/   # Fuente de verdad del pivot
e2e/                        # 01, 02, 03, 04, 09 (+ helpers)
```

Notación legacy: comentarios aún dicen "PayStyle" y `package.json` se llama `studio-app`.

## Onchain (solo lo verificado)

- Arc Testnet, chainId `5042002`; USDC ERC-20 `0x3600000000000000000000000000000000000000` (6 decimals). En Arc el
  gas token TAMBIÉN es USDC pero a 18 decimals — mezclarlos es un error 10^12 (`onchain-money.ts`).
- PaymentRouter desplegado: `0x83DF8E097F2f8A5e19a291eb45FEff3A69bBF802` (Arc Testnet, redeploy Oct-2026: agrega
  `deposit`/`depositWithPermit` y corrige `usdcToken`, que apuntaba al USDC de Ethereum mainnet). Fees:
  platformFeeBps 100 (1%), devFeeBps 50 (0.5%) — constantes en `usdc-arc.ts`.
- No confiar: `contracts/contract-metadata/PaymentRouter.json` (deploy viejo `0xb3a5646f…d29b`) ni el header de
  `contracts/PaymentRouter-design.md` ("Vendify", chain ID 2818). Treasury/owner del redeploy: verificar.

## Decisiones de producto

| Decisión | Valor |
|---|---|
| Mercado | Agencias de import/export; Argentina LIVE, VE·MX·CO·CL "coming soon" |
| Custody | Non-custodial: buyer → seller directo; la plataforma nunca firma ni retiene |
| WhatsApp | Eliminado (era la propuesta Vendify vieja) |
| i18n | Single locale `en`, catálogo propio `t()`; excepción: HTML fiscal de `venezuela.ts` en español |
| Docs comerciales | Tabla propia `commercial_docs`, numeración separada del fiscal |
| Fiscal | `invoicing`/VenezuelaEngine intacto (IVA 16%, IGTF 3%, RIF); AR/MX fuera |
| Partner | `?ref=` → `tenant_members.attributed_partner_tenant_id`; fee % `tenants.partner_fee_bps` (default 100 bps, UI pendiente) |
| Onboarding | Whitelist: signup crea tenant `is_approved=false`; `access_requests` (005); `VITE_SHOW_REGISTER` |
| Backend | Sin backend propio; lógica server = edge functions (service_role) |
| Multi-tenant | RLS `member_tenant_isolation`; `tenant_id` en todas las tablas |

## Para correrlo

```bash
bun install && bun run dev    # vite — exige VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (VITE_PRIVY_APP_ID opcional)
bun run check                 # oxlint type-aware + tsc --noEmit
bun run build && bun run lint # tsc + vite build; oxlint
bun run contracts:build && bun run contracts:test   # forge
bunx playwright test e2e/                            # e2e (sin script npm)
```

## Reglas duras para agentes

1. **Numeración fiscal intocable**: `next_invoice_number()`, `invoices` y `engines/venezuela.ts` (su HTML en
   español es salida legal imprimible, no UI) quedan intactos; los docs comerciales usan `next_commercial_doc_number()`.
2. **`factory.ts` es el único punto de import de implementaciones concretas** (payments, invoicing,
   commercial-docs); nunca importar providers/renderers desde UI o store.
3. **RLS multi-tenant**: `member_tenant_isolation` (scope por `tenants.owner_id = auth.uid()`); jamás relajar
   RLS ni leer la propia tabla dentro de un `USING` (recursión infinita).
4. **i18n**: UI nueva en inglés vía `t()`; no hardcodear strings; renombrar keys exige migrar consumidores
   (grep antes). Un stem por concepto; errores `<ns>.error.<verb>`.
5. **No custodia**: nunca billeteras de plataforma, passthrough ni estructuras que retengan USDC (PA-R5).
6. **UI**: seguir `DESIGN.md` (luxe-dark solo dentro de `.luxe-landing`; dashboard en tema claro).
7. Antes de cerrar tarea: `bun run check` en verde y e2e afectados pasando.
