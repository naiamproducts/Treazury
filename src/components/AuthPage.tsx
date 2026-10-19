/**
 * PayStyle — AuthPage
 *
 * Login / Register screen. Uses Supabase Auth.
 * - Tab "Sign in": email + password sign-in
 * - Tab "Create account": email + password + business name sign-up
 *   (only shown when VITE_SHOW_REGISTER=true)
 *
 * Styled in the Treazury luxe-dark theme (scoped to .luxe-landing),
 * matching the LandingPage showcase card.
 */

import { useState } from 'react'
import { MessageSquare, KeyRound, Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import type { AuthActions } from '../hooks/useAuth'
import { t } from '../i18n/t'

interface AuthPageProps {
  onBack: () => void
  authActions: Pick<AuthActions, 'signIn' | 'signUp'>
}

const showRegister = import.meta.env.VITE_SHOW_REGISTER === 'true'

/**
 * Supabase returns auth failures in English. Map the known ones to friendly
 * catalog messages for display only — unknown messages pass through untouched.
 */
function friendlyAuthError(raw: string): string {
  const msg = raw.toLowerCase()
  if (msg.includes('invalid login credentials')) return t('auth.error.credentials')
  if (msg.includes('email not confirmed')) return t('auth.error.emailConfirm')
  if (msg.includes('user already registered')) return t('auth.error.register')
  if (msg.includes('password should be at least')) return t('auth.error.passwordLength')
  if (msg.includes('signup requires a valid password')) return t('auth.error.passwordInvalid')
  if (msg.includes('unable to validate email address')) return t('auth.error.validateEmail')
  if (msg.includes('email rate limit exceeded')) return t('auth.error.rateLimit')
  if (msg.includes('for security purposes')) return t('auth.error.securityWait')
  return raw
}

const inputClass =
  'w-full rounded-xl py-3 pl-10 pr-4 text-sm text-white outline-none transition-all ' +
  'bg-white/[0.04] border border-white/10 placeholder:text-slate-500 ' +
  'focus:border-cyan-300/60 focus:bg-white/[0.06]'

const labelClass = 'font-mono text-[11px] uppercase tracking-widest text-slate-400'

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
    if (err) setError(friendlyAuthError(err))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authActions.signUp(email, password, businessName)
    setLoading(false)
    if (err) {
      setError(friendlyAuthError(err))
    } else {
      setSuccess(t('auth.register.success'))
      setTab('login')
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

      {/* Brand */}
      <div className="relative z-10 mb-8 text-center">
        <div className="luxe-glass mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl">
          <MessageSquare className="size-7 text-icyCyan" />
        </div>
        <p className="font-serif text-4xl font-medium tracking-tight text-white">
          Treazury<span className="ml-1 inline-block size-1.5 rounded-full bg-icyCyan opacity-90 shadow-[0_0_8px_rgba(165,243,252,0.8)]"></span>
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">{t('auth.tagline')}</p>
      </div>

      {/* Card */}
      <div className="luxe-glass relative z-10 w-full max-w-sm rounded-[2rem] p-6 sm:p-8">
        {/* Tabs — only show if register is enabled */}
        {showRegister && (
          <div className="mb-6 flex rounded-full border border-white/10 bg-black/40 p-1">
            {(['login', 'register'] as const).map(tabId => (
              <button
                key={tabId}
                onClick={() => { setTab(tabId); setError(null); setSuccess(null) }}
                className={`flex-1 rounded-full py-2 font-mono text-xs tracking-wider transition-all ${
                  tab === tabId
                    ? 'border border-white/10 bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tabId === 'login' ? t('auth.login.tab') : t('auth.register.tab')}
              </button>
            ))}
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={(e) => { void handleLogin(e) }} className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                {t('auth.email.label')}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.email.placeholder')}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                {t('auth.password.label')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> {t('auth.entering')}</>
                : <><KeyRound className="size-4" /> {t('auth.cta.login')}</>
              }
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && showRegister && (
          <form onSubmit={(e) => { void handleRegister(e) }} className="space-y-4">
            <div className="space-y-1.5">
              <label className={labelClass}>
                {t('auth.businessName.label')}
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder={t('auth.businessName.placeholder')}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                {t('auth.email.label')}
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.email.placeholder')}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                {t('auth.password.label')}
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.password.placeholder')}
                  required
                  minLength={8}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> {t('auth.creating')}</>
                : <><ArrowRight className="size-4" /> {t('auth.cta.register')}</>
              }
            </button>
          </form>
        )}

        {/* Back link */}
        <button
          onClick={onBack}
          className="mt-5 w-full text-center font-mono text-xs tracking-wider text-slate-400 transition-colors hover:text-white"
        >
          {t('auth.backToLanding')}
        </button>
      </div>

      {/* Approval note */}
      {!showRegister && (
        <p className="relative z-10 mt-4 max-w-xs text-center text-xs text-slate-500">
          {t('auth.approvalNote')}
        </p>
      )}
    </div>
  )
}
