/**
 * PaymentPage — pantalla del comprador al abrir el link de pago.
 *
 * URL params:
 *   ?vault=<0x…>    OrderVault address (CREATE2) — destination del transfer
 *   ?to=<0x…>       Fallback: merchant address directo (modo sin contrato)
 *   ?amount=<usdc>  Monto esperado (human-readable)
 *   ?memo=<text>    Descripción del pedido
 *   ?chargeId=<id>  ID del charge para correlación
 *   ?merchant=<0x…> Merchant address (solo cuando vault está presente, para mostrar)
 *   ?display=<ccy>  Moneda display del comprador (ARS, VES, …). Solo visual:
 *                   el cargo siempre se liquida en USDC.
 */

import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { createPublicClient, http, erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { TokenUSDC } from '@web3icons/react'
import { Landmark, Wallet, CreditCard, ChevronDown, Copy, Check, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import PayWithWallet from './PayWithWallet'
import { supabase } from '../lib/supabase'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'
import { fetchUsdRate, formatLocal, CURRENCIES, accountLabelForCurrency } from '@/lib/currency'
import type { LocalCurrency } from '@/lib/currency'

const CHARGE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type VerifyState = 'idle' | 'checking' | 'verified' | 'pending'

type MethodId = 'transfer' | 'usdc' | 'card'

/**
 * Payment-method registry — the Linktree rows. To add a method
 * (MercadoPago, cards, …): append one entry here with status 'soon' (or
 * 'active' plus its details panel in the accordion below). Nothing else
 * changes: the hero, verification and reconciliation stay untouched.
 */
const PAYMENT_METHODS: { id: MethodId; label: string; Icon: typeof Landmark; status: 'active' | 'soon' }[] = [
  { id: 'transfer', label: 'Transferencia bancaria', Icon: Landmark, status: 'active' },
  { id: 'usdc',     label: 'Pagar con USDC',         Icon: Wallet,   status: 'active' },
  { id: 'card',     label: 'Tarjeta de crédito / débito', Icon: CreditCard, status: 'soon' },
]

/** Label + value row with a copy button (alias, CBU, …). */
function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
      <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={`truncate text-xs font-semibold ${mono ? 'mono' : ''}`} style={{ color: 'var(--ink)' }}>{value}</span>
        <button
          type="button"
          onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
          className="shrink-0 rounded-md p-1 transition-colors hover:opacity-80"
          style={{ color: copied ? 'var(--success)' : 'var(--subtle)' }}
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </span>
    </div>
  )
}

const ARC_TESTNET_CHAIN_ID = 5042002

const VAULT_ABI = [
  { name: 'swept',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bool'    }] },
  { name: 'expectedAmount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'received',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
] as const

const glass = {
  page:  { background: 'var(--bg-gradient)', minHeight: '100dvh' } as React.CSSProperties,
  card:  { background: 'var(--surface)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid var(--border)' } as React.CSSProperties,
  strip: { background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981)', height: '3px', borderRadius: '3px 3px 0 0' } as React.CSSProperties,
  inner: { background: 'var(--surface-muted)', border: '1px solid var(--border)' } as React.CSSProperties,
}

interface VaultState {
  balance: bigint
  expected: bigint
  swept: boolean
}

interface PaymentPageProps {
  searchParams: URLSearchParams
}

export default function PaymentPage({ searchParams }: PaymentPageProps) {
  // Vault address takes priority over legacy `to` param
  const vaultAddress = searchParams.get('vault') ?? ''
  const legacyTo     = searchParams.get('to')     ?? ''
  const recipient    = vaultAddress || legacyTo          // where USDC actually goes
  const amount       = searchParams.get('amount')   ?? ''
  const memo         = searchParams.get('memo')     ?? ''
  const chargeId     = searchParams.get('chargeId') ?? searchParams.get('cid') ?? 'unknown'
  const hasVault     = isAddress(vaultAddress)
  // Buyer display currency: validated against known codes (display-only,
  // settlement stays USDC). Absent or unknown → USD-only hero.
  const rawDisplay = (searchParams.get('display') ?? '').toUpperCase()
  const displayCurrency: LocalCurrency | null =
    rawDisplay !== 'USD' && rawDisplay in CURRENCIES ? (rawDisplay as LocalCurrency) : null

  // Open method: transfer first when the merchant shared bank details,
  // otherwise USDC. 'soon' rows never open.
  const defaultMethod: MethodId =
    (searchParams.get('balias') ?? '').trim() !== '' || (searchParams.get('bacct') ?? '').trim() !== ''
      ? 'transfer'
      : 'usdc'
  const [openMethod, setOpenMethod] = useState<MethodId | null>(defaultMethod)
  const [paidTx, setPaidTx]         = useState<string | null>(null)
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [vaultState, setVaultState] = useState<VaultState | null>(null)
  const [vaultLoading, setVaultLoading] = useState(false)
  // Buyer currency view: 'usd' shows the USDC hero, 'local' the converted total.
  const [displayRate, setDisplayRate] = useState<number | null>(null)

  // Load the display rate once when the link carries a display currency.
  useEffect(() => {
    if (!displayCurrency) return
    let cancelled = false
    void fetchUsdRate(displayCurrency).then(rate => {
      if (!cancelled && rate) setDisplayRate(rate.usdToLocal)
    })
    return () => { cancelled = true }
  }, [displayCurrency])

  // Strict amount validation: only a plain decimal string that parses to a
  // finite positive number is accepted. Blocks "1e10" (parseFloat accepts
  // exponent notation), "12abc" (trailing garbage) and NaN/Infinity before
  // they reach the on-chain transfer or the receipt screen.
  const amountNum = /^\d+(\.\d+)?$/.test(amount) ? parseFloat(amount) : NaN
  const isValid = isAddress(recipient) && Number.isFinite(amountNum) && amountNum > 0

  // Hero total in the buyer's currency (null → USDC hero fallback).
  const heroLocal =
    displayCurrency && displayRate !== null && amountNum > 0
      ? formatLocal(amountNum * displayRate, displayCurrency)
      : null

  // The verification state starts from the payment event (not from the
  // effect below): setState-in-effect is a lint error in this codebase.
  const handlePaymentSuccess = (txHash: string) => {
    setPaidTx(txHash)
    if (CHARGE_UUID_RE.test(chargeId)) setVerifyState('checking')
  }

  // ── Onchain verification (primary reconciliation path) ───────────────────
  // After the wallet confirms, report the tx hash to check-payment so the
  // charge is marked paid without waiting for a webhook. Polls while the
  // chain catches up; silent on failure — the webhook path stays as backup.
  useEffect(() => {
    if (!paidTx || !CHARGE_UUID_RE.test(chargeId)) return
    let cancelled = false
    let attempts = 0
    const maxAttempts = 36 // ~3 min at 5 s intervals

    const check = (): Promise<boolean> =>
      supabase.functions.invoke('check-payment', {
        body: { charge_id: chargeId, tx_hash: paidTx },
      }).then(({ data, error }): boolean => {
        if (cancelled) return true
        if (error) return false
        const status = (data as { status?: string } | null)?.status
        if (status === 'paid' || status === 'already_paid') {
          setVerifyState('verified')
          return true
        }
        return false
      }).catch((): boolean => false)

    const timer = setInterval(() => {
      attempts += 1
      if (attempts >= maxAttempts) {
        clearInterval(timer)
        if (!cancelled) setVerifyState('pending')
        return
      }
      void check().then((done) => { if (done) clearInterval(timer) })
    }, 5000)
    void check().then((done) => { if (done) clearInterval(timer) })
    return () => { cancelled = true; clearInterval(timer) }
  }, [paidTx, chargeId])

  // Poll vault state every 5 s when vault address is present
  useEffect(() => {
    if (!hasVault || !isAddress(vaultAddress)) return
    const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)
    if (!usdcFact) return

    const client = createPublicClient({ chain: arcTestnet, transport: http() })

    const poll = async () => {
      setVaultLoading(true)
      try {
        const [swept, expected, received, usdcBalance] = await Promise.all([
          client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: 'swept' }),
          client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: 'expectedAmount' }),
          client.readContract({ address: vaultAddress, abi: VAULT_ABI, functionName: 'received' }),
          client.readContract({ address: usdcFact.address as `0x${string}`, abi: erc20Abi, functionName: 'balanceOf', args: [vaultAddress] }),
        ])
        setVaultState({ balance: usdcBalance > received ? usdcBalance : received, expected, swept })
      } catch {
        // RPC not reachable — silently skip
      } finally {
        setVaultLoading(false)
      }
    }

    void poll()
    const interval = setInterval(() => { void poll() }, 5000)
    return () => clearInterval(interval)
  }, [hasVault, vaultAddress])

  // Derived vault display
  const decimals = usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)
  const vaultReceived = vaultState ? Amount.fromRaw(vaultState.balance, decimals).toFixed(2) : null
  const vaultExpected = vaultState ? Amount.fromRaw(vaultState.expected, decimals).toFixed(2) : null
  const isPartial = vaultState && !vaultState.swept && vaultState.balance > 0n && vaultState.balance < vaultState.expected
  const isSwepped = vaultState?.swept ?? false

  if (!isValid) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4" style={{ background: 'var(--bg-gradient)' }}>
        <div className="max-w-sm rounded-3xl p-8 text-center" style={glass.card}>
          <AlertCircle className="mx-auto mb-3 size-8" style={{ color: 'var(--danger)' }} />
          <p className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>Link de pago inválido</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Falta información requerida. Pídele al comerciante que comparta un link nuevo.
          </p>
        </div>
      </div>
    )
  }

  // ── Already swept / paid ────────────────────────────────────────────────────
  if (isSwepped || paidTx) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4" style={{ background: 'var(--bg-gradient)' }}>
        <div className="w-full max-w-sm overflow-hidden rounded-3xl" style={glass.card}>
          <div style={glass.strip} />
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full" style={{ background: 'rgba(26,128,71,0.12)' }}>
              <CheckCircle2 className="size-8" style={{ color: 'var(--success)' }} />
            </div>
            <p className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>Pago recibido</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              ${amount} USDC · {memo}
            </p>
            {verifyState === 'verified' && (
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--success)' }}>
                Verificado onchain ✓
              </p>
            )}
            {verifyState === 'checking' && (
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                Verificando pago onchain…
              </p>
            )}
            {verifyState === 'pending' && (
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                Pago enviado — la confirmación onchain sigue pendiente.
              </p>
            )}
            {paidTx && (
              <a
                href={`https://explorer.testnet.arc.io/tx/${paidTx}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-mono transition-all hover:opacity-80"
                style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}
              >
                {paidTx.slice(0, 10)}…{paidTx.slice(-8)}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main payment flow ───────────────────────────────────────────────────────
  // Linktree layout: merchant header, total in the buyer's display currency,
  // then one row per payment method (transfer / USDC / coming soon). Crypto
  // jargon (addresses, testnet badges, beta kits) only appears inside the
  // USDC method — never scares the buyer upfront.
  const merchantName = searchParams.get('mname') ?? ''
  const bankName = searchParams.get('bname') ?? ''
  const bankAlias = searchParams.get('balias') ?? ''
  const bankAccount = searchParams.get('bacct') ?? ''
  const hasTransfer = bankAlias.trim() !== '' || bankAccount.trim() !== ''
  // Transfer row subtitle: local total + alias when known.
  const transferSubtitle = [heroLocal, bankAlias.trim()].filter(Boolean).join(' · ') || 'Ver datos de transferencia'

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8" style={glass.page}>
      {/* Merchant header */}
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        <div
          className="display flex size-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {(merchantName || 'P').slice(0, 1).toUpperCase()}
        </div>
        <p className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
          {merchantName || 'Treazury'}
        </p>
        {memo && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{memo}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Charge card */}
        <div className="overflow-hidden rounded-3xl" style={glass.card}>
          <div style={glass.strip} />
          <div className="p-6">
            {/* Amount hero — display currency first, never USDC upfront */}
            {heroLocal ? (
              <div className="flex items-baseline justify-center gap-2">
                <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {heroLocal}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline justify-center gap-2">
                <TokenUSDC variant="branded" size={32} />
                <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  ${amountNum.toFixed(2)}
                </span>
                <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
              </div>
            )}
            {displayCurrency && displayRate === null && (
              <p className="mt-2 text-center text-xs" style={{ color: 'var(--subtle)' }}>Trayendo tasa…</p>
            )}

            {/* Vault state: partial payment banner */}
            {isPartial && (
              <div className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#b45309' }}>
                <Clock className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Pago parcial recibido: <strong>${vaultReceived}</strong> de <strong>${vaultExpected}</strong>.
                  Transfiere el monto restante a la misma dirección del vault.
                </span>
              </div>
            )}

            {/* Vault loading indicator */}
            {hasVault && vaultLoading && !vaultState && (
              <p className="mt-2 text-center text-xs" style={{ color: 'var(--subtle)' }}>
                Verificando estado del vault…
              </p>
            )}
          </div>
        </div>

        {/* Payment methods — Linktree rows. To add a method (MercadoPago,
            cards, …): append an entry to PAYMENT_METHODS below with its
            details panel. Nothing else changes. */}
        <div className="space-y-2">
          {PAYMENT_METHODS.filter(m => m.id !== 'transfer' || hasTransfer).map(method => {
            if (method.status === 'soon') {
              return (
                <div
                  key={method.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 opacity-60"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <method.Icon className="size-5 shrink-0" style={{ color: 'var(--subtle)' }} />
                  <span className="flex-1 text-left text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                    {method.label}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: 'var(--surface-muted)', color: 'var(--subtle)', border: '1px solid var(--border)' }}
                  >
                    Próximamente
                  </span>
                </div>
              )
            }
            const open = openMethod === method.id
            return (
              <div key={method.id} className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setOpenMethod(open ? null : method.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:opacity-90"
                >
                  <method.Icon className="size-5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                      {method.label}
                    </span>
                    <span className="block truncate text-xs" style={{ color: 'var(--muted)' }}>
                      {method.id === 'transfer' ? transferSubtitle : `$${amountNum.toFixed(2)} USDC`}
                    </span>
                  </span>
                  <ChevronDown
                    className="size-4 shrink-0 transition-transform"
                    style={{ color: 'var(--subtle)', transform: open ? 'rotate(180deg)' : undefined }}
                  />
                </button>
                {open && (
                  <div className="border-t px-4 py-4" style={{ borderColor: 'var(--border)' }}>
                    {method.id === 'transfer' ? (
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>A transferir</span>
                          <span className="display text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                            {heroLocal ?? `$${amountNum.toFixed(2)}`}
                          </span>
                        </div>
                        {bankAlias.trim() && (
                          <CopyField label="Alias" value={bankAlias.trim()} />
                        )}
                        {bankName.trim() && (
                          <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>Banco</span>
                            <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>{bankName.trim()}</span>
                          </div>
                        )}
                        {bankAccount.trim() && (
                          <CopyField label={accountLabelForCurrency(displayCurrency, bankAccount.trim())} value={bankAccount.trim()} mono />
                        )}
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--subtle)' }}>
                          Transfiere el total exacto y avísale al comerciante — confirmará el pago manualmente.
                        </p>
                      </div>
                    ) : (
                      <PayWithWallet
                        recipientAddress={recipient}
                        amount={amount}
                        memo={memo}
                        chargeId={chargeId}
                        isVault={hasVault}
                        onSuccess={handlePaymentSuccess}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Pagos seguros con <span className="font-semibold">Treazury</span>
        </p>
      </div>
    </div>
  )
}
