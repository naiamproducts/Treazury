/**
 * VenezuelaInvoiceEngine
 *
 * Implements InvoiceEngine for Venezuela (VE).
 *
 * Fiscal context:
 *  - IVA: 16% general rate (Gaceta Oficial). Applied to taxable lines.
 *  - IGTF: 3% (Impuesto a Grandes Transacciones Financieras en divisas).
 *    Applies when payment is in USD, USDC, EUR, or any foreign currency.
 *    Base: total + IVA (i.e., applied on the IVA-inclusive subtotal).
 *    Basis: Decreto 4.963, Gaceta Oficial N° 6.687 Extraordinario (2022).
 *  - No mandatory electronic invoicing for SMEs as of 2026.
 *    PDF + paper is legally sufficient for most providers in this segment.
 *  - RIF is the tax ID (J-XXXXXXXX-X for companies, V/E/P-XXXXXXXX-X for persons).
 *
 * PDF rendering:
 *  Uses a plain-text/HTML template approach. In production, swap renderPDF
 *  to call a server-side PDF library (pdfmake, puppeteer, wkhtmltopdf).
 *  For the PoC it returns a minimal HTML string that the browser can print.
 */

import { v4 as uuidv4 } from 'uuid'
import type { InvoiceEngine, InvoiceDocument, GenerateInvoiceParams, ValidationResult, TaxLine } from '../interface'
import type { CountryCode } from '../../shared/types'
import { applyRate, sumDecimals } from '../../shared/types'

// ─────────────────────────────────────────────
// Venezuela tax constants
// ─────────────────────────────────────────────

const IVA_RATE_PCT = 16
const IGTF_RATE_PCT = 3

// ─────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────

export class VenezuelaInvoiceEngine implements InvoiceEngine {
  readonly country: CountryCode = 'VE'
  readonly countryName = 'Venezuela'
  readonly supportedCurrencies = ['USD', 'USDC', 'VES'] as const

  readonly taxIdLabel = 'RIF'
  readonly taxIdPlaceholder = 'J-12345678-9'
  readonly taxIdExample = 'J-12345678-9'

  readonly buyerTaxIdLabel = 'RIF'
  readonly buyerTaxIdPlaceholder = 'J-12345678-9'
  readonly buyerTaxIdExample = 'J-12345678-9 o V-12345678-0'

  validateTaxId(taxId: string): boolean {
    return isValidVenezuelanRIF(taxId)
  }

  validateBuyerTaxId(taxId: string): boolean {
    if (!taxId.trim()) return true
    return isValidVenezuelanRIF(taxId)
  }

  // ── generate ─────────────────────────────────────────────────────────────

  generate(params: GenerateInvoiceParams): InvoiceDocument {
    const { order, tenant, buyer, currency, isForexPayment, notes, dueAt } = params

    // ── Line items ──────────────────────────────────────────────────────────
    const lines = order.lines.map((line) => ({
      productId: line.productId,
      description: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      subtotal: line.subtotal,
      taxable: true,           // Venezuela: assume all commerce lines are taxable
    }))

    // ── Subtotal (no taxes) ─────────────────────────────────────────────────
    const subtotal = order.subtotal

    // ── IVA ─────────────────────────────────────────────────────────────────
    const ivaAmount = applyRate(subtotal, IVA_RATE_PCT)
    const subtotalPlusIva = sumDecimals([subtotal, ivaAmount])

    // ── IGTF (only on forex / USDC payments) ────────────────────────────────
    const taxLines: TaxLine[] = [
      {
        key: 'IVA',
        label: `IVA ${IVA_RATE_PCT}%`,
        ratePct: IVA_RATE_PCT,
        amount: ivaAmount,
        trigger: 'always',
      },
    ]

    if (isForexPayment) {
      const igtfAmount = applyRate(subtotalPlusIva, IGTF_RATE_PCT)
      taxLines.push({
        key: 'IGTF',
        label: `IGTF ${IGTF_RATE_PCT}% (pago en divisas)`,
        ratePct: IGTF_RATE_PCT,
        amount: igtfAmount,
        trigger: 'forex_payment',
      })
    }

    // ── Total ────────────────────────────────────────────────────────────────
    const total = sumDecimals([subtotal, ...taxLines.map((t) => t.amount)])

    // ── Invoice number ───────────────────────────────────────────────────────
    // Format: VE-{YYYYMMDD}-{short uuid}
    // In production this should come from an atomic DB sequence per tenant.
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const invoiceNumber = params.invoiceNumber ?? `VE-${dateStr}-${uuidv4().slice(0, 8).toUpperCase()}`

    return {
      id: uuidv4(),
      number: invoiceNumber,
      tenantId: tenant.id,
      country: 'VE',
      orderId: order.id,

      issuer: {
        name: tenant.name,
        taxId: tenant.taxId ?? '',
        taxIdLabel: tenant.taxIdLabel ?? 'RIF',
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
      },

      buyer: {
        name: buyer.name,
        taxId: buyer.taxId,
        taxIdLabel: buyer.taxId ? this.buyerTaxIdLabel : undefined,
        phone: buyer.phone,
        email: buyer.email,
      },

      lines,
      subtotal,
      taxLines,
      total,
      currency,
      isForexPayment,
      issuedAt: now.toISOString(),
      dueAt,
      notes,
      status: 'draft',
      fiscalData: {},
    }
  }

  // ── validate ─────────────────────────────────────────────────────────────

  validate(doc: InvoiceDocument): ValidationResult {
    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []

    if (!doc.issuer.taxId) {
      errors.push({ field: 'issuer.taxId', message: 'El RIF del emisor es obligatorio.' })
    } else if (!isValidVenezuelanRIF(doc.issuer.taxId)) {
      errors.push({ field: 'issuer.taxId', message: 'Formato de RIF inválido. Ej: J-12345678-9' })
    }

    if (!doc.buyer.name?.trim()) {
      errors.push({ field: 'buyer.name', message: 'El nombre del comprador es obligatorio.' })
    }

    if (doc.lines.length === 0) {
      errors.push({ field: 'lines', message: 'La factura debe tener al menos una línea.' })
    }

    if (parseFloat(doc.total) <= 0) {
      errors.push({ field: 'total', message: 'El total de la factura debe ser mayor a cero.' })
    }

    // IGTF warning if forex payment but IGTF line is missing
    if (doc.isForexPayment && !doc.taxLines.find((t) => t.key === 'IGTF')) {
      warnings.push({
        field: 'taxLines',
        message: 'El pago es en divisas pero no se encontró línea de IGTF. Verifique el cálculo.',
      })
    }

    if (!doc.buyer.taxId) {
      warnings.push({
        field: 'buyer.taxId',
        message: 'Sin RIF del comprador la factura no es deducible de impuestos para él.',
      })
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  // ── renderPDF ─────────────────────────────────────────────────────────────

  /**
   * PoC implementation: returns printable HTML.
   * In production: replace with a pdfmake / jsPDF / puppeteer call on the server.
   */
  renderPDF(doc: InvoiceDocument): Promise<string> {
    return Promise.resolve(this.#buildPDFHtml(doc))
  }

  #buildPDFHtml(doc: InvoiceDocument): string {
    const taxRows = doc.taxLines.map((t) =>
      `<tr><td>${t.label}</td><td style="text-align:right">${t.amount} ${doc.currency}</td></tr>`
    ).join('')

    const lineRows = doc.lines.map((l) =>
      `<tr>
        <td>${l.description}</td>
        <td style="text-align:right">${l.quantity}</td>
        <td style="text-align:right">${l.unitPrice}</td>
        <td style="text-align:right">${l.subtotal}</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${doc.number}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; max-width: 800px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 20px; } h2 { font-size: 14px; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f0f0f0; text-align: left; padding: 6px; }
    td { padding: 5px 6px; border-bottom: 1px solid #e0e0e0; }
    .total-row td { font-weight: bold; font-size: 14px; }
    .badge { background: #e8f5e9; color: #1a8047; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .igtf-note { background: #fff3e0; border-left: 4px solid #ff9800; padding: 8px; margin-top: 12px; font-size: 11px; }
  </style>
</head>
<body>
  <h1>FACTURA <span style="color:#555;font-size:16px">#${doc.number}</span></h1>
  <p style="margin:4px 0"><strong>${doc.issuer.name}</strong> &nbsp;·&nbsp; ${doc.issuer.taxIdLabel}: ${doc.issuer.taxId || '(pendiente)'}</p>
  <p style="margin:4px 0">Fecha: ${new Date(doc.issuedAt).toLocaleDateString('es-VE')}</p>

  <h2 style="margin-top:16px">Comprador</h2>
  <p style="margin:4px 0">${doc.buyer.name}${doc.buyer.taxId ? ` &nbsp;·&nbsp; RIF: ${doc.buyer.taxId}` : ''}</p>

  <table>
    <thead><tr><th>Descripción</th><th style="text-align:right">Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${lineRows}</tbody>
  </table>

  <table style="margin-top:8px">
    <tr><td>Subtotal</td><td style="text-align:right">${doc.subtotal} ${doc.currency}</td></tr>
    ${taxRows}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${doc.total} ${doc.currency}</td></tr>
  </table>

  ${doc.isForexPayment ? `
  <div class="igtf-note">
    <strong>Nota IGTF:</strong> Este comprobante incluye el Impuesto a Grandes Transacciones
    Financieras (IGTF ${IGTF_RATE_PCT}%) por pago en moneda extranjera (Gaceta Oficial N° 6.687).
  </div>` : ''}

  ${doc.notes ? `<p style="margin-top:16px;color:#555">${doc.notes}</p>` : ''}
</body>
</html>`

    // In browser: return HTML directly so caller can open a print window.
    // In server: pipe through puppeteer/wkhtmltopdf and return base64 PDF.
    return btoa(unescape(encodeURIComponent(html)))
  }

  // ── submitToFiscalAuthority ───────────────────────────────────────────────

  submitToFiscalAuthority(_doc: InvoiceDocument): Promise<Record<string, string>> {
    return Promise.reject(new Error(
      'Venezuela (VE): No se requiere timbrado electrónico obligatorio para PYMES. ' +
      'La factura en PDF es suficiente. ' +
      'Si tu negocio supera el umbral SENIAT, integra con un proveedor autorizado.',
    ))
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Validates Venezuelan RIF format.
 * Pattern: [JGVEP]-\d{8}-\d
 * Examples: J-12345678-9, V-87654321-0
 *
 * Exported so callers (e.g. the dashboard store) can reject a bad RIF before
 * reserving a fiscal number — next_invoice_number() burns a number even when
 * the invoice that follows it fails validation.
 */
export function isValidVenezuelanRIF(rif: string): boolean {
  return /^[JGVEP]-\d{8}-\d$/.test(rif.toUpperCase().trim())
}

// ─────────────────────────────────────────────
// Stubs for Argentina and Mexico (documented)
// ─────────────────────────────────────────────

/**
 * STUB: ArgentinaInvoiceEngine
 *
 * Taxes: IVA 21% (10.5% reduced for some goods), IIBB (varies by province)
 * Fiscal ID: CUIT (XX-XXXXXXXX-X)
 * Electronic invoicing: MANDATORY for Responsable Inscripto via AFIP/ARCA.
 * Invoice types: A (RI to RI), B (RI to CF), C (Monotributista)
 * CAE: Código de Autorización Electrónico, returned by AFIP web service.
 * API: https://serviciosweb.afip.gob.ar/wsfev1/ (SOAP) or via libs like afip.js
 * submitToFiscalAuthority: calls wsfe.FECAESolicitar → returns CAE + CAEFchVto
 * Key: 'AR'
 */
export const ARGENTINA_ENGINE_STUB_DOCS = null

/**
 * STUB: MexicoInvoiceEngine
 *
 * Standard: CFDI 4.0 (Comprobante Fiscal Digital por Internet)
 * Fiscal ID: RFC (AAAA######XXX for persons, AAA######XX for companies)
 * Tax: IVA 16%, ISR withholding for services
 * Timbrado: Mandatory via PAC (Proveedor Autorizado de Certificación)
 *   Recommended PACs: Finkok, SW Sapien, Edicom
 *   They sign the XML and return UUID + sello SAT
 * submitToFiscalAuthority: sends CFDI XML to PAC → returns UUID + acuse SAT
 * Key: 'MX'
 */
export const MEXICO_ENGINE_STUB_DOCS = null
