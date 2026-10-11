# Vendify — Arquitectura de Producto

> Documento vivo. Actualizar al tomar decisiones de diseño.
> Última revisión: Octubre 2026

---

## Visión del producto

Plataforma B2B multi-tenant que digitaliza el flujo completo de ventas mayoristas que hoy ocurren por WhatsApp:
cotización → pedido → factura → cobro → registro.

El proveedor opera desde un dashboard web. El comprador recibe un link y paga desde su móvil, sin instalar nada.

**Mercado inicial:** Venezuela (proveedores mayoristas, e.g. neumáticos, repuestos, alimentos)
**Canal de distribución inicial:** WhatsApp (manual primero, automatizado en fase 2)
**Medio de pago inicial:** USDC on Arc Testnet → Arc Mainnet

---

## Principios de ingeniería

1. **Módulos, no monolito.** Cada dominio (pagos, facturación, catálogo, WhatsApp) es un módulo con su propia interfaz pública. El núcleo nunca importa implementaciones concretas, solo interfaces.
2. **Reemplazabilidad.** El primer proveedor de pagos es USDC/Circle. Mañana puede ser Santander Pay, Mercado Pago, o cualquier otro. El cambio no debe tocar el dominio de Órdenes ni de Facturación.
3. **Multi-tenant desde el día uno.** Toda tabla en la DB tiene `tenant_id`. Toda query tiene RLS. Nunca se mezclan datos entre tenants.
4. **Self-service con whitelist.** El onboarding es público, pero el acceso real está controlado por un flag `is_approved` en el tenant. Una landing distinta oculta el registro hasta que se levante la whitelist.
5. **Incrustabilidad.** El módulo de facturación es pluggable por país. Agregar Colombia o México no requiere tocar el núcleo.

---

## Stack de tecnología

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + Vite + Tailwind | Ya en uso, familiaridad del equipo |
| Auth + DB | Supabase (Postgres + RLS + Auth + Storage + Realtime) | Multi-tenant con RLS, Storage para assets, Realtime para estado de pedidos |
| Backend API | Bun + Hono en Railway | Ligero, TypeScript nativo, fácil de dockerizar |
| Pagos (V1) | Circle Dev-Controlled Wallets + USDC on Arc | Sin intermediario, liquidación instantánea |
| Pagos (V2+) | Santander Pay / otros via PaymentProvider interface | Plug-in, no cambia el núcleo |
| WhatsApp (fase 2) | WhatsApp Business API en Railway | Bot Node, llama al mismo backend |
| Edge | Cloudflare Workers | Webhooks de WhatsApp, payment pages (cache público), rate limiting |
| Facturación VE | Módulo Venezuela (PDF SENIAT-compatible) | Primer país, sin API fiscal obligatoria |
| Facturación AR | Módulo Argentina (AFIP/ARCA API) | Fase 2 |
| Facturación MX | Módulo México (SAT/CFDI via PAC) | Fase 2 |

---

## Diagrama de capas

```
┌─────────────────────────────────────────────────────┐
│                     FRONTEND                         │
│   Dashboard (tenant)  │  Payment Page (comprador)    │
│   Landing / Whitelist │  Admin (interno)              │
└───────────────┬─────────────────────────────────────┘
                │ REST / Supabase client
┌───────────────▼─────────────────────────────────────┐
│                  BACKEND API (Hono/Bun)               │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Orders  │  │ Invoices │  │  PaymentOrchestrator│ │
│  └──────────┘  └──────────┘  └────────┬───────────┘ │
│  ┌──────────┐  ┌──────────┐           │              │
│  │ Contacts │  │ Products │  ┌────────▼───────────┐ │
│  └──────────┘  └──────────┘  │  PaymentProvider   │ │
│  ┌──────────────────────┐    │  (interface)        │ │
│  │  InvoiceEngine       │    ├────────────────────┤ │
│  │  (interface)         │    │ USDCProvider       │ │
│  ├──────────────────────┤    │ SantanderProvider  │ │
│  │ VenezuelaInvoice     │    │ MercadoPagoProvider│ │
│  │ ArgentinaInvoice     │    └────────────────────┘ │
│  │ MexicoInvoice        │                            │
│  └──────────────────────┘                            │
└───────────────┬─────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────┐
│                    SUPABASE                           │
│  Postgres + RLS  │  Auth  │  Storage  │  Realtime    │
└─────────────────────────────────────────────────────┘
```

---

## Multi-tenancy: modelo de datos

**Estrategia:** schema compartido + RLS (Row-Level Security). Una sola base de datos, todas las tablas tienen `tenant_id uuid NOT NULL REFERENCES tenants(id)`.

**Por qué no schema-per-tenant:** Supabase free/pro tiene límite de schemas. Schema compartido con RLS escala hasta miles de tenants en Postgres estándar.

**Política RLS estándar (se aplica a cada tabla):**

```sql
-- Leer solo los propios registros
CREATE POLICY "tenant_isolation" ON orders
  FOR ALL USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

El JWT de Supabase Auth incluye `tenant_id` en los claims custom. El backend lo valida antes de cualquier operación.

### Whitelist / self-service controlado

```sql
-- En la tabla tenants
is_approved   boolean  DEFAULT false
approved_at   timestamptz
approved_by   uuid  -- admin que aprobó
```

El frontend evalúa `tenant.is_approved` al login:
- `false` → muestra pantalla "Tu cuenta está en revisión"
- `true` → acceso al dashboard completo

Para activar self-service público: cambiar el `DEFAULT false` a `DEFAULT true`.
Para modo whitelist total: ocultar el botón de registro en la landing con `VITE_SHOW_REGISTER=false`.

---

## Módulo de Pagos: interfaz y providers

### Interface `PaymentProvider`

```typescript
// src/modules/payments/types.ts

export interface ChargeParams {
  orderId: string
  amount: string          // USDC-compatible decimal string, e.g. "150.00"
  currency: 'USDC'        // hoy solo USDC; mañana 'VES' | 'USD' | 'ARS'
  recipientAddress: string
  memo?: string
  expiresInMinutes?: number
}

export interface ChargeResult {
  chargeId: string
  paymentUrl: string       // link que se envía por WhatsApp
  expiresAt: string        // ISO timestamp
  providerRef: string      // id interno del provider (tx id, order id externo, etc.)
  provider: PaymentProviderKind
}

export interface PaymentStatus {
  chargeId: string
  status: 'pending' | 'paid' | 'expired' | 'failed'
  paidAt?: string
  txHash?: string          // solo providers onchain
  providerRef: string
}

export type PaymentProviderKind = 'usdc_arc' | 'santander_pay' | 'mercado_pago' | 'stripe'

export interface PaymentProvider {
  readonly kind: PaymentProviderKind
  createCharge(params: ChargeParams): Promise<ChargeResult>
  getStatus(chargeId: string): Promise<PaymentStatus>
  // Llamado por el webhook handler cuando el provider notifica un pago
  handleWebhook?(payload: unknown, signature: string): Promise<PaymentStatus>
}
```

### Providers concretos

```
src/modules/payments/
  types.ts                 ← interfaz pública (no importa implementaciones)
  providers/
    usdc-arc.ts            ← Circle dev-controlled wallets, Arc Testnet/Mainnet
    santander-pay.ts       ← stub con TODO, implementar cuando haya API access
    mercado-pago.ts        ← stub con TODO
  factory.ts               ← getProvider(kind): PaymentProvider
  index.ts                 ← re-export de types + factory
```

### Factory

```typescript
// src/modules/payments/factory.ts
import { USDCArcProvider } from './providers/usdc-arc'
import type { PaymentProvider, PaymentProviderKind } from './types'

const registry = new Map<PaymentProviderKind, () => PaymentProvider>()

registry.set('usdc_arc', () => new USDCArcProvider())
// registry.set('santander_pay', () => new SantanderPayProvider())

export function getProvider(kind: PaymentProviderKind): PaymentProvider {
  const factory = registry.get(kind)
  if (!factory) throw new Error(`Payment provider '${kind}' not registered`)
  return factory()
}
```

**Agregar Santander Pay en el futuro:** crear `santander-pay.ts` implementando `PaymentProvider`, registrarlo en `factory.ts`. El módulo de Órdenes no cambia ni una línea.

---

## Módulo de Facturación: interfaz y plugins de país

### Interface `InvoiceEngine`

```typescript
// src/modules/invoicing/types.ts

export interface InvoiceLine {
  description: string
  quantity: number
  unitPrice: string       // decimal string
  unit?: string           // 'unidad', 'kg', 'par', etc.
  taxRate?: number        // 0.16 para 16% IVA
}

export interface InvoiceParams {
  tenant: TenantInvoiceConfig
  buyer: BuyerInfo
  lines: InvoiceLine[]
  currency: string        // 'USD' | 'VES' | 'ARS' | 'MXN'
  notes?: string
  orderId: string
  invoiceNumber: string   // correlativo del tenant
}

export interface TenantInvoiceConfig {
  businessName: string
  taxId: string           // RIF (VE), CUIT (AR), RFC (MX)
  address: string
  logoUrl?: string
  country: CountryCode
  // Campos extra por país:
  extra?: Record<string, string>
}

export interface BuyerInfo {
  name: string
  taxId?: string
  address?: string
  phone?: string
}

export interface InvoiceDocument {
  invoiceNumber: string
  issuedAt: string
  params: InvoiceParams
  totals: {
    subtotal: string
    tax: string
    total: string
  }
  // Resultado fiscal (solo si el país requiere timbrado)
  fiscalData?: {
    authorizationCode?: string   // CAE (AR), UUID (MX), etc.
    expiresAt?: string
    xmlUrl?: string
  }
}

export type CountryCode = 'VE' | 'AR' | 'MX' | 'CO' | 'CL' | 'UY'

export interface InvoiceEngine {
  readonly country: CountryCode
  generate(params: InvoiceParams): Promise<InvoiceDocument>
  exportPDF(doc: InvoiceDocument): Promise<Uint8Array>
  // Opcional: timbrado/autorización fiscal
  submitToAuthority?(doc: InvoiceDocument): Promise<InvoiceDocument>
  validate(params: InvoiceParams): ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}
```

### Plugins de país

```
src/modules/invoicing/
  types.ts                   ← interfaz pública
  engines/
    venezuela.ts             ← PDF SENIAT-compatible, IGTF, RIF, sin API fiscal
    argentina.ts             ← AFIP/ARCA API, CAE, tipos A/B/C  [fase 2]
    mexico.ts                ← CFDI 4.0 via PAC (Finkok/SW)     [fase 2]
  pdf/
    base-template.ts         ← layout PDF compartido (Uint8Array)
    venezuela-template.ts    ← campos y logo específicos VE
  factory.ts                 ← getEngine(country): InvoiceEngine
  index.ts                   ← re-export de types + factory
```

### Venezuela: especificidades

```typescript
// Campos obligatorios en facturas venezolanas (SENIAT)
interface VenezuelaTenantExtra {
  rif: string                // J-12345678-9
  numeroControl: string      // 00-000001 (pre-impreso o correlativo)
  // Para retenciones ISLR / IVA si aplica:
  isAgentRetencion?: boolean
}

// IGTF (Impuesto a Grandes Transacciones Financieras)
// Se aplica al 3% en pagos con divisas (USDC cuenta como divisa)
const IGTF_RATE = 0.03

// IVA general Venezuela
const IVA_RATE = 0.16
```

---

## Flujo completo de una venta

```
1. Proveedor recibe pedido de comprador (WhatsApp / manual en dashboard)
2. Proveedor abre dashboard → Nueva Orden → selecciona productos del catálogo
3. Sistema genera cotización con precios, cantidades, IVA, IGTF
4. Proveedor aprueba → sistema genera Factura (PDF Venezuela)
5. Proveedor genera Cobro →
     PaymentOrchestrator.createCharge(orderId, provider='usdc_arc')
     → devuelve paymentUrl
6. Proveedor copia link → lo envía por WhatsApp al comprador
7. Comprador abre link en móvil →
     PaymentPage: muestra detalle de la factura + botón pagar
     Conecta wallet → transfiere USDC → confirma
8. Circle / onchain confirma tx →
     PaymentOrchestrator.handleWebhook() → actualiza Order a PAID
     Supabase Realtime notifica al dashboard del proveedor
9. Sistema registra pago en historial del tenant
10. Proveedor puede descargar PDF de la factura pagada
```

---

## Estructura de archivos del proyecto (objetivo)

```
src/
  modules/
    payments/
      types.ts
      factory.ts
      providers/
        usdc-arc.ts
        santander-pay.ts      ← stub
    invoicing/
      types.ts
      factory.ts
      engines/
        venezuela.ts
        argentina.ts          ← stub
        mexico.ts             ← stub
      pdf/
        base-template.ts
    catalog/
      types.ts
      service.ts
    orders/
      types.ts
      service.ts
    contacts/
      types.ts
      service.ts
  components/
    MerchantPanel.tsx         ← ya existe, se refactorizará
    PaymentPage.tsx           ← ya existe, se refactorizará
    PayWithWallet.tsx         ← ya existe, se refactorizará
    dashboard/
      OrderList.tsx
      NewOrderSheet.tsx
      ChargeHistory.tsx
    invoicing/
      InvoicePreview.tsx
      InvoiceForm.tsx
    catalog/
      ProductList.tsx
      ProductForm.tsx
  sdk/                        ← SDK público (ya existe, se refactorizará)
    index.ts
    types.ts
    circle-wallet.ts
  lib/
    supabase.ts               ← cliente Supabase tipado
    auth.ts                   ← helpers de auth multi-tenant
```

---

## Hoja de ruta técnica por sprint

### Sprint 1 — Núcleo multi-tenant (próximo)
- [ ] Schema Supabase: tenants, contacts, products, orders, charges, payments
- [ ] RLS policies en todas las tablas
- [ ] Auth flow: registro (whitelist) + login + JWT con tenant_id
- [ ] Módulo de pagos: interfaz + USDCArcProvider (refactor del SDK actual)
- [ ] Módulo de facturación: interfaz + VenezuelaEngine (PDF básico)
- [ ] Dashboard: lista de órdenes, nueva orden, generar cobro

### Sprint 2 — Catálogo y factura Venezuela
- [ ] CRUD de catálogo de productos con imagen (Supabase Storage)
- [ ] Plantilla de factura Venezuela completa (RIF, IGTF, IVA, logo)
- [ ] Preview de factura antes de enviar
- [ ] Export PDF descargable

### Sprint 3 — Self-service onboarding
- [ ] Landing page pública con flag VITE_SHOW_REGISTER
- [ ] Flujo de onboarding: registro → configuración de empresa → wallet → primer cobro
- [ ] Admin view: aprobar tenants (whitelist)
- [ ] Email de bienvenida / aprobación

### Sprint 4 — WhatsApp (canal)
- [ ] WhatsApp Business API en Railway
- [ ] Recibir pedido por mensaje → crear orden automáticamente
- [ ] Enviar link de pago por WhatsApp desde dashboard (1 clic)

### Sprint 5 — Pagos alternativos
- [ ] SantanderPayProvider implementado (cuando haya API access)
- [ ] UI para que el tenant elija su proveedor de cobro
- [ ] Factura con múltiples métodos de pago posibles

---

## Decisiones arquitectónicas registradas

| Fecha | Decisión | Razón |
|---|---|---|
| Oct 2026 | Multi-tenant con RLS en Supabase, no schema-per-tenant | Escala, costo, simplicidad |
| Oct 2026 | Pagos via interfaz `PaymentProvider`, no acoplado a Circle | Reemplazabilidad (Santander Pay, MP) |
| Oct 2026 | Facturación via interfaz `InvoiceEngine`, plugins por país | Extensibilidad sin tocar el núcleo |
| Oct 2026 | Whitelist controlada por `tenant.is_approved` + flag env | Self-service con control de acceso |
| Oct 2026 | Venezuela como primer país de facturación | Mayor uso real inmediato |
| Oct 2026 | WhatsApp automático en fase 2, manual primero | Núcleo antes que canal |
| Oct 2026 | USDC/Arc como único proveedor de pago en V1 | Liquidación instantánea, fees predecibles |
