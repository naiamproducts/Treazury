/**
 * PayStyle — DB row ⇄ store shape mappers.
 *
 * The dashboard model and the schema disagree in three structural ways, all
 * handled here and nowhere else:
 *
 *   1. The store nests `lines` inside `Order`; the DB has `order_lines` as a
 *      separate table.
 *   2. The store's `OrderStatus` has five values; the `order_status` enum has
 *      seven, and partial payment is not one of them.
 *   3. The store keeps `variants`/`customFields`/`fieldDefs` as first-class
 *      product fields; the DB keeps them inside one jsonb column.
 *
 * Every lossy edge is commented at the exact line it happens on.
 */

import type {
  Charge as ChargeRow,
  Contact as ContactRow,
  Order as OrderRow,
  OrderLine as OrderLineRow,
  Product as ProductRow,
  Tenant,
} from '../lib/database.types'
import type { CountryCode } from '../modules/shared/types'
import type {
  BusinessConfig,
  Customer,
  FieldDefinition,
  FieldType,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductVariant,
} from './types'

type DbOrderStatus = OrderRow['status']

// ── Scalars ────────────────────────────────────────────────────────────────

/**
 * Postgres numeric comes back as a string in supabase-js (and as a number
 * from some PostgREST versions). The UI works in strings for money, so both
 * are normalized here instead of at every call site.
 */
export function toText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function toQty(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

// ── Order status ───────────────────────────────────────────────────────────

/**
 * DB → UI.
 *
 * LOSSY, and these are the edges:
 *  - quoted    → draft     : the store has no "quoted" concept.
 *  - confirmed → draft     : confirming an order in the DB reads as a draft in
 *                             the UI, which is where the "generate payment
 *                             link" button lives (that button IS the store's
 *                             confirm step).
 *  - invoiced  → pending_payment
 *  - charged   → pending_payment : invoiced and charged are indistinguishable
 *                             in the UI, so the finer DB state is dropped on
 *                             read. It survives on `orders.status` and comes
 *                             back the moment a UI state can express it.
 *
 * 'partially_paid' is NOT produced here: `order_status` cannot express it. It
 * is synthesized in orderRowToStore from charges.status === 'partial', i.e.
 * from the charge, not from the order.
 */
export const DB_TO_STORE_ORDER_STATUS = {
  draft: 'draft',
  quoted: 'draft',
  confirmed: 'draft',
  invoiced: 'pending_payment',
  charged: 'pending_payment',
  paid: 'paid',
  cancelled: 'cancelled',
} as const satisfies Record<DbOrderStatus, OrderStatus>

/**
 * UI → DB.
 *
 * LOSSY, and these are the edges:
 *  - pending_payment → invoiced : the store cannot say whether a charge exists
 *                             yet, so writing it always records 'invoiced'.
 *                             An order the backend already advanced to
 *                             'charged' will be moved *back* to 'invoiced'
 *                             if the merchant re-saves it from the UI — the
 *                             single-active-charge rule below keeps that
 *                             harmless, but it is a real information loss.
 *  - partially_paid  → charged  : orders.status has no partial value. The truth
 *                             lives in charges.status = 'partial'; this write
 *                             only records the closest order-level state.
 */
export const STORE_TO_DB_ORDER_STATUS = {
  draft: 'draft',
  pending_payment: 'invoiced',
  partially_paid: 'charged',
  paid: 'paid',
  cancelled: 'cancelled',
} as const satisfies Record<OrderStatus, DbOrderStatus>

// ── Product attributes (jsonb) ─────────────────────────────────────────────

/** The exact jsonb shape written to products.attributes. */
export interface ProductAttributes {
  variants: ProductVariant[]
  values: Record<string, string | number | boolean>
  fieldDefs: FieldDefinition[]
}

const FIELD_TYPES: readonly FieldType[] = ['text', 'number', 'select', 'boolean']

/** LOSSY: an unrecognized type string in jsonb collapses to 'text'. */
function toFieldType(type: string): FieldType {
  return FIELD_TYPES.includes(type as FieldType) ? (type as FieldType) : 'text'
}

function asStringMap(value: unknown): Record<string, string | number | boolean> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  return value as Record<string, string | number | boolean>
}

export function readAttributes(raw: ProductRow['attributes']): ProductAttributes {
  const source = (raw ?? {}) as Partial<ProductAttributes>
  return {
    variants: Array.isArray(source.variants) ? source.variants.map(v => ({ ...v })) : [],
    values: asStringMap(source.values),
    fieldDefs: Array.isArray(source.fieldDefs)
      ? source.fieldDefs.map(f => ({ ...f, type: toFieldType(f.type) }))
      : [],
  }
}

export function writeAttributes(
  product: Pick<Product, 'variants' | 'customFields' | 'fieldDefs'>,
): ProductAttributes {
  return {
    variants: product.variants,
    values: product.customFields,
    fieldDefs: product.fieldDefs,
  }
}

/**
 * ProductAttributes → the jsonb column type.
 *
 * database.types.ts declares attributes.values as Record<string, string> while
 * the product form stores numbers and booleans there too; jsonb imposes no such
 * restriction, so the wider type is the honest one. This is the single cast
 * that reconciles the generated type with the real column.
 */
export function toRowAttributes(attributes: ProductAttributes): ProductRow['attributes'] {
  return attributes as unknown as ProductRow['attributes']
}

export function productRowToStore(row: ProductRow): Product {
  const attributes = readAttributes(row.attributes)
  const variantStock = attributes.variants.reduce((sum, v) => sum + toQty(v.stock), 0)
  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? undefined,
    description: row.description ?? undefined,
    price: toText(row.price),
    unit: row.unit,
    // products.stock is nullable: NULL means "no stock control", but the UI
    // needs a number. LOSSY: a product with stock control off and no variants
    // reads as 0, i.e. it renders as sold out.
    stock: row.stock ?? variantStock,
    imageUrl: row.image_url ?? undefined,
    variants: attributes.variants,
    customFields: attributes.values,
    fieldDefs: attributes.fieldDefs,
    createdAt: row.created_at,
  }
}

/** Store product → the insert/update columns that differ from an identity map. */
export function productToColumns(product: Partial<Product>): Partial<ProductRow> {
  const columns: Partial<ProductRow> = {}
  if (product.name !== undefined) columns.name = product.name
  if (product.sku !== undefined) columns.sku = product.sku
  if (product.description !== undefined) columns.description = product.description
  if (product.imageUrl !== undefined) columns.image_url = product.imageUrl
  if (product.price !== undefined) columns.price = product.price
  if (product.unit !== undefined) columns.unit = product.unit
  if (product.stock !== undefined) columns.stock = product.stock
  return columns
}

// ── Order lines ────────────────────────────────────────────────────────────

export function orderLineRowToStore(row: OrderLineRow): OrderLine {
  return {
    // NULL once the product is deleted (ON DELETE SET NULL): the description
    // snapshot is all that survives, and it is enough to render the line.
    productId: row.product_id ?? undefined,
    productName: row.description,
    variantLabel: row.variant_label ?? undefined,
    // variantId is intentionally absent: order_lines.variant_label is a text
    // snapshot and there is no variant_id to reconstruct an id from.
    quantity: toQty(row.quantity),
    unitPrice: toText(row.unit_price),
    unit: row.unit ?? '',
  }
}

export function orderLineToColumns(orderId: string, line: OrderLine): Partial<OrderLineRow> {
  const quantity = toQty(line.quantity)
  const unitPrice = toQty(line.unitPrice)
  return {
    order_id: orderId,
    product_id: line.productId ?? null,
    description: line.productName,
    unit: line.unit || null,
    quantity: toText(quantity),
    unit_price: toText(unitPrice),
    // line_total is a plain column with no trigger behind it, so it is
    // computed here in float arithmetic. It is a snapshot for display; the
    // authoritative money math is the invoicing engine's.
    line_total: toText(quantity * unitPrice),
    // variant_label only: order_lines has no variant_id (see migration 001),
    // so `variantId` is dropped here. Two variants of the same product with
    // the same label would become indistinguishable in history.
    variant_label: line.variantLabel ?? null,
    // tax_rate is deliberately omitted so the column default (0.16) applies.
  }
}

// ── Orders ─────────────────────────────────────────────────────────────────

/**
 * Which charge represents an order in the UI. The partial unique index
 * charges_active_order_uidx guarantees at most one pending/partial charge per
 * order, but paid and expired ones accumulate, so pick deterministically:
 * partial > pending > everything else, most recent first inside a tier.
 */
const CHARGE_STATUS_RANK: Record<ChargeRow['status'], number> = {
  partial: 0,
  pending: 1,
  paid: 2,
  expired: 3,
  failed: 4,
  cancelled: 5,
}

export function pickChargeForOrder(charges: ChargeRow[]): ChargeRow | undefined {
  if (charges.length === 0) return undefined
  return [...charges].sort((a, b) => {
    const rank = CHARGE_STATUS_RANK[a.status] - CHARGE_STATUS_RANK[b.status]
    if (rank !== 0) return rank
    return a.created_at < b.created_at ? 1 : -1
  })[0]
}

export function orderRowToStore(
  row: OrderRow,
  lines: OrderLine[],
  charge?: ChargeRow,
): Order {
  // Partial payment is a charge fact, not an order fact — see the table above.
  const status = charge?.status === 'partial'
    ? 'partially_paid'
    : DB_TO_STORE_ORDER_STATUS[row.status]
  return {
    id: row.id,
    orderNumber: row.order_number,
    buyerName: row.buyer_name ?? '',
    buyerPhone: row.buyer_phone ?? '',
    // orders.contact_id / buyer_tax_id are the durable buyer link; email and
    // address have no order columns and come from the linked contact row (see
    // generateInvoiceForOrder in ./index.ts), so they stay undefined here.
    contactId: row.contact_id ?? undefined,
    buyerTaxId: row.buyer_tax_id ?? undefined,
    lines,
    subtotal: toText(row.subtotal),
    taxAmount: toText(row.tax_amount),
    igtfAmount: toText(row.igtf_amount),
    total: toText(row.total),
    currency: row.currency,
    status,
    chargeId: charge?.id,
    paymentUrl: charge?.payment_url,
    vaultAddress: charge?.vault_address ?? undefined,
    txHash: charge?.tx_hash ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Order totals split into subtotal / IVA / IGTF. */
export function splitTotals(
  subtotal: string,
  total: string,
  applyIgtf: boolean,
): { taxAmount: string; igtfAmount: string } {
  const subtotalValue = toQty(subtotal)
  const totalValue = toQty(total)
  // Inverse of the form's math (IVA 16%, then IGTF 3% on the IVA-inclusive
  // base). Only used when the caller does not send the split itself, so the
  // dashboard can render the same numbers it showed before persistence.
  const iva = subtotalValue * 0.16
  const igtf = applyIgtf ? subtotalValue * 1.16 * 0.03 : 0
  const residual = totalValue - subtotalValue - igtf
  // Whatever the caller actually paid beyond the modelled taxes stays in the
  // IVA bucket rather than being silently dropped.
  return { taxAmount: toText(Math.max(0, iva + residual)), igtfAmount: toText(igtf) }
}

export function orderToColumns(order: Partial<Order>, applyIgtf: boolean): Partial<OrderRow> {
  const columns: Partial<OrderRow> = {}
  if (order.status !== undefined) columns.status = STORE_TO_DB_ORDER_STATUS[order.status]
  if (order.buyerName !== undefined) columns.buyer_name = order.buyerName
  if (order.buyerPhone !== undefined) columns.buyer_phone = order.buyerPhone
  // contactId is string|undefined: undefined means "untouched", a value means
  // "link". There is no unlink path from the UI (orders keep their buyer).
  if (order.contactId !== undefined) columns.contact_id = order.contactId
  // Empty tax ID becomes NULL, not '': a cleared field must read back as
  // "no tax ID", and '' would fail country format checks downstream.
  if (order.buyerTaxId !== undefined) columns.buyer_tax_id = order.buyerTaxId.trim() || null
  // buyerEmail / buyerAddress intentionally absent: orders has no columns for
  // them. They are written to the linked contact row (see resolveCustomerForOrder
  // in ./index.ts) and read back from it at invoice time.
  if (order.notes !== undefined) columns.notes = order.notes
  if (order.currency !== undefined) columns.currency = order.currency
  if (order.subtotal !== undefined) columns.subtotal = order.subtotal
  if (order.total !== undefined) columns.total = order.total
  if (order.taxAmount !== undefined || order.igtfAmount !== undefined) {
    const split = splitTotals(order.subtotal ?? '0', order.total ?? '0', applyIgtf)
    columns.tax_amount = order.taxAmount ?? split.taxAmount
    columns.igtf_amount = order.igtfAmount ?? split.igtfAmount
  }
  return columns
}

// ── Tenant / config ────────────────────────────────────────────────────────

const KNOWN_COUNTRY_CODES: readonly string[] = ['VE', 'AR', 'MX', 'CO', 'CL']

/**
 * tenants.country is free text; the UI speaks CountryCode. Unknown or empty
 * values fall back to 'VE' (the only registered engine today) rather than
 * crashing the settings form on legacy rows.
 */
export function toCountryCode(value: string | null | undefined): CountryCode {
  const normalized = (value ?? '').trim().toUpperCase()
  return (KNOWN_COUNTRY_CODES).includes(normalized)
    ? (normalized as CountryCode)
    : 'VE'
}

export function tenantRowToConfig(row: Tenant): BusinessConfig {
  return {
    name: row.business_name,
    rif: row.tax_id ?? '',
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    logoUrl: row.logo_url ?? undefined,
    merchantWallet: row.merchant_wallet_address ?? '',
    invoicePrefix: row.invoice_prefix,
    applyIgtf: row.apply_igtf,
    country: toCountryCode(row.country),
  }
}

/**
 * BusinessConfig → tenants columns.
 *
 * Empty strings become NULL, not '': the settings form round-trips the whole
 * config object, and writing '' into a nullable column would make "cleared"
 * indistinguishable from "never set" for every future reader.
 *
 * Only these columns are sent, and migration 001 column-grants exactly this
 * set on tenants (INSERT is revoked outright). slug, owner_id and
 * is_approved are deliberately never sent — the last one is the approval
 * whitelist and must stay out of the client.
 */
export function configToTenantColumns(patch: Partial<BusinessConfig>): Partial<Tenant> {
  const columns: Partial<Tenant> = {}
  if (patch.name !== undefined) columns.business_name = patch.name
  if (patch.rif !== undefined) columns.tax_id = patch.rif || null
  if (patch.address !== undefined) columns.address = patch.address || null
  if (patch.phone !== undefined) columns.phone = patch.phone || null
  if (patch.email !== undefined) columns.email = patch.email || null
  if (patch.logoUrl !== undefined) columns.logo_url = patch.logoUrl || null
  if (patch.merchantWallet !== undefined) columns.merchant_wallet_address = patch.merchantWallet || null
  if (patch.invoicePrefix !== undefined) columns.invoice_prefix = patch.invoicePrefix
  if (patch.applyIgtf !== undefined) columns.apply_igtf = patch.applyIgtf
  // `country` is inside the authenticated UPDATE grant (migration 001), so
  // the merchant can switch fiscal profile without a schema change.
  if (patch.country !== undefined) columns.country = patch.country
  return columns
}

// ── Customers (contacts) ───────────────────────────────────────────────────

/**
 * contacts row → UI Customer. The ONLY place snake_case contact columns are
 * read; nothing in the UI touches a Contact row directly.
 */
export function customerRowToStore(row: ContactRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    taxId: row.tax_id ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * UI Customer → contacts columns. Empty strings become NULL (same convention
 * as configToTenantColumns): the order form round-trips whole profiles, and
 * writing '' would make "cleared" indistinguishable from "never set".
 */
export function customerToColumns(customer: Partial<Customer>): Partial<ContactRow> {
  const columns: Partial<ContactRow> = {}
  if (customer.name !== undefined) columns.name = customer.name
  if (customer.phone !== undefined) columns.phone = customer.phone.trim() || null
  if (customer.email !== undefined) columns.email = customer.email.trim() || null
  if (customer.taxId !== undefined) columns.tax_id = customer.taxId.trim() || null
  if (customer.address !== undefined) columns.address = customer.address.trim() || null
  if (customer.notes !== undefined) columns.notes = customer.notes.trim() || null
  return columns
}

// ── Customer matching ──────────────────────────────────────────────────────

/** Collapse case/whitespace so "  Neumáticos  EL centro " matches itself. */
export function normalizeCustomerName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Digits only, so "+58 412-000 0000" matches "584120000000". */
export function normalizePhoneDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

/** Uppercase, no whitespace: "j-12345678-9" matches "J-12345678-9". */
export function normalizeTaxId(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase().replace(/\s+/g, '')
}

/** Lowercase, trimmed: emails are case-insensitive by convention. */
export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

/** The buyer snapshot the order form hands to the matcher. */
export interface CustomerSnapshot {
  name: string
  phone?: string
  email?: string
  taxId?: string
  address?: string
}

/**
 * Deterministic duplicate guard: find the saved customer that IS this buyer.
 *
 * Rules, in order:
 *  1. The normalized name must match exactly — a name miss is never a match,
 *     no fuzzy logic, no invention.
 *  2. When the snapshot carries identifiers (phone digits / tax ID / email),
 *     at least one of them must also match. Same name + no shared identifier
 *     means "different person with the same name": return undefined so the
 *     caller inserts instead of overwriting an unrelated row.
 *  3. When the snapshot carries NO identifier, match only if exactly one
 *     saved customer has that name — otherwise the match is ambiguous and the
 *     caller must insert (or let the merchant pick).
 *
 * First match in array order wins, so callers pass a stably-sorted list.
 */
export function matchCustomer(
  candidates: Customer[],
  snapshot: CustomerSnapshot,
): Customer | undefined {
  const name = normalizeCustomerName(snapshot.name)
  if (!name) return undefined
  const sameName = candidates.filter(c => normalizeCustomerName(c.name) === name)
  if (sameName.length === 0) return undefined

  const phone = normalizePhoneDigits(snapshot.phone)
  const taxId = normalizeTaxId(snapshot.taxId)
  const email = normalizeEmail(snapshot.email)
  const hasIdentifiers = phone !== '' || taxId !== '' || email !== ''

  if (!hasIdentifiers) {
    return sameName.length === 1 ? sameName[0] : undefined
  }

  return sameName.find(c => {
    const candidatePhone = normalizePhoneDigits(c.phone)
    const candidateTaxId = normalizeTaxId(c.taxId)
    const candidateEmail = normalizeEmail(c.email)
    return (phone !== '' && candidatePhone !== '' && candidatePhone === phone)
      || (taxId !== '' && candidateTaxId !== '' && candidateTaxId === taxId)
      || (email !== '' && candidateEmail !== '' && candidateEmail === email)
  })
}

// ── Order numbers ──────────────────────────────────────────────────────────

const ORDER_NUMBER_PREFIX = 'ORD-'
const ORDER_NUMBER_WIDTH = 4

/**
 * Next order number derived from the tenant's current maximum.
 *
 * Deliberately NOT next_invoice_number(): that RPC advances
 * tenants.next_invoice_number, the *fiscal* sequence that invoices draw from.
 * Using it for orders would burn invoice numbers on non-invoice rows and put
 * an invoice-sequence value on an order_number, where the unique constraint is
 * per (tenant_id, order_number) and the audit trail would no longer line up.
 *
 * Read-modify-write, so two concurrent creates can pick the same number — the
 * unique index catches that and the caller retries (see generateOrderNumber).
 */
export function nextOrderNumber(existing: string[]): string {
  let highest = 0
  for (const value of existing) {
    if (!value.startsWith(ORDER_NUMBER_PREFIX)) continue
    const suffix = Number(value.slice(ORDER_NUMBER_PREFIX.length))
    if (Number.isFinite(suffix) && suffix > highest) highest = suffix
  }
  return `${ORDER_NUMBER_PREFIX}${String(highest + 1).padStart(ORDER_NUMBER_WIDTH, '0')}`
}