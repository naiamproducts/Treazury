/**
 * PayWithWallet — flujo de pago USDC con wallet conectada.
 *
 * Cuando `isVault=true` el transfer va al OrderVault (no al merchant directo).
 * Tras confirmar el transfer, llama automáticamente a vault.settle() para
 * triggerear el sweep y la distribución de fees.
 * Funciona también sin vault (fallback directo al merchant).
 */

import { useState } from 'react'
import {
  useAccount, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, useSwitchChain,
} from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { erc20Abi } from 'viem'
import { Loader2, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

// Minimal vault ABI — only settle()
const VAULT_SETTLE_ABI = [
  {
    name: 'settle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const

const glass = {
  card:  { background: 'var(--surface)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', border: '1px solid var(--border)' } as React.CSSProperties,
  inner: { background: 'var(--surface-muted)', border: '1px solid var(--border)' } as React.CSSProperties,
}

function parseOnchainError(error: Error | null): string {
  if (!error) return ''
  const msg = error.message.toLowerCase()
  if (msg.includes('user rejected') || msg.includes('denied'))  return 'Transacción cancelada.'
  if (msg.includes('insufficient'))                             return 'Balance de USDC insuficiente.'
  if (msg.includes('reverted'))                                 return 'La transacción fue revertida. Intenta de nuevo.'
  return 'Algo salió mal. Intenta de nuevo.'
}

interface PayWithWalletProps {
  /** Vault address (if contract mode) or merchant address (fallback) */
  recipientAddress: string
  amount: string      // human-readable USDC, e.g. "5.00"
  memo: string
  chargeId: string
  /** True when recipientAddress is an OrderVault — calls settle() after transfer */
  isVault?: boolean
  onSuccess?: (txHash: string) => void
}

export default function PayWithWallet({
  recipientAddress,
  amount,
  memo,
  chargeId,
  isVault = false,
  onSuccess,
}: PayWithWalletProps) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [confirmed, setConfirmed]     = useState(false)
  const [settling, setSettling]       = useState(false)
  const [settleError, setSettleError] = useState('')

  const wrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID

  // Payer's USDC balance
  const { data: rawBalance, isLoading: balanceLoading } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance = rawBalance
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(ARC_TESTNET_CHAIN_ID)).toFixed(2)
    : null

  // Parse amount
  let parsedAmount: bigint | null = null
  let parseError = ''
  try {
    if (amount) parsedAmount = parseAmount(ARC_TESTNET_CHAIN_ID, amount).raw
  } catch {
    parseError = 'Monto inválido.'
  }

  const insufficientBalance =
    rawBalance !== undefined && parsedAmount !== null && rawBalance < parsedAmount

  // Transfer USDC → recipientAddress
  const {
    writeContract: sendTransfer,
    data: transferHash,
    isPending: transferPending,
    error: transferError,
    reset: resetTransfer,
  } = useWriteContract()

  const { isLoading: transferConfirming, isSuccess: transferSuccess } =
    useWaitForTransactionReceipt({ hash: transferHash, chainId: ARC_TESTNET_CHAIN_ID })

  // settle() — called after transfer confirmed, only when isVault
  const { writeContract: callSettle, isPending: settlePending } = useWriteContract()

  // One-shot: once transfer confirmed, call settle() on the vault
  if (transferSuccess && transferHash && !confirmed) {
    setConfirmed(true)
    if (isVault) {
      setSettling(true)
      callSettle(
        {
          address: recipientAddress as `0x${string}`,
          abi: VAULT_SETTLE_ABI,
          functionName: 'settle',
          chainId: ARC_TESTNET_CHAIN_ID,
        },
        {
          onSuccess: () => {
            setSettling(false)
            onSuccess?.(transferHash)
          },
          onError: (err) => {
            setSettling(false)
            // settle() failure is non-critical — the funds are already in the vault.
            // Anyone can call settle() later. We still mark the payment as complete.
            setSettleError(
              err instanceof Error && err.message.toLowerCase().includes('user rejected')
                ? ''
                : 'settle() falló — los fondos están en el vault. El sweep ocurrirá en el próximo intento.',
            )
            onSuccess?.(transferHash)
          },
        },
      )
    } else {
      onSuccess?.(transferHash)
    }
  }

  const txUrl = transferHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, transferHash) : null

  const handlePay = () => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (!parsedAmount || !recipientAddress) return
    sendTransfer({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, parsedAmount],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  const errorMessage = parseError || parseOnchainError(transferError ?? null)
  const isReady =
    isConnected && !wrongChain && !!parsedAmount &&
    !insufficientBalance && !transferPending && !transferConfirming &&
    !transferSuccess

  // ── Success receipt ────────────────────────────────────────────────────────
  if (transferSuccess && transferHash) {
    return (
      <div className="rounded-2xl p-5 text-center" style={glass.card}>
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full" style={{ background: 'rgba(26,128,71,0.12)' }}>
          {settling || settlePending
            ? <Loader2 className="size-6 animate-spin" style={{ color: 'var(--success)' }} />
            : <CheckCircle2 className="size-6" style={{ color: 'var(--success)' }} />}
        </div>
        <p className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
          {settling || settlePending ? 'Procesando…' : 'Pago confirmado'}
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          ${amount} USDC {isVault ? 'depositados en el vault' : 'enviados al comerciante'}
        </p>
        <p className="mt-1 text-xs font-mono" style={{ color: 'var(--subtle)' }}>
          Pedido: {chargeId.slice(0, 8)}…
        </p>
        {settleError && (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>{settleError}</p>
        )}
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"
            style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
          >
            <ExternalLink className="size-3.5" />
            Ver en explorer
          </a>
        )}
      </div>
    )
  }

  // ── Main payment form ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {!isConnected ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl p-5" style={glass.card}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Conecta tu wallet para pagar con USDC
          </p>
          <ConnectKitButton />
        </div>
      ) : (
        <>
          {wrongChain ? (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
              <AlertCircle className="size-4 shrink-0" />
              Red incorrecta. Cambia a Arc Testnet para continuar.
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={glass.inner}>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Tu balance USDC</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>
                {balanceLoading ? '…' : formattedBalance !== null ? `$${formattedBalance}` : '—'}
              </span>
            </div>
          )}

          {insufficientBalance && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
              <AlertCircle className="size-4 shrink-0" />
              Balance insuficiente. Necesitas ${amount} USDC.
            </div>
          )}

          {errorMessage && !insufficientBalance && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
              <AlertCircle className="size-4 shrink-0" />
              {errorMessage}
              <button className="ml-auto text-xs underline" onClick={resetTransfer}>Reintentar</button>
            </div>
          )}

          {memo && (
            <div className="flex items-center justify-between rounded-xl px-4 py-2.5" style={glass.inner}>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Referencia</span>
              <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>{memo}</span>
            </div>
          )}

          {isVault && (
            <div className="rounded-xl px-4 py-2.5" style={glass.inner}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Los fondos se depositan en un vault de pago seguro y el comerciante los recibe automáticamente al confirmarse.
              </p>
            </div>
          )}

          <button
            disabled={!isReady}
            onClick={handlePay}
            className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {wrongChain
              ? 'Cambiar a Arc Testnet'
              : transferPending
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirma en tu wallet…</span>
              : transferConfirming
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirmando…</span>
              : `Pagar $${amount} USDC`}
          </button>

          <p className="text-center text-xs" style={{ color: 'var(--subtle)' }}>
            {isVault
              ? 'El pago queda registrado onchain en el vault del pedido'
              : 'Fondos directos a la wallet del comerciante en Arc Testnet'}
          </p>
        </>
      )}
    </div>
  )
}
