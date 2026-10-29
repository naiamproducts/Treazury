---
dept: L.D
scope: br
kind: policy
status: provisional
as_of: 2026-10-26
sources:
 - https://www.in.gov.br/en/web/dou/-/resolucao-bcb-n-520-de-10-de-novembro-de-2025-668059151
 - https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=520&tipo=Resolu%C3%A7%C3%A3o+BCB
 - https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14286.htm
 - https://www.bcb.gov.br/meubc/faqs/s/exportacoes
 - https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14478.htm
 - https://www.circle.com/legal/usdc-terms
---

# BR — Brazil

Decision-support for counsel. Not legal advice; not a binding opinion.
Booleans whose citation is `unverified` encode NOT-VERIFIED (fail-closed), not
confirmed facts. Port to `profiles/br.ts` only after L.D confirms the
`unverified` fields.

```ts
const br: CountryRegulatoryProfile = {
 country: 'BR',
 asOf: '2026-10-26',
 status: 'provisional',
 flows: {
 buyerToSellerDirect: {
 verdict: 'conditional',
 rule: 'Brazil has no export-surrender duty (export proceeds may be kept abroad), but entry and exit of currency must pass exclusively through the FX market, so a direct USDC receipt is lawful only while no currency enters Brazil outside an authorized FX institution and the platform never holds the funds.',
 citation: 'BR - Lei 14.286/2021 art. 14 (read 2026-10-26, Planalto); BCB FAQ Exportacoes (read 2026-10-26, bcb.gov.br): export values may be credited to an account abroad and need not be transferred to Brazil',
 condition: 'Any currency entering or leaving Brazil passes exclusively through an institution authorized to operate in the FX market (Lei 14.286/2021 art. 14), any BRL conversion is executed by that institution, and Treazury never holds the funds.',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Custody of crypto-assets for third parties is a SPSAV activity that may only be performed by an entity authorized by Banco Central; Treazury holds no BCB authorization, and a foreign entity must localize within 270 days.',
 citation: 'BR - Resolucao BCB 520/2025 (published DOU 11/11/2025; read 2026-10-26, in.gov.br and BCB normativo API) and its art. 23 for entities constituted abroad; Lei 14.478/2022 (read 2026-10-25)',
 },
 platformChargesFeeOnValue: {
 verdict: 'conditional',
 rule: 'A separately invoiced service fee is outside the SPSAV regime; a fee netted from crypto the platform custodies is part of the custody activity.',
 citation: 'BR - Resolucao BCB 520/2025 (read 2026-10-26, in.gov.br/BCB)',
 condition: 'The fee is invoiced separately to the agency and never deducted from crypto the platform holds or transmits.',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Conversion requires both an authorized SPSAV activity for the crypto leg and an authorized FX-market institution for the BRL leg; Treazury is neither.',
 citation: 'BR - Resolucao BCB 520/2025 (read 2026-10-26); Lei 14.286/2021 art. 14 (read 2026-10-26)',
 },
 platformPaysSupplier: {
 verdict: 'unknown',
 rule: 'Paying a supplier from collected value would require both custody and a payment/transmission analysis that has not been verified in this pass.',
 citation: 'unverified - Brazilian payment-institution regime (and its interaction with Res. BCB 520/2025) not verified in this pass',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion can run through an authorized SPSAV for the crypto leg and an authorized FX-market institution for the BRL leg, with Treazury outside the funds flow.',
 citation: 'BR - Resolucao BCB 520/2025 (read 2026-10-26); Lei 14.286/2021 art. 14 (read 2026-10-26)',
 condition: 'A BCB-authorized SPSAV executes the crypto leg and an institution authorized to operate in the FX market executes the BRL leg, with Treazury never holding the funds.',
 },
 },
 fxControl: {
 required: true,
 channel: 'mercado de cambo (institutions authorized by BCB)',
 deadlineDays: 'n/a',
 citation: 'BR - Lei 14.286/2021 art. 14 (read 2026-10-26, Planalto): entry and exit of national and foreign currency must be made exclusively through the FX market; no repatriation duty for export proceeds identified (BCB FAQ Exportacoes, read 2026-10-26) - INFORMATIONAL on the absence of a surrender duty',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'SPSAV authorization (intermediation and/or custody) under Resolucao BCB 520/2025 plus Lei 14.478/2022; a foreign entity already operating must localize within 270 days of entry into force (02/02/2026)',
 citation: 'BR - Resolucao BCB 520/2025 art. 23 (read 2026-10-26, in.gov.br DOU text); Lei 14.478/2022 (read 2026-10-25)',
 },
 agency: {
 required: false,
 regime: 'No financial licence identified for a merchant import/export agency - INFORMATIONAL (absence)',
 citation: 'unverified',
 },
 extraterritorial: true,
 citation: 'BR - Resolucao BCB 520/2025 art. 23 expressly addresses "a entidade constituida no exterior" acting in the Brazilian virtual-asset market (read 2026-10-26, in.gov.br/LegisWeb)',
 },
 aml: {
 obligedEntity: 'unknown',
 travelRule: 'unknown',
 kycThresholds: {},
 citation: 'unverified - allocation of AML duties under Resolucao BCB 520/2025 not read at article level in this pass',
 },
 docs: {
 invoiceCurrency: 'unknown',
 customsRequires: [],
 commercialInvoiceAllowed: false,
 citation: 'unverified - Brazilian export documentation regime (Receita Federal) not verified in this pass; commercialInvoiceAllowed=false is fail-closed, not a confirmed prohibition',
 },
 tax: {
 valuationRule: 'unknown',
 citation: 'unverified - Brazilian customs/tax valuation not verified in this pass',
 },
 sanctions: {
 screening: 'OFAC/UN/EU screening of all parties and wallet addresses before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms (blocked addresses and forfeited funds) - read 2026-10-25 ( appendix items 17-18)',
 },
 rails: {
 licensedPartners: [],
 citation: 'BCB registry of authorized SPSAVs and FX-market institutions (Resolucao BCB 520/2025; Lei 14.286/2021); no partner contracted as of this profile',
 },
 openQuestions: [
 'Must a USDC-denominated export collection be registered as external credit with BCB (SISBACEN) by the Brazilian exporter? (registration instrument not verified in this pass)',
 'Does keeping export proceeds in USDC abroad satisfy the exporter obligations under Lei 14.286/2021 and its information-disclosure rules, or only cash foreign currency does?',
 'Is Treazury, while holding no funds, caught by Resolucao BCB 520/2025 as a foreign entity acting in the virtual-asset market, or only custody/intermediation is caught?',
 'Which AML/CFT duties (and thresholds) attach to an SPSAV under Resolucao BCB 520/2025, and does COAF reporting reach a non-resident platform?',
 'Does paying a supplier in crypto from collected value fall under the payment-institution regime (Lei 12.865/2013) or under Resolucao BCB 520/2025?',
 'What is the current status of the 270-day localization clock (entry into force 02/02/2026) for a foreign platform that has not requested authorization?',
 ],
};
```

## Process delta

- No export-surrender step is required (unlike AR/CO), but every currency leg that touches Brazil must run through an authorized FX-market institution: keep USDC offshore until an authorized partner converts.
- Remove the vault and fee netting for BR corridors: custody is a reserved SPSAV activity requiring BCB authorization that Treazury does not hold.
- Gate document release on the FX-market receipt evidence for any BRL payout, not only on the on-chain payment event.
- Before any BR launch, confirm whether Res. BCB 520/2025 art. 23 treats the foreign non-custodial platform as an "entity acting in the market" (270-day localization clock started 02/02/2026).
- Do not advertise a supplier payout in BRL until a named BCB-authorized SPSAV and FX institution are contracted (rails.licensedPartners is empty today).
