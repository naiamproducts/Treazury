---
dept: L.D
scope: eu
kind: policy
status: provisional
as_of: 2026-10-26
sources:
 - https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-3-definitions
 - https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-59-authorisation
 - https://www.esma.europa.eu/sites/default/files/2024-07/ESMA75-453128700-1048_Opinion_on_broker_models.pdf
 - https://www.esma.europa.eu/print/pdf/node/206847
 - https://eur-lex.europa.eu/eli/reg/2023/1113/art_14/oj/eng
 - https://eur-lex.europa.eu/EN/legal-content/summary/information-accompanying-transfers-of-funds-and-certain-crypto-assets.html
 - https://www.cssf.lu/en/2026/07/mica-transition-period-for-virtual-asset-service-providers-ended-on-1-july-2026
 - https://www.circle.com/legal/usdc-terms
---

# EU — European Union (regional scope)

Decision-support for counsel. Not legal advice; not a binding opinion.
Scope note: `EU` is a regional scope, not an ISO-3166 alpha-2 code (see
openQuestions); the contract requires ISO-3166, so porting this profile needs a
contract amendment or a member-state split. Booleans whose citation is
`unverified` encode NOT-VERIFIED (fail-closed), not confirmed facts.

```ts
const eu: CountryRegulatoryProfile = {
 country: 'EU', // regional scope, not ISO-3166 alpha-2 - see openQuestions
 asOf: '2026-10-26',
 status: 'provisional',
 flows: {
 buyerToSellerDirect: {
 verdict: 'conditional',
 rule: 'Peer-to-peer transfers fall outside the TFR while no crypto-asset service provider is involved, but a platform that executes, transmits, or initiates transfers for clients is providing a crypto-asset service that requires authorisation.',
 citation: 'EU - Regulation (EU) 2023/1114 (MiCA) art. 3(1)(16) and art. 3(1)(26), art. 59(1) (read 2026-10-26, ESMA rulebook); Regulation (EU) 2023/1113 (TFR) recital 38 and art. 14 (read 2026-10-26, EUR-Lex); ESMA QA_2071 (20/06/2024, read 2026-10-26)',
 condition: 'The platform never executes, transmits, or initiates a transfer on behalf of a client (it only displays the seller address and invoice), so it stays outside MiCA art. 3(1)(16)(j) and art. 59.',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Custody and administration of crypto-assets on behalf of clients is a crypto-asset service that may only be provided by an authorised CASP; Treazury holds no MiCA authorisation.',
 citation: 'EU - MiCA art. 3(1)(16)(a) and art. 59(1) (read 2026-10-26, ESMA rulebook)',
 },
 platformChargesFeeOnValue: {
 verdict: 'conditional',
 rule: 'A separately invoiced service fee is outside MiCA; a fee netted from crypto the platform holds is part of the custody service.',
 citation: 'EU - MiCA art. 3(1)(16)(a) and art. 59(1) (read 2026-10-26, ESMA rulebook)',
 condition: 'The fee is invoiced separately to the agency and never deducted from crypto the platform holds or transfers.',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Exchange of crypto-assets for funds is a crypto-asset service reserved to an authorised CASP (or an art. 60 financial institution).',
 citation: 'EU - MiCA art. 3(1)(16)(c), art. 59(1) (read 2026-10-26, ESMA rulebook)',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Providing transfer services on behalf of clients is a self-standing crypto-asset service requiring authorisation; paying a supplier from collected value is that service.',
 citation: 'EU - MiCA art. 3(1)(26), art. 3(1)(16)(j), art. 59(1) (read 2026-10-26, ESMA rulebook; ESMA QA_2071 read 2026-10-26)',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion and payout can run through an EU-authorised CASP or an art. 60 financial institution while Treazury stays outside the funds flow.',
 citation: 'EU - MiCA art. 59(1), art. 60, art. 63 (read 2026-10-26, ESMA rulebook and ESMA Opinion ESMA75-453128700-1048)',
 condition: 'A CASP authorised under MiCA art. 63 in a member state (or an institution allowed under art. 60) executes the conversion or transfer, and Treazury never holds, signs, or transmits the client assets.',
 },
 },
 fxControl: {
 required: false,
 channel: 'n/a',
 deadlineDays: 'n/a',
 citation: 'No EU export-surrender or FX-control instrument identified in this pass - INFORMATIONAL (absence of evidence, not a confirmed negative)',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'CASP authorisation under MiCA art. 59/63 for any service in art. 3(1)(16); art. 60 allows already-authorised financial institutions',
 citation: 'EU - MiCA art. 59(1) (read 2026-10-26, ESMA rulebook): "A person shall not provide crypto-asset services, within the Union, unless" authorised under art. 63 or allowed under art. 60',
 },
 agency: {
 required: false,
 regime: 'No EU financial licence identified for a merchant import/export agency - INFORMATIONAL (absence)',
 citation: 'unverified',
 },
 extraterritorial: true,
 citation: 'EU - MiCA art. 59(1) plus art. 61 reverse-solicitation exemption, per ESMA Opinion ESMA75-453128700-1048 (read 2026-10-26): "third-country firms may not provide crypto-asset services in the Union"; CSSF notice (02/07/2026, read 2026-10-26): VASP transition ended 01/07/2026 and third-country CASPs actively offering to EU clients need authorisation',
 },
 },
 aml: {
 obligedEntity: 'platform',
 travelRule: 'conditional',
 kycThresholds: {
 selfHostedAddress: 'Ownership/control assessment required for transfers to or from a self-hosted address exceeding EUR 1,000',
 },
 citation: 'EU - Regulation (EU) 2023/1113 (TFR) art. 14(5) (read 2026-10-26, EUR-Lex); MiCA art. 3(1)(16) (read 2026-10-26); travel-rule duties attach only while a CASP is involved in the transfer',
 },
 docs: {
 invoiceCurrency: 'unknown',
 customsRequires: [],
 commercialInvoiceAllowed: false,
 citation: 'unverified - EU customs documentation regime (Union Customs Code) not verified in this pass; commercialInvoiceAllowed=false is fail-closed, not a confirmed prohibition',
 },
 tax: {
 valuationRule: 'unknown',
 citation: 'unverified - EU customs/tax valuation not verified in this pass',
 },
 sanctions: {
 screening: 'OFAC/UN/EU screening of all parties and wallet addresses before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; EU restrictive measures where applicable; Circle USDC Terms (blocked addresses and forfeited funds) - read 2026-10-25 ( appendix items 17-18)',
 },
 rails: {
 licensedPartners: [],
 citation: 'MiCA art. 63 CASP authorisations held with national competent authorities; no partner contracted as of this profile',
 },
 openQuestions: [
 'Does hosting a payment page that displays a seller wallet amount to providing a transfer service (MiCA art. 3(1)(26)) or only a component of another service, per ESMA QA_2071?',
 'The contract requires ISO-3166 alpha-2 in `country`; should the EU profile be split into member states (e.g. IE, DE, MT) or should the contract accept a regional scope code? (C.O contract arbitration)',
 'Which member state would host a CASP authorisation (registered office + effective management in the Union, art. 59(2)) and what are the capital requirements for the services Treazury would need?',
 'Does the reverse-solicitation exemption (art. 61) survive a landing page that actively markets to EU agencies?',
 'What are the EU customs invoice requirements and accepted invoice currency for the commercial documents Treazury generates?',
 'Does the TFR EUR 1,000 self-hosted threshold apply per transfer, per batch, or aggregated (see EUR-Lex summary, read 2026-10-26)?',
 ],
};
```

## Process delta

- Keep the base path strictly non-executing: the platform may display the seller address and invoice but must never sign, transmit, or initiate the transfer, or it needs MiCA art. 59 authorisation.
- Remove the vault, owner refund key, and fee netting for EU corridors: custody of client crypto-assets is a reserved service (MiCA art. 3(1)(16)(a)).
- Route any conversion or supplier payout through an EU-authorised CASP or art. 60 institution; Treazury stays outside the funds flow.
- If Treazury ever becomes a CASP, the TFR art. 14(5) EUR 1,000 self-hosted-address ownership check becomes a hard product requirement before transfer execution.
- Do not market or solicit actively into the EU from a third country: only reverse solicitation is exempt (MiCA art. 61, ESMA Opinion read 2026-10-26).
- Split or amend the `country: 'EU'` code question with C.O before porting this profile into the engine.
