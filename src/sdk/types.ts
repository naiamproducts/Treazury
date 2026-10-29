/**
 * PayStyle SDK — Type definitions
 *
 * These are the public types a developer consumes when integrating the SDK.
 * They are intentionally framework-agnostic (no React imports here).
 */

export interface SDKConfig {
  /**
   * Circle Developer API Key — LEGACY, server-side only.
   * Non-custodial is the default: merchants collect to their own address
   * (Privy embedded wallet or BYOW) and the platform never signs. These
   * fields stay so tenants created under the legacy Circle flow keep
   * working through the `circle-wallet` Edge Function — they must NEVER
   * be set from VITE_ env vars or any browser-bundled value.
   */
  apiKey: string
  /** Circle Entity Secret — LEGACY, server-side only (see apiKey). */
  entitySecret: string
  /** Chain ID to operate on. Defaults to Arc mainnet (5042) */
  chainId?: number
}

export interface Charge {
  /** Unique charge id (uuid v4) */
  id: string
  /** Human-readable description / order reference */
  memo: string
  /** Amount in USDC (human-readable, e.g. "5.00") */
  amount: string
  /** Merchant wallet address that will ultimately receive the funds after sweep */
  merchantAddress: string
  /**
   * OrderVault contract address (CREATE2, deterministic per chargeId).
   * The payer transfers USDC here — not directly to merchantAddress.
   * Undefined in demo mode (no contract interaction).
   */
  vaultAddress?: string
  /** Full shareable payment URL — includes vaultAddress when available */
  paymentUrl: string
  /** ISO timestamp */
  createdAt: string
}

export type ChargeStatus =
  | 'pending'    // Link generated, no payment yet
  | 'paid'       // On-chain transfer confirmed
  | 'failed'     // Transfer failed or was cancelled

export interface ChargeStatusResult {
  chargeId: string
  status: ChargeStatus
  /** Populated once status is 'paid' */
  txHash?: string
  /** Populated once status is 'paid' */
  paidAt?: string
  /** Populated once status is 'failed' */
  errorMessage?: string
}
