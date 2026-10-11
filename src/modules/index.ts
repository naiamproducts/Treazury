/**
 * Modules root barrel
 *
 * Import path guide:
 *   import { paymentFactory, USDCArcProvider } from '@/modules/payments'
 *   import { invoiceFactory, VenezuelaInvoiceEngine } from '@/modules/invoicing'
 *   import type { Order, Tenant, Product } from '@/modules/shared/types'
 */
export * from './payments'
export * from './invoicing'
export type { Order, Tenant, Product, OrderLine, OrderStatus, CountryCode } from './shared/types'
