---
dept: L.D
scope: cl
kind: policy
status: provisional
as_of: 2026-10-26
sources:
 - https://www.bcn.cl/leychile/navegar?idNorma=1187323
 - https://www.cmfchile.cl/institucional/inc/dictamenes_muestra_doc.php?nro_docto=2023090397526&nro_oficio=85224
 - https://www.cmfchile.cl/portal/principal/623/articles-72917_doc_pdf.pdf?ts=1693409930
 - https://www.cmfchile.cl/normativa/ncg_530_2025.pdf
 - https://www.bcentral.cl/documents/33528/133253/bcch_circular_099639_es.pdf/78ca97a8-406f-bbf2-490f-3e94408d0b9a
 - https://www.circle.com/legal/usdc-terms
---

# CL — Chile

Decision-support for counsel. Not legal advice; not a binding opinion.
Evidence posture: the fintech-law characterisation was read on 2026-10-25
( appendix items 8-9); the FX reporting rule rests on an excerpt of BC
Circular 768 read 2026-10-26 (full text still pending). Booleans whose citation
is `unverified` encode NOT-VERIFIED (fail-closed), not confirmed facts.

```ts
const cl: CountryRegulatoryProfile = {
 country: 'CL',
 asOf: '2026-10-26',
 status: 'provisional',
 flows: {
 buyerToSellerDirect: {
 verdict: 'conditional',
 rule: 'Chile has no identified export-surrender duty, but exporters must report the result and destination of export proceeds above FOB USD 10,000 to their bank in the Formal FX Market, so the collection must be reported before the corridor can settle.',
 citation: 'CL - Banco Central de Chile Circular N. 768 (Acuerdo 961-04-020117), Cap. IV (excerpt read 2026-10-26, bcentral.cl): exporters must inform result and destination of divisas for FOB above USD 10,000; "Liquidacion de Retorno" = sale to an MCF entity - full text not yet read (SUSPICIOUS)',
 condition: 'The exporter reports the collection (result and destination of the export divisas) to its bank in the Formal FX Market under BC Circular 768 before document release, and any CLP conversion occurs through an MCF entity.',
 },
 platformHoldsFunds: {
 verdict: 'unknown',
 rule: 'Whether custody of client crypto-assets is the regulated service "custodia de instrumentos financieros" or another Ley 21.521 giro is unresolved in this pass.',
 citation: 'unverified - Ley 21.521 arts. 3(3) and 5 characterisation of crypto custody not resolved (read 2026-10-25, items 8-9; CMF Oficio 85224 read 2026-10-25)',
 },
 platformChargesFeeOnValue: {
 verdict: 'unknown',
 rule: 'Whether a fee netted from a payment the platform handles triggers a regulated giro has not been verified in this pass.',
 citation: 'unverified - Ley 21.521 giro analysis for fee netting not verified in this pass',
 },
 platformConvertsToFiat: {
 verdict: 'unknown',
 rule: 'Whether a USDC-to-CLP conversion by the platform requires CMF authorisation (SAT or other giro) has not been verified in this pass.',
 citation: 'unverified - Ley 21.521 / NCG 502 characterisation of crypto-to-fiat exchange not verified in this pass',
 },
 platformPaysSupplier: {
 verdict: 'unknown',
 rule: 'Paying a supplier from collected value requires the custody and transfer analysis that is itself unresolved in this pass.',
 citation: 'unverified - no primary source read for this flow in this pass',
 },
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion can run through a Formal FX Market entity for the CLP leg while Treazury stays outside the funds flow, subject to the partner’s CMF position on the crypto leg.',
 citation: 'CL - BC Circular 768 (excerpt read 2026-10-26) for the MCF structure; Ley 21.521 arts. 3(3), 5 (read 2026-10-25, items 8-9)',
 condition: 'An MCF entity (bank or casa de cambio) executes the CLP leg, Treazury never holds the funds, and counsel confirms in writing that the partner’s crypto leg does not require CMF registration under Ley 21.521 before go-live.',
 },
 },
 fxControl: {
 required: true,
 channel: 'Mercado Cambiario Formal (MCF) - reporting through the exporter’s bank',
 citation: 'CL - Banco Central de Chile Circular N. 768 (excerpt read 2026-10-26): export-collection reporting (result/destination of divisas, FOB > USD 10,000) and "Liquidacion de Retorno" through an MCF entity; full text not yet read (SUSPICIOUS); deadline not evidenced in this pass',
 },
 licensing: {
 platform: {
 required: false,
 regime: 'No VASP service appears in the Ley 21.521 art. 5 list of regulated servicios financieros; custody/exchange characterisation of crypto is unresolved - INFORMATIONAL (absence)',
 citation: 'CL - Ley 21.521 arts. 3(3) and 5 (read 2026-10-25, items 8-9); CMF registry of financial service providers (read 2026-10-26 excerpt)',
 },
 agency: {
 required: false,
 regime: 'No financial licence identified for a merchant import/export agency; a despachante de aduanas is a separate licensed customs role - INFORMATIONAL (absence, unverified)',
 citation: 'unverified',
 },
 extraterritorial: false,
 citation: 'CL - no provision found in Ley 21.521 that reaches a foreign non-custodial software platform - INFORMATIONAL (absence of evidence, not a confirmed negative)',
 },
 aml: {
 obligedEntity: 'unknown',
 travelRule: 'unknown',
 kycThresholds: {},
 citation: 'unverified - Chilean AML obligation allocation (and any crypto-asset travel-rule rule) not verified in this pass',
 },
 docs: {
 invoiceCurrency: 'unknown',
 customsRequires: ['Documento Unico de Salida (DUS) - excerpt read 2026-10-26 via BC Circular 768; full customs regime unverified'],
 commercialInvoiceAllowed: false,
 citation: 'CL - BC Circular 768 excerpt (read 2026-10-26) mentions the Documento Unico de Salida; invoice currency and commercial-invoice acceptance not verified - commercialInvoiceAllowed=false is fail-closed, not a confirmed prohibition',
 },
 tax: {
 valuationRule: 'unknown',
 citation: 'unverified - Chilean customs/tax valuation not verified in this pass',
 },
 sanctions: {
 screening: 'OFAC/UN/EU screening of all parties and wallet addresses before order creation; the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms (blocked addresses and forfeited funds) - read 2026-10-25 ( appendix items 17-18)',
 },
 rails: {
 licensedPartners: [],
 citation: 'MCF entities authorized by Banco Central de Chile and CMF Registro de Prestadores de Servicios Financieros; no partner contracted as of this profile',
 },
 openQuestions: [
 'Does receipt of USDC by a Chilean exporter count as "divisas" for BC Circular 768 reporting, or only cash foreign currency does?',
 'Are crypto-assets "instrumentos financieros" for Ley 21.521 purposes, so that custody becomes the regulated giro "custodia de instrumentos financieros"? (CMF Oficio 85224 addresses art. 3(3) only)',
 'Does operating a matching venue for crypto-to-crypto or crypto-to-fiat amount to a "sistema alternativo de transaccion" requiring CMF authorisation?',
 'What is the full current text and in-force status of BC Circular 768 (only an excerpt was read on 2026-10-26), and was it relaxed by the April 2026 BC measures?',
 'What deadline applies between receipt of the export collection and the bank report?',
 'Is a foreign platform that only displays a seller wallet and invoices the agency reachable by Ley 21.521 at all?',
 ],
};
```

## Process delta

- Add a bank-reporting gate: the exporter’s MCF bank must receive the export-collection report (BC Circular 768, FOB > USD 10,000) before Treazury releases documents.
- Keep conversion off the platform entirely: only an MCF entity may take the CLP leg, and counsel must clear the partner’s crypto leg under Ley 21.521 first.
- Leave custody, fee netting, and supplier payout switched off for CL: every one of those flows is `unknown` in this profile and the engine treats unknown as blocked.
- Do not claim the commercial invoice clears Chilean customs; the DUS/customs position is only partially evidenced (excerpt-level).
- Treat CL as "reporting-light, licence-dark": the FX delta is small, but the Ley 21.521 characterisation questions must be closed by counsel before any corridor is sold.
