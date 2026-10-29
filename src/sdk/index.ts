/**
 * PayStyle SDK — Public API
 *
 * Minimal developer integration (non-custodial: the merchant collects to
 * their own address — Privy embedded wallet or BYOW — and the platform
 * never signs):
 *
 *   import { createPayStyleSDK } from '@/sdk'
 *
 *   const sdk = createPayStyleSDK({ apiKey, entitySecret })
 *   sdk.setMerchantAddress(privyEvmAddress) // Privy-first path for new
 *                                           // integrations (no Circle call)
 *   const charge = await sdk.createCharge({
 *     amount: '5.00',
 *     memo: 'Pedido #123',
 *   })
 *   // charge.paymentUrl → share via WhatsApp
 *
 * `init()` is the LEGACY Circle path (tenants created under it only) — new
 * integrations must NOT call it; set the Privy/BYOW address directly.
 *
 * The SDK delegates payment link creation to the PaymentProviderFactory, so
 * switching from USDC to another payment method requires zero SDK changes.
 */

import { getOrCreateMerchantWallet } from './circle-wallet'
import type { Charge, ChargeStatus, ChargeStatusResult, SDKConfig } from './types'
import { paymentFactory, USDCArcProvider } from '@/modules/payments'

export type { Charge, ChargeStatus, ChargeStatusResult, SDKConfig }

const ARC_CHAIN_ID = 5042

// Register built-in providers once.
// Additional providers (santander_pay, etc.) are registered by the host app
// before calling createPayStyleSDK, then passed as providerKey to createCharge.
function ensureDefaultProviders(baseUrl: string): void {
  if (!paymentFactory.list().find((p) => p.key === 'usdc_arc')) {
    paymentFactory.register(
      new USDCArcProvider({
        paymentPageBaseUrl: baseUrl,
        chainId: ARC_CHAIN_ID,
      }),
    )
  }
}

export class PayStyleSDK {
  private config: SDKConfig
  private merchantAddress: string | null = null
  private readonly baseUrl: string

  constructor(config: SDKConfig, baseUrl?: string) {
    this.config = {
      ...config,
      chainId: config.chainId ?? ARC_CHAIN_ID,
    }
    this.baseUrl = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
    ensureDefaultProviders(this.baseUrl)
  }

  /**
   * Resolve (or create) the merchant's Circle developer-controlled wallet —
   * LEGACY path, kept for tenants created under it. New integrations must
   * NOT call this: non-custodial is the default (merchant-owned address via
   * Privy embedded wallet or BYOW; direct transfers; check-payment
   * reconciliation), so the platform never holds signing power. Use
   * setMerchantAddress() instead.
   * Must be called once before createCharge() when using the legacy path.
   *
   * @deprecated LEGACY — legacy tenants only. New code must use
   * setMerchantAddress() with the Privy/BYOW address.
   */
  async init(): Promise<string> {
    this.merchantAddress = await getOrCreateMerchantWallet(this.config)
    return this.merchantAddress
  }

  /**
   * Privy-first path for new integrations: set the merchant's own payout
   * address directly (Privy embedded EVM address or BYOW). Makes no Circle
   * call and creates no wallet — new tenants must never touch the legacy
   * `circle-wallet` flow. Must be called once before createCharge().
   */
  setMerchantAddress(address: string): string {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new Error('setMerchantAddress() expects an EVM (0x…) payout address')
    }
    this.merchantAddress = address
    return this.merchantAddress
  }

  get address(): string | null {
    return this.merchantAddress
  }

  /**
   * Generate a payment link.
   *
   * @param amount      Human-readable USDC amount, e.g. "5.00"
   * @param memo        Order description shown on the payment page
   * @param providerKey Payment provider to use. Defaults to 'usdc_arc'.
   *                    Register a different provider via paymentFactory.register()
   *                    before calling this method.
   */
  async createCharge(params: {
    amount: string
    memo: string
    providerKey?: string
    /** Buyer display currency on the payment page (settlement stays USDC). */
    displayCurrency?: string
    /** Merchant identity + bank details shown on the payment page. */
    merchantName?: string
    bankName?: string
    bankAlias?: string
    bankAccount?: string
  }): Promise<Charge> {
    if (!this.merchantAddress) {
      throw new Error('Call sdk.setMerchantAddress() (or legacy sdk.init()) before createCharge()')
    }

    const key = params.providerKey ?? 'usdc_arc'
    const provider = paymentFactory.get(key)
    const currency = provider.supportedCurrencies[0] ?? 'USDC'

    const providerCharge = await paymentFactory.createCharge(key, {
      amount: params.amount,
      currency,
      description: params.memo,
      recipientRef: this.merchantAddress,
      displayCurrency: params.displayCurrency,
      merchantName: params.merchantName,
      bankName: params.bankName,
      bankAlias: params.bankAlias,
      bankAccount: params.bankAccount,
    })

    // Map PaymentCharge → legacy Charge shape (kept for UI compatibility)
    return {
      id: providerCharge.id,
      memo: params.memo,
      amount: params.amount,
      merchantAddress: this.merchantAddress,
      paymentUrl: providerCharge.paymentUrl,
      createdAt: providerCharge.createdAt,
    }
  }

  /**
   * Check the status of a charge.
   * Pass the txHash once the payer confirms on-chain.
   */
  getStatus(chargeId: string, txHash?: string): ChargeStatusResult {
    if (txHash) {
      return { chargeId, status: 'paid', txHash, paidAt: new Date().toISOString() }
    }
    return { chargeId, status: 'pending' }
  }
}

export function createPayStyleSDK(config: SDKConfig, baseUrl?: string): PayStyleSDK {
  return new PayStyleSDK(config, baseUrl)
}

// Re-export the factory so host apps can register additional providers
export { paymentFactory } from '@/modules/payments'
