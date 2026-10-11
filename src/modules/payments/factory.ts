/**
 * PaymentProviderFactory
 *
 * Central registry for all payment providers.
 * - Register a provider once at app startup.
 * - Resolve by key when creating a charge or checking status.
 * - The rest of the app never imports a concrete provider directly.
 *
 * Usage:
 *   import { paymentFactory } from '@/modules/payments/factory'
 *   import { USDCArcProvider } from '@/modules/payments/providers/usdc-arc'
 *
 *   paymentFactory.register(new USDCArcProvider(config))
 *   const charge = await paymentFactory.createCharge('usdc_arc', params)
 */

import type {
  PaymentProvider,
  CreateChargeParams,
  CheckStatusParams,
  PaymentCharge,
  PaymentReceipt,
} from './interface'

class PaymentProviderFactory {
  private readonly registry = new Map<string, PaymentProvider>()

  /** Register a provider. Safe to call multiple times with the same key (replaces). */
  register(provider: PaymentProvider): void {
    this.registry.set(provider.key, provider)
  }

  /** Return provider by key or throw a descriptive error. */
  get(key: string): PaymentProvider {
    const provider = this.registry.get(key)
    if (!provider) {
      throw new Error(
        `PaymentProvider '${key}' is not registered. ` +
        `Available: [${[...this.registry.keys()].join(', ')}]`,
      )
    }
    return provider
  }

  /** List all registered providers (available or not). */
  list(): PaymentProvider[] {
    return [...this.registry.values()]
  }

  /** List only available providers (isAvailable === true). */
  listAvailable(): PaymentProvider[] {
    return this.list().filter((p) => p.isAvailable)
  }

  /** Convenience: create a charge through a named provider. */
  async createCharge(providerKey: string, params: CreateChargeParams): Promise<PaymentCharge> {
    const provider = this.get(providerKey)
    if (!provider.isAvailable) {
      throw new Error(`PaymentProvider '${providerKey}' is registered but not available.`)
    }
    return provider.createCharge(params)
  }

  /** Convenience: check status through a named provider. */
  async checkStatus(providerKey: string, params: CheckStatusParams): Promise<PaymentReceipt | null> {
    return this.get(providerKey).checkStatus(params)
  }
}

/** Singleton factory — import this everywhere. */
export const paymentFactory = new PaymentProviderFactory()
