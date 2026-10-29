---
dept: L.D
scope: us
kind: policy
status: provisional
as_of: 2026-10-26
sources:
 - https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/section-1010.100
 - https://fincen.gov/sites/default/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf
 - https://fincen.gov/resources/statutes-regulations/administrative-rulings/application-fincens-regulations-virtual
 - https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-591
 - https://www.circle.com/legal/usdc-terms
---

# US — United States

Decision-support for counsel. Not legal advice; not a binding opinion.
Booleans whose citation is `unverified` encode NOT-VERIFIED (fail-closed), not
confirmed facts. Port to `profiles/us.ts` only after L.D confirms the
`unverified` fields.

```ts
const us: CountryRegulatoryProfile = {
 country: 'US',
 asOf: '2026-10-26',
 status: 'provisional',
 flows: {
 buyerToSellerDirect: {
 verdict: 'permitted',
 rule: 'A wallet-to-wallet payment with no platform acceptance or transmission is outside the money-transmitter definition; software that only displays or routes information is not an MSB.',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) and (ff)(5)(ii)(A)/(F) exclusions (read 2026-10-26, eCFR); FinCEN FIN-2019-G001 (read 2026-10-25); FinCEN administrative ruling, virtual currency software development (read 2026-10-25)',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Accepting value from one person and holding it before paying another is money transmission and makes the platform an MSB; Treazury is not FinCEN-registered.',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25)',
 },
 platformChargesFeeOnValue: {
 verdict: 'conditional',
 rule: 'A fee is lawful as a separate service charge but becomes part of the transmitted value if it is netted out of funds the platform accepts.',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25)',
 condition: 'The fee is invoiced separately to the agency and never deducted from value the platform accepts, holds, or transmits.',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Exchanging convertible virtual currency for currency is a money-transmission activity (and may be a dealer in foreign exchange); an unregistered platform cannot do it.',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) and (ff)(1) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25)',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Paying a third party from collected value is transmission of value to another person by any means, which is the statutory money-transmission service.',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) (read 2026-10-26)',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion or payout can run through a registered MSB or a bank while Treazury stays outside the funds flow.',
 citation: 'US - 31 CFR 1010.100(ff)(5) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25)',
 condition: 'A FinCEN-registered MSB (money transmitter/exchanger) or a bank executes the conversion or payout, with state money-transmitter licensing for that partner determined by counsel, and Treazury never touches the funds.',
 },
 },
 fxControl: {
 required: false,
 channel: 'n/a',
 deadlineDays: 'n/a',
 citation: 'No US export-surrender or FX-control instrument identified in this pass - INFORMATIONAL (absence of evidence, not a confirmed negative)',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'FinCEN MSB money-transmitter registration if the platform accepts or transmits value; state money-transmitter licences per state (per-state requirements unverified); pure software alone is not an MSB',
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25)',
 },
 agency: {
 required: false,
 regime: 'No financial licence identified for a merchant import/export agency - INFORMATIONAL (absence); OFAC screening duties still apply',
 citation: 'unverified',
 },
 extraterritorial: true,
 citation: 'US - 31 CFR 1010.100(ff) reaches a person "wherever located doing business ... wholly or in substantial part within the United States" (read 2026-10-26, eCFR)',
 },
 aml: {
 obligedEntity: 'platform',
 travelRule: 'conditional',
 kycThresholds: {
 moneyTransmission: 'Recordkeeping and travel-rule thresholds under 31 CFR 1010.410 - not re-verified in this pass (INFORMATIONAL)',
 },
 citation: 'US - 31 CFR 1010.100(ff)(5)(i)(A) (read 2026-10-26); FinCEN FIN-2019-G001 (read 2026-10-25); obliged entity is "platform" only while the platform acts as an MSB - pure software leaves no obliged entity',
 },
 docs: {
 invoiceCurrency: 'unknown',
 customsRequires: [],
 commercialInvoiceAllowed: false,
 citation: 'unverified - US export documentation regime (EEI/AES) not verified in this pass; commercialInvoiceAllowed=false is fail-closed, not a confirmed prohibition',
 },
 tax: {
 valuationRule: 'unknown',
 citation: 'unverified - US customs/tax valuation not verified in this pass',
 },
 sanctions: {
 screening: 'OFAC/UN/EU screening of all parties and wallet addresses before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms (blocked addresses and forfeited funds) - read 2026-10-25 ( appendix items 17-18)',
 },
 rails: {
 licensedPartners: [],
 citation: 'FinCEN MSB registry and state money-transmitter registries; no partner contracted as of this profile',
 },
 openQuestions: [
 'Does the payment page plus OrderVault architecture make Treazury a money transmitter in fact, given that contracts/PaymentRouter.sol:185-192 lets the owner refund any vault (, read 2026-10-25)?',
 'Which US states require a money transmitter licence for the contemplated partner, and does any state exemption cover a non-custodial stablecoin flow?',
 'Does the "integral to the sale of goods" exclusion (31 CFR 1010.100(ff)(5)(ii)(F)) cover a platform fee charged to the agency rather than the buyer?',
 'What are the exact recordkeeping/travel-rule thresholds that attach once the platform is an MSB (31 CFR 1010.410 not re-read in this pass)?',
 'What is the US customs invoice/EEI requirement for the export documents Treazury generates, and in what currency must the declaration be made?',
 ],
};
```

## Process delta

- Base flow (buyer pays seller wallet-to-wallet) is lawful with no process change, but only while the platform never accepts or transmits value: remove the vault, the owner refund key, and fee netting for US corridors or treat the platform as an MSB and register.
- Invoice the platform fee separately to the agency; a fee deducted from the payment is acceptance of value and flips the flow into MSB scope.
- Never convert USDC to USD or pay a supplier from collected value in-house; route both through a FinCEN-registered MSB or bank partner.
- Sanctions screening of buyer, seller, and both wallet addresses must run before order creation (OFAC SDN + issuer blocklist), not after settlement.
- Keep customs claims out of the product copy until the US EEI/AES documentation position is verified (currently `unknown` in this profile).
