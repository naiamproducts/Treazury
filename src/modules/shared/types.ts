/**
 * Shared domain types used across all modules.
 *
 * Rules:
 * - No framework imports (no React, no viem, no wagmi).
 * - Every monetary amount is a string in human-readable decimal form ("5.00")
 *   to avoid floating-point errors across module boundaries.
 * - Module implementations convert to bigint/number only at their own edges.
 */

// ─────────────────────────────────────────────
// Tenant / Auth
// ─────────────────────────────────────────────

export interface Tenant {
  id: string
  name: string
  /** Onchain wallet address that receives payments for this tenant. */
  walletAddress: string
  /** ISO 3166-1 alpha-2 country code. Drives invoice engine selection. */
  country: CountryCode
  /** True while the tenant is in the approved whitelist. */
  isApproved: boolean
  createdAt: string
  /** Issuer tax ID (RIF / CUIT / RFC / NIT depending on country). Optional so
   *  existing tenants and callers that only know the core fields keep working;
   *  the Venezuela engine treats a missing value as "not configured". */
  taxId?: string
  /** Human label for the tax ID ("RIF" / "CUIT" / "RFC" / "NIT"). */
  taxIdLabel?: string
  address?: string
  phone?: string
  email?: string
}

// ─────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────

export interface Product {
  id: string
  tenantId: string
  name: string
  description?: string
  /** Human-readable unit price in the tenant's billing currency (usually USD). */
  unitPrice: string
  unit: string          // e.g. "unidad", "caja", "kg"
  taxable: boolean
  active: boolean
}

// ─────────────────────────────────────────────
// Orders
// ─────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'invoiced'
  | 'paid'
  | 'cancelled'

export interface OrderLine {
  productId: string
  productName: string     // denormalized snapshot at order time
  unitPrice: string
  quantity: number
  /** Subtotal = unitPrice × quantity, no taxes. */
  subtotal: string
}

export interface Order {
  id: string
  tenantId: string
  /** WhatsApp number or display name of the buyer. */
  contactRef: string
  lines: OrderLine[]
  /** Sum of all line subtotals, no taxes. */
  subtotal: string
  status: OrderStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────
// Country codes we support
// ─────────────────────────────────────────────

export type CountryCode = 'VE' | 'AR' | 'MX' | 'CO' | 'CL'

// ─────────────────────────────────────────────
// Money helpers (pure string arithmetic stubs)
// NOTE: In browser code, use @/onchain-money instead.
// These are for server/module contexts with no viem dependency.
// ─────────────────────────────────────────────

/** Multiply two decimal strings and return a string rounded to `decimals` places. */
export function mulDecimal(a: string, b: string, decimals = 2): string {
  const result = parseFloat(a) * parseFloat(b)
  return result.toFixed(decimals)
}

/** Add an array of decimal strings. */
export function sumDecimals(values: string[], decimals = 2): string {
  const result = values.reduce((acc, v) => acc + parseFloat(v), 0)
  return result.toFixed(decimals)
}

/** Apply a percentage rate to a decimal string. */
export function applyRate(amount: string, ratePct: number, decimals = 2): string {
  return (parseFloat(amount) * (ratePct / 100)).toFixed(decimals)
}
