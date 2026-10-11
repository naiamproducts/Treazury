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
 */

import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { createPublicClient, http, erc20Abi } from 'viem'
import { arcTestnet } from 'viem/chains'
import { TokenUSDC } from '@web3icons/react'
import { MessageCircle, CreditCard, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import PayWithWallet from './PayWithWallet'
import { getUsdc } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

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

type Tab = 'wallet' | 'card'

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
  const merchant     = searchParams.get('merchant') ?? legacyTo  // who ultimately receives
  const amount       = searchParams.get('amount')   ?? ''
  const memo         = searchParams.get('memo')     ?? ''
  const chargeId     = searchParams.get('chargeId') ?? searchParams.get('cid') ?? 'unknown'
  const hasVault     = isAddress(vaultAddress)

  const [activeTab, setActiveTab]   = useState<Tab>('wallet')
  const [paidTx, setPaidTx]         = useState<string | null>(null)
  const [vaultState, setVaultState] = useState<VaultState | null>(null)
  const [vaultLoading, setVaultLoading] = useState(false)

  const isValid = isAddress(recipient) && !!amount && parseFloat(amount) > 0

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
            {paidTx && (
              <p className="mt-4 rounded-xl px-4 py-2 text-xs font-mono" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
                {paidTx.slice(0, 10)}…{paidTx.slice(-8)}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main payment flow ───────────────────────────────────────────────────────
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8" style={glass.page}>
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2">
        <MessageCircle className="size-5" style={{ color: 'var(--accent)' }} />
        <span className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>PayStyle</span>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Charge card */}
        <div className="overflow-hidden rounded-3xl" style={glass.card}>
          <div style={glass.strip} />
          <div className="p-6">
            {/* Amount hero */}
            <div className="flex items-baseline gap-2">
              <TokenUSDC variant="branded" size={32} />
              <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                ${parseFloat(amount).toFixed(2)}
              </span>
              <span className="text-lg font-medium" style={{ color: 'var(--subtle)' }}>USDC</span>
            </div>

            {memo && (
              <p className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>{memo}</p>
            )}

            {/* Destination row */}
            <div className="mt-4 space-y-1.5">
              {hasVault ? (
                <div className="flex items-center justify-between rounded-xl px-3 py-2" style={glass.inner}>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Vault de pago</span>
                  <span className="mono text-xs" style={{ color: 'var(--ink-2)' }}>
                    {vaultAddress.slice(0, 8)}…{vaultAddress.slice(-6)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl px-3 py-2" style={glass.inner}>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Para</span>
                  <span className="mono text-xs" style={{ color: 'var(--ink-2)' }}>
                    {merchant.slice(0, 8)}…{merchant.slice(-6)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-center">
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(18,45,69,0.07)', color: 'var(--muted)' }}>
                  Arc Testnet · USDC
                </span>
              </div>
            </div>

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

        {/* Payment method tabs */}
        <div className="overflow-hidden rounded-3xl" style={glass.card}>
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {([
              { id: 'wallet' as Tab, label: 'Pagar con Wallet', Icon: Wallet },
              { id: 'card'   as Tab, label: 'Pagar con Tarjeta', Icon: CreditCard },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors"
                style={{
                  color:        activeTab === id ? 'var(--ink)' : 'var(--muted)',
                  borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent',
                  background:   'transparent',
                }}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'wallet' ? (
              <PayWithWallet
                recipientAddress={recipient}
                amount={amount}
                memo={memo}
                chargeId={chargeId}
                isVault={hasVault}
                onSuccess={setPaidTx}
              />
            ) : (
              <div className="space-y-4 py-2 text-center">
                <div
                  className="mx-auto flex size-12 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <CreditCard className="size-5" style={{ color: 'var(--muted)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Pago con tarjeta próximamente</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    Circle Onramp Kit (débito, Apple Pay, Google Pay) está en beta privada.
                  </p>
                </div>
                <div className="pt-1">
                  <p className="mb-3 text-xs" style={{ color: 'var(--subtle)' }}>Mientras tanto, paga con tu wallet:</p>
                  <ConnectKitButton />
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
          Powered by <span className="font-semibold">PayStyle</span> &amp; Circle USDC
        </p>
      </div>
    </div>
  )
}
