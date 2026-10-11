/**
 * In-memory store — single source of truth for all dashboard state.
 * Structured to match the Supabase schema exactly so the swap to a real DB
 * is a drop-in: replace set* calls with Supabase mutations, reads with
 * Supabase selects. No external state library needed at this scale.
 */

import { useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

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
  productId: string
  productName: string
  variantId?: string
  variantLabel?: string
  quantity: number
  unitPrice: string
  unit: string
}

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
  chargeId?: string
  paymentUrl?: string
  vaultAddress?: string
  txHash?: string
  notes?: string
  createdAt: string
  updatedAt: string
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
  // Auth
  isConnected: boolean
  merchantAddress: string

  // Catalog
  products: Product[]

  // Orders
  orders: Order[]

  // Config
  config: BusinessConfig

  // Mutations
  connect: (address: string) => void
  disconnect: () => void
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (productId: string, variantId: string | undefined, delta: number) => void
  reserveStock: (productId: string, variantId: string | undefined, qty: number) => void
  releaseStock: (productId: string, variantId: string | undefined, qty: number) => void
  addOrder: (o: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Order
  updateOrder: (id: string, patch: Partial<Order>) => void
  updateConfig: (patch: Partial<BusinessConfig>) => void
}

// ── Seed data (demo) ───────────────────────────────────────────────────────

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Neumático 205/55R16',
    sku: 'NEU-205-55R16',
    description: 'Neumático radial para vehículo de pasajeros.',
    price: '45.00',
    unit: 'unidad',
    stock: 48,
    variants: [
      { id: 'v1', label: '205/55R16', stock: 24, price: '45.00' },
      { id: 'v2', label: '215/60R16', stock: 12, price: '48.00' },
      { id: 'v3', label: '225/65R17', stock: 12, price: '55.00' },
    ],
    customFields: { marca: 'Bridgestone', indice_carga: '91', indice_velocidad: 'V' },
    fieldDefs: [
      { key: 'marca', label: 'Marca', type: 'text', required: true },
      { key: 'indice_carga', label: 'Índice de carga', type: 'text' },
      { key: 'indice_velocidad', label: 'Índice de velocidad', type: 'text' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Aceite de motor 5W-30',
    sku: 'ACE-5W30-1L',
    description: 'Aceite sintético para motor gasolina/diesel.',
    price: '8.50',
    unit: 'litro',
    stock: 120,
    variants: [],
    customFields: { marca: 'Mobil', viscosidad: '5W-30', presentacion: '1L' },
    fieldDefs: [
      { key: 'marca', label: 'Marca', type: 'text', required: true },
      { key: 'viscosidad', label: 'Viscosidad', type: 'text' },
      { key: 'presentacion', label: 'Presentación', type: 'text' },
    ],
    createdAt: new Date().toISOString(),
  },
]

const DEFAULT_CONFIG: BusinessConfig = {
  name: 'Mi Negocio',
  rif: '',
  address: '',
  phone: '',
  email: '',
  merchantWallet: '',
  invoicePrefix: '0001',
  applyIgtf: true,
}

// ── Hook ───────────────────────────────────────────────────────────────────

let orderCounter = 1

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function nextOrderNumber() {
  return `ORD-${String(orderCounter++).padStart(4, '0')}`
}

export function useDashboardStore(): DashboardStore {
  const [isConnected, setIsConnected] = useState(false)
  const [merchantAddress, setMerchantAddress] = useState('')
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS)
  const [orders, setOrders] = useState<Order[]>([])
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG)

  const connect = useCallback((address: string) => {
    setIsConnected(true)
    setMerchantAddress(address)
    setConfig((c) => ({ ...c, merchantWallet: address }))
  }, [])

  const disconnect = useCallback(() => {
    setIsConnected(false)
    setMerchantAddress('')
  }, [])

  const addProduct = useCallback((p: Omit<Product, 'id' | 'createdAt'>): Product => {
    const product: Product = { ...p, id: `prod-${newId()}`, createdAt: new Date().toISOString() }
    setProducts((prev) => [product, ...prev])
    return product
  }, [])

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updateStock = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p
      if (variantId) {
        const variants = p.variants.map((v) =>
          v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v
        )
        const stock = variants.reduce((s, v) => s + v.stock, 0)
        return { ...p, variants, stock }
      }
      return { ...p, stock: Math.max(0, p.stock + delta) }
    }))
  }, [])

  const reserveStock = useCallback((productId: string, variantId: string | undefined, qty: number) => {
    updateStock(productId, variantId, -qty)
  }, [updateStock])

  const releaseStock = useCallback((productId: string, variantId: string | undefined, qty: number) => {
    updateStock(productId, variantId, qty)
  }, [updateStock])

  const addOrder = useCallback((o: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order => {
    const now = new Date().toISOString()
    const order: Order = {
      ...o,
      id: `ord-${newId()}`,
      orderNumber: nextOrderNumber(),
      createdAt: now,
      updatedAt: now,
    }
    setOrders((prev) => [order, ...prev])
    // Reserve stock for each line
    order.lines.forEach((line) => {
      reserveStock(line.productId, line.variantId, line.quantity)
    })
    return order
  }, [reserveStock])

  const updateOrder = useCallback((id: string, patch: Partial<Order>) => {
    setOrders((prev) => prev.map((o) =>
      o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o
    ))
  }, [])

  const updateConfig = useCallback((patch: Partial<BusinessConfig>) => {
    setConfig((c) => ({ ...c, ...patch }))
  }, [])

  return {
    isConnected, merchantAddress,
    products, orders, config,
    connect, disconnect,
    addProduct, updateProduct, deleteProduct,
    updateStock, reserveStock, releaseStock,
    addOrder, updateOrder,
    updateConfig,
  }
}
