# Vendify — Módulos: interfaces TypeScript

> Fuente de verdad de los contratos entre módulos.
> Ningún módulo importa implementaciones de otro: solo interfaces de este archivo.

---

## Principio de dependencia

```
orders/service.ts
  ↓ importa interfaces de:
payments/types.ts       ← nunca payments/providers/usdc-arc.ts
invoicing/types.ts      ← nunca invoicing/engines/venezuela.ts

payments/factory.ts     ← único lugar que importa implementaciones de providers
invoicing/factory.ts    ← único lugar que importa implementaciones de engines
```

---

## Módulo de Pagos (`src/modules/payments/`)

### `types.ts` — contrato público

```typescript
export type PaymentProviderKind =
  | 'usdc_arc'       // Circle dev-controlled wallets, Arc Testnet/Mainnet  [V1]
  | 'santander_pay'  // Santander Pay link API                              [V2, stub]
  | 'mercado_pago'   // Mercado Pago API                                    [V2, stub]
  | 'stripe'         // Stripe Payment Links                                [V2, stub]

export interface ChargeParams {
  orderId: string
  tenantId: string
  amount: string            // decimal string, e.g. "150.00"
  currency: 'USD'           // hoy solo USD/USDC; extender con 'VES' etc.
  recipientAddress?: string // requerido para providers onchain
  memo?: string
  expiresInMinutes?: number // default: 60
  metadata?: Record<string, string>
}

export interface ChargeResult {
  chargeId: string          // id en nuestra DB (charges.id)
  paymentUrl: string        // link enviado al comprador
  expiresAt: string         // ISO 8601
  providerRef: string       // id interno del provider (tx hash pre-generado, order id)
  provider: PaymentProviderKind
}

export interface PaymentStatusResult {
  chargeId: string
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'cancelled'
  paidAt?: string
  amount?: string
  currency?: string
  // Onchain providers
  txHash?: string
  fromAddress?: string
  blockNumber?: bigint
  chainId?: number
  // Off-chain providers
  providerTransactionId?: string
  providerRef: string
}

export interface PaymentProvider {
  readonly kind: PaymentProviderKind
  readonly displayName: string     // "USDC on Arc", "Santander Pay", etc.
  readonly supportedCurrencies: string[]
  readonly requiresRecipientAddress: boolean

  /**
   * Crea un nuevo cobro y devuelve el link de pago.
   * NO persiste en DB — eso lo hace el PaymentOrchestrator.
   */
  createCharge(params: ChargeParams): Promise<ChargeResult>

  /**
   * Consulta el estado actual de un cobro por su provider ref.
   */
  getStatus(providerRef: string): Promise<PaymentStatusResult>

  /**
   * Procesa el payload de un webhook entrante.
   * Devuelve el estado actualizado o null si el payload no es relevante.
   */
  handleWebhook?(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<PaymentStatusResult | null>

  /**
   * Genera la URL de pago sin crear un cobro en el provider.
   * Útil para providers basados en link estático (Santander Pay, etc.)
   */
  buildPaymentUrl?(params: Pick<ChargeParams, 'amount' | 'currency' | 'memo'>): string
}
```

### `factory.ts` — registro de providers

```typescript
// src/modules/payments/factory.ts

import type { PaymentProvider, PaymentProviderKind } from './types'

// Solo este archivo importa implementaciones concretas
import { USDCArcProvider } from './providers/usdc-arc'
// import { SantanderPayProvider } from './providers/santander-pay'  // descomenta en V2

type ProviderFactory = () => PaymentProvider

const _registry = new Map<PaymentProviderKind, ProviderFactory>()

_registry.set('usdc_arc', () => new USDCArcProvider())
// _registry.set('santander_pay', () => new SantanderPayProvider())

export function getProvider(kind: PaymentProviderKind): PaymentProvider {
  const factory = _registry.get(kind)
  if (!factory) {
    throw new Error(
      `Payment provider '${kind}' is not registered. ` +
      `Available: ${[..._registry.keys()].join(', ')}`
    )
  }
  return factory()
}

export function getAvailableProviders(): PaymentProviderKind[] {
  return [..._registry.keys()]
}
```

### Provider stub para Santander Pay (a implementar)

```typescript
// src/modules/payments/providers/santander-pay.ts
import type { PaymentProvider, ChargeParams, ChargeResult, PaymentStatusResult } from '../types'

export class SantanderPayProvider implements PaymentProvider {
  readonly kind = 'santander_pay' as const
  readonly displayName = 'Santander Pay'
  readonly supportedCurrencies = ['ARS', 'MXN', 'USD']
  readonly requiresRecipientAddress = false

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    // TODO: llamar a la API de Santander Pay cuando tengamos acceso
    // Ref: https://developer.santander.com/pay (documentar URL real)
    throw new Error('SantanderPayProvider not yet implemented. Waiting for API access.')
  }

  async getStatus(providerRef: string): Promise<PaymentStatusResult> {
    throw new Error('SantanderPayProvider not yet implemented.')
  }

  buildPaymentUrl(params: { amount: string; currency: string; memo?: string }): string {
    // Los links de Santander Pay tienen un formato específico por país
    // Se implementa cuando tengamos las credenciales de la API
    throw new Error('SantanderPayProvider not yet implemented.')
  }
}
```

---

## Módulo de Facturación (`src/modules/invoicing/`)

### `types.ts` — contrato público

```typescript
export type CountryCode = 'VE' | 'AR' | 'MX' | 'CO' | 'CL' | 'UY'

export interface InvoiceLine {
  productId?: string
  description: string
  quantity: number
  unit?: string             // 'unidad', 'kg', 'par', 'caja', 'litro'
  unitPrice: string         // decimal string en currency base
  taxRate: number           // 0.16 = 16% IVA
  lineTotal: string         // quantity * unitPrice (sin impuesto)
}

export interface TenantInvoiceConfig {
  businessName: string
  taxId: string             // RIF-J12345678-9 / CUIT / RFC
  address: string
  phone?: string
  email?: string
  logoUrl?: string
  country: CountryCode
  // Campos extra dependientes del país (validados por cada engine)
  fiscal?: Record<string, string>
}

export interface BuyerInfo {
  name: string
  taxId?: string            // RIF del comprador / CUIT / RFC
  address?: string
  phone?: string
  email?: string
}

export interface InvoiceParams {
  invoiceNumber: string     // F-000001 (lo genera el tenant)
  orderId: string
  issuedAt?: Date           // default: now()
  tenant: TenantInvoiceConfig
  buyer: BuyerInfo
  lines: InvoiceLine[]
  currency: string          // 'USD' | 'VES' | 'ARS' | 'MXN'
  notes?: string
  // Datos de pago (para mostrar en la factura)
  paymentInfo?: {
    method: string          // 'USDC on Arc', 'Transferencia', etc.
    reference?: string      // tx hash o número de referencia
  }
}

export interface InvoiceTotals {
  subtotal: string
  taxAmount: string
  igtfAmount?: string       // Venezuela: Impuesto a Grandes Transacciones Financieras
  total: string
  currency: string
}

export interface InvoiceDocument {
  invoiceNumber: string
  issuedAt: string          // ISO 8601
  params: InvoiceParams
  totals: InvoiceTotals
  // Resultado fiscal (solo si el engine lo soporta)
  fiscalData?: {
    authorizationCode?: string   // CAE (AR), UUID CFDI (MX)
    authorizationDate?: string
    expiresAt?: string
    xmlContent?: string          // CFDI XML (MX)
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface InvoiceEngine {
  readonly country: CountryCode
  readonly displayName: string   // "Venezuela (SENIAT)", "Argentina (AFIP)", etc.

  /**
   * Valida los parámetros antes de generar.
   * Devuelve array vacío si todo está OK.
   */
  validate(params: InvoiceParams): ValidationError[]

  /**
   * Genera el documento de factura con totales calculados.
   * No toca la DB ni APIs externas.
   */
  generate(params: InvoiceParams): Promise<InvoiceDocument>

  /**
   * Exporta el documento como PDF (Uint8Array).
   */
  exportPDF(doc: InvoiceDocument): Promise<Uint8Array>

  /**
   * Opcional: enviar a la autoridad fiscal para timbrado/autorización.
   * Solo Argentina (AFIP), México (SAT via PAC), Colombia (DIAN).
   * Venezuela no tiene obligación de factura electrónica para PYMES.
   */
  submitToAuthority?(doc: InvoiceDocument): Promise<InvoiceDocument>
}
```

### `factory.ts` — registro de engines

```typescript
// src/modules/invoicing/factory.ts

import type { InvoiceEngine, CountryCode } from './types'
import { VenezuelaInvoiceEngine } from './engines/venezuela'
// import { ArgentinaInvoiceEngine } from './engines/argentina'  // fase 2
// import { MexicoInvoiceEngine }    from './engines/mexico'     // fase 2

const _registry = new Map<CountryCode, () => InvoiceEngine>()

_registry.set('VE', () => new VenezuelaInvoiceEngine())
// _registry.set('AR', () => new ArgentinaInvoiceEngine())
// _registry.set('MX', () => new MexicoInvoiceEngine())

export function getEngine(country: CountryCode): InvoiceEngine {
  const factory = _registry.get(country)
  if (!factory) {
    throw new Error(
      `Invoice engine for country '${country}' is not registered. ` +
      `Available: ${[..._registry.keys()].join(', ')}`
    )
  }
  return factory()
}

export function getSupportedCountries(): CountryCode[] {
  return [..._registry.keys()]
}
```

---

## Módulo de Órdenes (`src/modules/orders/`)

### `types.ts`

```typescript
export type OrderStatus =
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'invoiced'
  | 'charged'
  | 'paid'
  | 'cancelled'

export interface OrderLine {
  id?: string
  productId?: string
  description: string
  quantity: number
  unit?: string
  unitPrice: string      // en USD
  taxRate: number
  lineTotal: string
}

export interface Order {
  id: string
  tenantId: string
  contactId?: string
  orderNumber: string
  status: OrderStatus
  lines: OrderLine[]
  subtotal: string
  taxAmount: string
  igtfAmount: string
  total: string
  currency: string
  notes?: string
  source: 'dashboard' | 'whatsapp' | 'api'
  createdAt: string
  updatedAt: string
  // Refs
  invoiceId?: string
  chargeId?: string
}

export interface CreateOrderParams {
  tenantId: string
  contactId?: string
  lines: Omit<OrderLine, 'id' | 'lineTotal'>[]
  notes?: string
  source?: Order['source']
}
```

---

## Módulo de Catálogo (`src/modules/catalog/`)

### `types.ts`

```typescript
export interface Product {
  id: string
  tenantId: string
  name: string
  description?: string
  sku?: string
  imageUrl?: string
  unit: string
  price: string          // en USD
  taxRate: number        // 0.16 = 16%
  currency: string
  isActive: boolean
  stock?: number
  attributes: Record<string, string>   // atributos personalizados
  createdAt: string
  updatedAt: string
}

export interface CreateProductParams {
  tenantId: string
  name: string
  price: string
  unit?: string
  description?: string
  sku?: string
  taxRate?: number
  attributes?: Record<string, string>
}
```

---

## Venezuela: especificidades fiscales

```typescript
// Incluido en el engine de Venezuela, no exportado al núcleo

interface VenezuelaFiscalConfig {
  rif: string              // J-12345678-9 o V-12345678
  numeroControl: string    // 00-000001 (correlativo interno)
  // Para retenciones
  isAgentRetencionIVA?: boolean
  isAgentRetencionISLR?: boolean
}

// Tasas vigentes (actualizar cuando SENIAT las modifique)
const VENEZUELA_TAX_RATES = {
  IVA_GENERAL: 0.16,       // 16% IVA general
  IVA_REDUCIDO: 0.08,      // 8% IVA reducido (bienes de primera necesidad)
  IVA_EXENTO: 0.00,        // 0% exento
  IGTF: 0.03,              // 3% Impuesto a Grandes Transacciones Financieras
                           // Se aplica cuando se paga en divisas (aplica a USDC)
} as const

// El IGTF aplica cuando:
// - El pago se realiza en moneda extranjera (USD, USDC, EUR, etc.)
// - El receptor está sujeto a IGTF (la mayoría de empresas)
// En la factura se muestra como línea separada: "IGTF 3%: $X.XX"
```

---

## Extensión futura: Argentina (AFIP/ARCA)

```typescript
// stub — a implementar en fase 2
interface ArgentinaFiscalConfig {
  cuit: string             // 20-12345678-9
  // Tipo de comprobante según el IVA del emisor y receptor:
  // A: emisor responsable inscripto → receptor responsable inscripto
  // B: emisor responsable inscripto → consumidor final / monotributista
  // C: emisor monotributista → cualquier receptor
  comprobanteType: 'A' | 'B' | 'C'
  puntoDeVenta: number     // 1-5 dígitos
}
// API AFIP WSFE: https://wsaahomo.afip.gov.ar/ws/services/LoginCms
// Flujo: obtener TA (ticket de acceso) → solicitar CAE → respuesta con CAE + vto
```

---

## Extensión futura: México (SAT/CFDI)

```typescript
// stub — a implementar en fase 2
interface MexicoFiscalConfig {
  rfc: string              // XAXX010101000
  regimenFiscal: string    // '601', '626', etc.
  // PAC (Proveedor Autorizado de Certificación) — elegir uno:
  // Finkok: https://facturacion.finkok.com
  // SW SAPiens: https://api.sw.com.mx
  pacProvider: 'finkok' | 'sw_sapiens'
  // Certificados del contribuyente (CSD)
  certificadoBase64?: string
  llavePemBase64?: string
}
// CFDI 4.0: XML firmado → PAC timbre → UUID + sello SAT
```
