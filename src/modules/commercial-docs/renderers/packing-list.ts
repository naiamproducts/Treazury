/**
 * Packing list renderer — stub.
 * Slice 4 fills the actual HTML export; slice 1 only proves the registry.
 */

import type { CommercialDocRenderer } from '../interface'

export const packingListRenderer: CommercialDocRenderer = {
  docType: 'packing_list',
  renderHTML(_doc): string {
    return ''
  },
}
