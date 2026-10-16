/**
 * PayStyle — per-chain wallet references.
 *
 * Supabase remains the merchant identity and tenant authority; Privy only
 * custodies embedded wallets. Every chain the app ever pays out on gets its
 * own reference here so EVM and Solana addresses can never be confused.
 *
 * Active now: `evm` (Arc/EVM embedded wallet, 0x…) and `solana` (embedded
 * Solana wallet, base58). Settlement defaults to the EVM address
 * (tenants.merchant_wallet_address); the Solana address is exposed for
 * future per-chain selection and is never written as the settlement address
 * by the automatic persist path.
 */

export type WalletChain = 'evm' | 'solana'

export interface ChainWalletRef {
  chain: WalletChain
  /** Payout address on this chain, or null when none is linked yet. */
  address: string | null
}

export const EVM_CHAIN: WalletChain = 'evm'
export const SOLANA_CHAIN: WalletChain = 'solana'

/** EVM payout addresses are 0x…; anything else is never a wallet address. */
export function isEvmAddress(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)
}

/**
 * Solana payout addresses are base58-encoded public keys (32 bytes → 43–44
 * chars, never shorter than 32). Only the alphabet is checked here — full
 * curve validation happens on-chain at transfer time.
 */
export function isSolanaAddress(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}
