/**
 * AccessRequestForm — "Solicitar acceso" landing form.
 *
 * Renders inside the luxe-dark hero card (scoped to .luxe-landing by the
 * parent). Saves to the public `access_requests` table via the anon key.
 * The migration (docs/migrations/005_access_requests.sql) must be applied
 * by the operator first — when it is missing, PostgREST answers with
 * 42P01 / PGRST205 and the form shows a configuration error instead of a
 * generic failure.
 */

import { useState } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SUPPORTED_COUNTRIES } from '../lib/currency'

const VOLUME_RANGES = [
  { value: 'lt_1k', label: 'Menos de 1.000 USD / mes' },
  { value: '1k_10k', label: '1.000 – 10.000 USD / mes' },
  { value: '10k_50k', label: '10.000 – 50.000 USD / mes' },
  { value: 'gt_50k', label: 'Más de 50.000 USD / mes' },
] as const

type VolumeRange = (typeof VOLUME_RANGES)[number]['value']

interface AccessRequestFormProps {
  onEnterApp: () => void
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

/** True when the error means the table (or schema cache entry) is missing. */
function isMissingTableError(err: { code?: string; message?: string }): boolean {
  if (err.code === '42P01' || err.code === 'PGRST205') return true
  const msg = (err.message ?? '').toLowerCase()
  return msg.includes('access_requests') && (msg.includes('does not exist') || msg.includes('schema cache'))
}

const inputCls =
  'w-full rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-500 ' +
  'bg-white/[0.03] border border-white/10 text-white ' +
  'focus:border-cyan-300/50 focus:bg-white/[0.06] focus:shadow-[0_0_16px_rgba(56,189,248,0.15)]'

const labelCls = 'mb-1.5 block text-xs font-medium tracking-wide text-slate-300'

export default function AccessRequestForm({ onEnterApp }: AccessRequestFormProps) {
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('AR')
  const [volumeRange, setVolumeRange] = useState<VolumeRange | ''>('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [configMissing, setConfigMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Contanos tu nombre.'
    if (!businessName.trim()) next.businessName = 'Contanos el nombre de tu negocio.'
    if (!email.trim()) next.email = 'Necesitamos tu email para contactarte.'
    else if (!isValidEmail(email)) next.email = 'Ese email no parece válido. Revisalo.'
    if (!country) next.country = 'Elegí tu país.'
    if (!volumeRange) next.volumeRange = 'Elegí un rango de facturación.'
    setErrors(next)
    setSubmitError(null)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      const { error } = await supabase.from('access_requests').insert({
        name: name.trim(),
        business_name: businessName.trim(),
        email: email.trim().toLowerCase(),
        country,
        monthly_volume_range: volumeRange,
        message: message.trim() || null,
      })
      if (error) {
        if (isMissingTableError({ code: error.code, message: error.message })) {
          setConfigMissing(true)
          setSubmitError(
            'El formulario aún no está conectado (falta aplicar la migración 005 en Supabase). Probá de nuevo más tarde.'
          )
        } else {
          setSubmitError('No se pudo enviar tu solicitud. Revisá tu conexión e intentá de nuevo.')
        }
        return
      }
      setSent(true)
    } catch {
      setSubmitError('No se pudo enviar tu solicitud. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center py-6 text-center" data-purpose="access-request-success">
        <div className="luxe-glass mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl">
          <CheckCircle2 className="size-7 text-icyCyan" />
        </div>
        <h3 className="font-serif text-2xl font-medium text-white">Solicitud recibida</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
          Gracias, {name.trim().split(' ')[0]}. Te contactamos a{' '}
          <strong className="text-white">{email.trim()}</strong> cuando tu cuenta sea activada.
        </p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
          Treazury está en acceso anticipado. Estamos activando cuentas gradualmente para garantizar
          la calidad del servicio.
        </p>
        <button
          type="button"
          onClick={onEnterApp}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all duration-300 hover:bg-slate-100 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          Crear mi cuenta ahora
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    )
  }

  return (
    <div data-purpose="access-request-form">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
          Acceso anticipado
        </span>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-950/40 px-2 py-0.5 font-mono text-[10px] text-icyCyan">
          ARG · LIVE
        </span>
      </div>
      <h3 className="font-serif text-2xl font-medium text-white">Solicitá acceso</h3>
      <p className="mt-2 text-sm font-light leading-relaxed text-slate-400">
        Contanos sobre tu negocio y te avisamos cuando tu cuenta esté lista para operar.
      </p>

      <div className="mt-5 space-y-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="ar-name" className={labelCls}>Tu nombre *</label>
            <input
              id="ar-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Martín Gómez"
              className={inputCls}
              autoComplete="name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="ar-business" className={labelCls}>Negocio *</label>
            <input
              id="ar-business"
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ej: Distribuidora Sur"
              className={inputCls}
              autoComplete="organization"
            />
            {errors.businessName && <p className="mt-1 text-xs text-red-300">{errors.businessName}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="ar-email" className={labelCls}>Email *</label>
          <input
            id="ar-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vos@tunegocio.com"
            className={inputCls}
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="ar-country" className={labelCls}>País *</label>
            <select id="ar-country" value={country} onChange={e => setCountry(e.target.value)} className={`${inputCls} appearance-none [&>option]:bg-graphite`}>
              {SUPPORTED_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            {errors.country && <p className="mt-1 text-xs text-red-300">{errors.country}</p>}
          </div>
          <div>
            <label htmlFor="ar-volume" className={labelCls}>Facturación mensual *</label>
            <select
              id="ar-volume"
              value={volumeRange}
              onChange={e => setVolumeRange(e.target.value as VolumeRange)}
              className={`${inputCls} appearance-none [&>option]:bg-graphite ${volumeRange === '' ? 'text-slate-500' : ''}`}
            >
              <option value="">Elegí un rango…</option>
              {VOLUME_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {errors.volumeRange && <p className="mt-1 text-xs text-red-300">{errors.volumeRange}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="ar-message" className={labelCls}>
            Mensaje <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="ar-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="¿Qué vendés? ¿A cuántos clientes?"
            rows={2}
            maxLength={500}
            className={`${inputCls} resize-none`}
          />
        </div>

        {submitError && (
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
              configMissing
                ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                : 'border-red-400/20 bg-red-500/10 text-red-300'
            }`}
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => { void handleSubmit() }}
          disabled={saving}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all duration-300 hover:bg-slate-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-[0_0_30px_rgba(255,255,255,0.25)] cursor-pointer"
        >
          {saving ? (
            <><Loader2 className="size-4 animate-spin" /> Enviando…</>
          ) : (
            <><span>Solicitar acceso</span> <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></>
          )}
        </button>
        <p className="text-center font-mono text-[10px] tracking-wider text-slate-500">
          Sin compromiso · Te contactamos por email
        </p>
      </div>
    </div>
  )
}
