/**
 * PayStyle SDK — Circle Developer-Controlled Wallet helpers
 *
 * Wraps Circle's developer-controlled wallets SDK.
 * In a production SDK this module runs server-side only.
 * For this PoC it runs in the browser using VITE_ env vars so the
 * demo works without a backend.
 */

import type { SDKConfig } from './types'

// The Circle developer-controlled wallets SDK is a server-side package.
// We call Circle's REST API directly here so the PoC runs in the browser.
const CIRCLE_API_BASE = 'https://api.circle.com/v1/w3s'

interface CircleWallet {
  id: string
  address: string
  blockchain: string
  state: string
}

interface CircleApiResponse {
  data?: {
    wallets?: CircleWallet[]
    walletSet?: { id: string }
  }
  message?: string
}

/**
 * Attempt to fetch an existing wallet set + wallet for this merchant.
 * Returns the first Arc wallet address found, or null if none exist yet.
 *
 * In this PoC "merchant" is identified by the API key (one key = one merchant).
 * A real implementation would pass a merchantId to scope wallets.
 */
export async function resolveMerchantWallet(config: SDKConfig): Promise<string | null> {
  try {
    const res = await fetch(`${CIRCLE_API_BASE}/wallets?pageSize=10`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return null
    const json = (await res.json()) as CircleApiResponse
    const wallets: CircleWallet[] = json?.data?.wallets ?? []
    // Prefer Arc Testnet wallets
    const arcWallet = wallets.find(
      (w) => w.blockchain === 'ARC-TESTNET' && w.state === 'LIVE',
    )
    if (arcWallet) return arcWallet.address
    return null
  } catch {
    return null
  }
}

/**
 * Create a new wallet set + wallet for this merchant on Arc Testnet.
 * Returns the wallet address.
 */
export async function createMerchantWallet(config: SDKConfig): Promise<string> {
  // 1. Create a wallet set
  const setRes = await fetch(`${CIRCLE_API_BASE}/developer/walletSets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      entitySecretCiphertext: config.entitySecret, // PoC: passed raw; prod: ciphertext
      name: 'PayStyle Merchant Wallet Set',
    }),
  })

  if (!setRes.ok) {
    const err = (await setRes.json().catch(() => ({}))) as CircleApiResponse
    throw new Error(
      `Failed to create wallet set: ${err?.message ?? setRes.statusText}`,
    )
  }

  const setJson = (await setRes.json()) as CircleApiResponse
  const walletSetId: string = setJson?.data?.walletSet?.id ?? ''
  if (!walletSetId) throw new Error('Wallet set ID missing from response')

  // 2. Create a wallet in that set on ARC-TESTNET
  const walletRes = await fetch(`${CIRCLE_API_BASE}/developer/wallets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      entitySecretCiphertext: config.entitySecret,
      blockchains: ['ARC-TESTNET'],
      count: 1,
      walletSetId,
    }),
  })

  if (!walletRes.ok) {
    const err = (await walletRes.json().catch(() => ({}))) as CircleApiResponse
    throw new Error(
      `Failed to create wallet: ${err?.message ?? walletRes.statusText}`,
    )
  }

  const walletJson = (await walletRes.json()) as CircleApiResponse
  const wallets: CircleWallet[] = walletJson?.data?.wallets ?? []
  const newWallet = wallets[0]
  if (!newWallet?.address) throw new Error('Wallet address missing from response')

  return newWallet.address
}

/**
 * Resolve the merchant wallet: returns existing or creates a new one.
 */
export async function getOrCreateMerchantWallet(config: SDKConfig): Promise<string> {
  const existing = await resolveMerchantWallet(config)
  if (existing) return existing
  return createMerchantWallet(config)
}
