/**
 * SettingsView — configuración del negocio, datos fiscales Venezuela (RIF),
 * wallet y preferencias de facturación.
 */

import { useState } from 'react'
import { Check, AlertCircle, Building2, Receipt, Wallet, ToggleLeft, ToggleRight } from 'lucide-react'
import type { DashboardStore } from '@/store'

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
  onTenantUpdate?: () => Promise<void>
}

export default function SettingsView({ store }: SettingsViewProps) {
  const [form, setForm] = useState({ ...store.config })
  const [saved, setSaved] = useState(false)

  const patch = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    store.updateConfig(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mx-auto max-w-md space-y-4">

      {/* Business info */}
      <Section icon={<Building2 className="size-4" />} title="Datos del negocio">
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Nombre del negocio</label>
          <input className={inputCls} style={inputStyle} value={form.name} onChange={e => patch('name', e.target.value)} placeholder="Mi Negocio" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Teléfono</label>
            <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => patch('phone', e.target.value)} placeholder="+58 412 000 0000" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Email</label>
            <input className={inputCls} style={inputStyle} value={form.email} onChange={e => patch('email', e.target.value)} placeholder="info@negocio.com" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Dirección fiscal</label>
          <input className={inputCls} style={inputStyle} value={form.address} onChange={e => patch('address', e.target.value)} placeholder="Av. Principal, Caracas" />
        </div>
      </Section>

      {/* Venezuelan fiscal data */}
      <Section icon={<Receipt className="size-4" />} title="Datos fiscales — Venezuela">
        <div
          className="rounded-xl px-3 py-2.5 text-xs"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--muted)' }}
        >
          El módulo de facturación Venezuela calcula IVA 16% + IGTF 3% automáticamente.
          El RIF aparece en todas las facturas emitidas.
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
            RIF <span className="font-normal opacity-60">(J-12345678-9 / V-12345678)</span>
          </label>
          <input
            className={inputCls} style={inputStyle}
            value={form.rif}
            onChange={e => patch('rif', e.target.value.toUpperCase())}
            placeholder="J-12345678-9"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Prefijo de factura</label>
          <input
            className={`${inputCls} mono`} style={inputStyle}
            value={form.invoicePrefix}
            onChange={e => patch('invoicePrefix', e.target.value)}
            placeholder="0001"
          />
        </div>

        {/* IGTF toggle */}
        <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Aplicar IGTF 3%</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Impuesto a pagos en divisas (USDC)</p>
          </div>
          <button onClick={() => patch('applyIgtf', !form.applyIgtf)}>
            {form.applyIgtf
              ? <ToggleRight className="size-8" style={{ color: 'var(--accent)' }} />
              : <ToggleLeft className="size-8" style={{ color: 'var(--subtle)' }} />
            }
          </button>
        </div>

        {!form.rif && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(217,119,6,0.08)', color: '#b45309', border: '1px solid rgba(217,119,6,0.2)' }}>
            <AlertCircle className="size-3.5 shrink-0" />
            El RIF es requerido para emitir facturas válidas en Venezuela.
          </div>
        )}
      </Section>

      {/* Wallet */}
      <Section icon={<Wallet className="size-4" />} title="Wallet de cobro">
        <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Dirección activa (Circle Developer-Controlled)</p>
          <p className="mono mt-1 break-all text-xs" style={{ color: 'var(--ink-2)' }}>{store.merchantAddress || '—'}</p>
        </div>
        <p className="text-xs" style={{ color: 'var(--subtle)' }}>
          La wallet se asigna al conectar tu cuenta Circle. Los fondos recibidos en los cobros van a esta dirección en Arc Testnet.
        </p>
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01]"
        style={{ background: saved ? '#1a8047' : 'var(--accent)' }}
      >
        <Check className="size-4" />
        {saved ? 'Configuración guardada' : 'Guardar configuración'}
      </button>
    </div>
  )
}
