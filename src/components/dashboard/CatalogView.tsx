/**
 * CatalogView — product management with dynamic fields, variants and stock.
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp,
  X, Check, AlertCircle,
} from 'lucide-react'
import type { DashboardStore, Product, ProductVariant, FieldDefinition } from '@/store'
import { currencyForCountry, fetchUsdRate, formatLocal, readPricingPref, writePricingPref, resolveEntryCurrency } from '@/lib/currency'
import type { PricingPref } from '@/lib/currency'
import { t } from '@/i18n/t'
import { StoreError } from '@/store/errors'

/**
 * Localized English message for a thrown mutation error — never blank.
 * A StoreError maps its code to the `errors.store.*` catalog; any other
 * `Error` keeps its own message (viem/SDK diagnostics are English);
 * anything else falls back to `errors.store.unknown`.
 */
export function storeErrorMessage(thrown: unknown): string {
  if (thrown instanceof StoreError) return t(`errors.store.${thrown.code}`)
  if (thrown instanceof Error && thrown.message) return thrown.message
  return t('errors.store.unknown')
}


// ── helpers ────────────────────────────────────────────────────────────────

function newVariant(): ProductVariant {
  return { id: Math.random().toString(36).slice(2, 8), label: '', stock: 0 }
}

function newFieldDef(): FieldDefinition {
  return { key: '', label: '', type: 'text' }
}

// Stored unit values are stable ids (data written by the merchant); labels
// come from the catalog so the picker reads in English (PR7a).
const UNITS = [
  { value: 'unidad', labelKey: 'catalog.unitOption.unit' },
  { value: 'docena', labelKey: 'catalog.unitOption.dozen' },
  { value: 'caja', labelKey: 'catalog.unitOption.box' },
  { value: 'par', labelKey: 'catalog.unitOption.pair' },
  { value: 'litro', labelKey: 'catalog.unitOption.liter' },
  { value: 'kg', labelKey: 'catalog.unitOption.kg' },
  { value: 'metro', labelKey: 'catalog.unitOption.meter' },
  { value: 'rollo', labelKey: 'catalog.unitOption.roll' },
  { value: 'juego', labelKey: 'catalog.unitOption.set' },
] as const

// ── Stock badge ────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  const color = stock === 0
    ? { bg: 'rgba(186,43,76,0.1)', fg: 'var(--danger)' }
    : stock < 5
    ? { bg: 'rgba(217,119,6,0.1)', fg: '#b45309' }
    : { bg: 'rgba(26,128,71,0.1)', fg: 'var(--success)' }
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
      style={{ background: color.bg, color: color.fg }}
    >
      {stock} {t('catalog.stockUnit')}
    </span>
  )
}

// ── Product form (add/edit) ────────────────────────────────────────────────

interface ProductFormProps {
  initial?: Product
  onSave: (data: Omit<Product, 'id' | 'createdAt'>) => void
  onCancel: () => void
  localCurrency: string
  fxRate: number | null
  /** Entry mode from the merchant's pricing preference (auto-resolved). */
  initialCurrency: 'usd' | 'local'
  /** Persists toggle changes back to the preference — pick once, sticks everywhere. */
  onCurrencyChange: (mode: 'usd' | 'local') => void
}

function ProductForm({ initial, onSave, onCancel, localCurrency, fxRate, initialCurrency, onCurrencyChange }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [sku, setSku] = useState(initial?.sku ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  // Stored prices are always USD. When editing with a local-currency
  // preference, convert once for display (needs fxRate; falls back to the
  // raw USD value while the rate loads).
  const [price, setPrice] = useState(() => {
    if (initial?.price && initialCurrency === 'local' && fxRate && fxRate > 0) {
      return String(parseFloat(initial.price) * fxRate)
    }
    return initial?.price ?? ''
  })
  const [priceCurrency, setPriceCurrency] = useState<'usd' | 'local'>(initialCurrency)
  const [unit, setUnit] = useState(initial?.unit ?? 'unidad')
  const [stock, setStock] = useState(String(initial?.stock ?? 0))
  const [variants, setVariants] = useState<ProductVariant[]>(initial?.variants ?? [])
  const [fieldDefs, setFieldDefs] = useState<FieldDefinition[]>(initial?.fieldDefs ?? [])
  const [customFields, setCustomFields] = useState<Record<string, string | number | boolean>>(initial?.customFields ?? {})
  const [showVariants, setShowVariants] = useState((initial?.variants.length ?? 0) > 0)
  const [showCustomFields, setShowCustomFields] = useState((initial?.fieldDefs.length ?? 0) > 0)
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!name.trim()) { setError(t('catalog.error.validateName')); return }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setError(t('catalog.error.validatePrice')); return
    }
    // Convert local currency to USD for storage (prices are always stored in USD/USDC)
    let usdPrice = parseFloat(price)
    if (priceCurrency === 'local' && fxRate && fxRate > 0) {
      usdPrice = usdPrice / fxRate
    }
    const totalStock = variants.length > 0
      ? variants.reduce((s, v) => s + v.stock, 0)
      : parseInt(stock, 10) || 0

    void onSave({
      name: name.trim(), sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      price: usdPrice.toFixed(2),
      unit, stock: totalStock,
      variants: variants.filter(v => v.label.trim()),
      fieldDefs: fieldDefs.filter(f => f.key.trim() && f.label.trim()),
      customFields,
    })
  }

  const addVariant = () => setVariants(v => [...v, newVariant()])
  const removeVariant = (id: string) => setVariants(v => v.filter(x => x.id !== id))
  const patchVariant = (id: string, patch: Partial<ProductVariant>) =>
    setVariants(v => v.map(x => x.id === id ? { ...x, ...patch } : x))

  const addFieldDef = () => setFieldDefs(f => [...f, newFieldDef()])
  const removeFieldDef = (idx: number) => {
    const removed = fieldDefs[idx]
    setFieldDefs(f => f.filter((_, i) => i !== idx))
    setCustomFields(cf => { const c = { ...cf }; delete c[removed.key]; return c })
  }
  const patchFieldDef = (idx: number, patch: Partial<FieldDefinition>) => {
    setFieldDefs(f => f.map((x, i) => i === idx ? { ...x, ...patch } : x))
  }

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:ring-2"
  const inputStyle = {
    background: 'var(--surface-muted)',
    border: '1px solid var(--border)',
    color: 'var(--ink)',
  }

  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
    >
      {/* Rainbow strip */}
      <div className="treazury-strip" />

      <div className="p-5 space-y-4">
        <h3 className="display text-base font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {initial ? t('catalog.edit') : t('catalog.new')}
        </h3>

        {/* Basic fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.nameLabel')}</label>
            <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder={t('catalog.name')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.sku')}</label>
            <input className={inputCls} style={inputStyle} value={sku} onChange={e => setSku(e.target.value)} placeholder="NEU-205-55R16" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.unit')}</label>
            <select className={inputCls} style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)}>
              {UNITS.map(u => <option key={u.value} value={u.value}>{t(u.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.price')}</label>
              {localCurrency !== 'USD' && (
                <div className="flex overflow-hidden rounded-lg text-[11px] font-semibold" style={{ border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => { setPriceCurrency('usd'); onCurrencyChange('usd') }}
                    disabled={fxRate === null}
                    className="px-2 py-0.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: priceCurrency === 'usd' ? 'var(--accent)' : 'var(--surface-muted)', color: priceCurrency === 'usd' ? '#fff' : 'var(--muted)' }}
                  >USD</button>
                  <button
                    type="button"
                    onClick={() => { setPriceCurrency('local'); onCurrencyChange('local') }}
                    disabled={fxRate === null}
                    className="px-2 py-0.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: priceCurrency === 'local' ? 'var(--accent)' : 'var(--surface-muted)', color: priceCurrency === 'local' ? '#fff' : 'var(--muted)' }}
                  >{localCurrency}</button>
                  {fxRate === null && <span className="px-2 py-0.5 text-[10px]" style={{ color: 'var(--subtle)' }}>{t('catalog.rateLoading')}</span>}
                </div>
              )}
            </div>
            <input className={inputCls} style={inputStyle} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            {price && parseFloat(price) > 0 && localCurrency !== 'USD' && fxRate !== null && (
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                {priceCurrency === 'usd'
                  ? `≈ ${formatLocal(parseFloat(price) * fxRate, localCurrency as never)}`
                  : `≈ $${(parseFloat(price) / fxRate).toFixed(2)} USD`}
              </p>
            )}
            {price && parseFloat(price) > 0 && localCurrency !== 'USD' && fxRate === null && (
              <p className="mt-1 text-xs" style={{ color: 'var(--subtle)' }}>{t('charges.equivalent')}</p>
            )}
          </div>
          {!showVariants && (
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.stock')}</label>
              <input className={inputCls} style={inputStyle} inputMode="numeric" value={stock} onChange={e => setStock(e.target.value.replace(/\D/g, ''))} placeholder="0" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('catalog.description')}</label>
            <input className={inputCls} style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('catalog.descriptionPlaceholder')} />
          </div>
        </div>

        {/* Variants toggle */}
        <button
          type="button"
          onClick={() => setShowVariants(v => !v)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
        >
          <span>{t('catalog.variants')}</span>
          {showVariants ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <AnimatePresence>
          {showVariants && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                {variants.map((v) => (
                  <div key={v.id} className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                      value={v.label}
                      onChange={e => patchVariant(v.id, { label: e.target.value })}
                      placeholder={t('catalog.variantLabelPlaceholder')}
                    />
                    <input
                      className="w-20 rounded-xl px-3 py-2 text-sm outline-none tabular-nums"
                      style={inputStyle}
                      inputMode="numeric"
                      value={String(v.stock)}
                      onChange={e => patchVariant(v.id, { stock: parseInt(e.target.value, 10) || 0 })}
                      placeholder={t('catalog.stock')}
                    />
                    <input
                      className="w-24 rounded-xl px-3 py-2 text-sm outline-none tabular-nums"
                      style={inputStyle}
                      inputMode="decimal"
                      value={v.price ?? ''}
                      onChange={e => patchVariant(v.id, { price: e.target.value || undefined })}
                      placeholder={t('catalog.variantPricePlaceholder')}
                    />
                    <button onClick={() => removeVariant(v.id)} className="rounded-xl p-2 transition-all hover:opacity-70" style={{ color: 'var(--danger)' }}>
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addVariant}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'var(--surface-muted)', border: '1px dashed var(--border)', color: 'var(--ink-2)' }}
                >
                  <Plus className="size-3.5" /> {t('catalog.addVariant')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom fields toggle */}
        <button
          type="button"
          onClick={() => setShowCustomFields(v => !v)}
          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
        >
          <span>{t('catalog.customFields')}</span>
          {showCustomFields ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <AnimatePresence>
          {showCustomFields && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                {fieldDefs.map((fd, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                      value={fd.label}
                      onChange={e => patchFieldDef(idx, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder={t('catalog.fieldNamePlaceholder')}
                    />
                    <select
                      className="rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ ...inputStyle, width: 110 }}
                      value={fd.type}
                      onChange={e => patchFieldDef(idx, { type: e.target.value as FieldDefinition['type'] })}
                    >
                      <option value="text">{t('catalog.fieldType.text')}</option>
                      <option value="number">{t('catalog.fieldType.number')}</option>
                      <option value="select">{t('catalog.fieldType.select')}</option>
                    </select>
                    <input
                      className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                      value={String(customFields[fd.key] ?? '')}
                      onChange={e => setCustomFields(cf => ({ ...cf, [fd.key]: e.target.value }))}
                      placeholder={t('catalog.fieldValuePlaceholder')}
                    />
                    <button onClick={() => removeFieldDef(idx)} className="rounded-xl p-2 transition-all hover:opacity-70" style={{ color: 'var(--danger)' }}>
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addFieldDef}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'var(--surface-muted)', border: '1px dashed var(--border)', color: 'var(--ink-2)' }}
                >
                  <Plus className="size-3.5" /> {t('catalog.addField')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
          >
            {t('catalog.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
            style={{ background: 'var(--accent)' }}
          >
            <Check className="size-4" />
            {initial ? t('catalog.saveChanges') : t('catalog.add')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Product card ────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product
  onEdit: () => void
  onDelete: () => void
  onStockAdjust: (variantId: string | undefined, delta: number) => void
  localCurrency: string
  fxRate: number | null
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(function ProductCard({ product, onEdit, onDelete, onStockAdjust, localCurrency, fxRate }, _ref) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="overflow-hidden rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon placeholder */}
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <Package className="size-5" style={{ color: 'var(--subtle)' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>{product.name}</p>
              {product.sku && (
                <p className="mono text-xs" style={{ color: 'var(--subtle)' }}>{product.sku}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                ${parseFloat(product.price).toFixed(2)}
              </span>
              <span className="text-xs" style={{ color: 'var(--subtle)' }}>/ {product.unit}</span>
            </div>
          </div>
          {localCurrency !== 'USD' && fxRate !== null && (
            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
              ≈ {formatLocal(parseFloat(product.price) * fxRate, localCurrency as never)}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StockBadge stock={product.stock} />
            {product.variants.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {product.variants.length === 1
                  ? t('catalog.variantCountOne', { count: product.variants.length })
                  : t('catalog.variantCountMany', { count: product.variants.length })}
              </span>
            )}
            {Object.entries(product.customFields).slice(0, 2).map(([k, v]) => (
              <span key={k} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                {v as string}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-1 border-t px-4 py-2" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--muted)' }}
        >
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {t('catalog.stock')}
        </button>
        <button onClick={onEdit} className="ml-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:opacity-80" style={{ color: 'var(--muted)' }}>
          <Pencil className="size-3.5" /> {t('catalog.edit')}
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:opacity-80" style={{ color: 'var(--danger)' }}>
          <Trash2 className="size-3.5" /> {t('catalog.delete')}
        </button>
      </div>

      {/* Stock adjuster */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 pb-3 pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
              {product.variants.length > 0 ? product.variants.map(v => (
                <div key={v.id} className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>{v.label}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onStockAdjust(v.id, -1)} className="flex size-7 items-center justify-center rounded-lg text-base font-bold transition-all hover:opacity-70" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}>−</button>
                    <span className="mono w-8 text-center text-sm tabular-nums" style={{ color: 'var(--ink)' }}>{v.stock}</span>
                    <button onClick={() => onStockAdjust(v.id, +1)} className="flex size-7 items-center justify-center rounded-lg text-base font-bold transition-all hover:opacity-70" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}>+</button>
                  </div>
                </div>
              )) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>{t('catalog.stockTotal')}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onStockAdjust(undefined, -1)} className="flex size-7 items-center justify-center rounded-lg text-base font-bold transition-all hover:opacity-70" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}>−</button>
                    <span className="mono w-8 text-center text-sm tabular-nums" style={{ color: 'var(--ink)' }}>{product.stock}</span>
                    <button onClick={() => onStockAdjust(undefined, +1)} className="flex size-7 items-center justify-center rounded-lg text-base font-bold transition-all hover:opacity-70" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}>+</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// ── Root ────────────────────────────────────────────────────────────────────

export default function CatalogView({ store, tenantId }: { store: DashboardStore; tenantId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [fxRate, setFxRate] = useState<number | null>(null)
  // Merchant pricing preference (auto = follow country). Picked once in any
  // price form or Settings; every form opens in it from then on.
  const [pref, setPref] = useState<PricingPref>(() => readPricingPref(tenantId))

  const localCurrency = currencyForCountry(store.config.country)
  const entryCurrency = resolveEntryCurrency(pref, store.config.country)
  const persistCurrency = (mode: 'usd' | 'local') => {
    setPref(mode)
    writePricingPref(tenantId, mode)
  }

  useEffect(() => {
    if (localCurrency === 'USD') return
    let cancelled = false
    void fetchUsdRate(localCurrency).then(rate => {
      if (!cancelled && rate) setFxRate(rate.usdToLocal)
    })
    return () => { cancelled = true }
  }, [localCurrency])

  // Both branches are network writes now; the form only closes when the
  // database accepted the row.
  const handleSave = async (data: Omit<Product, 'id' | 'createdAt'>) => {
    setError('')
    try {
      if (editingId) {
        await store.updateProduct(editingId, data)
      } else {
        await store.addProduct(data)
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setError(storeErrorMessage(err))
    }
  }

  const handleDelete = (id: string) => {
    setError('')
    void store.deleteProduct(id)
      .catch((err: unknown) => setError(storeErrorMessage(err)))
  }

  const handleStockAdjust = (productId: string, variantId: string | undefined, delta: number) => {
    setError('')
    void store.updateStock(productId, variantId, delta)
      .catch((err: unknown) => setError(storeErrorMessage(err)))
  }

  const editingProduct = editingId ? store.products.find(p => p.id === editingId) : undefined

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {store.products.length === 1
              ? t('catalog.countOne', { count: store.products.length })
              : t('catalog.countMany', { count: store.products.length })}
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowForm(true) }}
          className="flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="size-4" /> {t('catalog.new')}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editingId) && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ProductForm
              key={editingId ?? 'new'}
              initial={editingProduct}
              onSave={(data) => { void handleSave(data) }}
              onCancel={() => { setShowForm(false); setEditingId(null) }}
              localCurrency={localCurrency}
              fxRate={fxRate}
              initialCurrency={entryCurrency}
              onCurrencyChange={persistCurrency}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
          <AlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="size-3.5" /></button>
        </div>
      )}

      {store.loading && store.products.length === 0 && (
        <p className="px-1 py-6 text-xs" style={{ color: 'var(--muted)' }}>{t('catalog.loading')}</p>
      )}

      {/* Product list */}
      <AnimatePresence mode="popLayout">
        {store.products.length === 0 && !showForm && !store.loading ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-3xl py-16 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Package className="size-10" style={{ color: 'var(--subtle)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>{t('catalog.empty')}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('catalog.emptyHint')}</p>
          </motion.div>
        ) : (
          store.products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={() => { setEditingId(product.id); setShowForm(false) }}
              onDelete={() => handleDelete(product.id)}
              onStockAdjust={(variantId, delta) => handleStockAdjust(product.id, variantId, delta)}
              localCurrency={localCurrency}
              fxRate={fxRate}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  )
}
