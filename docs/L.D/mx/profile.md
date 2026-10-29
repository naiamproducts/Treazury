---
dept: L.D
scope: mx
kind: policy
status: confirmed
as_of: 2026-10-27
sources:
 - https://www.diputados.gob.mx/LeyesBiblio/pdf/LRITF.pdf
 - https://dof.gob.mx/nota_detalle.php?codigo=5515623&fecha=09/03/2018
 - https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-4-2019/%7B8D7769AF-03F6-701A-68AA-EF25A73AD035%7D.pdf
 - https://sidofqa.segob.gob.mx/notas/docFuente/5763161
 - https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPIORPI.pdf
 - https://www.circle.com/legal/usdc-terms
---

# MX — Mexico

Decision-support for counsel. Not legal advice; not a binding opinion.

```ts
const mx: CountryRegulatoryProfile = {
 country: 'MX',
 asOf: '2026-10-25',
 status: 'confirmed',
 flows: {
 buyerToSellerDirect: {
 verdict: 'permitted',
 rule: 'A Mexican exporter receiving USDC wallet-to-wallet is subject to tax and customs duties, not to an FX surrender duty; virtual assets are not currency or divisas.',
 citation: 'Ley Fintech art. 30 (virtual asset definition excludes legal tender and divisas); no export-surrender regime identified in Ley Fintech or Banxico circulars',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Holding buyer USDC is custody and control under Ley Fintech art. 32 and requires an ITF authorised by CNBV plus a Banxico virtual-asset authorisation; Circular 4/2019 confines authorised virtual-asset operations to internal operations.',
 citation: 'Ley Fintech arts. 30 and 32; Banxico Circular 4/2019 art. 3',
 },
 platformChargesFeeOnValue: {
 verdict: 'conditional',
 rule: 'A fee is lawful as a service fee but not as a deduction from funds the platform holds, because that deduction is the custody/control the law reserves to authorised entities.',
 citation: 'Ley Fintech art. 32 (custody = possession of signatures, keys or authorisations sufficient to execute operations); Circular 4/2019 art. 3',
 condition: 'The fee is invoiced separately to the agency and never netted from a vault, escrow or sweep controlled by the platform.',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Only an ITF with prior Banxico authorisation may operate with virtual assets, and only as internal operations that do not transmit the risk to clients; a platform cannot convert client USDC to MXN.',
 citation: 'Ley Fintech art. 30; Banxico Circular 4/2019 arts. 3 and 4 (disp. 3.a: direct client-facing exchange/custody/transmission is ineligible for authorization even for authorized institutions — read 2026-10-27)',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Paying a supplier from collected USDC requires custody plus a payment-funds activity that the platform is not authorised to perform.',
 citation: 'Ley Fintech arts. 30 and 32; Banxico Circular 4/2019 art. 3',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion can only run through a CNBV-authorised ITF with Banxico virtual-asset authorisation acting inside the internal-operations limit, or through a bank executing a pure FX conversion with no virtual-asset leg.',
 citation: 'Ley Fintech arts. 30 and 32; Banxico Circular 4/2019 arts. 3 and 4',
 condition: 'A signed ITF partner whose Banxico authorisation expressly covers the contemplated operation, with the platform outside the funds flow; NOTE (read 2026-10-27): Circular 4/2019 disp. 3.a makes direct client-facing AV exchange/custody/transmission ineligible for Banxico authorization even for authorized institutions — counsel must identify the partner lawful basis for a client-facing stablecoin off-ramp, or run the MX leg as pure FX (bank SPEI) with no virtual-asset leg.',
 },
 },
 fxControl: {
 required: false,
 channel: 'n/a',
 deadlineDays: 'n/a',
 citation: 'No export-surrender obligation identified in Ley Fintech or Banxico circulars; Ley Fintech art. 30 treats virtual assets as outside currency and divisas - INFORMATIONAL on absence',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'ITF authorisation (CNBV) plus Banxico virtual-asset authorisation if any custody or exchange is performed; no licence for pure software',
 citation: 'Ley Fintech arts. 30 and 32; Banxico Circular 4/2019 art. 3',
 },
 agency: {
 required: false,
 regime: 'Customs importer/exporter registration (RFC, pedimento); no financial licence for the agency role',
 citation: 'Ley Aduanera - padrón de importadores and pedimento (INFORMATIONAL)',
 },
 extraterritorial: false,
 citation: 'Ley Fintech art. 30 binds ITF; no provision identified that reaches a foreign software provider (Ley Fintech scope only — absence, INFORMATIONAL); NOTE (read 2026-10-27): LFPIORPI art. 17 XVI (DOF 16-07-2025) DOES expressly cover AV exchange/custody/transfer operations with Mexican citizens from another jurisdiction — AML-registration exposure independent of this field, see aml',
 },
 aml: {
 obligedEntity: 'partner',
 travelRule: 'unknown',
 kycThresholds: {
 itf: 'LFPIORPI art. 17 XVI aviso thresholds (reformed DOF 16-07-2025, read 2026-10-27): per-client operation >= 210x UMA daily value, or fee charged >= 4x UMA daily; recordkeeping on originator, receptor and Beneficiario Controlador',
 },
 citation: 'LFPIORPI art. 17 XVI (DOF 16-07-2025 — express extraterritorial clause: operations with Mexican citizens from another jurisdiction; read 2026-10-27); Ley Fintech art. 32',
 },
 docs: {
 invoiceCurrency: 'USD',
 customsRequires: ['pedimento', 'commercial invoice', 'packing list', 'certificate of origin where a trade agreement is claimed'],
 commercialInvoiceAllowed: true,
 citation: 'Ley Aduanera arts. 64-65 (customs value); commercial invoice in foreign currency accepted - INFORMATIONAL',
 },
 tax: {
 valuationRule: 'Customs value on transaction value; exports zero-rated for VAT.',
 citation: 'Ley Aduanera art. 64; Ley del IVA art. 29',
 },
 sanctions: {
 screening: 'OFAC/UN screening before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms',
 },
 rails: {
 licensedPartners: [],
 citation: 'CNBV ITF registry and Banxico authorised list; no partner contracted as of this profile',
 },
 openQuestions: [
 'Is a foreign platform that only displays a seller wallet and charges a separate SaaS fee an ITF under Ley Fintech art. 30?',
 'Can a CNBV-authorised ITF lawfully off-ramp USDC to MXN for a third-party exporter given the internal-operations limit in Circular 4/2019?',
 'What LFPIORPI registration and threshold apply to an agency that receives USDC?',
 'Does the vault owner-refund key constitute custody and control under art. 32 even if the platform never initiates a transfer?',
 'Is a USD commercial invoice sufficient for the pedimento, or must the customs value be declared in MXN?',
 'What CFDI treatment applies to a USDC-settled export sale?',
 ],
};
```

## Process delta

- Remove the vault, the owner refund key and fee netting for MX: the statutory custody test is possession of keys or authorisations sufficient to execute transfers.
- Keep MX in "direct only" until an ITF partner with an express Banxico scope is contracted.
- Do not advertise fiat payout in MX; there is no lawful platform conversion channel today.
- Invoice the platform fee separately, in MXN or USD, never from the payment amount.
- Align invoice currency with the pedimento and do not claim that commercial documents close customs.
