/**
 * CommercialDocFactory — registry for commercial document renderers.
 * Same pattern as InvoiceEngineFactory / PaymentProviderFactory.
 *
 * AGENTS.md rule: this file is the ONLY one that imports the concrete
 * renderers (and csv) — callers go through the factory.
 *
 * Usage:
 *   import { commercialDocFactory } from '@/modules/commercial-docs/factory'
 *
 *   const doc = commercialDocFactory.generate('commercial_invoice', params)
 *   const html = commercialDocFactory.renderHTML(doc)
 *   const csv = commercialDocFactory.toCSV(doc)
 */

import { v4 as uuidv4 } from 'uuid'

import type {
  CommercialDoc,
  CommercialDocRenderer,
  CommercialDocType,
  CommercialLine,
  DocTotals,
  GenerateCommercialDocParams,
} from './interface'
import { COMMERCIAL_DOC_DISCLAIMER } from './interface'
import { sumDecimals } from '../shared/types'
import { commercialInvoiceRenderer } from './renderers/invoice'
import { packingListRenderer } from './renderers/packing-list'
import { buildCommercialCsv } from './csv'

class CommercialDocFactory {
  private readonly registry = new Map<CommercialDocType, CommercialDocRenderer>()

  register(docType: CommercialDocType, renderer: CommercialDocRenderer): void {
    this.registry.set(docType, renderer)
  }

  get(docType: CommercialDocType): CommercialDocRenderer {
    const renderer = this.registry.get(docType)
    if (!renderer) {
      throw new Error(
        `CommercialDocRenderer for type '${docType}' is not registered. ` +
          `Available: [${[...this.registry.keys()].join(', ')}]`,
      )
    }
    return renderer
  }

  list(): CommercialDocRenderer[] {
    return [...this.registry.values()]
  }

  /** Build a draft document with computed totals and the CD-R5 disclaimer. */
  generate(docType: CommercialDocType, params: GenerateCommercialDocParams): CommercialDoc {
    return {
      id: uuidv4(),
      tenantId: params.tenantId,
      orderId: params.orderId ?? null,
      docType,
      number: params.number,
      status: 'draft',
      currency: params.currency,
      seller: params.seller,
      buyer: params.buyer,
      incoterm: params.incoterm,
      lines: params.lines,
      totals: computeTotals(params.lines),
      disclaimer: COMMERCIAL_DOC_DISCLAIMER,
    }
  }

  /** Render through the renderer registered for the doc's type. */
  renderHTML(doc: CommercialDoc): string {
    return this.get(doc.docType).renderHTML(doc)
  }

  toCSV(doc: CommercialDoc): string {
    return buildCommercialCsv(doc)
  }
}

/**
 * Totals: subtotal always (2dp); weight/package totals only when at least
 * one line provides the field (design D11).
 */
function computeTotals(lines: CommercialLine[]): DocTotals {
  const totals: DocTotals = {
    subtotal: sumDecimals(
      lines.map((l) => l.subtotal),
      2,
    ),
  }

  const netWeights = lines.flatMap((l) => (l.weightNetKg === undefined ? [] : [l.weightNetKg]))
  if (netWeights.length > 0) {
    totals.weightNetKg = sumDecimals(netWeights, 3)
  }

  const grossWeights = lines.flatMap((l) => (l.weightGrossKg === undefined ? [] : [l.weightGrossKg]))
  if (grossWeights.length > 0) {
    totals.weightGrossKg = sumDecimals(grossWeights, 3)
  }

  const packages = lines.flatMap((l) => (l.packages === undefined ? [] : [l.packages]))
  if (packages.length > 0) {
    totals.packagesTotal = packages.reduce((acc, p) => acc + p, 0)
  }

  return totals
}

export const commercialDocFactory = new CommercialDocFactory()

// Built-in renderers (registered here so callers never import them directly).
commercialDocFactory.register('commercial_invoice', commercialInvoiceRenderer)
commercialDocFactory.register('packing_list', packingListRenderer)
