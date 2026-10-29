/**
 * PaymentPage — buyer screen when opening a payment link.
 *
 * URL params:
 *   ?vault=<0x…>    OrderVault address (CREATE2) — transfer destination
 *   ?to=<0x…>       Fallback: direct merchant address (contractless mode)
 *   ?amount=<usdc>  Expected amount (human-readable)
 *   ?memo=<text>    Order description
 *   ?chargeId=<id>  Charge ID for reconciliation
 *   ?merchant=<0x…> Merchant address (only when a vault is present, for display)
 *   ?display=<ccy>  Buyer display currency (ARS, VES, …). Display-only:
 *                   the charge always settles in USDC.
 *
 * Styled in the Treazury luxe-dark theme (scoped to .luxe-landing).
 */

import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { createPublicClient, http, erc20Abi } from 'viem'
import { TokenUSDC } from '@web3icons/react'
import { Landmark, Wallet, CreditCard, ChevronDown, Copy, Check, CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import PayWithWallet from './PayWithWallet'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/t'
import { getUsdc } from '@/onchain-facts'
import { arc, ARC_MAINNET_CHAIN_ID } from '@/lib/arc-chain'
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
  { id: 'transfer', label: t('pay.method.transfer'), Icon: Landmark, status: 'active' },
  { id: 'usdc',     label: t('pay.method.usdc'),     Icon: Wallet,   status: 'active' },
  { id: 'card',     label: t('pay.method.card'),     Icon: CreditCard, status: 'soon' },
]

/** Label + value row with a copy button (alias, CBU, …). */
function CopyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="shrink-0 text-xs text-slate-400">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className={`truncate text-xs font-semibold text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button
          type="button"
          onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }) }}
          className="shrink-0 rounded-md p-1 transition-colors hover:text-white"
          style={{ color: copied ? 'var(--luxe-cyan)' : undefined }}
          aria-label={t('pay.copyAria', { label })}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5 text-slate-500" />}
        </button>
      </span>
    </div>
  )
}

const ARC_CHAIN_ID = ARC_MAINNET_CHAIN_ID

const VAULT_ABI = [
  { name: 'swept',          type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'bool'    }] },
  { name: 'expectedAmount', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { name: 'received',       type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
] as const

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
    const usdcFact = getUsdc(ARC_CHAIN_ID)
    if (!usdcFact) return

    const client = createPublicClient({ chain: arc, transport: http() })

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
  const decimals = usdcDecimalsFor(ARC_CHAIN_ID)
  const vaultReceived = vaultState ? Amount.fromRaw(vaultState.balance, decimals).toFixed(2) : null
  const vaultExpected = vaultState ? Amount.fromRaw(vaultState.expected, decimals).toFixed(2) : null
  const isPartial = vaultState && !vaultState.swept && vaultState.balance > 0n && vaultState.balance < vaultState.expected
  const isSwepped = vaultState?.swept ?? false

  if (!isValid) {
    return (
      <div className="luxe-landing relative flex min-h-dvh items-center justify-center px-4 font-sans">
        <div className="pointer-events-none fixed inset-0 select-none overflow-hidden">
          <div className="luxe-dotgrid absolute inset-0"></div>
        </div>
        <div className="luxe-glass relative z-10 max-w-sm rounded-[2rem] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 size-8 text-red-400" />
          <p className="font-serif text-2xl font-medium text-white">{t('pay.invalid.title')}</p>
          <p className="mt-2 text-sm text-slate-400">
            {t('pay.invalid.body')}
          </p>
        </div>
      </div>
    )
  }

  // ── Already swept / paid ────────────────────────────────────────────────────
  if (isSwepped || paidTx) {
    return (
      <div className="luxe-landing relative flex min-h-dvh items-center justify-center px-4 font-sans">
        <div className="pointer-events-none fixed inset-0 select-none overflow-hidden">
          <div className="luxe-dotgrid absolute inset-0"></div>
        </div>
        <div className="luxe-glass relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem]">
          <div className="treazury-strip" />
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-300" />
            </div>
            <p className="font-serif text-3xl font-medium text-white">{t('pay.received.title')}</p>
            <p className="mt-2 text-sm text-slate-400">
              ${amount} USDC · {memo}
            </p>
            {verifyState === 'verified' && (
              <p className="mt-2 text-xs font-medium text-emerald-300">
                {t('pay.verified')}
              </p>
            )}
            {verifyState === 'checking' && (
              <p className="mt-2 text-xs text-slate-400">
                {t('pay.verifying')}
              </p>
            )}
            {verifyState === 'pending' && (
              <p className="mt-2 text-xs text-slate-400">
                {t('pay.confirmPending')}
              </p>
            )}
            {paidTx && (
              <a
                href={`https://explorer.testnet.arc.io/tx/${paidTx}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 font-mono text-xs text-slate-300 transition-all hover:text-white"
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
  const transferSubtitle = [heroLocal, bankAlias.trim()].filter(Boolean).join(' · ') || t('pay.viewTransferDetails')

  return (
    <div className="luxe-landing relative flex min-h-dvh flex-col items-center px-4 py-8 font-sans">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 select-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[38rem] w-[38rem] rounded-full bg-cyan-900/10 blur-[140px]"></div>
        <div className="absolute top-1/3 -right-48 h-[42rem] w-[42rem] rounded-full bg-slate-600/5 blur-[160px]"></div>
        <div className="luxe-dotgrid absolute inset-0"></div>
      </div>

      {/* Merchant header */}
      <div className="relative z-10 mb-5 flex flex-col items-center gap-1 text-center">
        <div className="luxe-glass flex size-12 items-center justify-center rounded-2xl font-serif text-lg font-medium text-white">
          {(merchantName || 'P').slice(0, 1).toUpperCase()}
        </div>
        <p className="font-serif text-2xl font-medium tracking-tight text-white">
          {merchantName || 'Treazury'}
        </p>
        {memo && (
          <p className="text-sm text-slate-400">{memo}</p>
        )}
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4">
        {/* Charge card */}
        <div className="luxe-glass overflow-hidden rounded-[1.5rem]">
          <div className="treazury-strip" />
          <div className="p-6">
            {/* Amount hero — display currency first, never USDC upfront */}
            {heroLocal ? (
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-serif text-5xl font-medium tabular-nums text-white">
                  {heroLocal}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline justify-center gap-2">
                <TokenUSDC variant="branded" size={32} />
                <span className="font-serif text-5xl font-medium tabular-nums text-white">
                  ${amountNum.toFixed(2)}
                </span>
                <span className="text-lg font-medium text-slate-400">USDC</span>
              </div>
            )}
            {displayCurrency && displayRate === null && (
              <p className="mt-2 text-center text-xs text-slate-500">{t('pay.rateLoading')}</p>
            )}

            {/* Vault state: partial payment banner */}
            {isPartial && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                <Clock className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {t('pay.partial.prefix')}<strong>${vaultReceived}</strong>{t('pay.partial.of')}<strong>${vaultExpected}</strong>{t('pay.partial.suffix')}
                </span>
              </div>
            )}

            {/* Vault loading indicator */}
            {hasVault && vaultLoading && !vaultState && (
              <p className="mt-2 text-center text-xs text-slate-500">
                {t('pay.vaultChecking')}
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
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3.5 opacity-60"
                >
                  <method.Icon className="size-5 shrink-0 text-slate-500" />
                  <span className="flex-1 text-left text-sm font-semibold text-slate-400">
                    {method.label}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {t('pay.badge.soon')}
                  </span>
                </div>
              )
            }
            const open = openMethod === method.id
            return (
              <div key={method.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setOpenMethod(open ? null : method.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <method.Icon className="size-5 shrink-0 text-icyCyan" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {method.label}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {method.id === 'transfer' ? transferSubtitle : `$${amountNum.toFixed(2)} USDC`}
                    </span>
                  </span>
                  <ChevronDown
                    className="size-4 shrink-0 text-slate-500 transition-transform"
                    style={{ transform: open ? 'rotate(180deg)' : undefined }}
                  />
                </button>
                {open && (
                  <div className="border-t border-white/10 px-4 py-4">
                    {method.id === 'transfer' ? (
                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">{t('pay.transfer.amountLabel')}</span>
                          <span className="font-serif text-2xl font-medium tabular-nums text-white">
                            {heroLocal ?? `$${amountNum.toFixed(2)}`}
                          </span>
                        </div>
                        {bankAlias.trim() && (
                          <CopyField label="Alias" value={bankAlias.trim()} />
                        )}
                        {bankName.trim() && (
                          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                            <span className="text-xs text-slate-400">{t('settings.field.bank')}</span>
                            <span className="text-xs font-semibold text-white">{bankName.trim()}</span>
                          </div>
                        )}
                        {bankAccount.trim() && (
                          <CopyField label={accountLabelForCurrency(displayCurrency, bankAccount.trim())} value={bankAccount.trim()} mono />
                        )}
                        <p className="text-[11px] leading-relaxed text-slate-500">
                          {t('pay.transfer.hint')}
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

        <p className="text-center text-xs text-slate-500">
          {t('pay.secure')} <span className="font-serif font-medium text-slate-300">Treazury</span>
        </p>
      </div>
    </div>
  )
}
