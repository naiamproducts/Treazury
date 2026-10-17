/**
 * Commercial invoice renderer — stub.
 * Slice 4 fills the actual HTML export; slice 1 only proves the registry.
 */

import type { CommercialDocRenderer } from '../interface'

export const commercialInvoiceRenderer: CommercialDocRenderer = {
  docType: 'commercial_invoice',
  renderHTML(_doc): string {
    return ''
  },
}
