/**
 * PayStyle — merchant wallet state shared with the dashboard.
 *
 * The context always exists, with or without Privy: when Privy is
 * unconfigured the provider below serves the disabled value so every
 * consumer keeps rendering and the dashboard falls back to the tenant's
 * stored payout address. No consumer ever touches a Privy hook directly,
 * which is what keeps the unconfigured path safe.
 */

import { createContext, useContext } from 'react'

export interface MerchantWalletState {
  /** False when no VITE_PRIVY_APP_ID is set — every address stays null. */
  configured: boolean
  /** True once the wallet layer settled (or immediately when disabled). */
  ready: boolean
  /** Linked embedded EVM payout address (0x…), or null when none yet. */
  evmAddress: string | null
  /**
   * Linked embedded Solana payout address (base58), or null when none yet.
   * Exposed for future per-chain selection — the automatic persist path
   * writes only the EVM address as the settlement address
   * (tenants.merchant_wallet_address), and the merchant can always override
   * the stored address manually (BYOW).
   */
  solanaAddress: string | null
  /** True while any embedded wallet (EVM or Solana) is being created. */
  ensuring: boolean
  /** Last wallet-creation failure, if the capped automatic retries are exhausted. */
  walletError: string | null
  /**
   * Clears only the current attempt/retry state and runs one more bounded
   * retry sequence. Never clears a linked address and never loops: the
   * per-user guard and the capped exponential retries still apply. Stable
   * across renders; a no-op when the wallet layer is disabled.
   */
  retryWallet: () => void
}

export const DISABLED_MERCHANT_WALLET: MerchantWalletState = {
  configured: false,
  ready: true,
  evmAddress: null,
  solanaAddress: null,
  ensuring: false,
  walletError: null,
  retryWallet: () => {},
}

export const MerchantWalletContext =
  createContext<MerchantWalletState>(DISABLED_MERCHANT_WALLET)

/** Payout address the dashboard should use: EVM only, never a user id. */
export function useMerchantWallet(): MerchantWalletState {
  return useContext(MerchantWalletContext)
}
