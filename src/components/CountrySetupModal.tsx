/**
 * CountrySetupModal — shown once after first login when the tenant
 * has no country configured. Blocks until the merchant picks one.
 * Persisted via store.config.country + localStorage flag.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ArrowRight, Loader2 } from 'lucide-react'
import type { DashboardStore } from '@/store'
import { SUPPORTED_COUNTRIES } from '@/lib/currency'

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
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(18,45,69,0.55)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-sm rounded-3xl p-6"
            style={{
              background: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 48px rgba(18,45,69,0.22)',
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl"
              style={{ background: 'var(--accent)' }}
            >
              <Globe className="size-6 text-white" />
            </div>

            <h2 className="display text-center text-xl font-bold" style={{ color: 'var(--ink)' }}>
              ¿Dónde operás?
            </h2>
            <p className="mt-1 text-center text-sm" style={{ color: 'var(--muted)' }}>
              Elegí tu país para configurar la moneda local y las preferencias fiscales.
            </p>

            {/* Country list */}
            <div className="mt-5 space-y-2">
              {SUPPORTED_COUNTRIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
                  style={{
                    background: selected === c.code ? 'var(--accent)' : 'var(--surface-muted)',
                    color: selected === c.code ? '#fff' : 'var(--ink)',
                    border: selected === c.code
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  }}
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
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {saving
                ? <><Loader2 className="size-4 animate-spin" /> Guardando…</>
                : <><ArrowRight className="size-4" /> Continuar</>
              }
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
