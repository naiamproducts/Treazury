/**
 * InvoiceEngineFactory
 *
 * Central registry for country invoice engines.
 * Same pattern as PaymentProviderFactory — register once, resolve by country code.
 *
 * Usage:
 *   import { invoiceFactory } from '@/modules/invoicing/factory'
 *   import { VenezuelaInvoiceEngine } from '@/modules/invoicing/engines/venezuela'
 *
 *   invoiceFactory.register(new VenezuelaInvoiceEngine())
 *   const doc = invoiceFactory.generate('VE', params)
 */

import type {
  InvoiceEngine,
  GenerateInvoiceParams,
  InvoiceDocument,
  ValidationResult,
} from './interface'
import type { CountryCode } from '../shared/types'

class InvoiceEngineFactory {
  private readonly registry = new Map<CountryCode, InvoiceEngine>()

  register(engine: InvoiceEngine): void {
    this.registry.set(engine.country, engine)
  }

  get(country: CountryCode): InvoiceEngine {
    const engine = this.registry.get(country)
    if (!engine) {
      throw new Error(
        `InvoiceEngine for country '${country}' is not registered. ` +
        `Available: [${[...this.registry.keys()].join(', ')}]`,
      )
    }
    return engine
  }

  list(): InvoiceEngine[] {
    return [...this.registry.values()]
  }

  /** Generate invoice through the engine registered for that country. */
  generate(country: CountryCode, params: GenerateInvoiceParams): InvoiceDocument {
    return this.get(country).generate(params)
  }

  /** Validate through country engine. */
  validate(country: CountryCode, doc: InvoiceDocument): ValidationResult {
    return this.get(country).validate(doc)
  }

  /** Render PDF through country engine. */
  async renderPDF(country: CountryCode, doc: InvoiceDocument): Promise<string> {
    return this.get(country).renderPDF(doc)
  }
}

export const invoiceFactory = new InvoiceEngineFactory()
