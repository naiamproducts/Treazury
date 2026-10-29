/**
 * CountryRegulatoryProfile — the L.D → T.D contract (v0).
 *
 * Mirrors `naiam-si/docs/C.O/global/country-regulatory-profile.md` exactly.
 * Neither department may invent a field here without editing that document
 * first. The Markdown profile under `docs/L.D/<cc>/` is the source of truth;
 * the `.ts` file under `profiles/` is its machine-readable mirror.
 *
 * No framework imports. This module is consumed by browser code AND by edge
 * functions, so it must stay pure TypeScript.
 */

export type Verdict = 'permitted' | 'conditional' | 'blocked' | 'unknown'

export interface FlowRule {
  verdict: Verdict
  /** Plain-language rule, one sentence. */
  rule: string
  /** Instrument + article. Required when verdict != 'unknown'. */
  citation: string
  /** What the product must do to be legal under this flow. */
  condition?: string
}

export interface CountryRegulatoryProfile {
  country: string // ISO-3166 alpha-2, uppercase
  asOf: string // YYYY-MM-DD
  status: 'confirmed' | 'provisional' | 'stale'
  /** Flows are keyed by the settlement pattern, not by feature name. */
  flows: {
    buyerToSellerDirect: FlowRule // wallet -> wallet, no platform involvement
    platformHoldsFunds: FlowRule // escrow / vault / pending claims
    platformChargesFeeOnValue: FlowRule
    platformConvertsToFiat: FlowRule
    platformPaysSupplier: FlowRule // payout on behalf of buyer/agency
    licensedPartnerConversion: FlowRule
  }
  fxControl: {
    required: boolean
    channel?: string // e.g. 'MEC', 'IMC', 'eFX'
    deadlineDays?: number | 'n/a'
    citation: string
  }
  licensing: {
    platform: { required: boolean; regime?: string; citation: string }
    agency: { required: boolean; regime?: string; citation: string }
    extraterritorial: boolean // does the regime reach a foreign platform?
    citation: string
  }
  aml: {
    obligedEntity: string // 'agency' | 'platform' | 'partner' | 'none'
    travelRule: Verdict
    kycThresholds?: Record<string, string>
    citation: string
  }
  docs: {
    invoiceCurrency: string // what the customs declaration accepts
    customsRequires: string[]
    commercialInvoiceAllowed: boolean
    citation: string
  }
  tax: { valuationRule: string; citation: string }
  sanctions: { screening: string; issuerBlocklist: boolean; citation: string }
  rails: {
    licensedPartners: string[] // named providers with local authority
    settlementWindowHours?: number // only if evidenced
    citation: string
  }
  openQuestions: string[] // must be answered by a licensed attorney
}

// ─────────────────────────────────────────────
// Derived helpers — NOT new contract fields
// ─────────────────────────────────────────────

/** The six settlement patterns the engine can gate. Derived from the contract. */
export type FlowKey = keyof CountryRegulatoryProfile['flows']

/** Lifecycle state of a profile. Derived from the contract. */
export type ProfileStatus = CountryRegulatoryProfile['status']
