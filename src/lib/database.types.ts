/**
 * PayStyle — Supabase database types
 * Generated manually from schema. Run `supabase gen types typescript`
 * once the project is linked to keep this in sync automatically.
 */

export type OrderStatus = 'draft' | 'quoted' | 'confirmed' | 'invoiced' | 'charged' | 'paid' | 'cancelled'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'voided'
export type ChargeStatus = 'pending' | 'paid' | 'partial' | 'expired' | 'failed' | 'cancelled'
export type MemberRole = 'owner' | 'admin' | 'seller' | 'viewer'

export type Tenant = {
  id: string
  created_at: string
  updated_at: string
  slug: string
  business_name: string
  logo_url: string | null
  owner_id: string
  is_approved: boolean
  approved_at: string | null
  approved_by: string | null
  default_payment_provider: string
  merchant_wallet_id: string | null
  merchant_wallet_address: string | null
  country: string
  tax_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  invoice_prefix: string
  next_invoice_number: number
  apply_igtf: boolean
  fiscal_config: Record<string, unknown>
}

export type TenantMember = {
  id: string
  tenant_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

export type Contact = {
  id: string
  tenant_id: string
  created_at: string
  updated_at: string
  name: string
  phone: string | null
  email: string | null
  tax_id: string | null
  address: string | null
  notes: string | null
  tags: string[]
  is_active: boolean
}

export type Product = {
  id: string
  tenant_id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  sku: string | null
  image_url: string | null
  unit: string
  price: string          // numeric comes as string from Supabase
  tax_rate: string
  currency: string
  stock: number | null
  stock_reserved: number
  is_active: boolean
  attributes: {
    fieldDefs?: Array<{ key: string; label: string; type: string; unit?: string; options?: string[]; required?: boolean }>
    values?: Record<string, string>
    variants?: Array<{ id: string; label: string; stock: number; price?: string }>
  }
}

export type Order = {
  id: string
  tenant_id: string
  contact_id: string | null
  created_at: string
  updated_at: string
  order_number: string
  status: OrderStatus
  subtotal: string
  tax_amount: string
  igtf_amount: string
  total: string
  currency: string
  buyer_name: string | null
  buyer_phone: string | null
  buyer_tax_id: string | null
  notes: string | null
  source: string
  whatsapp_thread_id: string | null
}

export type OrderLine = {
  id: string
  order_id: string
  product_id: string | null
  created_at: string
  description: string
  unit: string | null
  quantity: string
  unit_price: string
  tax_rate: string
  line_total: string
  variant_label: string | null
}

export type Charge = {
  id: string
  tenant_id: string
  order_id: string | null
  created_at: string
  updated_at: string
  payment_provider: string
  provider_ref: string | null
  amount: string
  amount_received: string
  currency: string
  vault_address: string | null
  charge_id_onchain: string | null
  payment_url: string
  expires_at: string | null
  status: ChargeStatus
  paid_at: string | null
  tx_hash: string | null
  block_number: number | null
  sweep_tx_hash: string | null
  memo: string | null
}

export type Payment = {
  id: string
  tenant_id: string
  charge_id: string
  created_at: string
  amount: string
  currency: string
  payment_provider: string
  provider_ref: string
  paid_at: string
  tx_hash: string | null
  from_address: string | null
  block_number: number | null
  chain_id: number | null
  platform_fee: string | null
  dev_fee: string | null
  merchant_amount: string | null
  raw_event: Record<string, unknown> | null
}

export type Invoice = {
  id: string
  tenant_id: string
  order_id: string | null
  created_at: string
  updated_at: string
  invoice_number: string
  status: InvoiceStatus
  issued_at: string | null
  tenant_snapshot: Record<string, unknown>
  buyer_snapshot: Record<string, unknown>
  subtotal: string | null
  tax_amount: string | null
  igtf_amount: string | null
  total: string | null
  currency: string
  numero_control: string | null
  fiscal_data: Record<string, unknown>
  pdf_url: string | null
  xml_url: string | null
}

export type AccessRequest = {
  id: string
  created_at: string
  name: string
  business_name: string
  email: string
  country: string
  monthly_volume_range: string
  message: string | null
}

// Supabase generic Database type shape (used by createClient<Database>)
export type Database = {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Partial<Tenant>; Update: Partial<Tenant>; Relationships: [] }
      tenant_members: { Row: TenantMember; Insert: Partial<TenantMember>; Update: Partial<TenantMember>; Relationships: [] }
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact>; Relationships: [] }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product>; Relationships: [] }
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order>; Relationships: [] }
      order_lines: { Row: OrderLine; Insert: Partial<OrderLine>; Update: Partial<OrderLine>; Relationships: [] }
      charges: { Row: Charge; Insert: Partial<Charge>; Update: Partial<Charge>; Relationships: [] }
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment>; Relationships: [] }
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice>; Relationships: [] }
      access_requests: { Row: AccessRequest; Insert: Partial<AccessRequest>; Update: Partial<AccessRequest>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: {
      // Reserves and returns the next invoice number for the caller's tenant.
      // Atomic: a single UPDATE ... RETURNING, so concurrent callers cannot
      // receive the same number. Derives the tenant from auth.uid(), so it
      // takes no tenant argument on purpose. Raises 42501 if the tenant is
      // missing or not approved. See docs/migrations/002_atomic_invoice_number.sql.
      next_invoice_number: { Args: Record<string, never>; Returns: number }
    }
    Enums: {
      order_status: OrderStatus
      invoice_status: InvoiceStatus
      charge_status: ChargeStatus
      member_role: MemberRole
    }
  }
}
