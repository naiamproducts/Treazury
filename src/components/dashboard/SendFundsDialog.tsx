/**
 * SendFundsDialog — envío de USDC desde la wallet embebida del comercio.
 *
 * Reemplaza el link muerto a app.arc.io: la wallet de cobros es una wallet
 * embebida de Privy custodiada por PayStyle, así que app.arc.io no puede
 * gestionarla. El envío se firma localmente con el provider EIP-1193 de la
 * wallet embebida y se envía onchain con viem sobre Arc Testnet.
 *
 * No custodiamos claves: Privy firma en el cliente y la app solo arma la
 * transacción ERC-20 transfer.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { createPublicClient, createWalletClient, custom, erc20Abi, http, isAddress } from 'viem'
import { arcTestnet } from 'viem/chains'
import { useWallets } from '@privy-io/react-auth'
import { getUsdc } from '@/onchain-facts'
import { parseUsdc, formatUsdc } from '@/onchain-money'
import { useUsdcBalance } from '@/hooks/useUsdcBalance'
import { t } from '@/i18n/t'
import { storeErrorMessage } from './CatalogView'

const ARC_TESTNET_CHAIN_ID = 5042002
const usdcFact = getUsdc(ARC_TESTNET_CHAIN_ID)!
const USDC_ADDRESS = usdcFact.address as `0x${string}`

const publicClient = createPublicClient({ chain: arcTestnet, transport: http() })

const inputStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }
const inputCls = 'w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all'

function isUserRejection(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return /user rejected|user denied|rejected the request/i.test(error.message)
}

interface SendFundsDialogProps {
  open: boolean
  onClose: () => void
  /** Merchant embedded-wallet address; null when the wallet layer is disabled. */
  senderAddress: string | null
}

export default function SendFundsDialog({ open, onClose, senderAddress }: SendFundsDialogProps) {
  const { wallets } = useWallets()
  const { balance } = useUsdcBalance(open ? senderAddress : null)

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing' | 'pending'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)

  // Closing resets the whole flow so the next send starts clean.
  const close = () => {
    setRecipient('')
    setAmount('')
    setError('')
    setStatus('idle')
    setTxHash(null)
    onClose()
  }

  const recipientValid = isAddress(recipient.trim())
  const amountNum = /^\d+(\.\d{1,6})?$/.test(amount) ? parseUsdc(amount) : null
  const amountValid = amountNum !== null && amountNum > 0n
  const withinBalance = balance !== null && amountNum !== null && amountNum <= balance
  const canSend = recipientValid && amountValid && withinBalance && status === 'idle' && !!senderAddress

  const handleSend = () => {
    setError('')
    if (!senderAddress || !amountNum) return
    const wallet = wallets.find(w => w.address.toLowerCase() === senderAddress.toLowerCase())
    if (!wallet) {
      setError(t('funds.error.walletNotFound'))
      return
    }
    setStatus('signing')
    void (async () => {
      try {
        const provider = await wallet.getEthereumProvider()
        const walletClient = createWalletClient({
          account: senderAddress as `0x${string}`,
          chain: arcTestnet,
          transport: custom(provider),
        })
        const hash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipient.trim() as `0x${string}`, amountNum],
          chain: arcTestnet,
        })
        setTxHash(hash)
        setStatus('pending')
        await publicClient.waitForTransactionReceipt({ hash })
        close()
      } catch (err) {
        setStatus('idle')
        setTxHash(null)
        if (isUserRejection(err)) {
          setError(t('funds.error.rejected'))
        } else {
          // StoreError maps to errors.store.*; any other Error keeps its
          // own English (viem/chain) message.
          setError(storeErrorMessage(err))
        }
      }
    })()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(18,45,69,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => { if (status === 'idle') close() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', boxShadow: '0 12px 48px rgba(18,45,69,0.22)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="treazury-strip" />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="display text-base font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{t('funds.title')}</h3>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                    {t('funds.subtitle')}{balance !== null ? ` · ${t('funds.balance', { balance: formatUsdc(balance) })}` : ''}
                  </p>
                </div>
                <button
                  onClick={close}
                  disabled={status !== 'idle'}
                  className="flex size-7 items-center justify-center rounded-lg transition-all hover:opacity-70 disabled:opacity-40"
                  style={{ color: 'var(--muted)' }}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                  {t('funds.recipient')} <span className="font-normal opacity-60">(0x…)</span>
                </label>
                <input
                  className={`${inputCls} mono`}
                  style={inputStyle}
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="0x…"
                  disabled={status !== 'idle'}
                  autoComplete="off"
                />
                {recipient.trim() !== '' && !recipientValid && (
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--danger)' }}>{t('funds.error.validateRecipient')}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--muted)' }}>{t('funds.amount')}</label>
                <input
                  className={`${inputCls} mono tabular-nums`}
                  style={inputStyle}
                  value={amount}
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  inputMode="decimal"
                  disabled={status !== 'idle'}
                />
                {amount.trim() !== '' && !amountValid && (
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--danger)' }}>{t('funds.error.validateAmount')}</p>
                )}
                {amountValid && balance !== null && !withinBalance && (
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--danger)' }}>{t('funds.error.insufficientBalance')}</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}>
                  <AlertCircle className="mt-px size-3.5 shrink-0" />
                  <span className="flex-1 break-words">{error}</span>
                </div>
              )}

              {status === 'pending' && txHash && (
                <a
                  href={`https://explorer.testnet.arc.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  {t('funds.txSent')}
                  <ExternalLink className="size-3" />
                </a>
              )}

              <button
                onClick={handleSend}
                disabled={!canSend}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                {status === 'signing' ? (
                  <><Loader2 className="size-4 animate-spin" /> {t('funds.waitingSignature')}</>
                ) : status === 'pending' ? (
                  <><Loader2 className="size-4 animate-spin" /> {t('funds.confirming')}</>
                ) : (
                  <><Send className="size-4" /> {t('funds.send')}</>
                )}
              </button>

              <p className="text-[11px] leading-relaxed text-center" style={{ color: 'var(--subtle)' }}>
                {t('funds.custodyHint')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
