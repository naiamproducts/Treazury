---
dept: L.D
scope: global
kind: research
status: provisional
as_of: 2026-10-26
sources:
 - docs/L.D/ar/profile.md
 - docs/L.D/mx/profile.md
 - docs/L.D/co/profile.md
 - docs/L.D/cl/profile.md
 - docs/L.D/br/profile.md
 - docs/L.D/us/profile.md
 - docs/L.D/eu/profile.md
 - docs/L.D/ve/profile.md
 - naiam-si/docs/C.O/global/country-regulatory-profile.md
 - aven (legal pass, 19-source appendix, 2026-10-25)
 - aven (this pass, 2026-10-26)
---

# Treazury — jurisdiction flow matrix

Scope note (Rule 1 reconciliation): this file is a **summary index**, not an
independent source of jurisdictional claims. Every country-specific claim's
authority lives in `docs/L.D/<cc>/profile.md`; each cell below is a pointer to
that file, and no sentence here reads "generally, and in country X...". Where a
cell disagrees with the country file, the country file wins.

Verdict vocabulary (engine semantics, `src/modules/jurisdiction/index.ts`):
`permitted` = allowed; `conditional` = allowed only if the named condition is
satisfied in configuration; `blocked` = refused; `unknown` = treated as blocked
for money movement. All profiles below are `status: provisional`, so **no
corridor is sellable today** until L.D confirms them and T.D ports them into
`src/modules/jurisdiction/profiles/`.

## Flow matrix

| Country | buyerToSellerDirect | platformHoldsFunds | platformChargesFeeOnValue | platformConvertsToFiat | platformPaysSupplier | licensedPartnerConversion | FX control channel | Platform licence needed? | Regime reaches a foreign platform? | Single biggest blocker |
|---|---|---|---|---|---|---|---|---|---|---|
| AR | blocked | blocked | blocked | conditional | blocked | conditional | MCF / SECOEX, 180 days | yes (CNV PSAV + BCRA rules) | yes (RG 994/2024 art. 3) | Export-surrender duty: USDC receipt does not discharge it (Decreto 609/19; BCRA TO §7.1) |
| CO | blocked | blocked | blocked | conditional | blocked | conditional | IMC / compensation account, 180 days | no for pure software; custody/conversion reserved to IMC/banks | no (duty attaches to the resident exporter) | No reintegro outside the FX market (Decreto 1068/2015 art. 2.17.1.4; JDS-05009) |
| MX | permitted | blocked | conditional | blocked | blocked | conditional | none identified | yes if any custody/exchange (ITF + Banxico) | no (Ley Fintech binds ITF) | Custody test: keys/authorisations = control (Ley Fintech art. 32); vault + fee netting breach it |
| US | permitted | blocked | conditional | blocked | blocked | conditional | none identified | yes if the platform accepts/transmits (FinCEN MSB) | yes (31 CFR 1010.100(ff): person wherever located, US nexus) | MSB status of the vault/fee/payout build; state MTL for any partner |
| EU | conditional | blocked | conditional | blocked | blocked | conditional | none identified | yes for any art. 3(1)(16) service (CASP, MiCA art. 59) | yes (art. 59(1) + art. 61; third-country CASPs need authorisation to solicit) | MiCA authorisation for any execution/custody; no third-country solicitation of EU clients |
| BR | conditional | blocked | conditional | blocked | unknown | conditional | mercado de câmbio (BCB-authorized institutions) | yes for custody/intermediation (SPSAV, Res. BCB 520/2025) | yes (art. 23 addresses entities constituted abroad; 270-day localization) | SPSAV authorisation + art. 23 clock (started 02/02/2026); custody is off-limits |
| CL | conditional | unknown | unknown | unknown | unknown | conditional | MCF reporting via exporter's bank (BC Circular 768) | no VASP giro found in Ley 21.521 art. 5 (INFORMATIONAL) | no provision found (absence, INFORMATIONAL) | Unresolved Ley 21.521 characterisation (custody/SAT) + Circular 768 full text unread |
| VE | conditional | blocked | unknown | blocked | unknown | conditional | operador cambiario autorizado / BCV-CENCOEX declaration | yes (conservative; currency sale reserved to BCV operators) | conservative true (unverified) + US 31 CFR Part 591 in practice | OFAC Part 591 red line + which VE FX instrument is in force (2014/2015/2018/2021) |

Authority per cell: the corresponding country file (all eight). AR/CO/MX rows
normalize the verdicts already recorded in (2026-10-25); US/EU/BR/CL/VE
rows are new in (2026-10-26).

## Ranked: no-delta vs modified process

Measured against the ideal buyer→seller-direct path (wallet→wallet, platform
outside the funds flow):

1. **No-delta (settle as-is): MX, US.** Base flow `permitted`, no FX channel
 required. US carries one architecture condition: the platform must never
 accept or transmit value (that is the product's own non-custodial guardrail,
 PA-R5). EU is a borderline no-delta: `conditional` only on the platform
 staying outside execution/transfer, which is design intent rather than an
 extra process step - ranked with MX/US if the vault is removed.
2. **Light delta (small process step): BR, CL.** BR: any currency leg that
 touches Brazil must run through an authorized FX institution, and custody is
 barred outright (SPSAV). CL: the exporter's bank report under BC Circular 768
 becomes a document-release gate.
3. **Modified process (real workflow change): VE, CO, AR.** VE: OFAC Part 591
 gate plus BCV/CENCOEX declaration. CO: full IMC/compensation-account channel
 plus cambio declaration as release gate. AR: heaviest - MCF/SECOEX
 liquidation, no fee netting, no platform payout, penal regime (Ley 19.359)
 in the background.
4. **Not sellable in any market today (structural):** `platformHoldsFunds` is
 `blocked` or `unknown` in all eight profiles. The current OrderVault + fee
 sweep build (`contracts/PaymentRouter.sol:185-192, 290-297, 394-407`, read
 2026-10-25) cannot be offered anywhere until it is removed or the platform is
 licensed - this is a global build decision, not a country decision.

Cross-cutting constraints (global, no country row): no corridor ships until the
matching `docs/L.D/<cc>/profile.md` is ported into `src/modules/jurisdiction/
profiles/<cc>.ts` and passes `bun run check`; no named partner may appear in any
`rails.licensedPartners` until it is actually contracted; and every
`citation: 'unverified'` field must be resolved by L.D before the profile
status moves from `provisional` to `confirmed`.
