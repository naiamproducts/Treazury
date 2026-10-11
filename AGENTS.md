# Vendify

> Plataforma B2B multi-tenant que digitaliza el flujo de ventas mayoristas por WhatsApp:
> cotización → pedido → factura → cobro en USDC → registro.

---

## Qué hace esta app

Un proveedor mayorista (e.g. proveedor de neumáticos) usa el dashboard para crear pedidos,
generar facturas Venezuela-compatibles, y enviar links de pago USDC por WhatsApp a sus compradores.
El comprador abre el link en el móvil y paga sin instalar nada.

El sistema es multi-tenant: cada proveedor tiene su propio slug, wallet, catálogo y facturas aislados por RLS.

## Contratos desplegados

| Contrato | Red | Dirección | Explorer |
|---|---|---|---|
| PaymentRouter | Arc Testnet | `0xb3a5646f7b864dca246437b18e35d23d4535d29b` | [ver](https://explorer.testnet.arc.io/address/0xb3a5646f7b864dca246437b18e35d23d4535d29b) |

- **platformFeeBps:** 100 (1%)
- **defaultDevFeeBps:** 50 (0.5%)
- **platformTreasury / owner:** `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer)
- **Fuente:** `contracts/PaymentRouter.sol`
- **Design doc:** `contracts/PaymentRouter-design.md`

---

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Auth + DB: Supabase (Postgres + RLS + Auth + Storage + Realtime) — pendiente de conectar
- Pagos V1: Circle Developer-Controlled Wallets + USDC on Arc Testnet
- Pagos V2+: interfaz `PaymentProvider` → pluggable (Santander Pay, Mercado Pago, etc.)
- Facturación V1: módulo Venezuela (PDF SENIAT-compatible, IVA 16%, IGTF 3%)
- Facturación V2+: interfaz `InvoiceEngine` → pluggable por país (AR/MX en fase 2)
- Chain: Arc Testnet (Chain ID: 5042002)
- Token: USDC ERC-20 (6 decimals, 0x3600000000000000000000000000000000000000)
- Toasts: Sonner

## Estructura clave

```
src/
  sdk/                      # SDK público (PayLinkSDK, createCharge, etc.)
  modules/
    payments/               # Interfaz PaymentProvider + providers concretos
      types.ts
      factory.ts
      providers/usdc-arc.ts
      providers/santander-pay.ts  (stub)
    invoicing/              # Interfaz InvoiceEngine + engines por país
      types.ts
      factory.ts
      engines/venezuela.ts
      engines/argentina.ts  (stub)
      engines/mexico.ts     (stub)
    orders/                 # Tipos y service de órdenes
    catalog/                # Tipos y service de catálogo
    contacts/               # Tipos y service de contactos
  components/
    MerchantPanel.tsx       # Dashboard del proveedor (PoC, se refactorizará)
    PaymentPage.tsx         # Página del comprador (parsea URL params)
    PayWithWallet.tsx       # Flujo ConnectKit + USDC transfer
  lib/
    supabase.ts             (pendiente)
    auth.ts                 (pendiente)

docs/
  architecture.md           # Visión completa, stack, hoja de ruta
  schema.md                 # Schema Supabase completo con RLS
  modules.md                # Interfaces TypeScript de todos los módulos
```

## Decisiones de producto

| Decisión | Valor |
|---|---|
| Multi-tenant | Sí, desde el inicio. RLS en Supabase, `tenant_id` en todas las tablas |
| Whitelist | `tenant.is_approved = false` por defecto. Flag `VITE_SHOW_REGISTER` controla la landing |
| País inicial | Venezuela: IVA 16%, IGTF 3% en pagos con divisas, RIF |
| Pago inicial | USDC on Arc (directo, sin contrato intermediario) |
| Pago futuro | Interfaz `PaymentProvider` — Santander Pay, Mercado Pago, Stripe pluggables |
| Facturación | Interfaz `InvoiceEngine` — Argentina (AFIP), México (SAT/CFDI) como stubs |
| WhatsApp | Fase 2. Primero el núcleo (catálogo + factura + cobro) |
| Backend | Bun + Hono en Railway (pendiente). Por ahora todo en el frontend |

## Contratos de módulos (NO cambiar sin revisar docs/modules.md)

- `PaymentProvider`: `createCharge()`, `getStatus()`, `handleWebhook?()`
- `InvoiceEngine`: `validate()`, `generate()`, `exportPDF()`, `submitToAuthority?()`
- `factory.ts` de cada módulo es el ÚNICO lugar que importa implementaciones concretas

## Addresses desplegadas

- Ninguna por ahora (PoC sin contrato intermediario)

## Para correr

```bash
bun install
bun run dev
```

## Próximos pasos (Sprint 1)

1. Scaffoldear `src/modules/payments/` con interfaz + USDCArcProvider (refactor del SDK actual)
2. Scaffoldear `src/modules/invoicing/` con interfaz + VenezuelaEngine (PDF)
3. Conectar Supabase: crear proyecto, aplicar schema de `docs/schema.md`, configurar RLS
4. Auth flow: registro (whitelist) + login + JWT con `tenant_id` en claims
5. Dashboard básico: lista de órdenes, nueva orden, generar cobro
