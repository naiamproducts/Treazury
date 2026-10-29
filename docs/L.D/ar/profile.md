---
dept: L.D
scope: ar
kind: policy
status: confirmed
as_of: 2026-10-28
sources:
 - https://www.argentina.gob.ar/normativa/nacional/decreto-609-2019-327566/actualizacion
 - https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf
 - docs/L.D/ar/regulatory-rent-map.md (aven, 2026-10-28; TO §7.1.2 deadline table re-read under Com A 8481 vig. 15/09/2026)
 - https://www.bcra.gob.ar/normativa-de-exterior-y-cambios/
 - https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-994-2024-397598/texto
 - https://www.argentina.gob.ar/normativa/nacional/norma-410635/texto
 - https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto
 - https://www.bbva.com.ar/content/dam/public-web/argentina/documents/actualidad-normativa/Com%20A%206780.pdf
 - https://www.circle.com/legal/usdc-terms
---

# AR — Argentina

Decision-support for counsel. Not legal advice; not a binding opinion.

```ts
const ar: CountryRegulatoryProfile = {
 country: 'AR',
 asOf: '2026-10-25',
 status: 'confirmed',
 flows: {
 buyerToSellerDirect: {
 verdict: 'blocked',
 rule: 'An Argentine-resident exporter must bring the export consideration into the country in foreign currency and/or negotiate it in the FX market; direct USDC receipt in an offshore wallet does not discharge that duty.',
 citation: 'Decreto 609/2019 art. 1 (as amended by Decreto 91/2019); BCRA TO Exterior y Cambios (14/09/2026) Seccion 7.1',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Holding the buyer payment before the seller is paid leaves export proceeds outside the FX market and makes the platform a custodian of third-party funds.',
 citation: 'BCRA TO Exterior y Cambios (14/09/2026) Seccion 7.1; CNV RG 1172/2026 (PSAV registration; supersedes RG 994/2024/RG 1058/2025 Capítulo III — read 2026-10-27)',
 },
 platformChargesFeeOnValue: {
 verdict: 'blocked',
 rule: 'A fee deducted from the export collection reduces the amount that must be ingressed and liquidated, so the netting itself breaches the surrender duty.',
 citation: 'Decreto 609/2019 art. 1; BCRA TO Exterior y Cambios (14/09/2026) Seccion 7.1',
 },
 platformConvertsToFiat: {
 verdict: 'conditional',
 rule: 'USDC-to-ARS conversion is lawful only inside the formal FX market and, where crypto is involved, through a CNV-registered PSAV.',
 citation: 'BCRA TO Exterior y Cambios (14/09/2026) Seccion 1.1 and 7.1; CNV RG 1172/2026 (read 2026-10-27)',
 condition: 'The fiat leg is executed by a BCRA-authorised MCF entity (bank or casa de cambio) and, if the crypto leg is intermediated, by a CNV-registered PSAV; Treazury never holds the funds.',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Paying a third-party supplier from collected export proceeds is an FX operation that only an authorised MCF entity may execute, and it breaks the link between the exporter and its own collection.',
 citation: 'BCRA TO Exterior y Cambios (14/09/2026) Seccion 7.1; Ley 19.359 (regimen penal cambiario)',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'A licensed partner can convert and settle only if the whole collection is channelled through the FX market with the export declaration.',
 citation: 'Decreto 609/2019 art. 1; BCRA TO Exterior y Cambios (14/09/2026) Seccion 7.1; CNV RG 1172/2026 (read 2026-10-27)',
 condition: 'Contract a BCRA-authorised MCF entity (and a CNV-registered PSAV for the crypto leg) and make the SECOEXPO/export declaration a hard gate before any release of documents.',
 },
 },
 fxControl: {
 required: true,
 channel: 'Mercado de Cambios (MCF) / SECOEXPO',
 deadlineDays: 180,
 citation: 'Decreto 609/2019 art. 1 (as amended by Decreto 91/2019); BCRA TO Seccion 7.1 (Com. A 8481 vig. 15/09/2026: 30/60/180/365 calendar days by HS position + independent 20 business days from fecha de cobro; the old 15/30/180 table of Com. A 6780/2019 is superseded — read 2026-10-28, aven)',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'CNV PSAV registration (RG 1172/2026, B.O. 15-10-2026; supersedes the RG 994/2024/RG 1058/2025 registration articles) plus BCRA payment-service rules if funds are held or converted; no volume carve-out for legal persons (UVA 35,000/month applies to natural persons only); minimum net worth USD 150k/75k/35k by category, 50% if under USD 2.5M volume (RG 1172/2026 arts. 1 and 10 — read 2026-10-27)',
 citation: 'CNV RG 1172/2026 arts. 1-2, 9-10; BCRA TO Exterior y Cambios Seccion 7.1',
 },
 agency: {
 required: false,
 regime: 'Exporter registration with customs and tax ID; no financial licence for the agency role',
 citation: 'Ley 22.415 (Codigo Aduanero) - export declaration',
 },
 extraterritorial: true,
 citation: 'CNV RG 1172/2026 art. 4 (points of contact for foreign legal persons: .ar domain, local funding/ramp agreements, targeting, advertising, >20% AR volume; foreign PSAVs must constitute a local society under Ley 19.550 art. 123 or register a branch under art. 118) — read 2026-10-27',
 },
 aml: {
 obligedEntity: 'platform',
 travelRule: 'conditional',
 kycThresholds: {
 psav: 'Client identification at onboarding under CNV RG 1172/2026 (read 2026-10-27)',
 mcf: 'Client identification and genuineness checks by the BCRA-authorised entity (TO Seccion 1.1)',
 },
 citation: 'CNV RG 1172/2026 (read 2026-10-27); BCRA TO Exterior y Cambios Seccion 1.1; Ley 25.246',
 },
 docs: {
 invoiceCurrency: 'USD',
 customsRequires: ['permiso de embarque', 'commercial invoice', 'packing list', 'certificate of origin where applicable'],
 commercialInvoiceAllowed: true,
 citation: 'Ley 22.415 (Codigo Aduanero); AFIP RG 4419/2019 (foreign-currency export invoicing)',
 },
 tax: {
 valuationRule: 'Customs value on transaction value; exports zero-rated for VAT; export duties may apply by HS position.',
 citation: 'Ley 22.415; Ley 23.349 art. 8',
 },
 sanctions: {
 screening: 'OFAC/UN/EU screening before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms (blocked addresses and forfeited funds)',
 },
 rails: {
 licensedPartners: [],
 citation: 'BCRA MCF registry and CNV PSAV registry; no partner contracted as of this profile',
 },
 openQuestions: [
 'Does BCRA treat USDC received abroad by an AR exporter as divisas that must be liquidated, or as a non-FX asset whose sale must still be brought into the country?',
 'Is CNV PSAV registration required for a foreign platform that only displays a seller wallet address and never holds funds?',
 'RESOLVED 2026-10-28 (aven): TO Seccion 7.1.2 current deadlines are 30/60/180/365 calendar days by HS position + 20 business days from fecha de cobro (Com. A 8481); see docs/L.D/ar/regulatory-rent-map.md — counsel may re-verify against the next TO consolidation.',
 'Can an exporter lawfully deduct a platform commission from the collection before liquidation, and what documentation must the MCF entity see?',
 'Does RG 1172/2026 art. 4 reach a non-resident platform marketing to AR agencies (nexus modalities), and does the reverse-solicitation carve-out apply?',
 'RG 1172/2026 (B.O. 15-10-2026) substituted the whole Capítulo III — confirm the transitional treatment of registrations filed under RG 994/2024 / RG 1058/2025 (counsel).',
 'Is the contemplated agencia de exportacion a licensed despachante de aduana or the principal exporter?',
 ],
};
```

## Process delta

- Direct wallet settlement cannot be the settlement of an AR export: add an MCF/PSAV liquidation step, or restrict AR sellers to non-resident entities whose goods do not originate in AR.
- Remove vault + fee netting for AR: invoice the SaaS fee separately to the agency, never deduct it from the export collection.
- Do not mark an order "settled" until an MCF liquidation/export declaration exists; make that document a release gate.
- Segment AR explicitly: the "ARGENTINA LIVE" market is the one that needs the heaviest process change.
- Merchanting/triangulation (goods never cross AR) is a separate product line, not a label used to keep the AR corridor alive.
