---
dept: L.D
scope: ve
kind: policy
status: provisional
as_of: 2026-10-26
sources:
 - https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-591
 - https://ofac.treasury.gov/media/913571/download?inline=
 - https://www.asambleanacional.gob.ve/storage/documentos/leyes/decreto-n0-2167-mediante-el-cual-se-dicta-el-decreto-con-rango-valor-y-fuerza-de-ley-del-regimen-cambiario-y-sus-ilicitos-20211018170612.pdf
 - https://www.bcv.org.ve/system/files/documentos_juridicos/convenio_cambiario_ndeg_1_de_fecha_7-09-2018_1.pdf
 - https://docs.venezuela.justia.com/federales/leyes/ley-contra-los-ilicitos-cambiarios.pdf
 - https://www.circle.com/legal/usdc-terms
---

# VE — Venezuela

Decision-support for counsel. Not legal advice; not a binding opinion.
Evidence posture: the OFAC/US layer was read on 2026-10-25 ( appendix
item 17); the Venezuelan FX instruments were read as excerpts on 2026-10-26 and
their in-force status is unresolved (openQuestions). Booleans whose citation is
`unverified` encode NOT-VERIFIED (fail-closed), not confirmed facts.

```ts
const ve: CountryRegulatoryProfile = {
 country: 'VE',
 asOf: '2026-10-26',
 status: 'provisional',
 flows: {
 buyerToSellerDirect: {
 verdict: 'conditional',
 rule: 'A direct payment is lawful only with no party or wallet touched by the US Venezuela sanctions programme and with the export operation declared to BCV/CENCOEX through an authorized FX operator.',
 citation: 'VE - 31 CFR Part 591 (read 2026-10-25, item 17); Decreto con Rango, Valor y Fuerza de Ley del Regimen Cambiario y sus Illicitos art. 18 (excerpt read 2026-10-26, Asamblea Nacional PDF): exporters must declare export amounts to BCV and CENCOEX through an authorized FX operator',
 condition: 'All parties and both wallet addresses are screened against OFAC 31 CFR Part 591 (SDN, blocked property, 50% rule) with no Government of Venezuela/PDVSA nexus, and the export operation is declared to BCV/CENCOEX through an authorized FX operator before document release.',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Holding third-party funds for a Venezuelan corridor combines unsanctioned-siege counterparty risk with no identified local authorization for third-party custody - fail-closed red line.',
 citation: 'VE - 31 CFR Part 591 and OFAC virtual-currency guidance (read 2026-10-25, item 17); no local custody authorization identified - INFORMATIONAL (absence)',
 },
 platformChargesFeeOnValue: {
 verdict: 'unknown',
 rule: 'Whether fee netting from a Venezuelan payment triggers an FX illicit or a licensing duty has not been verified in this pass.',
 citation: 'unverified - fee characterisation under the VE Régimen Cambiario not verified in this pass',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Purchase and sale of currency is reserved to BCV through authorized FX operators; a foreign platform cannot convert.',
 citation: 'VE - Ley Contra los Illicitos Cambiarios (read 2026-10-26 excerpt: exclusive BCV competence for currency sale/purchase at any amount); Decreto Régimen Cambiario y sus Illicitos art. 18 (excerpt read 2026-10-26); in-force status of these instruments unresolved (see openQuestions)',
 },
 platformPaysSupplier: {
 verdict: 'unknown',
 rule: 'Paying a supplier from collected value requires the custody and FX analysis that is itself unresolved in this pass.',
 citation: 'unverified - no primary source read for this flow in this pass',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion can run through an authorized FX operator for the local leg while Treazury stays outside the funds flow, subject to full OFAC screening.',
 citation: 'VE - Decreto Régimen Cambiario y sus Illicitos art. 18 (excerpt read 2026-10-26); 31 CFR Part 591 (read 2026-10-25)',
 condition: 'An operador cambiario authorized with BCV executes any currency leg, the export is declared under art. 18, OFAC Part 591 screening covers all parties and addresses, and Treazury never holds the funds.',
 },
 },
 fxControl: {
 required: true,
 channel: 'operador cambiario autorizado - declaration to BCV/CENCOEX',
 citation: 'VE - Decreto con Rango, Valor y Fuerza de Ley del Regimen Cambiario y sus Illicitos art. 18 (excerpt read 2026-10-26, Asamblea Nacional PDF); Convenio Cambiario N. 1 of 07/09/2018 (BCV, read 2026-10-26 excerpt: exporters may administer up to 80% of export divisa income, remainder sold to BCV) - in-force status of both instruments unverified; deadline not evidenced',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'Currency purchase/sale reserved to BCV through authorized FX operators; whether a non-converting foreign software platform needs any Venezuelan authorization is UNVERIFIED (fail-closed true)',
 citation: 'VE - Ley Contra los Illicitos Cambiarios excerpt (read 2026-10-26); Decreto Régimen Cambiario y sus Illicitos art. 18 (read 2026-10-26); instrument-in-force status unverified',
 },
 agency: {
 required: false,
 regime: 'Venezuelan taxpayer registration (RIF) is required for fiscal invoicing; no financial licence identified for a merchant agency - INFORMATIONAL (absence, unverified)',
 citation: 'unverified',
 },
 extraterritorial: true,
 citation: 'VE - unverified (fail-closed true): reach of the Régimen Cambiario over a foreign platform not verified; the binding extraterritorial layer in practice is US law (31 CFR Part 591, read 2026-10-25)',
 },
 aml: {
 obligedEntity: 'unknown',
 travelRule: 'unknown',
 kycThresholds: {},
 citation: 'unverified - Venezuelan AML/CFT obligation allocation not verified in this pass; OFAC screening duties are separate and verified (31 CFR Part 591, read 2026-10-25)',
 },
 docs: {
 invoiceCurrency: 'unknown',
 customsRequires: [],
 commercialInvoiceAllowed: false,
 citation: 'unverified - Venezuelan customs declaration regime (VENADUANA/SENIAT) not verified in this pass; the FX export declaration under Régimen Cambiario art. 18 (read 2026-10-26) is a separate obligation; commercialInvoiceAllowed=false is fail-closed, not a confirmed prohibition',
 },
 tax: {
 valuationRule: 'unknown',
 citation: 'unverified - Venezuelan customs/tax valuation not verified in this pass (the fiscal engine in src/modules/invoicing/engines/venezuela.ts is product code, not a legal source)',
 },
 sanctions: {
 screening: 'OFAC 31 CFR Part 591 screening (SDN, blocked property, 50% rule) of all parties and wallet addresses before order creation, plus UN/EU lists; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'US - 31 CFR Part 591 (read 2026-10-25, item 17); OFAC virtual-currency guidance (read 2026-10-25); Circle USDC Terms (blocked addresses and forfeited funds) - read 2026-10-25',
 },
 rails: {
 licensedPartners: [],
 citation: 'operadores cambiarios authorized with BCV (Régimen Cambiario); no partner contracted as of this profile',
 },
 openQuestions: [
 'Which instrument is in force in 2026: the 2014/2015 Régimen Cambiario decrees, the 2018 ANC derogation of the Ley de Ilícitos Cambiarios, or Decreto 2167 (2021)? (all read only as excerpts on 2026-10-26)',
 'Should Treazury treat VE as a closed market entirely until an OFAC counsel opinion exists, given secondary-sanctions exposure for a non-US platform using USDC?',
 'Does a non-converting, non-custodial foreign platform need any authorization under the Régimen Cambiario, or does art. 18 attach only to the exporter and the FX operator?',
 'Does the Convenio Cambiario N. 1 (80% rule) remain operative after the later exchange-rate liberalisation measures?',
 'What are the current customs declaration requirements and accepted invoice currency for the documents Treazury generates?',
 'What AML/CFT obligations attach to a Venezuelan agency receiving USDC (UAFT/BCV rules not verified in this pass)?',
 ],
};
```

## Process delta

- Sanctions gate first: screen buyer, seller, and both wallet addresses against 31 CFR Part 591 (including the 50% rule) before order creation; any hit is a hard refusal, not a warning.
- Add a BCV/CENCOEX export declaration step through an authorized FX operator (Régimen Cambiario art. 18) as a document-release gate.
- Keep custody, fee netting, and supplier payout switched off for VE: two of those flows are `unknown` and one is a red-line `blocked`.
- Never convert on-platform: currency sale/purchase is reserved to BCV authorized operators, and the in-force instrument set is itself unresolved.
- Segment VE out of any "coming soon" claim until the founder decides between closed-market (pending OFAC counsel) and conditional launch; this profile does not make that business call.
- Pair every VE corridor with a written OFAC opinion before first live payment - this is a founder-plus-counsel escalation, not an engineering task.
