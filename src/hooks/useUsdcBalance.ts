/**
 * useUsdcBalance — polls the merchant's USDC balance on Arc (mainnet).
 *
 * Reuses the same viem public-client + erc20Abi pattern as PaymentPage so
 * the dashboard and the payment page read the chain the same way.
 * Refreshes every 15 s; silently skips when the address or RPC is missing.
 */

import { useEffect, useState } from 'react'
import { createPublicClient, http, erc20Abi } from 'viem'
import { getUsdc, USDC_DECIMALS } from '@/onchain-facts'
import { arc, ARC_MAINNET_CHAIN_ID } from '@/lib/arc-chain'

const ARC_CHAIN_ID = ARC_MAINNET_CHAIN_ID
const client = createPublicClient({ chain: arc, transport: http() })
const POLL_MS = 15_000

export function useUsdcBalance(address: string | null | undefined): {
  balance: bigint | null
  loading: boolean
} {
  const [balance, setBalance] = useState<bigint | null>(null)
  const [loading, setLoading] = useState(false)
  const validAddress = typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address)

  useEffect(() => {
    if (!validAddress || !address) return
    const usdc = getUsdc(ARC_CHAIN_ID)
    if (!usdc) return

    let cancelled = false
    const poll = async () => {
      setLoading(true)
      try {
        const raw = await client.readContract({
          address: usdc.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        })
        if (!cancelled) setBalance(raw)
      } catch {
        // RPC unreachable — keep last known balance
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void poll()
    const timer = setInterval(() => void poll(), POLL_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [address, validAddress])

  return { balance, loading }
}

/** Format a raw USDC bigint as a human-readable string (6 decimals). */
export function formatUsdc(raw: bigint | null): string {
  if (raw === null) return '—'
  const negative = raw < 0n
  const abs = negative ? -raw : raw
  const whole = abs / 10n ** BigInt(USDC_DECIMALS)
  const frac = abs % 10n ** BigInt(USDC_DECIMALS)
  const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fracStr ? `.${fracStr}` : ''}`
}
