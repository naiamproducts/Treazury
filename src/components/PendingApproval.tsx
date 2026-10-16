/**
 * PayStyle — PendingApproval screen
 * Shown when the user registered but their tenant is not yet approved (whitelist).
 *
 * Step 1: Country selection (sets local currency + fiscal defaults).
 * Step 2: "Solicitud recibida" confirmation.
 *
 * Country is saved directly via Supabase (the tenant owner can UPDATE
 * their own row under RLS even while is_approved=false).
 */

import { useState } from 'react'
import { AlertCircle, Clock, LogOut, MessageSquare, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SUPPORTED_COUNTRIES, currencyForCountry } from '../lib/currency'

const STORAGE_PREFIX = 'paystyle:country-confirmed:'

function storageKey(tenantId: string): string {
  return STORAGE_PREFIX + tenantId
}

function isCountryConfirmed(tenantId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(tenantId)) === '1'
  } catch { return false }
}

function markCountryConfirmed(tenantId: string): void {
  try {
    window.localStorage.setItem(storageKey(tenantId), '1')
  } catch { /* private mode — harmless */ }
}

interface PendingApprovalProps {
  email: string
  businessName: string
  tenantId: string
  currentCountry?: string
  onSignOut: () => void
  /** Last embedded-wallet failure, if the capped automatic retries are exhausted. */
  walletError?: string | null
  /** True while a wallet retry sequence is running. */
  walletRetrying?: boolean
  /** Starts one more bounded wallet retry sequence. */
  onRetryWallet?: () => void
}

export default function PendingApproval({
  email, businessName, tenantId, currentCountry,
  onSignOut, walletError, walletRetrying, onRetryWallet,
}: PendingApprovalProps) {
  // If country was already confirmed in a previous session, skip step 1.
  const [step, setStep] = useState<'country' | 'waiting'>(() => {
    return isCountryConfirmed(tenantId) ? 'waiting' : 'country'
  })
  const [selected, setSelected] = useState(currentCountry || 'VE')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleCountryConfirm = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ country: selected })
        .eq('id', tenantId)
      if (error) {
        setSaveError('No se pudo guardar el país. Intentá de nuevo.')
        return
      }
      markCountryConfirmed(tenantId)
      setStep('waiting')
    } catch {
      setSaveError('Error de conexión. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 32px rgba(18,45,69,0.08)',
        }}
      >
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <MessageSquare className="size-7 text-white" />
        </div>

        {step === 'country' ? (
          <>
            {/* ── Step 1: Country selection ── */}
            <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
              ¿Dónde operás?
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Elegí tu país para configurar la moneda local y las preferencias fiscales.
            </p>

            <div className="mt-5 space-y-2 text-left">
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
                  <span className="ml-auto text-xs opacity-70">
                    {currencyForCountry(c.code)}
                  </span>
                </button>
              ))}
            </div>

            {saveError && (
              <p className="mt-3 text-xs" style={{ color: 'var(--danger)' }}>{saveError}</p>
            )}

            <button
              onClick={() => { void handleCountryConfirm() }}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {saving
                ? <><Loader2 className="size-4 animate-spin" /> Guardando…</>
                : <><ArrowRight className="size-4" /> Continuar</>
              }
            </button>
          </>
        ) : (
          <>
            {/* ── Step 2: Pending approval ── */}
            <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
              Solicitud recibida
            </h1>

            <div
              className="mx-auto mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)' }}
            >
              <Clock className="size-4 shrink-0" style={{ color: '#b45309' }} />
              <p className="text-sm" style={{ color: '#92400e' }}>
                Pendiente de aprobación
              </p>
            </div>

            <p className="mt-4 text-sm" style={{ color: 'var(--ink-2)' }}>
              Tu solicitud para <strong>{businessName}</strong> fue recibida.
              Recibirás un correo en <strong>{email}</strong> cuando tu cuenta sea activada.
            </p>

            <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
              PayStyle está en acceso anticipado. Estamos activando cuentas gradualmente
              para garantizar la calidad del servicio.
            </p>
          </>
        )}

        {walletError ? (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-left text-xs"
            style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <span className="flex-1">{walletError}</span>
            {onRetryWallet ? (
              <button
                type="button"
                onClick={onRetryWallet}
                disabled={walletRetrying === true}
                className="ml-auto shrink-0 text-xs font-medium underline disabled:opacity-50"
              >
                {walletRetrying === true ? 'Reintentando…' : 'Reintentar'}
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={onSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
          style={{
            background: 'var(--surface-muted)',
            color: 'var(--ink-2)',
            border: '1px solid var(--border)',
          }}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
