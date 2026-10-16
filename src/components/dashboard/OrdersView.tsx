/**
 * OrdersView — crear pedidos desde el catálogo, asignar comprador (WhatsApp),
 * generar link de pago, ver estado y gestionar órdenes.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ShoppingCart, X, MessageCircle, ExternalLink,
  Copy, CheckCheck, ChevronDown, ChevronUp, AlertCircle, Loader2,
  Search, User, Check,
} from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import type { Customer, DashboardStore, Order, OrderLine } from '@/store'
import { invoiceFactory } from '@/modules/invoicing/factory'
import type { CountryCode } from '@/modules/shared/types'
import { currencyForCountry, countryMeta, fetchUsdRate, formatLocal, readPricingPref, resolveEntryCurrency, readBankDetails } from '@/lib/currency'

// ── helpers ────────────────────────────────────────────────────────────────

/** Last linked customer, kept so recurring buyers are pre-selected. */
const LAST_CUSTOMER_KEY = 'paystyle:last-customer-id'

function readLastUsedId(): string | null {
  try {
    return window.localStorage.getItem(LAST_CUSTOMER_KEY)
  } catch {
    return null
  }
}

/**
 * Tenant's registered engine for buyer-tax labels/validation, or undefined
 * when the country has no invoicing engine yet. NEVER falls back to another
 * country's engine — an AR account must not see RIF labels or VE validation.
 */
function engineForCountry(country: CountryCode) {
  try {
    return invoiceFactory.get(country)
  } catch {
    return undefined
  }
}

function statusLabel(s: Order['status']) {
  const map: Record<Order['status'], { label: string; bg: string; fg: string }> = {
    draft:           { label: 'Borrador',         bg: 'rgba(18,45,69,0.07)', fg: 'var(--muted)' },
    pending_payment: { label: 'Pago pendiente',   bg: 'rgba(217,119,6,0.1)', fg: '#b45309' },
    partially_paid:  { label: 'Pago parcial',     bg: 'rgba(99,102,241,0.1)', fg: '#4f46e5' },
    paid:            { label: 'Pagado',            bg: 'rgba(26,128,71,0.1)', fg: 'var(--success)' },
    cancelled:       { label: 'Cancelado',         bg: 'rgba(186,43,76,0.08)', fg: 'var(--danger)' },
  }
  return map[s]
}

function calcTotal(lines: OrderLine[], applyIgtf: boolean, hasFiscalEngine: boolean) {
  const subtotal = lines.reduce((s, l) => s + parseFloat(l.unitPrice) * l.quantity, 0)
  // No invoicing engine for the country (AR, MX, …) → no automatic taxes.
  // The merchant charges the plain subtotal instead of VE's 16% + 3%.
  if (!hasFiscalEngine) {
    return { subtotal, iva: 0, igtf: 0, total: subtotal }
  }
  const iva = subtotal * 0.16
  const base = subtotal + iva
  const igtf = applyIgtf ? base * 0.03 : 0
  return { subtotal, iva, igtf, total: base + igtf }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all hover:opacity-80"
      style={{ background: 'var(--surface-muted)', color: copied ? 'var(--success)' : 'var(--muted)', border: '1px solid var(--border)' }}
    >
      {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

// ── New order form ─────────────────────────────────────────────────────────

interface NewOrderFormProps {
  store: DashboardStore
  tenantId: string
  onCreated: (order: Order) => Promise<void>
  onCancel: () => void
}

function NewOrderForm({ store, tenantId, onCreated, onCancel }: NewOrderFormProps) {
  const engine = engineForCountry(store.config.country)
  // Contact examples follow the merchant's country — never VE defaults.
  const meta = countryMeta(store.config.country)
  // Merchant pricing preference (set in Config or any price toggle): the
  // whole order form reads in this currency. Storage stays USD.
  const [entryCurrency] = useState<'usd' | 'local'>(() =>
    resolveEntryCurrency(readPricingPref(tenantId), store.config.country))

  // Mount-time seed: the form opens after the tenant load, so the customer
  // list is already populated. The last-used customer is pre-selected as the
  // recurring-buyer default; everything below stays editable.
  const [seed] = useState<Customer | undefined>(() => {
    if (store.customers.length === 0) return undefined
    const last = readLastUsedId()
    return last ? store.customers.find(c => c.id === last) : undefined
  })
  const [mode, setMode] = useState<'saved' | 'new'>(store.customers.length > 0 ? 'saved' : 'new')
  const [selectedId, setSelectedId] = useState<string | null>(seed?.id ?? null)
  const [buyerName, setBuyerName] = useState(seed?.name ?? '')
  const [buyerPhone, setBuyerPhone] = useState(seed?.phone ?? '')
  const [buyerTaxId, setBuyerTaxId] = useState(seed?.taxId ?? '')
  const [buyerEmail, setBuyerEmail] = useState(seed?.email ?? '')
  const [buyerAddress, setBuyerAddress] = useState(seed?.address ?? '')
  const [saveCustomer, setSaveCustomer] = useState(store.customers.length === 0)
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<OrderLine[]>([])
  const [error, setError] = useState('')
  const [fxRate, setFxRate] = useState<number | null>(null)

  const localCurrency = currencyForCountry(store.config.country)

  useEffect(() => {
    if (localCurrency === 'USD') return
    let cancelled = false
    void fetchUsdRate(localCurrency).then(rate => {
      if (!cancelled && rate) setFxRate(rate.usdToLocal)
    })
    return () => { cancelled = true }
  }, [localCurrency])

  // Local-currency view of a USD amount, or null when the merchant prices in
  // USD / the rate hasn't loaded. Display-only: storage stays USD.
  const inLocal = (usd: number): string | null =>
    entryCurrency === 'local' && localCurrency !== 'USD' && fxRate !== null
      ? formatLocal(usd * fxRate, localCurrency)
      : null

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target instanceof Node ? e.target : null
      if (dropdownRef.current && target && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [dropdownOpen])

  const selectedCustomer = store.customers.find(c => c.id === selectedId)
  const lastUsedId = readLastUsedId()
  const query = search.trim().toLowerCase()
  const filteredCustomers = query
    ? store.customers.filter(c =>
        [c.name, c.phone, c.email, c.taxId].some(v => (v ?? '').toLowerCase().includes(query)))
    : store.customers

  const selectCustomer = (customer: Customer) => {
    setSelectedId(customer.id)
    setBuyerName(customer.name)
    setBuyerPhone(customer.phone ?? '')
    setBuyerTaxId(customer.taxId ?? '')
    setBuyerEmail(customer.email ?? '')
    setBuyerAddress(customer.address ?? '')
    setSaveCustomer(false)
    setSearch('')
    setDropdownOpen(false)
    setError('')
  }

  const switchMode = (next: 'saved' | 'new') => {
    setMode(next)
    setDropdownOpen(false)
    if (next === 'new') {
      setSelectedId(null)
      setSaveCustomer(true)
    } else {
      setSaveCustomer(false)
    }
    setError('')
  }

  // IGTF only exists in VE; without a fiscal engine there are no auto taxes.
  const hasFiscalEngine = engine !== undefined
  const { subtotal, iva, igtf, total } = calcTotal(lines, store.config.applyIgtf && hasFiscalEngine, hasFiscalEngine)

  const addLine = (productId: string) => {
    const product = store.products.find(p => p.id === productId)
    if (!product) return
    const existing = lines.find(l => l.productId === productId && !l.variantId)
    if (existing) {
      setLines(ls => ls.map(l => l.productId === productId && !l.variantId ? { ...l, quantity: l.quantity + 1 } : l))
    } else {
      setLines(ls => [...ls, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        unit: product.unit,
      }])
    }
  }

  const addVariantLine = (productId: string, variantId: string) => {
    const product = store.products.find(p => p.id === productId)
    const variant = product?.variants.find(v => v.id === variantId)
    if (!product || !variant) return
    const existing = lines.find(l => l.productId === productId && l.variantId === variantId)
    if (existing) {
      setLines(ls => ls.map(l => l.productId === productId && l.variantId === variantId ? { ...l, quantity: l.quantity + 1 } : l))
    } else {
      setLines(ls => [...ls, {
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantLabel: variant.label,
        quantity: 1,
        unitPrice: variant.price ?? product.price,
        unit: product.unit,
      }])
    }
  }

  const removeLine = (idx: number) => setLines(ls => ls.filter((_, i) => i !== idx))
  const patchQty = (idx: number, qty: number) => setLines(ls => ls.map((l, i) => i === idx ? { ...l, quantity: Math.max(1, qty) } : l))

  const [saving, setSaving] = useState(false)

  // Every store mutation is a network round trip now, so this is async: the
  // order row, its lines and the stock reservations are separate writes.
  const handleCreate = async () => {
    if (!buyerName.trim()) { setError('El nombre del comprador es requerido.'); return }
    // Only validate the buyer tax ID when the country has an invoicing
    // engine. Without one (AR, MX, …) the field is free text — validating an
    // Argentine CUIT against VE RIF rules would wrongly reject it.
    if (engine && buyerTaxId.trim() && !engine.validateBuyerTaxId(buyerTaxId.trim())) {
      setError(`El ${engine.buyerTaxIdLabel} no tiene un formato válido. Ej: ${engine.buyerTaxIdExample}`)
      return
    }
    if (lines.length === 0) { setError('Agrega al menos un producto.'); return }
    setSaving(true)
    try {
      const order = await store.addOrder({
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerTaxId: buyerTaxId.trim() || undefined,
        buyerEmail: buyerEmail.trim() || undefined,
        buyerAddress: buyerAddress.trim() || undefined,
        contactId: mode === 'saved' ? (selectedId ?? undefined) : undefined,
        lines,
        subtotal: subtotal.toFixed(2),
        taxAmount: iva.toFixed(2),
        igtfAmount: igtf.toFixed(2),
        total: total.toFixed(2),
        currency: 'USD',
        status: 'draft',
        notes: notes.trim() || undefined,
      }, { saveCustomer })
      // Remember the linked buyer as the preferred default for next time.
      const linkedId = order.contactId ?? selectedId
      if (linkedId) {
        try {
          window.localStorage.setItem(LAST_CUSTOMER_KEY, linkedId)
        } catch {
          // Sin almacenamiento local no hay cliente preferido; la orden igual se creó.
        }
      }
      await onCreated(order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la orden.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }
  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"

  return (
    <div className="overflow-hidden rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="treazury-strip" />
      <div className="p-5 space-y-4">
        <h3 className="display text-base font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>Nueva orden</h3>

        {/* Buyer — saved customer or new */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cliente *</label>
            {store.customers.length > 0 && (
              <div className="flex gap-1 rounded-xl p-0.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                {(['saved', 'new'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                    style={mode === m
                      ? { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }
                      : { color: 'var(--muted)', border: '1px solid transparent' }}
                  >
                    {m === 'saved' ? 'Guardado' : 'Nuevo'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {store.customersLoading ? (
            <p className="px-1 py-2 text-xs" style={{ color: 'var(--muted)' }}>Cargando clientes…</p>
          ) : mode === 'saved' && store.customers.length > 0 ? (
            <div className="space-y-2">
              {/* If a customer is selected and dropdown is closed, show selected summary */}
              {selectedCustomer && !dropdownOpen ? (
                <div
                  className="flex items-center justify-between rounded-2xl p-2.5 transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: 'var(--ink)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold">{selectedCustomer.name}</span>
                        {selectedCustomer.id === lastUsedId && (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-0.2 text-[10px] font-semibold"
                            style={{ background: 'rgba(26,128,71,0.1)', color: 'var(--success)' }}
                          >
                            Habitual
                          </span>
                        )}
                      </div>
                      {(selectedCustomer.phone || selectedCustomer.taxId || selectedCustomer.email) && (
                        <span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                          {[selectedCustomer.phone, selectedCustomer.taxId, selectedCustomer.email].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(true)
                        setTimeout(() => searchInputRef.current?.focus(), 50)
                      }}
                      className="rounded-xl px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--accent)' }}
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Combobox Search Input + Dropdown */}
              {(!selectedCustomer || dropdownOpen) && (
                <div ref={dropdownRef} className="relative">
                  <div className="relative">
                    <Search
                      className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--muted)' }}
                    />
                    <input
                      ref={searchInputRef}
                      className={`${inputCls} pl-10 pr-16`}
                      style={inputStyle}
                      value={search}
                      onChange={e => {
                        setSearch(e.target.value)
                        if (!dropdownOpen) setDropdownOpen(true)
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      placeholder={`Buscar por nombre, WhatsApp, ${engine ? engine.buyerTaxIdLabel : 'documento'} o email…`}
                      autoComplete="off"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {search && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('')
                            searchInputRef.current?.focus()
                          }}
                          className="flex size-5 items-center justify-center rounded-full hover:opacity-70"
                          style={{ color: 'var(--muted)' }}
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(o => !o)}
                        className="flex size-6 items-center justify-center rounded-lg hover:opacity-70 transition-all"
                        style={{ color: 'var(--muted)' }}
                      >
                        {dropdownOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl p-1 space-y-0.5 shadow-xl"
                        style={{
                          background: 'var(--surface-strong)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 8px 30px rgba(18,45,69,0.12)',
                        }}
                      >
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-center text-xs space-y-1.5" style={{ color: 'var(--muted)' }}>
                            <p>Sin coincidencias para “{search}”</p>
                            <button
                              type="button"
                              onClick={() => {
                                switchMode('new')
                                setBuyerName(search)
                                setDropdownOpen(false)
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                              style={{ color: 'var(--accent)' }}
                            >
                              <Plus className="size-3" />
                              Usar como nuevo comprador
                            </button>
                          </div>
                        ) : (
                          <>
                            {filteredCustomers.map(customer => {
                              const active = customer.id === selectedId
                              return (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => selectCustomer(customer)}
                                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-all hover:opacity-90"
                                  style={active
                                    ? { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.35)', color: 'var(--ink)' }
                                    : { background: 'transparent', border: '1px solid transparent', color: 'var(--ink)' }}
                                >
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                      <span className="truncate text-xs font-bold">{customer.name}</span>
                                      {customer.id === lastUsedId && (
                                        <span
                                          className="shrink-0 rounded-full px-1.5 py-0.2 text-[10px] font-semibold"
                                          style={{ background: 'rgba(26,128,71,0.1)', color: 'var(--success)' }}
                                        >
                                          Habitual
                                        </span>
                                      )}
                                    </span>
                                    {(customer.phone || customer.taxId || customer.email) && (
                                      <span className="block truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                                        {[customer.phone, customer.taxId, customer.email].filter(Boolean).join(' · ')}
                                      </span>
                                    )}
                                  </span>

                                  {active && (
                                    <Check className="size-4 shrink-0" style={{ color: 'var(--accent)' }} />
                                  )}
                                </button>
                              )
                            })}

                            <div className="border-t pt-1 mt-1" style={{ borderColor: 'var(--border)' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  switchMode('new')
                                  setDropdownOpen(false)
                                }}
                                className="flex w-full items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-all"
                                style={{ color: 'var(--accent)' }}
                              >
                                <Plus className="size-3.5" />
                                Registrar nuevo cliente
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Nombre del comprador *</label>
              <input className={inputCls} style={inputStyle} value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Ej: Comercio El Centro" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                WhatsApp <span className="font-normal opacity-60">({meta.dialCode}…)</span>
              </label>
              <input className={inputCls} style={inputStyle} value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder={`${meta.dialCode} ${meta.phoneExample}`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                {engine ? engine.buyerTaxIdLabel : 'ID fiscal'} <span className="font-normal opacity-60">(opcional)</span>
              </label>
              <input className={inputCls} style={inputStyle} value={buyerTaxId} onChange={e => setBuyerTaxId(e.target.value)} placeholder={engine ? engine.buyerTaxIdPlaceholder : 'Documento fiscal del comprador'} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Email <span className="font-normal opacity-60">(opcional)</span>
              </label>
              <input className={inputCls} style={inputStyle} value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} placeholder="cliente@correo.com" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Dirección <span className="font-normal opacity-60">(opcional)</span>
            </label>
            <input className={inputCls} style={inputStyle} value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder={`Av. Principal, ${meta.cityExample}`} />
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
            <input
              type="checkbox"
              checked={saveCustomer}
              onChange={e => setSaveCustomer(e.target.checked)}
              className="size-4 accent-indigo-500"
            />
            {mode === 'saved' && selectedId
              ? 'Actualizar los datos del cliente guardado con estos cambios'
              : 'Guardar como cliente para próximas órdenes'}
          </label>
        </div>

        {/* Product picker */}
        <div>
          <label className="mb-2 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Agregar productos del catálogo</label>
          <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
            {store.products.length === 0 ? (
              <p className="px-3 py-3 text-xs" style={{ color: 'var(--muted)' }}>Sin productos en catálogo. Agrégalos primero.</p>
            ) : store.products.map(product => (
              <div key={product.id}>
                {product.variants.length > 0 ? (
                  product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => addVariantLine(product.id, v.id)}
                      disabled={v.stock === 0}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ color: 'var(--ink)', background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      <span>{product.name} — <span className="font-medium">{v.label}</span></span>
                      <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span className="tabular-nums">${parseFloat(v.price ?? product.price).toFixed(2)}</span>
                        {inLocal(parseFloat(v.price ?? product.price)) && (
                          <span className="tabular-nums" style={{ color: 'var(--subtle)' }}>≈ {inLocal(parseFloat(v.price ?? product.price))}</span>
                        )}
                        <span style={{ color: v.stock === 0 ? 'var(--danger)' : 'var(--success)' }}>({v.stock} disp.)</span>
                        <Plus className="size-3.5" style={{ color: 'var(--accent)' }} />
                      </span>
                    </button>
                  ))
                ) : (
                  <button
                    key={product.id}
                    onClick={() => addLine(product.id)}
                    disabled={product.stock === 0}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-sm transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ color: 'var(--ink)', background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}
                  >
                      <span>{product.name}</span>
                      <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span className="tabular-nums">${parseFloat(product.price).toFixed(2)}</span>
                        {inLocal(parseFloat(product.price)) && (
                          <span className="tabular-nums" style={{ color: 'var(--subtle)' }}>≈ {inLocal(parseFloat(product.price))}</span>
                        )}
                        <span style={{ color: product.stock === 0 ? 'var(--danger)' : 'var(--success)' }}>({product.stock} disp.)</span>
                        <Plus className="size-3.5" style={{ color: 'var(--accent)' }} />
                      </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order lines */}
        {lines.length > 0 && (
          <div className="space-y-1.5">
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Líneas del pedido</label>
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <span className="flex-1 truncate text-xs font-medium" style={{ color: 'var(--ink)' }}>
                  {line.productName}{line.variantLabel ? ` — ${line.variantLabel}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => patchQty(idx, line.quantity - 1)} className="flex size-6 items-center justify-center rounded-lg text-sm font-bold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>−</button>
                  <span className="mono w-6 text-center text-xs tabular-nums" style={{ color: 'var(--ink)' }}>{line.quantity}</span>
                  <button onClick={() => patchQty(idx, line.quantity + 1)} className="flex size-6 items-center justify-center rounded-lg text-sm font-bold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>+</button>
                </div>
                <span className="mono w-24 text-right text-xs tabular-nums" style={{ color: 'var(--ink-2)' }}>
                  ${(parseFloat(line.unitPrice) * line.quantity).toFixed(2)}
                  {inLocal(parseFloat(line.unitPrice) * line.quantity) && (
                    <span className="block text-[10px]" style={{ color: 'var(--subtle)' }}>
                      ≈ {inLocal(parseFloat(line.unitPrice) * line.quantity)}
                    </span>
                  )}
                </span>
                <button onClick={() => removeLine(idx)}><X className="size-3.5" style={{ color: 'var(--subtle)' }} /></button>
              </div>
            ))}

            {/* Totals */}
            <div className="rounded-xl px-3 py-3 space-y-1" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              {[
                { label: 'Subtotal', value: subtotal },
                ...(hasFiscalEngine ? [{ label: 'IVA 16%', value: iva }] : []),
                ...(hasFiscalEngine && store.config.applyIgtf ? [{ label: 'IGTF 3%', value: igtf }] : []),
              ].map(row => (
                <div key={row.label} className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                  <span>{row.label}</span>
                  <span className="mono tabular-nums">${row.value.toFixed(2)}</span>
                </div>
              ))}
              {!hasFiscalEngine && (
                <p className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                  Sin impuestos automáticos — facturación aún no disponible para tu país.
                </p>
              )}
              {inLocal(total) ? (
                <>
                  <div className="flex justify-between border-t pt-1.5 text-sm font-bold" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
                    <span>Total {localCurrency}</span>
                    <span className="mono tabular-nums">{inLocal(total)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                    <span>Se cobra en USDC</span>
                    <span className="flex items-center gap-1 mono tabular-nums">
                      <TokenUSDC variant="branded" size={14} />
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-t pt-1.5 text-sm font-bold" style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}>
                    <span>Total USDC</span>
                    <span className="flex items-center gap-1 mono tabular-nums">
                      <TokenUSDC variant="branded" size={14} />
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  {localCurrency !== 'USD' && fxRate !== null && (
                    <div className="flex justify-between text-xs" style={{ color: 'var(--muted)' }}>
                      <span>≈ Total en {localCurrency}</span>
                      <span className="mono tabular-nums">
                        {formatLocal(total * fxRate, localCurrency)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Notas</label>
          <input className={inputCls} style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instrucciones especiales, plazo de entrega…" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-2xl py-3 text-sm font-semibold transition-all hover:opacity-80" style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}>Cancelar</button>
          <button onClick={() => { void handleCreate() }} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--accent)' }}>
            <ShoppingCart className="size-4" /> {saving ? 'Guardando…' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Order card ─────────────────────────────────────────────────────────────

function OrderCard({ order, store, tenantId }: { order: Order; store: DashboardStore; tenantId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [actionError, setActionError] = useState('')
  const st = statusLabel(order.status)
  // Buyer display currency + merchant/bank details for the payment link.
  const linkExtra = (() => {
    const c = currencyForCountry(store.config.country)
    const bank = readBankDetails(tenantId)
    const params = new URLSearchParams()
    if (c !== 'USD') params.set('display', c)
    if (store.config.name) params.set('mname', store.config.name)
    if (bank.bankName) params.set('bname', bank.bankName)
    if (bank.alias) params.set('balias', bank.alias)
    if (bank.account) params.set('bacct', bank.account)
    const s = params.toString()
    return s ? `&${s}` : ''
  })()
  const payUrl = `${window.location.origin}?to=${store.merchantAddress}&amount=${order.total}&chargeId=${order.id}&memo=${encodeURIComponent(order.orderNumber)}${linkExtra}`

  // Writing the link also creates the charge row (charges.payment_url is where
  // the URL lives), so it is a round trip that can fail under RLS.
  const handleGenerateLink = () => {
    setActionError('')
    void store.updateOrder(order.id, { status: 'pending_payment', paymentUrl: payUrl })
      .catch((err: unknown) => setActionError(err instanceof Error ? err.message : 'No se pudo generar el link de pago.'))
  }

  const handleCancel = () => {
    setActionError('')
    void store.updateOrder(order.id, { status: 'cancelled' })
      .catch((err: unknown) => setActionError(err instanceof Error ? err.message : 'No se pudo cancelar la orden.'))
  }

  const [markingPaid, setMarkingPaid] = useState(false)
  const handleMarkPaid = () => {
    setActionError('')
    setMarkingPaid(true)
    void store.markChargePaid(order.id)
      .catch((err: unknown) => setActionError(err instanceof Error ? err.message : 'No se pudo marcar como pagado.'))
      .finally(() => setMarkingPaid(false))
  }

  const waText = encodeURIComponent(
    `Hola ${order.buyerName}! Tu pedido ${order.orderNumber} por $${parseFloat(order.total).toFixed(2)} USDC está listo.\n\nLink de pago: ${payUrl}`
  )

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="mono text-xs font-semibold" style={{ color: 'var(--ink)' }}>{order.orderNumber}</p>
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: st.bg, color: st.fg }}>{st.label}</span>
          </div>
          <p className="mt-0.5 text-sm font-medium" style={{ color: 'var(--ink-2)' }}>{order.buyerName}</p>
          {order.buyerPhone && (
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>{order.buyerPhone}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="display text-base font-bold tabular-nums" style={{ color: 'var(--ink)' }}>${parseFloat(order.total).toFixed(2)}</p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 border-t px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          style={{ color: 'var(--muted)' }}
        >
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          Detalle
        </button>

        {order.status === 'draft' && (
          <button
            onClick={handleGenerateLink}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent)' }}
          >
            <ExternalLink className="size-3.5" /> Generar link de pago
          </button>
        )}

        {order.paymentUrl && (
          <>
            <CopyBtn text={order.paymentUrl} />
            {order.buyerPhone && (
              <a
                href={`https://wa.me/${order.buyerPhone.replace(/\D/g, '')}?text=${waText}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: '#25D366' }}
              >
                <MessageCircle className="size-3.5" /> Enviar WA
              </a>
            )}
          </>
        )}

        {(order.status === 'pending_payment' || order.status === 'partially_paid') && (
          <button
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'rgba(26,128,71,0.1)', color: 'var(--success)', border: '1px solid rgba(26,128,71,0.2)' }}
          >
            <CheckCheck className="size-3.5" /> {markingPaid ? 'Marcando…' : 'Marcar como pagado'}
          </button>
        )}

        {order.status !== 'cancelled' && order.status !== 'paid' && (
          <button
            onClick={handleCancel}
            className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
            style={{ color: 'var(--danger)' }}
          >
            <X className="size-3.5" /> Cancelar
          </button>
        )}
      </div>

      {actionError && (
        <div className="flex items-start gap-2 border-t px-4 py-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
          <AlertCircle className="mt-px size-3.5 shrink-0" /> {actionError}
        </div>
      )}

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
              {order.lines.map((line, i) => (
                <div key={i} className="flex justify-between text-xs" style={{ color: 'var(--ink-2)' }}>
                  <span>{line.productName}{line.variantLabel ? ` — ${line.variantLabel}` : ''} × {line.quantity} {line.unit}</span>
                  <span className="mono tabular-nums">${(parseFloat(line.unitPrice) * line.quantity).toFixed(2)}</span>
                </div>
              ))}
              {order.notes && (
                <p className="text-xs italic" style={{ color: 'var(--subtle)' }}>"{order.notes}"</p>
              )}
              {order.paymentUrl && (
                <div className="mt-2 rounded-xl p-2.5 text-xs font-mono break-all" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
                  {order.paymentUrl}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function OrdersView({ store, tenantId }: { store: DashboardStore; tenantId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  // Buyer display currency for payment links (settlement stays USDC).
  const displayQuery = (() => {
    const c = currencyForCountry(store.config.country)
    return c === 'USD' ? '' : `&display=${c}`
  })()
  // Merchant identity + bank details for the payment page (Linktree header
  // + transfer option). Read live so just-saved Config applies to next link.
  const merchantQuery = (() => {
    const bank = readBankDetails(tenantId)
    const params = new URLSearchParams()
    if (store.config.name) params.set('mname', store.config.name)
    if (bank.bankName) params.set('bname', bank.bankName)
    if (bank.alias) params.set('balias', bank.alias)
    if (bank.account) params.set('bacct', bank.account)
    const s = params.toString()
    return s ? `&${s}` : ''
  })()

  // The order is already persisted by the time this runs, so a failure here
  // must not look like a failed creation: the order stays, the error says
  // only that the payment link was not generated.
  const handleCreated = async (order: Order) => {
    setShowForm(false)
    const payUrl = `${window.location.origin}?to=${store.merchantAddress}&amount=${order.total}&chargeId=${order.id}&memo=${encodeURIComponent(order.orderNumber)}${displayQuery}${merchantQuery}`
    try {
      await store.updateOrder(order.id, { status: 'pending_payment', paymentUrl: payUrl })
      setLinkError('')
    } catch (err) {
      setLinkError(`Orden ${order.orderNumber} creada, pero no se pudo generar el link de pago: ${err instanceof Error ? err.message : 'error desconocido'}`)
    }
  }

  const q = query.trim().toLowerCase()
  const matches = (o: Order) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (!q) return true
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.buyerName ?? '').toLowerCase().includes(q) ||
      (o.buyerPhone ?? '').toLowerCase().includes(q) ||
      (o.paymentUrl ?? '').toLowerCase().includes(q)
    )
  }
  const filtered = store.orders.filter(matches)
  const pending = filtered.filter(o => o.status === 'pending_payment' || o.status === 'partially_paid')
  const rest = filtered.filter(o => o.status !== 'pending_payment' && o.status !== 'partially_paid')
  const hasQuery = q !== '' || statusFilter !== 'all'

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {store.orders.length} orden{store.orders.length !== 1 ? 'es' : ''}
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="size-4" /> Nueva orden
        </button>
      </div>

      {store.orders.length > 0 && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--subtle)' }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por N°, cliente, teléfono…"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: 'Todas' },
                { key: 'pending_payment', label: 'Pendientes' },
                { key: 'paid', label: 'Pagadas' },
                { key: 'draft', label: 'Borradores' },
                { key: 'cancelled', label: 'Canceladas' },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-all"
                style={
                  statusFilter === tab.key
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {linkError && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="flex-1">{linkError}</span>
          <button onClick={() => setLinkError('')}><X className="size-3.5" /></button>
        </div>
      )}

      {store.loading && store.orders.length === 0 && (
        <div className="flex items-center gap-2 px-1 py-6 text-xs" style={{ color: 'var(--muted)' }}>
          <Loader2 className="size-3.5 animate-spin" /> Cargando órdenes…
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <NewOrderForm store={store} tenantId={tenantId} onCreated={handleCreated} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {store.orders.length === 0 && !showForm && !store.loading && (
        <div className="flex flex-col items-center gap-3 rounded-3xl py-16 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ShoppingCart className="size-10" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Sin órdenes todavía</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Crea una nueva orden para generar un link de pago.</p>
        </div>
      )}

      {store.orders.length > 0 && hasQuery && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl py-16 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Search className="size-10" style={{ color: 'var(--subtle)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>Sin resultados</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>No hay órdenes que coincidan con tu búsqueda.</p>
          <button
            onClick={() => { setQuery(''); setStatusFilter('all') }}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {pending.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Pendientes de pago</p>
            {pending.map(o => <OrderCard key={o.id} order={o} store={store} tenantId={tenantId} />)}
          </div>
        )}
        {rest.length > 0 && (
          <div className="space-y-3">
            {pending.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>Historial</p>}
            {rest.map(o => <OrderCard key={o.id} order={o} store={store} tenantId={tenantId} />)}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
