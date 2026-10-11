/**
 * PayStyle — dashboard domain model.
 *
 * These are the shapes the UI speaks. They are NOT the database schema: the
 * DB stores order lines in their own table, prices as numeric and product
 * variants inside a jsonb column. Conversion lives in ./mappers.ts — nothing
 * in the UI talks to a snake_case column directly.
 *
 * Extracted from ./index.ts so the store hook and the mappers can share them
 * without an import cycle; ./index.ts re-exports every name here, so
 * `import type { Product } from '@/store'` keeps working.
 */

import type { StoreError } from './errors'

export type FieldType = 'text' | 'number' | 'select' | 'boolean'

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  unit?: string           // e.g. "docena", "unidad", "caja", "kg"
  options?: string[]      // for type=select
  required?: boolean
}

export interface ProductVariant {
  id: string
  label: string           // e.g. "205/55R16", "Talla M", "Azul"
  stock: number
  price?: string          // override base price if needed
}

export interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  price: string           // base price in USD
  unit: string            // e.g. "unidad", "docena", "caja"
  stock: number           // total available (sum of variants if variants exist)
  imageUrl?: string
  variants: ProductVariant[]
  customFields: Record<string, string | number | boolean>
  fieldDefs: FieldDefinition[]   // dynamic field schema for this product
  createdAt: string
}

export interface OrderLine {
  /** Absent when the product was deleted after the order was placed
   *  (order_lines.product_id is ON DELETE SET NULL). The description snapshot
   *  on the line stays the durable record in that case. */
  productId?: string
  productName: string
  variantLabel?: string
  /** Client-side only: order_lines has no variant_id column, so this never
   *  reaches the database (only `variantLabel` does). The order form still
   *  needs it to tell two variants of the same product apart while building
   *  the cart. It is undefined on every line read back from the DB. */
  variantId?: string
  quantity: number
  unitPrice: string
  unit: string
}

/**
 * The UI's five-state lifecycle. The database's `order_status` enum has seven
 * values and cannot express partial payment at all — see ORDER_STATUS_TABLES
 * in ./mappers.ts for the exact (and lossy) mapping in both directions.
 */
export type OrderStatus =
  | 'draft'
  | 'pending_payment'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  buyerName: string
  buyerPhone: string        // WhatsApp number — placeholder for automation
  lines: OrderLine[]
  subtotal: string
  total: string             // includes IVA + IGTF if applicable
  status: OrderStatus
  // Payment fields are denormalized from the order's `charges` row; there is
  // no payment_url column on orders.
  chargeId?: string
  paymentUrl?: string
  vaultAddress?: string
  txHash?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Fiscal split of `total`. Optional: the form only knows subtotal + total,
  // so when the caller omits these the store derives them (see mappers).
  taxAmount?: string
  igtfAmount?: string
  currency?: string
}

export interface BusinessConfig {
  name: string
  rif: string              // Venezuelan tax ID (e.g. J-12345678-9)
  address: string
  phone: string
  email: string
  logoUrl?: string
  merchantWallet: string
  invoicePrefix: string    // e.g. "0001"
  applyIgtf: boolean       // whether to add 3% IGTF on USDC payments
}

export interface DashboardStore {
  // Wallet (owned by wagmi — local state, never persisted)
  isConnected: boolean
  merchantAddress: string

  // Catalog
  products: Product[]

  // Orders
  orders: Order[]

  // Config
  config: BusinessConfig

  // True while the initial (or a manual) read from Supabase is in flight, so
  // views can render a skeleton instead of flashing their empty state.
  loading: boolean

  // Last failed read/write, kept so the shell can surface it. Mutations also
  // throw that same error; this field is for failures that happen outside a
  // call site's try/catch (the initial load).
  error: StoreError | null

  // Mutations — all async: every one of them is a network round trip.
  connect: (address: string) => void
  disconnect: () => void
  refresh: () => Promise<void>
  dismissError: () => void
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>
  updateProduct: (id: string, patch: Partial<Product>) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  updateStock: (productId: string, variantId: string | undefined, delta: number) => Promise<void>
  reserveStock: (productId: string, variantId: string | undefined, qty: number) => Promise<void>
  releaseStock: (productId: string, variantId: string | undefined, qty: number) => Promise<void>
  addOrder: (o: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Promise<Order>
  updateOrder: (id: string, patch: Partial<Order>) => Promise<Order>
  updateConfig: (patch: Partial<BusinessConfig>) => Promise<void>
}