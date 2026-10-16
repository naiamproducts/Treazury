/**
 * PayStyle — dashboard store.
 *
 * Reads and writes Supabase. Supabase is the source of truth; the React state
 * here is a cache of the last read plus the row each mutation just wrote, so a
 * mutation never renders before the database accepted it.
 *
 * Scope notes:
 *  - `isConnected` / `merchantAddress` are wagmi's business and stay local:
 *    a wallet connection is not a tenant attribute. `config.merchantWallet`
 *    IS persisted (tenants.merchant_wallet_address).
 *  - Row ⇄ store conversion lives in ./mappers.ts. This file talks snake_case.
 *  - Every mutation returns a Promise and rejects with a StoreError. RLS
 *    refuses writes from a non-approved tenant with 42501; that surfaces as a
 *    thrown StoreError the UI shows, never as a silent no-op.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Charge as ChargeRow, Contact as ContactRow, Order as OrderRow } from '../lib/database.types'
import { StoreError, asStoreError, toStoreError } from './errors'
import {
  STORE_TO_DB_ORDER_STATUS,
  configToTenantColumns,
  customerRowToStore,
  customerToColumns,
  matchCustomer,
  nextOrderNumber,
  orderLineRowToStore,
  orderLineToColumns,
  orderRowToStore,
  orderToColumns,
  pickChargeForOrder,
  productRowToStore,
  productToColumns,
  readAttributes,
  splitTotals,
  tenantRowToConfig,
  toQty,
  toRowAttributes,
  toText,
  writeAttributes,
} from './mappers'
import { invoiceFactory, VenezuelaInvoiceEngine } from '../modules/invoicing'
import type { InvoiceDocument } from '../modules/invoicing'
import type { AddOrderCustomerOptions, BusinessConfig, Customer, DashboardStore, Order, OrderLine, Product } from './types'

export type {
  AddOrderCustomerOptions,
  BusinessConfig,
  Customer,
  DashboardStore,
  FieldDefinition,
  FieldType,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  ProductVariant,
} from './types'
export { StoreError } from './errors'
export type { StoreErrorCode } from './errors'

/** Order numbers are allocated by max+1 and can collide; retry on 23505. */
const ORDER_NUMBER_ATTEMPTS = 3
/** Compare-and-swap retries for a concurrent stock adjustment. */
const STOCK_CAS_ATTEMPTS = 3

/** Register the Venezuela invoice engine on module load. */
invoiceFactory.register(new VenezuelaInvoiceEngine())

const DEFAULT_CONFIG: BusinessConfig = {
  name: 'Mi Negocio',
  rif: '',
  address: '',
  phone: '',
  email: '',
  merchantWallet: '',
  invoicePrefix: '0001',
  applyIgtf: true,
  country: 'VE',
}

// ── Reads ──────────────────────────────────────────────────────────────────

async function fetchConfig(tenantId: string): Promise<BusinessConfig> {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()
  if (error) throw toStoreError(error, 'tenants')
  return tenantRowToConfig(data)
}

async function fetchProducts(tenantId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw toStoreError(error, 'products')
  return data.map(productRowToStore)
}

async function fetchCustomers(tenantId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')
  if (error) throw toStoreError(error, 'contacts')
  return data.map(customerRowToStore)
}

/** Keep the customer list stably sorted by name after local inserts. */
function insertCustomerSorted(prev: Customer[], created: Customer): Customer[] {
  return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

async function fetchLines(orderId: string): Promise<OrderLine[]> {
  const { data, error } = await supabase
    .from('order_lines')
    .select('*')
    .eq('order_id', orderId)
  if (error) throw toStoreError(error, 'order_lines')
  return data.map(orderLineRowToStore)
}

async function fetchOrders(tenantId: string): Promise<Order[]> {
  const { data: orderRows, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
  if (orderError) throw toStoreError(orderError, 'orders')

  const ids = orderRows.map(row => row.id)
  if (ids.length === 0) return []

  // Two flat reads instead of one embedded select: order_lines has no
  // tenant_id and is reached through its parent order, and orders→charges is
  // a plain nullable FK. Embedding both would mean a wide payload whose
  // generated types this project does not declare relationships for.
  const [linesResult, chargesResult] = await Promise.all([
    supabase.from('order_lines').select('*').in('order_id', ids),
    supabase.from('charges').select('*').in('order_id', ids),
  ])
  if (linesResult.error) throw toStoreError(linesResult.error, 'order_lines')
  if (chargesResult.error) throw toStoreError(chargesResult.error, 'charges')

  const linesByOrder = new Map<string, OrderLine[]>()
  for (const row of linesResult.data) {
    const bucket = linesByOrder.get(row.order_id)
    if (bucket) bucket.push(orderLineRowToStore(row))
    else linesByOrder.set(row.order_id, [orderLineRowToStore(row)])
  }

  const chargesByOrder = new Map<string, ChargeRow[]>()
  for (const row of chargesResult.data) {
    if (!row.order_id) continue
    const bucket = chargesByOrder.get(row.order_id)
    if (bucket) bucket.push(row)
    else chargesByOrder.set(row.order_id, [row])
  }

  return orderRows.map(row =>
    orderRowToStore(
      row,
      linesByOrder.get(row.id) ?? [],
      pickChargeForOrder(chargesByOrder.get(row.id) ?? []),
    ),
  )
}

// ── Invoice ──────────────────────────────────────────────────────────────────

/**
 * Generate the fiscal invoice for an order.
 *
 * Order matters: the RIF check, the lines check and the existing-invoice
 * check all run BEFORE next_invoice_number() is called, because that RPC
 * burns a fiscal number even when the insert that follows it fails (see
 * migration 002). Validation failures and repeat updates must never consume
 * numbers.
 *
 * Returns null when the order already has a non-voided invoice for this
 * tenant — a repeat update must not produce a second invoice. Throws
 * StoreError otherwise (bad RIF, RLS refusal, …); callers report that through
 * store error state without rolling back the order write that is already
 * durable.
 */
async function generateInvoiceForOrder(
  tenantId: string,
  orderId: string,
): Promise<InvoiceDocument | null> {
  const tenantConfig = await fetchConfig(tenantId)

  // The tenant's actual registered engine drives labels, placeholders and
  // tax-ID validation — never a hardcoded country. An unregistered country
  // (legacy row, hand-edited tenants.country) refuses loudly instead of
  // invoicing under the wrong fiscal rules.
  let engine
  try {
    engine = invoiceFactory.get(tenantConfig.country)
  } catch {
    throw new StoreError('unsupported', `No hay un motor de facturación registrado para el país "${tenantConfig.country}". Elige otro país fiscal en Configuración.`)
  }

  const rif = tenantConfig.rif.trim()
  if (!rif) {
    throw new StoreError('conflict', `Configura el ${engine.taxIdLabel} del negocio antes de generar la factura.`)
  }
  if (!engine.validateTaxId(rif)) {
    throw new StoreError('conflict', `El ${engine.taxIdLabel} configurado (${tenantConfig.rif}) no tiene un formato válido. Ej: ${engine.taxIdExample}`)
  }

  const { data: alreadyInvoiced, error: existingError } = await supabase
    .from('invoices')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .neq('status', 'voided')
    .limit(1)
  if (existingError) throw toStoreError(existingError, 'invoices')
  if (alreadyInvoiced.length > 0) return null

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .single()
  if (orderError) throw toStoreError(orderError, 'orders')

  const { data: lineRows, error: linesError } = await supabase
    .from('order_lines')
    .select('*')
    .eq('order_id', orderId)
  if (linesError) throw toStoreError(linesError, 'order_lines')

  if (lineRows.length === 0) {
    throw new StoreError('conflict', 'La orden no tiene líneas para facturar.')
  }
  const subtotal = lineRows
    .reduce((sum, row) => sum + Number(row.line_total), 0)
    .toFixed(2)
  if (!(Number(subtotal) > 0)) {
    throw new StoreError('conflict', 'El total de la orden debe ser mayor que cero para facturar.')
  }

  const { data: invoiceNumber, error: rpcError } = await supabase.rpc('next_invoice_number')
  if (rpcError) throw toStoreError(rpcError, 'next_invoice_number')

  // Buyer enrichment from the linked saved-customer row. orders has no email
  // or address columns, so without this read those two would be lost on every
  // invoice even though the merchant typed them. Best-effort on purpose: a
  // contact deleted after the order still leaves the order's own snapshot
  // (buyer_name / buyer_phone / buyer_tax_id), which is enough to invoice.
  let contact: ContactRow | null = null
  if (orderRow.contact_id) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', orderRow.contact_id)
      .eq('tenant_id', tenantId)
      .single()
    if (!error) contact = data
  }
  const buyerName = orderRow.buyer_name?.trim() || contact?.name.trim() || 'Cliente'
  const buyerTaxId = orderRow.buyer_tax_id?.trim() || contact?.tax_id?.trim() || undefined
  const buyerPhone = orderRow.buyer_phone?.trim() || contact?.phone?.trim() || undefined
  const buyerEmail = contact?.email?.trim() || undefined
  const buyerAddress = contact?.address?.trim() || undefined

  const invoiceDoc = invoiceFactory.generate(tenantConfig.country, {
    order: {
      id: orderRow.id,
      tenantId: orderRow.tenant_id,
      contactRef: orderRow.contact_id ?? '',
      lines: lineRows.map(row => ({
        productId: row.product_id ?? '',
        productName: row.description,
        unitPrice: String(row.unit_price),
        quantity: Number(row.quantity),
        subtotal: String(row.line_total),
      })),
      subtotal,
      status: 'invoiced' as const,
      notes: orderRow.notes ?? undefined,
      createdAt: orderRow.created_at,
      updatedAt: orderRow.updated_at,
    },
    tenant: {
      id: tenantId,
      name: tenantConfig.name,
      walletAddress: tenantConfig.merchantWallet,
      country: tenantConfig.country,
      isApproved: true,
      createdAt: new Date().toISOString(),
      taxId: rif,
      taxIdLabel: engine.taxIdLabel,
      address: tenantConfig.address || undefined,
      phone: tenantConfig.phone || undefined,
      email: tenantConfig.email || undefined,
    },
    buyer: {
      name: buyerName,
      taxId: buyerTaxId,
      phone: buyerPhone,
      email: buyerEmail,
    },
    currency: orderRow.currency ?? 'USD',
    isForexPayment: true,
    invoiceNumber: String(invoiceNumber),
    notes: orderRow.notes ?? undefined,
  })

  // Safety net: every error path the engine can hit (empty RIF, no lines,
  // non-positive total) is pre-checked above so no number is burned. If this
  // ever fires, the number is lost by design — gaps are auditable, duplicates
  // are not (see migration 002).
  const validation = invoiceFactory.validate(tenantConfig.country, invoiceDoc)
  if (!validation.valid) {
    throw new StoreError('conflict', 'Factura inválida: ' + validation.errors.map(e => e.message).join('; '))
  }

  const { error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      invoice_number: invoiceDoc.number,
      status: 'draft',
      subtotal: invoiceDoc.subtotal,
      tax_amount: invoiceDoc.taxLines.find(t => t.key === 'IVA')?.amount ?? '0',
      igtf_amount: invoiceDoc.taxLines.find(t => t.key === 'IGTF')?.amount ?? '0',
      total: invoiceDoc.total,
      currency: invoiceDoc.currency,
      tenant_snapshot: {
        name: tenantConfig.name,
        taxId: rif,
        address: tenantConfig.address || null,
        phone: tenantConfig.phone || null,
        email: tenantConfig.email || null,
      },
      buyer_snapshot: {
        name: buyerName,
        taxId: buyerTaxId ?? null,
        phone: buyerPhone ?? null,
        email: buyerEmail ?? null,
        address: buyerAddress ?? null,
      },
      fiscal_data: invoiceDoc.fiscalData ?? {},
    })
  if (invoiceError) throw toStoreError(invoiceError, 'invoices')

  return invoiceDoc
}

// ── Stock ──────────────────────────────────────────────────────────────────

/**
 * Adjust products.stock with a compare-and-swap: the WHERE clause re-asserts
 * the value we just read, so if another writer moved stock in between this
 * update matches zero rows instead of clobbering their number. Zero rows means
 * "lost the race" — re-read and try again, then give up loudly.
 */
async function adjustStockColumn(productId: string, delta: number): Promise<Product> {
  for (let attempt = 0; attempt < STOCK_CAS_ATTEMPTS; attempt++) {
    const { data: current, error: readError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()
    if (readError) throw toStoreError(readError, 'products')

    // NULL is "no stock control", not zero. Writing a number here would switch
    // stock control on behind the merchant's back, so refuse instead.
    if (current.stock === null) {
      throw new StoreError('unsupported', 'Este producto no tiene control de stock habilitado.')
    }

    const next = current.stock + delta
    if (next < 0) {
      throw new StoreError('insufficient_stock', `Stock disponible: ${current.stock}, se intentan descontar ${Math.abs(delta)}.`)
    }

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ stock: next })
      .eq('id', productId)
      .eq('stock', current.stock)
      .select('*')
    if (updateError) throw toStoreError(updateError, 'products')

    const row = updated[0]
    if (row) return productRowToStore(row)
  }
  throw new StoreError('insufficient_stock', `El stock cambió ${STOCK_CAS_ATTEMPTS} veces seguidas; reintenta.`)
}

/**
 * Adjust one variant's stock. Variants live inside products.attributes, a
 * single jsonb column: this is a plain read-modify-write with no compare-and-
 * swap (PostgREST cannot compare a jsonb column in a filter), so two tabs
 * editing the same product's variants can lose one another's change. Closing
 * that hole needs an RPC and there is none.
 */
async function adjustVariantStock(productId: string, variantId: string, delta: number): Promise<Product> {
  const { data: current, error: readError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()
  if (readError) throw toStoreError(readError, 'products')

  const attributes = readAttributes(current.attributes)
  if (!attributes.variants.some(variant => variant.id === variantId)) {
    throw new StoreError('not_found', 'La variante ya no existe en este producto.')
  }
  const variants = attributes.variants.map(variant =>
    variant.id === variantId ? { ...variant, stock: Math.max(0, variant.stock + delta) } : variant,
  )
  // Keep products.stock as the sum of the variants, the same invariant the
  // in-memory store maintained.
  const stock = variants.reduce((sum, variant) => sum + toQty(variant.stock), 0)

  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({
      attributes: toRowAttributes(writeAttributes({
        variants,
        customFields: attributes.values,
        fieldDefs: attributes.fieldDefs,
      })),
      stock,
    })
    .eq('id', productId)
    .select('*')
    .single()
  if (updateError) throw toStoreError(updateError, 'products')
  return productRowToStore(updated)
}

/**
 * Order lines carry a variant *label*, not an id (order_lines has no
 * variant_id), so a reservation has to look the id back up. Labels are not
 * unique in the schema, so an ambiguous label resolves to the first match and
 * stock is deducted from that one.
 */
async function resolveVariantId(productId: string, variantLabel: string | undefined): Promise<string | undefined> {
  if (!variantLabel) return undefined
  const { data, error } = await supabase
    .from('products')
    .select('attributes')
    .eq('id', productId)
    .single()
  if (error) throw toStoreError(error, 'products')
  const attributes = readAttributes(data.attributes)
  return attributes.variants.find(variant => variant.label === variantLabel)?.id
}

// ── Charges ────────────────────────────────────────────────────────────────

/**
 * Create or update the order's active charge.
 *
 * charges_active_order_uidx allows at most one pending/partial charge per
 * order, so this updates the existing active charge when there is one and
 * only inserts otherwise. payment_url is NOT NULL, which is why a patch with
 * no URL cannot create a charge.
 */
async function writeChargeForOrder(
  orderId: string,
  tenantId: string,
  amount: string,
  patch: Partial<Pick<Order, 'paymentUrl' | 'vaultAddress' | 'txHash'>>,
): Promise<ChargeRow | undefined> {
  const columns: Partial<ChargeRow> = {}
  if (patch.paymentUrl !== undefined) columns.payment_url = patch.paymentUrl
  if (patch.vaultAddress !== undefined) columns.vault_address = patch.vaultAddress
  if (patch.txHash !== undefined) columns.tx_hash = patch.txHash

  const { data: active, error: activeError } = await supabase
    .from('charges')
    .select('*')
    .eq('order_id', orderId)
    .in('status', ['pending', 'partial'])
    .limit(1)
  if (activeError) throw toStoreError(activeError, 'charges')

  const existing = active[0]
  if (existing) {
    const { data, error } = await supabase
      .from('charges')
      .update(columns)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'charges')
    return data
  }

  if (patch.paymentUrl === undefined) {
    throw new StoreError('not_found', 'No hay un cobro activo para esta orden y falta el link de pago para crearlo.')
  }
  if (toQty(amount) <= 0) {
    throw new StoreError('conflict', 'El total de la orden debe ser mayor que cero para generar un cobro.')
  }

  const { data, error } = await supabase
    .from('charges')
    .insert({
      tenant_id: tenantId,
      order_id: orderId,
      amount: toText(toQty(amount)),
      payment_url: patch.paymentUrl,
      status: 'pending',
      currency: 'USD',
      ...(patch.vaultAddress ? { vault_address: patch.vaultAddress } : {}),
      ...(patch.txHash ? { tx_hash: patch.txHash } : {}),
    })
    .select('*')
    .single()

  if (!error) return data

  if (error.code === '23505') {
    // Another tab created the active charge between the select and the insert.
    // Adopt it and update instead.
    const { data: raced, error: readError } = await supabase
      .from('charges')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['pending', 'partial'])
      .limit(1)
    if (readError) throw toStoreError(readError, 'charges')
    const winner = raced[0]
    if (!winner) throw toStoreError(error, 'charges')
    const { data: updated, error: updateError } = await supabase
      .from('charges')
      .update(columns)
      .eq('id', winner.id)
      .select('*')
      .single()
    if (updateError) throw toStoreError(updateError, 'charges')
    return updated
  }

  throw toStoreError(error, 'charges')
}

// ── Customers ────────────────────────────────────────────────────────────

/** Buyer fields the order form carries into the customer step. */
interface BuyerSnapshotInput {
  contactId?: string
  buyerName: string
  buyerPhone?: string
  buyerTaxId?: string
  buyerEmail?: string
  buyerAddress?: string
}

/**
 * Non-empty form values that differ from the stored row. Empty form fields
 * never blank stored data: a merchant editing only the phone must not wipe
 * the tax ID they typed last month.
 */
function customerPatchForSnapshot(
  current: Customer | undefined,
  snapshot: { name: string; phone?: string; email?: string; taxId?: string; address?: string },
): Partial<Customer> {
  const patch: Partial<Customer> = {}
  const name = snapshot.name.trim()
  if (name && name !== current?.name) patch.name = name
  const phone = (snapshot.phone ?? '').trim()
  if (phone && phone !== (current?.phone ?? '')) patch.phone = phone
  const email = (snapshot.email ?? '').trim()
  if (email && email !== (current?.email ?? '')) patch.email = email
  const taxId = (snapshot.taxId ?? '').trim()
  if (taxId && taxId !== (current?.taxId ?? '')) patch.taxId = taxId
  const address = (snapshot.address ?? '').trim()
  if (address && address !== (current?.address ?? '')) patch.address = address
  return patch
}

/**
 * Resolve the contacts row for a new order BEFORE the order row is inserted.
 *
 *  - Explicit contactId: link it; when `save` is set, also push the form's
 *    non-empty fields into that same row (never any other row).
 *  - No contactId: deterministic match (see matchCustomer). A match links
 *    read-only, or updates + links when `save` is set. No match + `save`
 *    inserts a new row. No match + no `save` leaves the order unlinked.
 *
 * Throws on any contact write failure: the caller must surface that instead
 * of inserting an order silently detached from its buyer.
 */
async function resolveCustomerForOrder(
  known: Customer[],
  input: BuyerSnapshotInput,
  save: boolean,
  persist: {
    insert: (c: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>
    update: (id: string, patch: Partial<Customer>) => Promise<Customer>
  },
): Promise<string | null> {
  const snapshot = {
    name: input.buyerName,
    phone: input.buyerPhone,
    email: input.buyerEmail,
    taxId: input.buyerTaxId,
    address: input.buyerAddress,
  }

  if (input.contactId) {
    if (save) {
      const linked = known.find(c => c.id === input.contactId)
      // A stale id (row deleted elsewhere) links as-is: the orders FK rejects
      // a truly dangling id with a conflict the UI shows, instead of this
      // step inventing a replacement row.
      if (linked) {
        const patch = customerPatchForSnapshot(linked, snapshot)
        if (Object.keys(patch).length > 0) {
          await persist.update(linked.id, patch)
        }
      }
    }
    return input.contactId
  }

  if (!snapshot.name.trim()) return null

  const matched = matchCustomer(known, snapshot)
  if (matched) {
    if (save) {
      const patch = customerPatchForSnapshot(matched, snapshot)
      if (Object.keys(patch).length > 0) {
        await persist.update(matched.id, patch)
      }
    }
    return matched.id
  }

  if (!save) return null

  const created = await persist.insert({
    name: snapshot.name.trim(),
    phone: (snapshot.phone ?? '').trim() || undefined,
    email: (snapshot.email ?? '').trim() || undefined,
    taxId: (snapshot.taxId ?? '').trim() || undefined,
    address: (snapshot.address ?? '').trim() || undefined,
  })
  return created.id
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * @param tenantId Tenant whose data the store reads. Omitted while signed out
 *   or on the pending-approval screen: the hook then stays empty and idle
 *   instead of querying rows RLS would reject anyway.
 */
export function useDashboardStore(tenantId?: string): DashboardStore {
  const [isConnected, setIsConnected] = useState(false)
  const [merchantAddress, setMerchantAddress] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG)
  const [error, setError] = useState<StoreError | null>(null)
  /** Tenant the data currently in state belongs to. */
  const [loadedTenant, setLoadedTenant] = useState<string | null>(null)

  // Derived, never set from the effect: true exactly while what is on screen
  // is not this tenant's data yet. Setting it inside the effect would cascade
  // a render; deriving it cannot.
  const loading = tenantId !== undefined && loadedTenant !== tenantId
  // Customers ride the same initial read, so their loading window is the same
  // one — the order form tells "cargando clientes" from "sin clientes" apart.
  const customersLoading = loading

  // Incremented per load so a response that arrives after the tenant changed
  // (or after unmount) cannot write stale rows into state.
  const loadSeq = useRef(0)

  const requireTenant = useCallback((): string => {
    if (!tenantId) {
      throw new StoreError('unsupported', 'No hay sesión de tenant activa.')
    }
    return tenantId
  }, [tenantId])

  // Written as an explicit promise chain rather than an async function: the
  // state writes then provably happen in a settled callback, never in the
  // effect's synchronous body (which oxlint's react/set-state-in-effect
  // rejects, correctly — a cascading render buys nothing here).
  const load = useCallback((): Promise<void> => {
    const currentTenant = requireTenant()
    loadSeq.current += 1
    const seq = loadSeq.current
    const isCurrent = () => loadSeq.current === seq

    return Promise.all([
      fetchConfig(currentTenant),
      fetchProducts(currentTenant),
      fetchOrders(currentTenant),
      fetchCustomers(currentTenant),
    ])
      .then(([nextConfig, nextProducts, nextOrders, nextCustomers]) => {
        if (!isCurrent()) return
        setConfig(nextConfig)
        setProducts(nextProducts)
        setOrders(nextOrders)
        setCustomers(nextCustomers)
        setError(null)
      })
      .catch((thrown: unknown) => {
        if (!isCurrent()) return
        setError(asStoreError(thrown))
      })
      .finally(() => {
        // Marked loaded on failure too, otherwise a failed read would leave the
        // skeleton spinning forever with no error visible under it.
        if (isCurrent()) setLoadedTenant(currentTenant)
      })
  }, [requireTenant])

  useEffect(() => {
    if (!tenantId) return
    void load()
  }, [tenantId, load])

  // Pago en vivo sin recarga manual: verify-payment marca charges como paid
  // fuera de esta pestaña, así que ante cualquier cambio en charges u orders
  // del tenant se recarga (la misma lectura inicial, sin patrones nuevos).
  // Si Realtime no está habilitado para estas tablas, el comercio sigue
  // viendo el pago con el botón de actualizar (store.refresh).
  useEffect(() => {
    if (!tenantId) return
    const channel = supabase
      .channel(`paystyle-tenant-${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'charges', filter: `tenant_id=eq.${tenantId}` },
        () => { void load() },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => { void load() },
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [tenantId, load])

  const refresh = useCallback(async (): Promise<void> => {
    await load()
  }, [load])

  const dismissError = useCallback(() => setError(null), [])

  // ── Wallet (local only) ────────────────────────────────────────────────

  const connect = useCallback((address: string) => {
    setIsConnected(true)
    setMerchantAddress(address)
    // config.merchantWallet is deliberately NOT touched here: it is the
    // tenants.merchant_wallet_address column and is loaded/saved through
    // updateConfig. A wallet connect must not silently rewrite the tenant.
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setMerchantAddress('')
  }, [])

  // ── Catalog ────────────────────────────────────────────────────────────

  const addProduct = useCallback(async (input: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const currentTenant = requireTenant()
    const { data, error } = await supabase
      .from('products')
      .insert({
        tenant_id: currentTenant,
        name: input.name,
        description: input.description ?? null,
        sku: input.sku ?? null,
        image_url: input.imageUrl ?? null,
        unit: input.unit,
        price: input.price,
        stock: input.stock,
        currency: 'USD',
        attributes: toRowAttributes(writeAttributes(input)),
        // tax_rate is left to the column default (0.16).
      })
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'products')

    const created = productRowToStore(data)
    setProducts(prev => [created, ...prev])
    return created
  }, [requireTenant])

  const updateProduct = useCallback(async (id: string, patch: Partial<Product>): Promise<Product> => {
    const columns = productToColumns(patch)

    const touchesAttributes =
      patch.variants !== undefined || patch.customFields !== undefined || patch.fieldDefs !== undefined
    if (touchesAttributes) {
      // Merge into what is stored rather than replacing: a patch that carries
      // only `variants` must not wipe the product's custom fields.
      const { data: current, error } = await supabase
        .from('products')
        .select('attributes')
        .eq('id', id)
        .single()
      if (error) throw toStoreError(error, 'products')
      const attributes = readAttributes(current.attributes)
      columns.attributes = toRowAttributes(writeAttributes({
        variants: patch.variants ?? attributes.variants,
        customFields: patch.customFields ?? attributes.values,
        fieldDefs: patch.fieldDefs ?? attributes.fieldDefs,
      }))
    }

    const { data, error } = await supabase
      .from('products')
      .update(columns)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'products')

    const updated = productRowToStore(data)
    setProducts(prev => prev.map(product => (product.id === id ? updated : product)))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) throw toStoreError(error, 'products')
    if (data.length === 0) throw new StoreError('not_found', 'El producto ya no existe.')

    // Past order_lines keep their description snapshot: order_lines.product_id
    // is ON DELETE SET NULL, so deleting a product never rewrites history.
    setProducts(prev => prev.filter(product => product.id !== id))
  }, [])

  const updateStock = useCallback(async (
    productId: string,
    variantId: string | undefined,
    delta: number,
  ): Promise<void> => {
    const updated = variantId
      ? await adjustVariantStock(productId, variantId, delta)
      : await adjustStockColumn(productId, delta)
    setProducts(prev => prev.map(product => (product.id === updated.id ? updated : product)))
  }, [])

  const reserveStock = useCallback(async (
    productId: string,
    variantId: string | undefined,
    qty: number,
  ): Promise<void> => {
    await updateStock(productId, variantId, -qty)
  }, [updateStock])

  const releaseStock = useCallback(async (
    productId: string,
    variantId: string | undefined,
    qty: number,
  ): Promise<void> => {
    await updateStock(productId, variantId, qty)
  }, [updateStock])

  // ── Customers ────────────────────────────────────────────────────────

  const updateCustomer = useCallback(async (id: string, patch: Partial<Customer>): Promise<Customer> => {
    const columns = customerToColumns(patch)
    if (columns.name !== undefined && !columns.name.trim()) {
      throw new StoreError('conflict', 'El nombre del cliente es requerido.')
    }
    const { data, error } = await supabase
      .from('contacts')
      .update(columns)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'contacts')

    const updated = customerRowToStore(data)
    setCustomers(prev => prev.map(customer => (customer.id === id ? updated : customer)))
    return updated
  }, [])

  const addCustomer = useCallback(async (input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const currentTenant = requireTenant()
    const name = input.name.trim()
    if (!name) {
      throw new StoreError('conflict', 'El nombre del cliente es requerido.')
    }
    // Last-line duplicate guard: an exact normalized match (name + phone /
    // tax ID / email) is updated with the new data instead of inserted twice.
    // matchCustomer only returns same-name rows sharing an identifier, so this
    // never merges two different people.
    const matched = matchCustomer(customers, {
      name,
      phone: input.phone,
      email: input.email,
      taxId: input.taxId,
      address: input.address,
    })
    if (matched) {
      const patch = customerPatchForSnapshot(matched, {
        name,
        phone: input.phone,
        email: input.email,
        taxId: input.taxId,
        address: input.address,
      })
      if (Object.keys(patch).length === 0) return matched
      return updateCustomer(matched.id, patch)
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        tenant_id: currentTenant,
        name,
        phone: input.phone?.trim() || null,
        email: input.email?.trim() || null,
        tax_id: input.taxId?.trim() || null,
        address: input.address?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'contacts')

    const created = customerRowToStore(data)
    setCustomers(prev => insertCustomerSorted(prev, created))
    return created
  }, [requireTenant, customers, updateCustomer])

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    const { data, error } = await supabase
      .from('contacts')
      .update({ is_active: false })
      .eq('id', id)
      .select('id')
    if (error) throw toStoreError(error, 'contacts')
    if (!data || data.length === 0) throw new StoreError('not_found', 'El cliente ya no existe.')

    setCustomers(prev => prev.filter(c => c.id !== id))
  }, [])

  // ── Orders ─────────────────────────────────────────────────────────────

  const addOrder = useCallback(async (
    input: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>,
    options?: AddOrderCustomerOptions,
  ): Promise<Order> => {
    const currentTenant = requireTenant()

    const split = splitTotals(input.subtotal, input.total, config.applyIgtf)

    // Customer step FIRST: resolve or save/update the contacts row before any
    // order row exists. A contact failure rejects here — the order is never
    // inserted silently detached from its buyer.
    const contactId = await resolveCustomerForOrder(
      customers,
      input,
      options?.saveCustomer === true,
      { insert: addCustomer, update: updateCustomer },
    )

    // order_number is UNIQUE per tenant and there is no counter column or RPC
    // for orders. Read the tenant's current maximum and retry on collision.
    // next_invoice_number() is deliberately not reused: it advances the fiscal
    // invoice sequence, and an order must not consume invoice numbers.
    let inserted: OrderRow | null = null
    let lastConflict = ''
    for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS && inserted === null; attempt++) {
      const { data: taken, error: numbersError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('tenant_id', currentTenant)
      if (numbersError) throw toStoreError(numbersError, 'orders')

      const { data, error } = await supabase
        .from('orders')
        .insert({
          tenant_id: currentTenant,
          order_number: nextOrderNumber(taken.map(row => row.order_number)),
          status: STORE_TO_DB_ORDER_STATUS[input.status ?? 'draft'],
          subtotal: input.subtotal,
          tax_amount: input.taxAmount ?? split.taxAmount,
          igtf_amount: input.igtfAmount ?? split.igtfAmount,
          total: input.total,
          currency: input.currency ?? 'USD',
          buyer_name: input.buyerName,
          buyer_phone: input.buyerPhone || null,
          buyer_tax_id: (input.buyerTaxId ?? '').trim() || null,
          contact_id: contactId,
          notes: input.notes ?? null,
          source: 'dashboard',
        })
        .select('*')
        .single()

      if (!error) inserted = data
      else if (error.code === '23505') lastConflict = error.message
      else throw toStoreError(error, 'orders')
    }
    if (inserted === null) {
      throw new StoreError('unique_violation', `No se pudo asignar un número de orden único en ${ORDER_NUMBER_ATTEMPTS} intentos. ${lastConflict}`)
    }
    const orderRow = inserted

    // Second write: the lines. PostgREST executes one statement per request,
    // so there is NO transaction spanning these two inserts without an RPC
    // (this project has none for orders). If the lines fail, the order row is
    // deleted to avoid an orphan — a compensation, not a rollback: if that
    // delete fails too, the order stays behind and the error says so.
    const lineColumns = input.lines.map(line => orderLineToColumns(orderRow.id, line))
    if (lineColumns.length > 0) {
      const { error: linesError } = await supabase.from('order_lines').insert(lineColumns)
      if (linesError) {
        const { error: cleanupError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderRow.id)
        if (cleanupError) {
          throw new StoreError('unknown',
            `Fallaron las líneas (${linesError.message}) y la orden ${orderRow.order_number} no se pudo eliminar (${cleanupError.message}). Elimínala a mano.`)
        }
        throw toStoreError(linesError, 'order_lines')
      }
    }

    // The order is durable from here on, so a stock failure is reported
    // through the store's error state instead of rejecting addOrder: the
    // order exists and the caller needs its id either way.
    const failures: string[] = []
    for (const line of input.lines) {
      if (!line.productId) continue
      try {
        const variantId = await resolveVariantId(line.productId, line.variantLabel)
        await updateStock(line.productId, variantId, -line.quantity)
      } catch (thrown) {
        failures.push(`${line.productName}: ${asStoreError(thrown).message}`)
      }
    }
    if (failures.length > 0) {
      setError(new StoreError('conflict',
        `La orden ${orderRow.order_number} se creó pero no se descontó el stock de: ${failures.join('; ')}`))
    }

    // Fiscal invoicing is NOT triggered here: NewOrderForm creates orders as
    // draft and the invoice is generated on the payment-link transition in
    // updateOrder (draft → pending_payment / DB invoiced). Generating here
    // would burn fiscal numbers on orders that may never be paid.
    const stored = orderRowToStore(orderRow, input.lines, undefined)
    // Email/address have no orders columns: echo the form's values onto the
    // returned order so the UI sees the same buyer it just saved on the
    // linked contact row (a reload re-reads them from that row at invoice
    // time — see generateInvoiceForOrder).
    const created: Order = {
      ...stored,
      buyerEmail: (input.buyerEmail ?? '').trim() || undefined,
      buyerAddress: (input.buyerAddress ?? '').trim() || undefined,
    }
    setOrders(prev => [created, ...prev])
    return created
  }, [requireTenant, config.applyIgtf, updateStock, customers, addCustomer, updateCustomer])

  const updateOrder = useCallback(async (id: string, patch: Partial<Order>): Promise<Order> => {
    const currentTenant = requireTenant()

    if (patch.lines !== undefined) {
      // Rewriting lines means delete-then-reinsert order_lines: a second
      // unguarded compensation step for a feature the UI does not have. Refuse
      // loudly rather than dropping part of the patch silently.
      throw new StoreError('unsupported', 'Editar las líneas de una orden todavía no está soportado.')
    }

    const columns = orderToColumns(patch, config.applyIgtf)
    const writesCharge =
      patch.paymentUrl !== undefined || patch.vaultAddress !== undefined || patch.txHash !== undefined

    let orderRow: OrderRow | null = null
    if (Object.keys(columns).length > 0) {
      const { data, error } = await supabase
        .from('orders')
        .update(columns)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw toStoreError(error, 'orders')
      orderRow = data
    }

    let charge: ChargeRow | undefined
    if (writesCharge) {
      // chargeId is read-only in this model: it identifies the charge row the
      // store already denormalizes, so it is never written back.
      if (orderRow === null) {
        const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
        if (error) throw toStoreError(error, 'orders')
        orderRow = data
      }
      charge = await writeChargeForOrder(id, currentTenant, orderRow.total, patch)
    } else if (orderRow === null) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
      if (error) throw toStoreError(error, 'orders')
      orderRow = data
    }

    // Re-read the charge when this patch did not touch it: paymentUrl/txHash
    // are denormalized from charges, so mapping the order alone would blank
    // them out (cancelling an order must not erase its payment link).
    if (charge === undefined) {
      const { data: charges, error } = await supabase
        .from('charges')
        .select('*')
        .eq('order_id', id)
      if (error) throw toStoreError(error, 'charges')
      charge = pickChargeForOrder(charges)
    }

    const lines = await fetchLines(id)
    const updated = orderRowToStore(orderRow, lines, charge)
    setOrders(prev => prev.map(order => (order.id === id ? updated : order)))

    // Fiscal trigger: the payment-link transition (UI pending_payment → DB
    // invoiced) is what makes an order ready for payment, so the invoice is
    // generated here and only here — never on order creation. The order and
    // charge writes above are already durable: an invoice failure surfaces as
    // store error state instead of rejecting the whole mutation.
    if (patch.status === 'pending_payment' && orderRow.status === 'invoiced') {
      try {
        await generateInvoiceForOrder(currentTenant, id)
      } catch (thrown) {
        setError(new StoreError('conflict',
          `La orden ${orderRow.order_number} se actualizó pero no se generó la factura: ${asStoreError(thrown).message}`))
      }
    }

    return updated
  }, [requireTenant, config.applyIgtf])

  // ── Manual payment mark ──────────────────────────────────────────────────
  // The merchant confirms receipt (alias, transfer, cash, etc.) and flips
  // the charge + order to paid without an on-chain tx. RLS allows the
  // tenant owner to update their own charges, so no edge function is
  // needed. paid_by is not a column yet — paid_at is the audit trail.
  const markChargePaid = useCallback(async (orderId: string): Promise<Order> => {
    const currentTenant = requireTenant()

    // Read the active charge for this order
    const { data: charges, error: chargeErr } = await supabase
      .from('charges')
      .select('*')
      .eq('order_id', orderId)
      .in('status', ['pending', 'partial'])
    if (chargeErr) throw toStoreError(chargeErr, 'charges')

    const charge = pickChargeForOrder(charges)
    if (!charge) {
      throw new StoreError('not_found', 'No hay un cobro activo para esta orden.')
    }

    // Update charge → paid
    const now = new Date().toISOString()
    const { error: updateChargeErr } = await supabase
      .from('charges')
      .update({ status: 'paid', paid_at: now, updated_at: now })
      .eq('id', charge.id)
      .eq('tenant_id', currentTenant)
    if (updateChargeErr) throw toStoreError(updateChargeErr, 'charges')

    // Update order → paid
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'paid', updated_at: now })
      .eq('id', orderId)
      .eq('tenant_id', currentTenant)
      .select('*')
      .single()
    if (orderErr) throw toStoreError(orderErr, 'orders')

    // Re-read the charge (now paid) and rebuild the store object
    const { data: updatedCharges } = await supabase
      .from('charges')
      .select('*')
      .eq('order_id', orderId)
    const updatedCharge = pickChargeForOrder(updatedCharges ?? [])
    const lines = await fetchLines(orderId)
    const updated = orderRowToStore(orderRow, lines, updatedCharge)
    setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)))
    return updated
  }, [requireTenant])

  // ── Config ─────────────────────────────────────────────────────────────

  const updateConfig = useCallback(async (patch: Partial<BusinessConfig>): Promise<void> => {
    const currentTenant = requireTenant()
    const { data, error } = await supabase
      .from('tenants')
      .update(configToTenantColumns(patch))
      .eq('id', currentTenant)
      .select('*')
      .single()
    if (error) throw toStoreError(error, 'tenants')
    setConfig(tenantRowToConfig(data))
  }, [requireTenant])

  return {
    isConnected,
    merchantAddress,
    products,
    orders,
    customers,
    config,
    loading,
    customersLoading,
    error,
    connect,
    disconnect,
    refresh,
    dismissError,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    reserveStock,
    releaseStock,
    addOrder,
    updateOrder,
    markChargePaid,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateConfig,
  }
}