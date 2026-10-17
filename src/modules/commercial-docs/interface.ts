/**
 * Commercial documents — domain types (import-export-pivot, slice 1)
 *
 * Non-fiscal export documents (commercial invoice / packing list). These are
 * intentionally NOT part of the invoicing module: fiscal isolation is a hard
 * guardrail of this change (see docs/migrations/006_commercial_docs.sql).
 */

export type CommercialDocType = 'commercial_invoice' | 'packing_list'

export type CommercialDocStatus = 'draft' | 'released' | 'voided'

/** Doc line numbers are decimal strings (money) to avoid float drift. */
export interface Party {
  name: string
  address?: string
  taxId?: string
  country?: string
}

export interface CommercialLine {
  description: string
  quantity: number
  unitPrice: string
  subtotal: string
  hsCode?: string
  origin?: string
  weightNetKg?: string
  weightGrossKg?: string
  packages?: number
}

export interface DocTotals {
  /** Always present — sum of line subtotals (2dp). */
  subtotal: string
  /** Present only when at least one line carries the field (3dp). */
  weightNetKg?: string
  weightGrossKg?: string
  /** Present only when at least one line carries the field. */
  packagesTotal?: number
}

/** In-memory shape of a commercial document (mirrors commercial_docs row). */
export interface CommercialDoc {
  id: string
  tenantId: string
  orderId: string | null
  docType: CommercialDocType
  /** Rendered number, e.g. 'CD-00001'. */
  number: string
  status: CommercialDocStatus
  currency: string
  seller: Party
  buyer: Party
  incoterm?: string
  lines: CommercialLine[]
  totals: DocTotals
  disclaimer?: string
  releasedAt?: string
}

export interface GenerateCommercialDocParams {
  tenantId: string
  orderId?: string | null
  /** Rendered number from the commercial sequence (CD-00001, ...). */
  number: string
  currency: string
  seller: Party
  buyer: Party
  incoterm?: string
  lines: CommercialLine[]
}

export interface CommercialDocRenderer {
  docType: CommercialDocType
  renderHTML(doc: CommercialDoc): string
}

/**
 * Exact disclaimer text required by spec CD-R5. Keep verbatim — tests and
 * CSV output assert on this string.
 */
export const COMMERCIAL_DOC_DISCLAIMER =
  'Commercial document. Not a customs declaration or transport document. Customs clearance requires a licensed broker.'
