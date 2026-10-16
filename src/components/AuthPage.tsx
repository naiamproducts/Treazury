/**
 * PayStyle — AuthPage
 *
 * Login / Register screen. Uses Supabase Auth.
 * - Tab "Ingresar": email + password sign-in
 * - Tab "Crear cuenta": email + password + business name sign-up
 *   (only shown when VITE_SHOW_REGISTER=true)
 */

import { useState } from 'react'
import { MessageSquare, KeyRound, Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import type { AuthActions } from '../hooks/useAuth'

interface AuthPageProps {
  onBack: () => void
  authActions: Pick<AuthActions, 'signIn' | 'signUp'>
}

const showRegister = import.meta.env.VITE_SHOW_REGISTER === 'true'

export default function AuthPage({ onBack, authActions }: AuthPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authActions.signIn(email, password)
    setLoading(false)
    if (err) setError(err)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authActions.signUp(email, password, businessName)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      setSuccess('Cuenta creada. Revisa tu email para confirmar, luego ingresa.')
      setTab('login')
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Brand */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--accent)' }}
        >
          <MessageSquare className="size-7 text-white" />
        </div>
        <p className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Treazury</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Cobros B2B por WhatsApp</p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 32px rgba(18,45,69,0.08)',
        }}
      >
        {/* Tabs — only show if register is enabled */}
        {showRegister && (
          <div
            className="mb-6 flex rounded-xl p-1"
            style={{ background: 'var(--surface-muted)' }}
          >
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
                style={{
                  background: tab === t ? 'var(--surface-strong)' : 'transparent',
                  color: tab === t ? 'var(--ink)' : 'var(--muted)',
                  boxShadow: tab === t ? '0 1px 4px rgba(18,45,69,0.08)' : 'none',
                }}
              >
                {t === 'login' ? 'Ingresar' : 'Crear cuenta'}
              </button>
            ))}
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(26,128,71,0.08)', color: 'var(--success)' }}
          >
            {success}
          </div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={(e) => { void handleLogin(e) }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: 'var(--subtle)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: 'var(--subtle)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Ingresando...</>
                : <><KeyRound className="size-4" /> Ingresar al panel</>
              }
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && showRegister && (
          <form onSubmit={(e) => { void handleRegister(e) }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                Nombre del negocio
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: 'var(--subtle)' }}
                />
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="Nombre de tu negocio"
                  required
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: 'var(--subtle)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                  style={{ color: 'var(--subtle)' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--ink)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Creando cuenta...</>
                : <><ArrowRight className="size-4" /> Crear cuenta</>
              }
            </button>
          </form>
        )}

        {/* Back link */}
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-xs transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          Volver al inicio
        </button>
      </div>

      {/* Approval note */}
      {!showRegister && (
        <p className="mt-4 max-w-xs text-center text-xs" style={{ color: 'var(--muted)' }}>
          El acceso a Treazury está disponible por invitación durante el Alpha.
        </p>
      )}
    </div>
  )
}
