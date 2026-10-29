---
dept: L.D
scope: co
kind: policy
status: confirmed
as_of: 2026-10-25
sources:
 - https://cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1068_2015_pr041.htm
 - https://www.banrep.gov.co/es/banco/junta-directiva/conceptos/jds-05009-0
 - https://www.banrep.gov.co/es/banco/junta-directiva/conceptos/jds-20289
 - https://www.circle.com/legal/usdc-terms
---

# CO — Colombia

Decision-support for counsel. Not legal advice; not a binding opinion.

```ts
const co: CountryRegulatoryProfile = {
 country: 'CO',
 asOf: '2026-10-25',
 status: 'confirmed',
 flows: {
 buyerToSellerDirect: {
 verdict: 'blocked',
 rule: 'A Colombian-resident exporter must channel the full export proceeds through the FX market (IMC or a compensation account); reintegration outside that market is not authorised.',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Resolucion Externa 8/2000 art. 7; Banrep JDS-05009 (7/03/2017)',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Holding the payment keeps export proceeds outside the FX market and, between residents, would also violate the rule that resident-to-resident obligations are performed in COP.',
 citation: 'Decreto 1068/2015 arts. 2.17.1.3 and 2.17.1.4; Banrep JDS-05009',
 },
 platformChargesFeeOnValue: {
 verdict: 'blocked',
 rule: 'Deducting a fee from the collection reduces the amount channelled through the FX market and is therefore part of the same breach.',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Banrep JDS-05009',
 },
 platformConvertsToFiat: {
 verdict: 'conditional',
 rule: 'Conversion to COP must occur through an IMC or a registered compensation account, with the corresponding cambio declaration.',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Resolucion Externa 8/2000 art. 7',
 condition: 'A bank or other IMC executes the conversion and the platform never holds the funds; the exporter files the cambio declaration (Formulario 2) for the goods export.',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Paying a supplier from collected funds is an FX operation reserved to IMC/banks and breaks the exporter-of-record link required by the FX declaration.',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Banrep JDS-05009',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'A licensed partner can settle only by channelling the entire collection through the FX market, not by netting or routing around it.',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Resolucion Externa 8/2000 art. 7; Banrep JDS-05009',
 condition: 'Contract an IMC (bank) or register a compensation account in the exporter name; the export declaration and cambio declaration are hard release gates.',
 },
 },
 fxControl: {
 required: true,
 channel: 'Mercado Cambiario (IMC / cuentas de compensacion)',
 deadlineDays: 180,
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Resolucion Externa 8/2000 art. 7 (channel within six months of receipt)',
 },
 licensing: {
 platform: {
 required: false,
 regime: 'No dedicated VASP licence; custody and conversion are reserved to IMC/banks, so a platform that does either needs a financial authorisation it does not have',
 citation: 'Decreto 1068/2015 art. 2.17.1.4; Ley 9/1991 art. 4',
 },
 agency: {
 required: false,
 regime: 'Exporter registration with customs and tax ID (RUT); no financial licence for the agency role',
 citation: 'Decreto 1165/2019 (regimen aduanero) - export declaration',
 },
 extraterritorial: false,
 citation: 'The FX duty attaches to the resident exporter; no provision identified that licenses or reaches a foreign software provider',
 },
 aml: {
 obligedEntity: 'partner',
 travelRule: 'unknown',
 kycThresholds: {
 imc: 'Client identification and origin-of-funds checks by the IMC under the Banco de la Republica DCIN-83 circular',
 },
 citation: 'Decreto 1068/2015; Banrep DCIN-83 - INFORMATIONAL',
 },
 docs: {
 invoiceCurrency: 'USD',
 customsRequires: ['declaracion de exportacion (DEX)', 'commercial invoice', 'packing list', 'certificate of origin where a trade agreement is claimed'],
 commercialInvoiceAllowed: true,
 citation: 'Decreto 1165/2019 - INFORMATIONAL',
 },
 tax: {
 valuationRule: 'Customs value on transaction value; exports zero-rated for VAT.',
 citation: 'Estatuto Tributario art. 481; Decreto 1165/2019',
 },
 sanctions: {
 screening: 'OFAC/UN screening before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms',
 },
 rails: {
 licensedPartners: [],
 citation: 'Banco de la Republica IMC list; no partner contracted as of this profile',
 },
 openQuestions: [
 'Is a USDC receipt by a CO exporter a "divisa" for purposes of the channeling duty, or does the obligation only bite when the USDC is sold for COP?',
 'Can a foreign platform display a seller wallet and charge a SaaS fee without becoming an FX intermediary?',
 'Does the six-month channeling deadline run from receipt or from the export declaration for the specific shipment?',
 'What documentation must the IMC see to accept a collection that originated as USDC?',
 'Is a compensation account available to the agency structure contemplated, and who must register it?',
 'Does paying a foreign supplier under a merchanting arrangement trigger a separate FX operation?',
 ],
};
```

## Process delta

- Direct USDC receipt cannot settle a CO export: add an IMC/compensation-account step with a cambio declaration.
- Remove vault and fee netting for CO; invoice the fee separately and never from the collection.
- Gate document release on the cambio declaration, not only on the on-chain payment event.
- Model merchanting (goods never cross CO) as a separate structure; it removes the export surrender duty but changes who the exporter of record is.
- Do not use an intra-group treasury settlement for CO resident-to-resident obligations; they must be in COP.
