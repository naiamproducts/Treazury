/**
 * InvoiceEngine interface
 *
 * Every country's invoicing logic implements this contract.
 * The core app only calls this interface — it never imports a country engine
 * directly. Adding support for a new country = implementing this interface +
 * registering it in factory.ts.
 */

import type { Order, Tenant, CountryCode } from '../shared/types'

// ─────────────────────────────────────────────
// Tax line (one per applicable tax)
// ─────────────────────────────────────────────

export interface TaxLine {
  /** Machine key, e.g. 'IVA', 'IGTF', 'VAT', 'ISR' */
  key: string
  /** Human-readable label shown on the invoice. */
  label: string
  /** Rate as a percentage number, e.g. 16 means 16%. */
  ratePct: number
  /** Computed amount in human-readable decimal. */
  amount: string
  /**
   * When this tax applies:
   * - 'always': always on every invoice (e.g. IVA)
   * - 'forex_payment': only when payment is in foreign currency / stablecoin (e.g. IGTF)
   */
  trigger: 'always' | 'forex_payment'
}

// ─────────────────────────────────────────────
// Invoice document
// ─────────────────────────────────────────────

export interface InvoiceDocument {
  id: string
  /** Sequential number within this tenant, formatted per country rules. */
  number: string
  tenantId: string
  country: CountryCode
  orderId: string

  /** Snapshot of tenant details at invoice time. */
  issuer: {
    name: string
    taxId: string          // RIF / CUIT / RFC / NIT depending on country
    taxIdLabel: string     // "RIF" / "CUIT" / "RFC" / "NIT"
    address?: string
    phone?: string
    email?: string
  }

  /** Buyer details (may be partial for informal commerce). */
  buyer: {
    name: string
    taxId?: string
    taxIdLabel?: string
    phone?: string
    email?: string
  }

  lines: InvoiceLineItem[]

  subtotal: string           // sum of line subtotals, no taxes
  taxLines: TaxLine[]
  total: string              // subtotal + all taxes

  /** ISO 4217 or stablecoin ticker ('USD', 'USDC', 'VES', 'ARS'). */
  currency: string

  /**
   * True when payment is in a foreign currency / stablecoin.
   * Triggers forex-specific taxes (e.g. Venezuela IGTF).
   */
  isForexPayment: boolean

  /** ISO timestamp */
  issuedAt: string
  dueAt?: string

  /** Country-specific fiscal fields (CAE, UUID, timbrado, etc.) */
  fiscalData?: Record<string, string>

  notes?: string
  status: 'draft' | 'issued' | 'paid' | 'voided'
}

export interface InvoiceLineItem {
  productId?: string
  description: string
  quantity: number
  unitPrice: string
  subtotal: string
  taxable: boolean
}

// ─────────────────────────────────────────────
// Input params
// ─────────────────────────────────────────────

export interface GenerateInvoiceParams {
  order: Order
  tenant: Tenant
  buyer: InvoiceDocument['buyer']
  /** ISO 4217 or stablecoin ticker for the invoice. */
  currency: string
  /** Whether the final payment will be in a foreign currency / stablecoin. */
  isForexPayment: boolean
  /** Override next sequential number. Engine generates one if omitted. */
  invoiceNumber?: string
  notes?: string
  dueAt?: string
}

export interface ValidationResult {
  valid: boolean
  errors: { field: string; message: string }[]
  warnings: { field: string; message: string }[]
}

// ─────────────────────────────────────────────
// The interface every country engine must implement
// ─────────────────────────────────────────────

export interface InvoiceEngine {
  /** ISO 3166-1 alpha-2. Must match the key used in InvoiceEngineFactory. */
  readonly country: CountryCode

  /** Human-readable country name. */
  readonly countryName: string

  /**
   * Currencies accepted as billing currency for this country's invoices.
   * Venezuela: ['USD', 'USDC', 'VES']
   * Argentina: ['ARS', 'USD', 'USDC']
   */
  readonly supportedCurrencies: readonly string[]

  /**
   * Issuer (business) fiscal-ID metadata for this country.
   * Venezuela: label 'RIF', placeholder 'J-12345678-9'.
   * Argentina: label 'CUIT', placeholder '30-12345678-9'.
   * Mexico: label 'RFC', placeholder 'AAA010101AAA'.
   */
  readonly taxIdLabel: string
  readonly taxIdPlaceholder: string
  readonly taxIdExample: string

  /**
   * Buyer fiscal-ID metadata. Often the same document as the issuer's (VE:
   * RIF), but some countries distinguish them (AR: a buyer may identify with
   * DNI while the issuer uses CUIT), so buyer and issuer metadata stay
   * separate on purpose.
   */
  readonly buyerTaxIdLabel: string
  readonly buyerTaxIdPlaceholder: string
  readonly buyerTaxIdExample: string

  /**
   * Country-specific issuer tax-ID format check (syntax only, never a fiscal
   * lookup). Used to reject a bad ID before a fiscal number is burned.
   */
  validateTaxId(taxId: string): boolean

  /**
   * Country-specific buyer tax-ID format check (syntax only). An empty value
   * is valid — buyer identity may be partial for informal commerce — so this
   * only validates non-empty input.
   */
  validateBuyerTaxId(taxId: string): boolean

  /**
   * Build and compute a complete InvoiceDocument from an order.
   * Does NOT persist — persistence is the caller's responsibility.
   */
  generate(params: GenerateInvoiceParams): InvoiceDocument

  /**
   * Validate an invoice document before issuing.
   * Returns errors that would prevent legal issuance.
   */
  validate(doc: InvoiceDocument): ValidationResult

  /**
   * Render to PDF as a base64 string.
   * Implementations may use jsPDF, pdfmake, or a server-side library.
   */
  renderPDF(doc: InvoiceDocument): Promise<string>

  /**
   * Submit to fiscal authority, if applicable for this country.
   * Returns updated fiscalData (CAE, UUID, etc.) to merge into the document.
   * Engines for countries without mandatory e-invoicing should throw a clear
   * "not required" error rather than silently doing nothing.
   */
  submitToFiscalAuthority?(doc: InvoiceDocument): Promise<Record<string, string>>
}
