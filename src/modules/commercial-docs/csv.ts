/**
 * CSV export for commercial documents (spec CD-R4/R5).
 *
 * One header row, one row per line item, then a final single-cell row holding
 * the disclaimer (CD-R5). RFC 4180 escaping: fields containing a comma, a
 * double-quote, or a line break are wrapped in quotes with internal quotes
 * doubled.
 */

import type { CommercialDoc } from './interface'
import { COMMERCIAL_DOC_DISCLAIMER } from './interface'

const HEADER =
  'doc_number,doc_type,line,description,quantity,unit_price,subtotal,hs_code,origin,weight_net_kg,weight_gross_kg,packages,incoterm,currency'

/** Quote a field only when RFC 4180 requires it. */
function cell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** Always-quoted cell (the disclaimer row is prose, quoted unconditionally). */
function alwaysQuote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function buildCommercialCsv(doc: CommercialDoc): string {
  const rows: string[] = [HEADER]

  doc.lines.forEach((line, i) => {
    rows.push(
      [
        doc.number,
        doc.docType,
        String(i + 1),
        line.description,
        String(line.quantity),
        line.unitPrice,
        line.subtotal,
        line.hsCode ?? '',
        line.origin ?? '',
        line.weightNetKg ?? '',
        line.weightGrossKg ?? '',
        line.packages === undefined ? '' : String(line.packages),
        doc.incoterm ?? '',
        doc.currency,
      ]
        .map(cell)
        .join(','),
    )
  })

  // Final disclaimer row: a single always-quoted cell (CD-R5).
  rows.push(alwaysQuote(doc.disclaimer ?? COMMERCIAL_DOC_DISCLAIMER))
  return rows.join('\n')
}
