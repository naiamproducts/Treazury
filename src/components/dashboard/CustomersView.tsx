/**
 * CustomersView — management of saved customers/buyers.
 * Search, register, edit and link customers to orders and charges.
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin,
  X, Check, AlertCircle, ShoppingCart, MessageCircle,
} from 'lucide-react'
import type { DashboardStore, Customer } from '@/store'
import { countryMeta } from '@/lib/currency'
import { invoiceFactory } from '@/modules/invoicing/factory'
import type { CountryCode } from '@/modules/shared/types'
import { t } from '@/i18n/t'
import { storeErrorMessage } from './CatalogView'

function engineForCountry(country: CountryCode) {
  try {
    return invoiceFactory.get(country)
  } catch {
    return undefined
  }
}

const LAST_CUSTOMER_KEY = 'paystyle:last-customer-id'


function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// ── Customer Form (Add / Edit) ──────────────────────────────────────────────

interface CustomerFormProps {
  initial?: Customer
  country: CountryCode
  onSave: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
}

function CustomerForm({ initial, country, onSave, onCancel }: CustomerFormProps) {
  const meta = countryMeta(country)
  const engine = engineForCountry(country)

  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [taxId, setTaxId] = useState(initial?.taxId ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const inputStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }
  const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-400'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('customers.nameRequired'))
      return
    }

    const trimmedTaxId = taxId.trim()
    if (engine && trimmedTaxId && !engine.validateBuyerTaxId(trimmedTaxId)) {
      setError(t('customers.error.validateTaxId', {
        label: engine.buyerTaxIdLabel,
        example: engine.buyerTaxIdExample,
      }))
      return
    }

    setError('')
    setSaving(true)
    void onSave({
      name: trimmedName,
      phone: phone.trim() || undefined,
      taxId: trimmedTaxId || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    }).catch(err => {
      // StoreError.message is a debug detail — map the code to errors.store.* for display.
      setError(storeErrorMessage(err))
    }).finally(() => {
      setSaving(false)
    })
  }

  return (
    <div className="overflow-hidden rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="treazury-strip" />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="display text-base font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {initial ? t('customers.edit') : t('customers.new')}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-70"
            style={{ color: 'var(--muted)' }}
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError('')}><X className="size-3.5" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {t('customers.field.name')}
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('customers.field.namePlaceholder')}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {t('customers.field.phone')} <span className="font-normal opacity-60">({meta.dialCode})</span>
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={`${meta.dialCode} ${meta.phoneExample}`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {engine ? engine.buyerTaxIdLabel : t('customers.field.taxIdFallback')} <span className="font-normal opacity-60">{t('customers.optional')}</span>
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              placeholder={engine ? engine.buyerTaxIdPlaceholder : t('customers.field.taxIdPlaceholderFallback')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              Email <span className="font-normal opacity-60">{t('customers.optional')}</span>
            </label>
            <input
              type="email"
              className={inputCls}
              style={inputStyle}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('customers.field.emailPlaceholder')}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {t('customers.field.address')} <span className="font-normal opacity-60">{t('customers.optional')}</span>
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={t('customers.field.addressPlaceholder', { city: meta.cityExample })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {t('customers.field.notes')} <span className="font-normal opacity-60">{t('customers.optional')}</span>
            </label>
            <input
              className={inputCls}
              style={inputStyle}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('customers.field.notesPlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            {t('customers.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <Check className="size-4" />
            {saving ? t('customers.saving') : initial ? t('customers.saveChanges') : t('customers.add')}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Customer Card ────────────────────────────────────────────────────────────

interface CustomerCardProps {
  customer: Customer
  ordersCount: number
  isHabitual: boolean
  country: CountryCode
  onEdit: () => void
  onDelete: () => void
  onNewOrder: () => void
}

function CustomerCard({
  customer,
  ordersCount,
  isHabitual,
  country,
  onEdit,
  onDelete,
  onNewOrder,
}: CustomerCardProps) {
  const engine = engineForCountry(country)
  const phoneClean = customer.phone ? customer.phone.replace(/\D/g, '') : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="flex flex-col justify-between overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="p-4 space-y-3">
        {/* Top bar with avatar, name and habitual badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
              style={{
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}
            >
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--ink)' }} data-purpose="stored-data">
                  {customer.name}
                </p>
                {isHabitual && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'rgba(26,128,71,0.1)', color: 'var(--success)' }}
                  >
                    {t('customers.frequent')}
                  </span>
                )}
              </div>
              {customer.taxId && (
                <p className="mono text-xs" style={{ color: 'var(--muted)' }} data-purpose="stored-data">
                  {engine ? `${engine.buyerTaxIdLabel}: ` : ''}{customer.taxId}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-80"
              style={{ color: 'var(--muted)', background: 'var(--surface-muted)' }}
              title={t('customers.edit')}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-80"
              style={{ color: 'var(--danger)', background: 'rgba(186,43,76,0.06)' }}
              title={t('customers.delete')}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Details list */}
        <div className="space-y-1.5 text-xs" style={{ color: 'var(--ink-2)' }}>
          {customer.phone && (
            <div className="flex items-center gap-2 truncate">
              <Phone className="size-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
              <span className="truncate" data-purpose="stored-data">{customer.phone}</span>
              {phoneClean && (
                <a
                  href={`https://wa.me/${phoneClean}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 ml-auto text-[11px] font-medium text-emerald-600 hover:underline shrink-0"
                  onClick={e => e.stopPropagation()}
                >
                  <MessageCircle className="size-3" /> WhatsApp
                </a>
              )}
            </div>
          )}

          {customer.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="size-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
              <span className="truncate" data-purpose="stored-data">{customer.email}</span>
            </div>
          )}

          {customer.address && (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="size-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
              <span className="truncate" style={{ color: 'var(--muted)' }} data-purpose="stored-data">{customer.address}</span>
            </div>
          )}

          {customer.notes && (
            <p className="pt-1 text-[11px] italic" style={{ color: 'var(--muted)' }} data-purpose="stored-data">
              “{customer.notes}”
            </p>
          )}
        </div>
      </div>

      {/* Card footer: Orders count & New Order button */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}
      >
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {t(ordersCount === 1 ? 'customers.countOne' : 'customers.countMany', { count: ordersCount })}
        </span>

        <button
          onClick={onNewOrder}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'var(--accent)' }}
        >
          <ShoppingCart className="size-3.5" />
          {t('customers.newOrder')}
        </button>
      </div>
    </motion.div>
  )
}

// ── Root View ────────────────────────────────────────────────────────────────

interface CustomersViewProps {
  store: DashboardStore
  tenantId?: string
  onNavigateToOrders?: () => void
}

export default function CustomersView({ store, onNavigateToOrders }: CustomersViewProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const engine = engineForCountry(store.config.country)

  const [lastUsedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_CUSTOMER_KEY)
    } catch {
      return null
    }
  })

  const query = search.trim().toLowerCase()
  const filteredCustomers = useMemo(() => {
    if (!query) return store.customers
    return store.customers.filter(c =>
      [c.name, c.phone, c.email, c.taxId, c.address, c.notes].some(v =>
        (v ?? '').toLowerCase().includes(query)
      )
    )
  }, [store.customers, query])

  const handleSave = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError('')
    try {
      if (editingId) {
        await store.updateCustomer(editingId, data)
      } else {
        await store.addCustomer(data)
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      // StoreError.message is a debug detail — map the code to errors.store.* for display.
      setError(storeErrorMessage(err))
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    setError('')
    try {
      await store.deleteCustomer(id)
      setConfirmDeleteId(null)
    } catch (err) {
      setError(storeErrorMessage(err))
    }
  }

  const handleNewOrderForCustomer = (customer: Customer) => {
    try {
      localStorage.setItem(LAST_CUSTOMER_KEY, customer.id)
    } catch {
      // safe storage fallback
    }
    if (onNavigateToOrders) {
      onNavigateToOrders()
    }
  }

  const editingCustomer = editingId ? store.customers.find(c => c.id === editingId) : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {t(store.customers.length === 1 ? 'customers.registeredOne' : 'customers.registeredMany', {
              count: store.customers.length,
            })}
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="size-4" /> {t('customers.new')}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="size-3.5" /></button>
        </div>
      )}

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="customer-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <CustomerForm
              initial={editingCustomer}
              country={store.config.country}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingId(null) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar when customers exist */}
      {store.customers.length > 0 && !showForm && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            className="w-full rounded-2xl pl-10 pr-9 py-2.5 text-sm outline-none transition-all focus:border-indigo-400"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('customers.searchPlaceholder', {
              doc: engine ? engine.buyerTaxIdLabel : t('customers.searchDocFallback'),
            })}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--muted)' }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(18,45,69,0.45)', backdropFilter: 'blur(3px)' }}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-5 space-y-4"
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: 'rgba(186,43,76,0.1)', color: 'var(--danger)' }}>
                  <Trash2 className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{t('customers.confirmDelete')}</h4>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('customers.deleteWarning')}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                >
                  {t('customers.cancel')}
                </button>
                <button
                  onClick={() => void handleDelete(confirmDeleteId)}
                  className="flex-1 rounded-xl py-2 text-xs font-semibold text-white"
                  style={{ background: 'var(--danger)' }}
                >
                  {t('customers.confirmDeleteYes')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State: No customers at all */}
      {store.customers.length === 0 && !showForm && (
        <div
          className="flex flex-col items-center gap-3 rounded-3xl py-16 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
            <Users className="size-7" />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{t('customers.empty')}</p>
          <p className="max-w-xs text-xs" style={{ color: 'var(--muted)' }}>
            {t('customers.emptyHint')}
          </p>
          <button
            onClick={() => { setEditingId(null); setShowForm(true) }}
            className="mt-2 flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent)' }}
          >
            <Plus className="size-3.5" /> {t('customers.addFirst')}
          </button>
        </div>
      )}

      {/* Empty State: Search filter yields 0 matches */}
      {store.customers.length > 0 && filteredCustomers.length === 0 && !showForm && (
        <div
          className="flex flex-col items-center gap-2 rounded-2xl py-12 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Search className="size-6" style={{ color: 'var(--subtle)' }} />
          <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
            {t('customers.noResults', { query: search })}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {t('customers.noResultsHint')}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setSearch('')}
              className="rounded-xl px-3 py-1.5 text-xs font-medium"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              {t('customers.clearSearch')}
            </button>
            <button
              onClick={() => { setEditingId(null); setShowForm(true) }}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'var(--accent)' }}
            >
              {t('customers.createNew')}
            </button>
          </div>
        </div>
      )}

      {/* Customer Cards Grid — stored tenant data is marked per-node
          data-purpose="stored-data" inside CustomerCard (e2e/09 case). */}
      {filteredCustomers.length > 0 && !showForm && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredCustomers.map(customer => {
            const ordersCount = store.orders.filter(o => o.contactId === customer.id).length
            return (
              <CustomerCard
                key={customer.id}
                customer={customer}
                ordersCount={ordersCount}
                isHabitual={customer.id === lastUsedId}
                country={store.config.country}
                onEdit={() => {
                  setEditingId(customer.id)
                  setShowForm(true)
                }}
                onDelete={() => setConfirmDeleteId(customer.id)}
                onNewOrder={() => handleNewOrderForCustomer(customer)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
