/**
 * PayWithWallet — flujo de pago USDC con wallet conectada.
 *
 * Cuando `isVault=true` el pago va al OrderVault vía el path atómico:
 * firma EIP-2612 offchain (permit, gratis) + depositWithPermit en UNA sola
 * tx — fondos, evento PaymentReceived y sweep ocurren juntos. Si la wallet
 * no soporta typed-data, cae a approve + deposit (dos txs). Los exchanges
 * y wallets externas usan transfer plano + settle (otro camino, acá no).
 * Sin vault: transfer directo al comerciante (sin cambios).
 */

import { useState } from 'react'
import {
  useAccount, useReadContract, useWriteContract,
  useWaitForTransactionReceipt, useSwitchChain,
  useSignTypedData, usePublicClient,
} from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { erc20Abi, parseSignature, type Address } from 'viem'
import { Loader2, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

// Luxe-dark row: label + value on a translucent dark surface.
const luxeRow =
  'border border-white/10 bg-white/[0.03]' as const

// Minimal vault ABI — atomic deposit paths (settle() is the legacy
// exchange/external path and is no longer called from here).
const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'depositWithPermit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
] as const

const ERC20_NONCES_ABI = [
  {
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

// Arc USDC EIP-712 domain — verified onchain: DOMAIN_SEPARATOR matches
// name 'USDC' (NOT the name() return value 'USD Coin') + version '2'.
const USDC_PERMIT_DOMAIN = {
  name: 'USDC',
  version: '2',
  chainId: ARC_TESTNET_CHAIN_ID,
  verifyingContract: USDC_ADDRESS,
} as const

const PERMIT_DEADLINE_SECONDS = 600

function parseOnchainError(error: Error | null): string {
  if (!error) return ''
  const msg = error.message.toLowerCase()
  if (msg.includes('user rejected') || msg.includes('denied'))  return 'Transacción cancelada.'
  if (msg.includes('insufficient'))                             return 'Balance de USDC insuficiente.'
  if (msg.includes('reverted'))                                 return 'La transacción fue revertida. Intenta de nuevo.'
  return 'Algo salió mal. Intenta de nuevo.'
}

function isUserRejection(error: unknown): boolean {
  return error instanceof Error &&
    (error.message.toLowerCase().includes('user rejected') ||
     error.message.toLowerCase().includes('denied') ||
     (error as { code?: number }).code === 4001)
}

interface PayWithWalletProps {
  /** Vault address (if contract mode) or merchant address (fallback) */
  recipientAddress: string
  amount: string      // human-readable USDC, e.g. "5.00"
  memo: string
  chargeId: string
  /** True when recipientAddress is an OrderVault — atomic deposit path */
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
  const publicClient = usePublicClient({ chainId: ARC_TESTNET_CHAIN_ID })
  const [depositFired, setDepositFired] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [permitError, setPermitError] = useState('')
  const [successNotified, setSuccessNotified] = useState(false)

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

  // Transfer USDC → recipientAddress (direct mode, no vault)
  const {
    writeContract: sendTransfer,
    data: transferHash,
    isPending: transferPending,
    error: transferError,
    reset: resetTransfer,
  } = useWriteContract()

  // Vault atomic path: depositWithPermit (permit sig + pull + accounting)
  const {
    writeContract: sendPermitDeposit,
    data: permitTxHash,
    isPending: permitTxPending,
    error: permitTxError,
  } = useWriteContract()

  // Vault fallback path: approve → deposit
  const {
    writeContract: sendApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
  } = useWriteContract()
  const {
    writeContract: sendDeposit,
    data: depositHash,
    isPending: depositPending,
  } = useWriteContract()

  const { signTypedDataAsync, isPending: signPending } = useSignTypedData()

  const { isLoading: permitTxConfirming, isSuccess: permitTxSuccess } =
    useWaitForTransactionReceipt({ hash: permitTxHash, chainId: ARC_TESTNET_CHAIN_ID })
  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash, chainId: ARC_TESTNET_CHAIN_ID })
  const { isLoading: depositConfirming, isSuccess: depositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash, chainId: ARC_TESTNET_CHAIN_ID })
  const { isLoading: transferConfirming, isSuccess: transferSuccess } =
    useWaitForTransactionReceipt({ hash: transferHash, chainId: ARC_TESTNET_CHAIN_ID })

  // One-shot: once the fallback approve confirms, fire the atomic deposit.
  if (approveSuccess && approveHash && !depositFired) {
    setDepositFired(true)
    sendDeposit(
      {
        address: recipientAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parsedAmount as bigint],
        chainId: ARC_TESTNET_CHAIN_ID,
      },
      { onError: () => setDepositFired(false) },
    )
  }

  const finalTxHash = isVault ? (permitTxHash ?? depositHash) : transferHash
  const finalSuccess = isVault ? (permitTxSuccess || depositSuccess) : transferSuccess

  // One-shot: hand the confirmed tx to the parent (starts check-payment polling).
  if (finalSuccess && finalTxHash && !successNotified) {
    setSuccessNotified(true)
    onSuccess?.(finalTxHash)
  }

  const txUrl = finalTxHash ? buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, finalTxHash) : null

  const handlePay = async () => {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (!parsedAmount || !recipientAddress) return
    setPermitError('')

    if (!isVault) {
      sendTransfer({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipientAddress as `0x${string}`, parsedAmount],
        chainId: ARC_TESTNET_CHAIN_ID,
      })
      return
    }

    // Vault: try the one-tx permit path first (typed-data signature is free).
    try {
      if (!address || !publicClient) throw new Error('no_wallet')
      const nonce = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_NONCES_ABI,
        functionName: 'nonces',
        args: [address],
      })
      const deadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_SECONDS)
      const signature = await signTypedDataAsync({
        domain: USDC_PERMIT_DOMAIN,
        types: PERMIT_TYPES,
        primaryType: 'Permit',
        message: {
          owner: address,
          spender: recipientAddress as Address,
          value: parsedAmount,
          nonce,
          deadline,
        },
      })
      const { r, s, v } = parseSignature(signature)
      sendPermitDeposit({
        address: recipientAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'depositWithPermit',
        args: [parsedAmount, deadline, Number(v), r, s],
        chainId: ARC_TESTNET_CHAIN_ID,
      })
    } catch (err) {
      if (isUserRejection(err)) {
        setPermitError('Firma cancelada.')
        return
      }
      // Wallet without typed-data support: approve + deposit (two txs).
      setFallbackMode(true)
      sendApprove({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [recipientAddress as `0x${string}`, parsedAmount],
        chainId: ARC_TESTNET_CHAIN_ID,
      })
    }
  }

  const activePending =
    transferPending || transferConfirming ||
    signPending || permitTxPending || permitTxConfirming ||
    approvePending || approveConfirming || depositPending || depositConfirming

  const errorMessage =
    parseError ||
    (permitError || parseOnchainError(
      (permitTxError ?? approveError ?? transferError),
    ))

  const isReady =
    isConnected && !wrongChain && !!parsedAmount &&
    !insufficientBalance && !activePending && !finalSuccess

  // ── Success receipt ────────────────────────────────────────────────────────
  if (finalTxHash && finalSuccess) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10">
          <CheckCircle2 className="size-6 text-emerald-300" />
        </div>
        <p className="font-serif text-xl font-medium text-white">
          Pago confirmado
        </p>
        <p className="mt-1 text-sm text-slate-400">
          ${amount} USDC {isVault ? 'depositados en el vault' : 'enviados al comerciante'}
        </p>
        <p className="mt-1 font-mono text-xs text-slate-500">
          Pedido: {chargeId.slice(0, 8)}…
        </p>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:text-white"
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
        <div className={`flex flex-col items-center gap-3 rounded-2xl p-5 ${luxeRow}`}>
          <p className="text-sm text-slate-400">
            Conecta tu wallet para pagar con USDC
          </p>
          <ConnectKitButton />
        </div>
      ) : (
        <>
          {wrongChain ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              Red incorrecta. Cambia a Arc Testnet para continuar.
            </div>
          ) : (
            <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${luxeRow}`}>
              <span className="text-xs text-slate-400">Tu balance USDC</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {balanceLoading ? '…' : formattedBalance !== null ? `$${formattedBalance}` : '—'}
              </span>
            </div>
          )}

          {insufficientBalance && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              Balance insuficiente. Necesitas ${amount} USDC.
            </div>
          )}

          {errorMessage && !insufficientBalance && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              {errorMessage}
              <button className="ml-auto text-xs underline hover:text-white" onClick={resetTransfer}>Reintentar</button>
            </div>
          )}

          {memo && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${luxeRow}`}>
              <span className="text-xs text-slate-400">Referencia</span>
              <span className="text-xs font-medium text-slate-200">{memo}</span>
            </div>
          )}

          {isVault && (
            <div className={`rounded-xl px-4 py-2.5 ${luxeRow}`}>
              <p className="text-xs text-slate-400">
                Los fondos se depositan en un vault de pago seguro y el comerciante los recibe automáticamente al confirmarse.
              </p>
            </div>
          )}

          <button
            disabled={!isReady}
            onClick={() => { void handlePay() }}
            className="w-full rounded-full bg-white py-3.5 font-mono text-xs font-medium uppercase tracking-wider text-black transition-all hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 shadow-[0_0_30px_rgba(255,255,255,0.25)]"
          >
            {wrongChain
              ? 'Cambiar a Arc Testnet'
              : signPending
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Firma en tu wallet…</span>
              : permitTxPending || transferPending
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirma en tu wallet…</span>
              : activePending
              ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" />Confirmando…</span>
              : `Pagar $${amount} USDC`}
          </button>

          {fallbackMode && (
            <p className="text-center text-xs text-slate-500">
              Tu wallet no firma typed-data: se usará approve + depósito (dos transacciones).
            </p>
          )}

          <p className="text-center text-xs text-slate-500">
            {isVault
              ? 'El pago queda registrado onchain en el vault del pedido'
              : 'Fondos directos a la wallet del comerciante en Arc Testnet'}
          </p>
        </>
      )}
    </div>
  )
}
