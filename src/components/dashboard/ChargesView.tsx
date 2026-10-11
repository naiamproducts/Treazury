/**
 * ChargesView — generar cobros manuales (sin orden), ver historial de links.
 * Mueve la funcionalidad del MerchantPanel original a esta vista.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Copy, CheckCheck, MessageCircle, ExternalLink, ChevronRight } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import type { DashboardStore } from '@/store'
import type { Charge } from '@/sdk'
import { createPayStyleSDK } from '@/sdk'

// ── helpers ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02]"
      style={{ background: 'var(--surface-muted)', color: copied ? 'var(--success)' : 'var(--ink-2)', border: '1px solid var(--border)' }}
    >
      {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

function whatsAppUrl(link: string, amount: string, memo: string) {
  const text = encodeURIComponent(
    `Hola! Te comparto el link de pago por $${amount} USDC${memo ? ` — ${memo}` : ''}:\n\n${link}`
  )
  return `https://wa.me/?text=${text}`
}

// ── Root ────────────────────────────────────────────────────────────────────

export default function ChargesView({ store }: { store: DashboardStore }) {
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [charges, setCharges] = useState<Charge[]>([])
  const [lastCharge, setLastCharge] = useState<Charge | null>(null)

  const sdk = createPayStyleSDK({ apiKey: 'demo', entitySecret: 'demo' })
  ;(sdk as unknown as { merchantAddress: string }).merchantAddress = store.merchantAddress

  const canGenerate = !!amount && parseFloat(amount) > 0

  const handleGenerate = () => {
    if (!canGenerate) return
    void sdk.createCharge({ amount, memo }).then(charge => {
      setLastCharge(charge)
      setCharges(prev => [charge, ...prev])
      setAmount('')
      setMemo('')
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Wallet chip */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Wallet destino</p>
          <p className="mono mt-0.5 text-xs" style={{ color: 'var(--ink-2)' }}>
            {store.merchantAddress.slice(0, 10)}…{store.merchantAddress.slice(-8)}
          </p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(26,128,71,0.1)', color: 'var(--success)' }}>Activa</span>
      </div>

      {/* Amount + memo */}
      <div className="overflow-hidden rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899,#f59e0b,#10b981)', borderRadius: '3px 3px 0 0' }} />
        <div className="p-5 space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cobro rápido</p>

          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <div className="flex items-baseline gap-2">
              <span className="display text-2xl font-bold" style={{ color: 'var(--muted)' }}>$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v) }}
                placeholder="0.00"
                className="display w-full bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                style={{ color: 'var(--ink)' }}
              />
              <div className="flex shrink-0 items-center gap-1.5">
                <TokenUSDC variant="branded" size={20} />
                <span className="text-base font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['5', '10', '25', '50', '100'].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all hover:scale-[1.03]"
                  style={{ background: amount === v ? 'var(--accent)' : 'var(--surface)', color: amount === v ? '#fff' : 'var(--ink-2)', border: '1px solid var(--border)' }}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="Descripción (ej: Pedido #123, Consulta)"
            maxLength={80}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          />

          <button
            disabled={!canGenerate}
            onClick={handleGenerate}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            <Plus className="size-4" /> Generar link de pago
          </button>
        </div>
      </div>

      {/* Latest charge */}
      <AnimatePresence>
        {lastCharge && (
          <motion.div
            key={lastCharge.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="overflow-hidden rounded-3xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899,#f59e0b,#10b981)', borderRadius: '3px 3px 0 0' }} />
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  ${parseFloat(lastCharge.amount).toFixed(2)} USDC
                </span>
                {lastCharge.memo && <span className="text-xs" style={{ color: 'var(--muted)' }}>{lastCharge.memo}</span>}
              </div>
              <div className="mb-3 overflow-hidden rounded-xl px-3 py-2.5 text-xs font-mono break-all" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}>
                {lastCharge.paymentUrl}
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={lastCharge.paymentUrl} />
                <a
                  href={whatsAppUrl(lastCharge.paymentUrl, lastCharge.amount, lastCharge.memo)}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-[1.02]"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
                <a
                  href={lastCharge.paymentUrl}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02]"
                  style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
                >
                  <ExternalLink className="size-3.5" /> Abrir
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {charges.length > 1 && (
        <div className="overflow-hidden rounded-3xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="p-5">
            <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--ink)' }}>Historial de cobros</p>
            <div className="space-y-2">
              {charges.slice(1).map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                      ${parseFloat(c.amount).toFixed(2)} USDC
                      {c.memo && <span className="ml-1.5 font-normal" style={{ color: 'var(--muted)' }}>· {c.memo}</span>}
                    </p>
                    <p className="mono mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>{new Date(c.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={c.paymentUrl} />
                    <a href={c.paymentUrl} target="_blank" rel="noreferrer">
                      <ChevronRight className="size-4" style={{ color: 'var(--subtle)' }} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
