/**
 * PayStyle — PendingApproval screen
 * Shown when the user registered but their tenant is not yet approved (whitelist).
 *
 * Step 1: Country selection (sets local currency + fiscal defaults).
 * Step 2: "Solicitud recibida" confirmation.
 *
 * Country is saved directly via Supabase (the tenant owner can UPDATE
 * their own row under RLS even while is_approved=false).
 *
 * Styled in the Treazury luxe-dark theme (scoped to .luxe-landing),
 * matching the AuthPage form card.
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
    <div className="luxe-landing relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 font-sans">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 select-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[38rem] w-[38rem] rounded-full bg-cyan-900/10 blur-[140px]"></div>
        <div className="absolute top-1/3 -right-48 h-[42rem] w-[42rem] rounded-full bg-slate-600/5 blur-[160px]"></div>
        <div className="luxe-dotgrid absolute inset-0"></div>
      </div>

      <div className="luxe-glass relative z-10 w-full max-w-sm rounded-[2rem] p-6 text-center sm:p-8">
        <div className="luxe-glass mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
          <MessageSquare className="size-7 text-icyCyan" />
        </div>

        {step === 'country' ? (
          <>
            {/* ── Step 1: Country selection ── */}
            <h1 className="font-serif text-2xl font-medium text-white">
              ¿Dónde operás?
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Elegí tu país para configurar la moneda local y las preferencias fiscales.
            </p>

            <div className="mt-5 space-y-2 text-left">
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
                  <span className={`ml-auto font-mono text-xs ${selected === c.code ? 'text-icyCyan' : 'text-slate-500'}`}>
                    {currencyForCountry(c.code)}
                  </span>
                </button>
              ))}
            </div>

            {saveError && (
              <p className="mt-3 text-xs text-red-300">{saveError}</p>
            )}

            <button
              onClick={() => { void handleCountryConfirm() }}
              disabled={saving}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
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
            <h1 className="font-serif text-2xl font-medium text-white">
              Solicitud recibida
            </h1>

            <div className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
              <Clock className="size-4 shrink-0 text-amber-300" />
              <p className="text-sm text-amber-200">
                Pendiente de aprobación
              </p>
            </div>

            <p className="mt-4 text-sm text-slate-300">
              Tu solicitud para <strong className="text-white">{businessName}</strong> fue recibida.
              Recibirás un correo en <strong className="text-white">{email}</strong> cuando tu cuenta sea activada.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Treazury está en acceso anticipado. Estamos activando cuentas gradualmente
              para garantizar la calidad del servicio.
            </p>
          </>
        )}

        {walletError ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-left text-xs text-red-300">
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <span className="flex-1">{walletError}</span>
            {onRetryWallet ? (
              <button
                type="button"
                onClick={onRetryWallet}
                disabled={walletRetrying === true}
                className="ml-auto shrink-0 text-xs font-medium underline hover:text-white disabled:opacity-50"
              >
                {walletRetrying === true ? 'Reintentando…' : 'Reintentar'}
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={onSignOut}
          className="mt-6 flex w-full items-center justify-center gap-2 text-center font-mono text-xs tracking-wider text-slate-400 transition-colors hover:text-white"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
