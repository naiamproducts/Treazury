/**
 * MX — Mexico. SKELETON, NOT LEGAL ADVICE.
 *
 * Source of truth: `docs/L.D/mx/profile.md` (L.D, confirmed 2026-10-25). This
 * .ts mirror is still the SKELETON: L.D's confirmed verdicts have NOT been
 * ported here yet, so `asOf`/`status` below record the skeleton review date,
 * not the markdown's. Until the port happens the engine refuses every MX flow
 * (fail-closed) — porting is a joint L.D/T.D change, never a silent edit.
 *
 * Read the values below as "unanswered", never as "the rule does not apply":
 *   - every flow is `unknown` (treated as blocked by the engine),
 *   - every citation reads `pending L.D` (unresolved by construction),
 *   - empty strings / `false` / `[]` are placeholders for a required contract
 *     field that has no legal answer yet.
 * Do NOT infer "MX is simpler than AR" from the identical shape: the skeleton
 * is identical on purpose. The difference between corridors is data that L.D
 * supplies, not a guess T.D makes here.
 */

import type { CountryRegulatoryProfile, FlowRule } from '../types'

const PENDING = 'pending L.D'

const pendingFlow = (pattern: string): FlowRule => ({
  verdict: 'unknown',
  rule: `${pattern}: pending L.D review — an unknown flow is treated as blocked.`,
  citation: PENDING,
})

export const mxProfile: CountryRegulatoryProfile = {
  country: 'MX',
  asOf: '2026-10-25',
  status: 'provisional',
  flows: {
    buyerToSellerDirect: pendingFlow('Buyer pays the seller directly, wallet to wallet'),
    platformHoldsFunds: pendingFlow('The platform or a vault holds funds before payout'),
    platformChargesFeeOnValue: pendingFlow('The platform charges a fee on the settled value'),
    platformConvertsToFiat: pendingFlow('The platform converts USDC to local currency'),
    platformPaysSupplier: pendingFlow('The platform pays the supplier on behalf of the agency'),
    licensedPartnerConversion: pendingFlow('A licensed local partner performs the conversion'),
  },
  fxControl: {
    // Placeholder, not a finding: `required` has no unknown state in the
    // contract, so an unanswered FX rule is recorded as `false` + pending
    // citation and the profile stays non-offerable.
    required: false,
    citation: PENDING,
  },
  licensing: {
    platform: { required: false, citation: PENDING },
    agency: { required: false, citation: PENDING },
    extraterritorial: false,
    citation: PENDING,
  },
  aml: {
    obligedEntity: '',
    travelRule: 'unknown',
    citation: PENDING,
  },
  docs: {
    invoiceCurrency: '',
    customsRequires: [],
    commercialInvoiceAllowed: false,
    citation: PENDING,
  },
  tax: { valuationRule: '', citation: PENDING },
  sanctions: { screening: '', issuerBlocklist: false, citation: PENDING },
  rails: {
    licensedPartners: [],
    citation: PENDING,
  },
  openQuestions: [
    'fxControl.required / channel / deadlineDays — is there an FX-control channel, or is conversion free?',
    'licensing.platform — is a local licence required for a foreign platform?',
    'licensing.agency — is the agency licensed, and for what activity?',
    'licensing.extraterritorial — does the regime reach a platform with no local entity?',
    'aml.obligedEntity / travelRule / kycThresholds — who is the obliged entity and at what threshold?',
    'docs.invoiceCurrency / customsRequires / commercialInvoiceAllowed — what must the customs declaration carry?',
    'tax.valuationRule — which FX rate values the goods for tax purposes?',
    'sanctions.screening — which list, checked by whom, and is an issuer blocklist required?',
    'rails.licensedPartners / settlementWindowHours — which partners hold local authority, and their evidenced window?',
  ],
}
