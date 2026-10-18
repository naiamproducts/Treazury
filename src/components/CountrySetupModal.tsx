/**
 * CountrySetupModal — shown once after first login when the tenant
 * has no country configured. Blocks until the merchant picks one.
 * Persisted via store.config.country + localStorage flag.
 *
 * Styled in the Treazury luxe-dark theme (luxe-glass card, dark option
 * rows), matching the AuthPage form card. All dark styling is scoped to
 * this modal's own classes — the light dashboard underneath is untouched.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ArrowRight, Loader2 } from 'lucide-react'
import type { DashboardStore } from '@/store'
import { SUPPORTED_COUNTRIES } from '@/lib/currency'
import { t } from '@/i18n/t'

const STORAGE_PREFIX = 'paystyle:country-confirmed:'

export function isCountryConfirmed(tenantId: string): boolean {
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + tenantId) === '1'
  } catch {
    return false
  }
}

export function markCountryConfirmed(tenantId: string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + tenantId, '1')
  } catch {
    /* private mode — modal will reappear next session, harmless */
  }
}

interface CountrySetupModalProps {
  store: DashboardStore
  tenantId: string
}

export default function CountrySetupModal({ store, tenantId }: CountrySetupModalProps) {
  const [selected, setSelected] = useState<string>(store.config.country || 'VE')
  const [saving, setSaving] = useState(false)

  const needsSetup = !isCountryConfirmed(tenantId)

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await store.updateConfig({ country: selected as never })
      markCountryConfirmed(tenantId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {needsSetup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans"
          style={{ background: 'rgba(7,8,10,0.72)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="luxe-glass w-full max-w-sm rounded-[2rem] p-6 sm:p-8"
          >
            {/* Icon */}
            <div className="luxe-glass mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl">
              <Globe className="size-6 text-icyCyan" />
            </div>

            <h2 className="text-center font-serif text-2xl font-medium text-white">
              {t('country.title')}
            </h2>
            <p className="mt-1 text-center text-sm text-slate-400">
              {t('country.subtitle')}
            </p>

            {/* Country list — option names/flags are SUPPORTED_COUNTRIES
                app data (e.g. "México"): i18n-scan exemption (e2e/09 case). */}
            <div data-purpose="country-options" className="mt-5 space-y-2">
              {SUPPORTED_COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    selected === c.code
                      ? 'border-cyan-300/50 bg-white/[0.08] text-white shadow-[0_0_16px_rgba(56,189,248,0.15)]'
                      : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            {/* Confirm */}
            <button
              onClick={() => { void handleConfirm() }}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              {saving
                ? <><Loader2 className="size-4 animate-spin" /> {t('country.saving')}</>
                : <><ArrowRight className="size-4" /> {t('country.continue')}</>
              }
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
