/**
 * PayStyle SDK — Public API
 *
 * Minimal developer integration:
 *
 *   import { createPayStyleSDK } from '@/sdk'
 *
 *   const sdk = createPayStyleSDK({ apiKey, entitySecret })
 *   await sdk.init()                          // resolves merchant wallet
 *   const charge = await sdk.createCharge({
 *     amount: '5.00',
 *     memo: 'Pedido #123',
 *   })
 *   // charge.paymentUrl → share via WhatsApp
 *
 * The SDK delegates payment link creation to the PaymentProviderFactory, so
 * switching from USDC to another payment method requires zero SDK changes.
 */

import { getOrCreateMerchantWallet } from './circle-wallet'
import type { Charge, ChargeStatus, ChargeStatusResult, SDKConfig } from './types'
import { paymentFactory, USDCArcProvider } from '@/modules/payments'

export type { Charge, ChargeStatus, ChargeStatusResult, SDKConfig }

const ARC_TESTNET_CHAIN_ID = 5042002

// Register built-in providers once.
// Additional providers (santander_pay, etc.) are registered by the host app
// before calling createPayStyleSDK, then passed as providerKey to createCharge.
function ensureDefaultProviders(baseUrl: string): void {
  if (!paymentFactory.list().find((p) => p.key === 'usdc_arc')) {
    paymentFactory.register(
      new USDCArcProvider({
        paymentPageBaseUrl: baseUrl,
        chainId: ARC_TESTNET_CHAIN_ID,
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
      chainId: config.chainId ?? ARC_TESTNET_CHAIN_ID,
    }
    this.baseUrl = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')
    ensureDefaultProviders(this.baseUrl)
  }

  /**
   * Resolve (or create) the merchant's Circle developer-controlled wallet.
   * Must be called once before createCharge().
   */
  async init(): Promise<string> {
    this.merchantAddress = await getOrCreateMerchantWallet(this.config)
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
  }): Promise<Charge> {
    if (!this.merchantAddress) {
      throw new Error('Call sdk.init() before createCharge()')
    }

    const key = params.providerKey ?? 'usdc_arc'
    const provider = paymentFactory.get(key)
    const currency = provider.supportedCurrencies[0] ?? 'USDC'

    const providerCharge = await paymentFactory.createCharge(key, {
      amount: params.amount,
      currency,
      description: params.memo,
      recipientRef: this.merchantAddress,
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
