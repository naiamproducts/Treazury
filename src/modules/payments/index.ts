/**
 * Payments module — public API
 *
 * Import from here, never from internal files directly.
 */
export type {
  PaymentProvider,
  PaymentCharge,
  PaymentReceipt,
  PaymentStatus,
  CreateChargeParams,
  CheckStatusParams,
  RefundParams,
} from './interface'

export { paymentFactory } from './factory'
export { USDCArcProvider } from './providers/usdc-arc'
export type { USDCArcProviderConfig } from './providers/usdc-arc'
