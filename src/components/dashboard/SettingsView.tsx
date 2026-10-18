/**
 * SettingsView — configuración del negocio, datos fiscales según el país
 * fiscal elegido (RIF / CUIT / RFC según el motor registrado), wallet y
 * preferencias de facturación.
 */

import { useState } from 'react'
import { Check, AlertCircle, Building2, Receipt, Wallet, ToggleLeft, ToggleRight } from 'lucide-react'
import type { DashboardStore } from '@/store'
import { invoiceFactory } from '@/modules/invoicing/factory'
import type { InvoiceEngine } from '@/modules/invoicing'
import type { CountryCode } from '@/modules/shared/types'
import { countryMeta, currencyForCountry, readPricingPref, writePricingPref, readBankDetails, writeBankDetails } from '@/lib/currency'
import type { PricingPref, BankDetails } from '@/lib/currency'
import { t } from '@/i18n/t'
import { storeErrorMessage } from './CatalogView'

/**
 * Fiscal engine driving the labels below. Sourced from the registered invoice
 * engines — never a hardcoded country list — so adding an engine (AR, MX, …)
 * automatically adds a fiscal profile here.
 */
function engineForCountry(country: CountryCode): InvoiceEngine | undefined {
  return invoiceFactory.list().find(engine => engine.country === country)
}

// ── Section wrapper — top-level to avoid "component in render" lint ────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{title}</h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:ring-2"
const inputStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }

interface SettingsViewProps {
  store: DashboardStore
  tenant?: { business_name: string; tax_id?: string | null; apply_igtf?: boolean }
  tenantId: string
  onTenantUpdate?: () => Promise<void>
}

export default function SettingsView({ store, tenantId, onTenantUpdate }: SettingsViewProps) {
  const [form, setForm] = useState({ ...store.config })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const engines = invoiceFactory.list()
  // No fallback: if the country has no registered engine, fiscalEngine is
  // undefined and the UI shows "not available" instead of another country's fields.
  const fiscalEngine = engineForCountry(form.country)
  // Contact examples follow the selected fiscal country — never VE defaults.
  const meta = countryMeta(form.country)
  // Merchant pricing preference: which currency price forms open in.
  // 'auto' follows the fiscal country. Shared with Catalog + Cobros toggles.
  const prefCurrency = currencyForCountry(form.country)
  const [pricingPref, setPricingPref] = useState<PricingPref>(() => readPricingPref(tenantId))
  const pickPricing = (pref: PricingPref) => {
    setPricingPref(pref)
    writePricingPref(tenantId, pref)
  }
  // Bank details for the transfer option in payment links. Stored per tenant
  // locally; each generated link embeds them (?balias=&bname=&bacct=).
  const [bank, setBank] = useState<BankDetails>(() => readBankDetails(tenantId))
  const [bankSaved, setBankSaved] = useState(false)
  const patchBank = (k: keyof BankDetails, v: string) =>
    setBank(b => ({ ...b, [k]: v }))
  const handleBankSave = () => {
    writeBankDetails(tenantId, { bankName: bank.bankName.trim(), alias: bank.alias.trim(), account: bank.account.trim() })
    setBank(b => ({ bankName: b.bankName.trim(), alias: b.alias.trim(), account: b.account.trim() }))
    setBankSaved(true)
    setTimeout(() => setBankSaved(false), 2500)
  }

  const patch = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  // Persists to tenants, which RLS can refuse (42501) for a tenant that is not
  // approved — so the success state is only shown after the write lands.
  const handleSave = () => {
    setError('')
    setSaving(true)
    void store.updateConfig(form)
      .then(async () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        await onTenantUpdate?.()
      })
      .catch((err: unknown) => {
        // StoreError.message is Spanish — map the code to errors.store.* (task 7.3).
        setError(storeErrorMessage(err))
      })
      .finally(() => setSaving(false))
  }

  // config arrives from tenants asynchronously. Until it does, `form` holds
  // defaults — saving that would overwrite the merchant's real tax_id,
  // address and wallet, so the form is not editable yet.
  if (store.loading) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>
        {t('settings.loading')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* Business info */}
      <Section icon={<Building2 className="size-4" />} title={t('settings.businessData')}>
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.businessName')}</label>
          <input className={inputCls} style={inputStyle} value={form.name} onChange={e => patch('name', e.target.value)} placeholder={t('settings.businessNamePlaceholder')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.field.phone')}</label>
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => patch('phone', e.target.value)} placeholder={`${meta.dialCode} ${meta.phoneExample}`} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.field.email')}</label>
            <input className={inputCls} style={inputStyle} value={form.email} onChange={e => patch('email', e.target.value)} placeholder={t('settings.field.emailPlaceholder')} />
          </div>
        </div>
      </Section>

      {/* Pricing currency preference */}
      <Section icon={<Wallet className="size-4" />} title={t('settings.priceCurrency')}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {t('settings.priceCurrencyHint')}
        </p>
        <div className="flex gap-1.5">
          {([
            { id: 'auto' as PricingPref, label: t('settings.pricingAuto', { currency: prefCurrency }) },
            { id: 'usd' as PricingPref, label: 'USD' },
            ...(prefCurrency !== 'USD' ? [{ id: 'local' as PricingPref, label: prefCurrency }] : []),
          ]).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => pickPricing(opt.id)}
              className="flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all"
              style={pricingPref === opt.id
                ? { background: 'var(--accent)', color: '#fff', border: '1px solid transparent' }
                : { background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Bank details for the transfer option in payment links */}
      <Section icon={<Building2 className="size-4" />} title={t('settings.bankData')}>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          {t('settings.bankDataHint')}
        </p>
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.field.bank')}</label>
          {/* Example placeholders come from countryMeta (app data, e.g. AR
              "Banco de la Nación Argentina") — i18n-scan exemption. */}
          <input data-purpose="country-data-field" className={inputCls} style={inputStyle} value={bank.bankName} onChange={e => patchBank('bankName', e.target.value)} placeholder={meta.bankExample} />
        </div>
        {/* Alias/account LABELS are countryMeta data too (VE "Pago Móvil…"). */}
        <div data-purpose="country-data-field" className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{meta.aliasLabel}</label>
            <input className={inputCls} style={inputStyle} value={bank.alias} onChange={e => patchBank('alias', e.target.value)} placeholder={meta.aliasExample} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{meta.accountLabel}</label>
            <input className={`${inputCls} mono`} style={inputStyle} value={bank.account} onChange={e => patchBank('account', e.target.value)} placeholder={meta.accountExample} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleBankSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)' }}
        >
          <Check className="size-4" /> {bankSaved ? t('settings.bankSaved') : t('settings.saveBank')}
        </button>
      </Section>

      {/* Fiscal data — country-aware */}
      <Section
        icon={<Receipt className="size-4" />}
        title={fiscalEngine ? t('settings.fiscalData', { country: fiscalEngine.countryName }) : t('settings.billing')}
      >
        {!fiscalEngine ? (
          <div className="space-y-3">
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', color: '#92400e' }}
            >
              {t('settings.fiscalUnavailable')}
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {t('settings.fiscalUnavailableHint')}
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.fiscalCountry')}</label>
              <select
                className={inputCls} style={inputStyle}
                value={form.country}
                onChange={e => patch('country', e.target.value)}
              >
                {engines.map(engine => (
                  <option key={engine.country} value={engine.country}>
                    {engine.countryName} ({engine.country}) — {engine.taxIdLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.fiscalAddress')}</label>
              <input className={inputCls} style={inputStyle} value={form.address} onChange={e => patch('address', e.target.value)} placeholder={fiscalEngine.addressPlaceholder ?? t('settings.fiscalAddress')} />
            </div>
            {fiscalEngine && (
              <>
                <div
                  className="rounded-xl px-3 py-2.5 text-xs"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--muted)' }}
                >
                  {t('settings.taxModuleHint', {
                    country: fiscalEngine.countryName,
                    taxIdLabel: fiscalEngine.taxIdLabel,
                  })}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    {fiscalEngine.taxIdLabel} <span className="font-normal opacity-60">({fiscalEngine.taxIdExample})</span>
                  </label>
                  <input
                    className={inputCls} style={inputStyle}
                    value={form.rif}
                    onChange={e => patch('rif', e.target.value.toUpperCase())}
                    placeholder={fiscalEngine.taxIdPlaceholder}
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.invoicePrefix')}</label>
              <input
                className={`${inputCls} mono`} style={inputStyle}
                value={form.invoicePrefix}
                onChange={e => patch('invoicePrefix', e.target.value)}
                placeholder="0001"
              />
            </div>

            {/* IGTF toggle — solo para VE */}
            {fiscalEngine && fiscalEngine.country === 'VE' && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t('settings.igtf')}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{t('settings.igtfHint')}</p>
                </div>
                <button onClick={() => patch('applyIgtf', !form.applyIgtf)}>
                  {form.applyIgtf
                    ? <ToggleRight className="size-8" style={{ color: 'var(--accent)' }} />
                    : <ToggleLeft className="size-8" style={{ color: 'var(--subtle)' }} />
                  }
                </button>
              </div>
            )}

            {!form.rif ? (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(217,119,6,0.08)', color: '#b45309', border: '1px solid rgba(217,119,6,0.2)' }}>
                <AlertCircle className="size-3.5 shrink-0" />
                {t('settings.error.requireTaxId', {
                  taxIdLabel: fiscalEngine?.taxIdLabel ?? t('settings.taxIdFallback'),
                  country: fiscalEngine ? ` in ${fiscalEngine.countryName}` : '',
                })}
              </div>
            ) : fiscalEngine && !fiscalEngine.validateTaxId(form.rif.trim()) ? (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(217,119,6,0.08)', color: '#b45309', border: '1px solid rgba(217,119,6,0.2)' }}>
                <AlertCircle className="size-3.5 shrink-0" />
                {t('settings.error.validateTaxId', { example: fiscalEngine.taxIdExample })}
              </div>
            ) : null}
          </>
        )}
      </Section>

      {/* Wallet */}
      <Section icon={<Wallet className="size-4" />} title={t('settings.wallet')}>
        <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('settings.walletActiveAddress')}</p>
          <p className="mono mt-1 break-all text-xs" style={{ color: 'var(--ink-2)' }}>{store.merchantAddress || '—'}</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          {t('settings.walletCustodyHint')}
        </p>
      </Section>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
          <AlertCircle className="mt-px size-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-60"
        style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}
      >
        <Check className="size-4" />
        {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.save')}
      </button>
    </div>
  )
}
