---
dept: L.D
scope: global
kind: policy
status: provisional
as_of: 2026-10-28
sources:
 - docs/L.D/ar/profile.md
 - docs/L.D/mx/profile.md
 - docs/L.D/co/profile.md
 - docs/L.D/cl/profile.md
 - docs/L.D/br/profile.md
 - docs/L.D/us/profile.md
 - docs/L.D/eu/profile.md
 - docs/L.D/ve/profile.md
 - aven (legal pass, 2026-10-25)
 - aven (2026-10-26)
 - docs/L.D/ar/fideicomiso-viability.md (aven, 2026-10-28 — item 21)
 - https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto (CNV RG 1172/2026, read 2026-10-28 — items 22-27)
 - https://tangem.com/company (Tangem AG, read 2026-10-28 — item 27)
 - docs/L.D/global/non-custody-boundary.md (aven, 2026-10-28 — items 22-27)
 - docs/L.D/ar/tangem-revshare-analysis.md (aven, 2026-10-28 — items 28-32)
 - https://tangem.com/en/affiliates + https://tangem.com/en/help-center/swap/ (Tangem referral program + swap providers, read 2026-10-28 — items 28, 32)
---

# Treazury — global red lines (never-do list)

Scope note (Rule 1 reconciliation): this is a cross-jurisdiction **index of
prohibitions**. Every item declares its own country scope; the authority for a
country item is the cited instrument (and the country profile it came from).
Items with `scope: global` contain zero jurisdiction-specific content.

Verdict labels on items: `CONFIRMED` = primary source read and cited;
`SUSPICIOUS` = source read but in-force/scope unresolved; `INFORMATIONAL` =
absence of evidence or thin evidence. Never do any of these without a founder
decision surfaced through the COO plus, where marked, a licensed attorney.

## Product-wide (scope: global)

1. **Never market Treazury as "non-custodial" or "100% self-custody" while the
 OrderVault owner can refund any vault to any recipient and the sweep splits
 fees.** Scope: global. Evidence: `contracts/PaymentRouter.sol:185-192,
 290-297, 394-407` (read 2026-10-25,) vs `AGENTS.md:149, :202`.
 Verdict: CONFIRMED (code) / SUSPICIOUS (copy). Resolve the architecture or
 the claim before any launch copy ships.
2. **Never name a licensed partner, rail, or "bank payout in 2–6 hours" claim
 before that partner is contracted and appears in
 `rails.licensedPartners`.** Scope: global. Evidence: all eight profiles
 carry `licensedPartners: []` (as_of 2026-10-26); landing claim at
 `src/i18n/en.ts:29-31` (read 2026-10-25). Verdict: CONFIRMED (empty rails) /
 SUSPICIOUS (copy).
3. **Never release customs-clearing claims on generated documents** - they are
 commercial, not customs, and carry the disclaimer. Scope: global. Evidence:
 `AGENTS.md:38-42` (CD/DRG/PA guardrails, read 2026-10-26). Verdict:
 CONFIRMED (product rule).
4. **Never let an unknown or stale profile ship a corridor.** Scope: global.
 Evidence: `src/modules/jurisdiction/index.ts:154-159, 147-152` (unknown and
 stale both refuse; read 2026-10-26). Verdict: CONFIRMED (engine).

## Non-custody / PSAV boundary (scope: global; added 2026-10-28, aven)

Analysis: `docs/L.D/global/non-custody-boundary.md`. Primary text: CNV RG
1172/2026 (B.O. 15-10-2026), Cap. III Tít. XIV, arts. 1–10, 33–34, 36, 38
(https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto, read
2026-10-28); Ley 25.246 art. 4 bis via considerandos. All CONFIRMED = cited
primary text; CNV-practice gaps flagged in the analysis file.

22. **Never hold, control, or retain any faculty over client virtual assets —
 private keys, seed shards or backups, MPC shares, session keys, signing
 credentials, hardware-device admin access, or a smart-contract recovery/
 guardian key — whether held by Treazury directly or by a third party we
 designate, instruct, fund, or can replace. Any such faculty, even
 temporary, makes Treazury a Cat 4 candidate (custody/administration or
 "instrumentos que permitan el control") and destroys the art. 2 iv)
 self-custody carve-out (zero-threshold test, not materiality).** Scope:
 global. Evidence: RG 1172/2026 arts. 2 iv), 9 Cat 4 (read 2026-10-28);
 PA-R5 (`AGENTS.md:202-203`). Verdict: CONFIRMED.
23. **Never be the counterparty, market-maker, or principal of any
 AV↔fiat or AV↔AV exchange for clients — no OTC desk, no "we receive USDC
 and pay ARS/USD", no instant-quote-we-execute — even if the client's keys
 live on their own Tangem or the custody arrangement is third-party. The
 exchange act is ours; Cat 1/2 attaches to it, and the ARS/USD leg is
 additionally reserved to TO §1.1 BCRA-authorized entities (Ley 19.359
 art. 1 a, criminal core).** Scope: global (PSAV) / ar (FX leg).
 Evidence: RG 1172/2026 art. 9 Cats 1–2 + art. 4 bis (read 2026-10-28);
 Ley 19.359 art. 1 a); BCRA TO §1.1 (`export-flow-escrow.md` A.1 #8).
 Verdict: CONFIRMED.
24. **Never initiate, sign, broadcast, submit, or relay a client transfer of
 virtual assets — no server-side signing, no relayer, no paymaster/
 gas-sponsorship with a Treazury signer, no meta-transaction flow, no
 "Treazury pays address X on behalf of the client". Returning a payment
 route ("pay to address X, the wallet is yours") is fine; executing the
 transfer is Cat 3.** Scope: global. Evidence: RG 1172/2026 art. 9 Cat 3 +
 art. 4 bis (read 2026-10-28). Verdict: CONFIRMED.
25. **Never deploy, operate, upgrade, pause, or parameter-tune a smart
 contract over client value if Treazury holds (or can rotate) any admin,
 upgrade, pause, fee-drain, blacklist, or guardian key, or can otherwise
 influence its functioning post-deploy — that contract is an "instrumento
 que permite el control" (Cat 4), and labels like "the contract controls
 itself" do not survive the control/sufficient-influence test. An escrow
 is clean only if both counterparties are the sole signers, no admin key
 exists anywhere, and timeout refunds go to original senders.** Scope:
 global. Evidence: RG 1172/2026 arts. 2 iii)–iv), 9 Cat 4, 38 ¶2
 (nature over form; read 2026-10-28). Verdict: CONFIRMED (text) /
 SUSPICIOUS (CNV application to admin-less contracts — no guidance read;
 counsel question in non-custody-boundary.md escalation 1).
26. **Never deduct, net, or skim any fee from a virtual-asset amount or from
 an export/import collection — fiat-invoiced SaaS fee to the agency only,
 outside every value flow.** Scope: global (PSAV characterization risk) /
 ar (surrender-duty breach). Evidence: red-line 6; RG 1172/2026 art. 4 bis
 (fee inside the flow embeds our economics in the exchange activity);
 BCRA TO §7.1 + Decreto 609/2019 art. 1; `docs/L.D/cn/profile.md` fee
 condition. Verdict: CONFIRMED.
27. **Never describe Tangem — or any hardware/self-custody tool — as "our
 custodian", "the licensed custodian in our stack", or "our regulated
 custody layer" in product, partner, or marketing copy. Tangem AG (Swiss,
 UID CHE-390.112.525) sells self-custody hardware/software; it does not
 hold, custody, or control user assets and is not a financial-services
 regulator's licensee — it sits inside the RG 1172/2026 art. 2 iv)
 carve-out, on the opposite side of the Cat 4 line from a custodian.
 Partnerships must be framed as tools/distribution only.** Scope: global.
 Evidence: tangem.com/company + ToS (read 2026-10-28, search extraction);
 RG 1172/2026 arts. 2 iv), 33–34 (read 2026-10-28);
 `non-custody-boundary.md` §C. Verdict: CONFIRMED (self-description) /
 INFORMATIONAL (no ESMA/CNV register query performed).

## Tangem affiliate rev-share (scope: ar / global-PSAV; added 2026-10-28, aven)

Analysis: `docs/L.D/ar/tangem-revshare-analysis.md`. Primary text: CNV RG
1172/2026 arts. 1 ¶3, 2 i)–ii), 4 (3/4), 9 (Cats 1/2/5), 33 ¶3, 34, 38 ¶2
(https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto, read
2026-10-28); Ley 25.246 art. 4 bis via considerandos; Ley 19.359 art. 1 a)
carried. Top-line verdict on the 30% rev-share: CONDITIONAL.

28. **Never promote Tangem's in-app swap, staking, yield, or fiat buy/sell
 (on/off-ramp) features to Argentine residents or in any content clearly
 directed at AR residents (AR-targeted landing pages, paid AR ads,
 AR-influencer campaigns funded by the rev-share). Until licensed AR
 counsel clears broader scope, promotion is limited to the self-custody
 hardware / wallet-security angle, outside AR-targeted paid promotion.**
 Basis: publicity/direction is the foreign operator's registration nexus
 (RG 1172/2026 art. 4 modalities 3/4 — our promotion would be the
 evidence of "claro direccionamiento"/"publicidad claramente dirigida");
 the promoted acts are Cat 1/2 when performed for another as a business
 (art. 9 + art. 4 bis); art. 34 (no confusion as PSAV); red-line 23
 family. Scope: ar. Verdict: CONFIRMED (text) / SUSPICIOUS (promoter-side
 exposure — no CNV guidance read; counsel questions 1–2 in the analysis).
29. **Never let the Tangem rev-share touch a value flow or the core product
 funnel — no netting into SaaS pricing, no fee-skim from any client
 collection, no "use Treazury and earn Tangem rewards" inside the agency
 app or payment pages; book it as a separate third-party marketing
 receivable, outside every client value flow.** Scope: global. Basis:
 analogue of red-line 26 (fee inside a value flow embeds our economics in
 the exchange activity — art. 4 bis conduct test + art. 38 ¶2
 substance-over-form posture). Verdict: CONFIRMED (policy).
30. **Never describe the rev-share — in contract, deck, copy, or accounting
 narrative — as "participation in operations", "revenue share on crypto
 transactions", or anything implying Treazury participates in an
 exchange/staking business; never use "agent", "representative", or
 "official partner in Argentina" for Tangem; never present Treazury's
 brand as the swap/staking surface.** Scope: global. Basis: RG 1172/2026
 art. 34 (non-registered persons must not suggest PSAV status / create
 confusion, read 2026-10-28); art. 38 ¶2 (nature over form); art. 33 ¶1
 anti-misleading standard by analogy; agency-characterization risk
 (analysis §4, SUSPICIOUS pending contract read). Verdict: CONFIRMED
 (text) / SUSPICIOUS (agency wording — contract unseen).
31. **Never receive the Tangem rev-share into any wallet, account, or
 address that holds or touches client value, platform contracts, or
 settlement flows — a dedicated own-account receiving wallet only, fully
 segregated, never described as part of the product "stack".** Scope:
 global. Basis: PA-R5 / hard rule 5 (`AGENTS.md:202-203`); the art. 2
 i) (own account) and art. 2 ii) (AVs as consideration for own services)
 exclusions of RG 1172/2026 depend on the segregation being real (read
 2026-10-28). Verdict: CONFIRMED (text + policy).
32. **Never collect or accrue the Tangem rev-share before the
 affiliate/partner agreement text has been reviewed under
 33-contracts-review — specifically the revenue-base definition (does it
 include fiat on/off-ramp fees?), territory/targeting and exclusivity
 clauses, assignment clause, indemnities, termination, and crypto-payment
 mechanics.** Scope: global. Basis: SUSPICIOUS — the founder-confirmed
 30% figure is taken as verified, but the contract is unseen; the public
 Tangem referral program pays a flat 5–10 USDT per hardware purchase
 (tangem.com/en/affiliates, read 2026-10-28), so a 30% in-app
 swap/staking rev-share is a custom arrangement whose actual scope
 decides the §3 scenario table. Verdict: SUSPICIOUS (unseen contract).

## Argentina (scope: ar)

5. **Never treat direct USDC receipt by an AR goods exporter as discharge of
 the export-surrender duty.** Evidence: Argentina - Decreto 609/2019 art. 1
 (as amended by Decreto 91/2019) + BCRA TO Exterior y Cambios (14/09/2026)
 Sección 7.1, https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf (read
 2026-10-25); penal regime Ley 19.359. Verdict: CONFIRMED.
6. **Never deduct a platform fee from an AR export collection** (netting itself
 breaches the surrender duty). Evidence: as item 5. Verdict: CONFIRMED.
7. **Never mark an AR order settled without an MCF liquidation/export
 declaration.** Evidence: Decreto 609/2019 art. 1; BCRA TO §7.1; CNV
 registration regime (RG 994/2024 — registration articles now superseded by
 CNV RG 1172/2026, B.O. 15-10-2026, see
 `docs/L.D/ar/ar-sas-cashabroad-equivalent.md`),
 https://www.argentina.gob.ar/normativa/nacional/resolución-994-2024-397598/texto,
 read 2026-10-25; supersession note read 2026-10-27. Verdict: CONFIRMED.
21. **Never present any structure — fideicomiso, offshore entity,
 smart-contract vault, or otherwise — as a way to avoid BCRA enforcement
 (bloqueos, conformidad previa, SEPAIMPO/SECOEXPO controls) or to keep a
 company's CUIT "clean" while operating. Never claim to "eliminate",
 "bypass" or "remove" exchange-control obligations or bureaucracy.** The
 only lawful AR framing: obligations run through BCRA-authorized entities
 and our software speeds the documented path. Scope: ar. Evidence: Ley
 19.359 TO 1995 arts. 1 a)/c)/d)/e)/f), 2 a)/e)/f), 17
 (https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm,
 read 2026-10-28); BCRA TO Exterior y Cambios (14/09/2026) §§1.1, 1.2, 3.7,
 3.10, 3.16.3.2 vii, 3.16.3.3, 3.16.4, 10.2.6, 10.3.2
 (https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf, read
 2026-10-28); CCyC arts. 1681, 1686 (read 2026-10-28); Decreto 609/2019
 art. 3 (read 2026-10-28); full analysis `docs/L.D/ar/fideicomiso-viability.md`
 (aven). Verdict: CONFIRMED.

## Colombia (scope: co)

8. **Never reintegro/export settlement outside the Colombian FX market.**
 Evidence: Colombia - Decreto 1068/2015 art. 2.17.1.4; Banrep JDS-05009
 (07/03/2017, "no está autorizado su reintegro por fuera de dicho mercado"),
 https://www.banrep.gov.co/es/banco/junta-directiva/conceptos/jds-05009-0
 (read 2026-10-25). Verdict: CONFIRMED.
9. **Never settle a resident-to-resident CO obligation in anything but COP.**
 Evidence: Decreto 1068/2015 art. 2.17.1.3 (read 2026-10-25). Verdict:
 CONFIRMED.

## Mexico (scope: mx)

10. **Never hold, control, or net client funds/keys without ITF + Banxico
 authorisation.** Evidence: Mexico - Ley Fintech arts. 30 and 32 (custody =
 possession of signatures/keys/authorisations sufficient to execute
 operations) + Banxico Circular 4/2019 art. 3,
 https://www.diputados.gob.mx/LeyesBiblio/pdf/LRITF.pdf (read 2026-10-25).
 Verdict: CONFIRMED.
11. **Never advertise an MX fiat payout or on-platform conversion.** Evidence:
 as item 10 (only an authorised ITF may operate with virtual assets, internal
 operations only). Verdict: CONFIRMED.

## United States (scope: us)

12. **Never accept, transmit, or hold value for US-nexus users without a
 FinCEN MSB analysis and registration.** Evidence: US - 31 CFR
 1010.100(ff)(5)(i)(A) (read 2026-10-26, eCFR) + FinCEN FIN-2019-G001 (read
 2026-10-25). Verdict: CONFIRMED.
13. **Never pay a third-party supplier from collected value in a US corridor.**
 Evidence: 31 CFR 1010.100(ff)(5)(i)(A) - transmission to another person by
 any means (read 2026-10-26). Verdict: CONFIRMED.

## European Union (scope: eu)

14. **Never provide custody, exchange, or client transfers in the Union without
 CASP authorisation, and never solicit EU clients from a third country
 (reverse solicitation only).** Evidence: EU - MiCA art. 3(1)(16), art.
 59(1), art. 61, per ESMA Opinion ESMA75-453128700-1048 (read 2026-10-26);
 CSSF notice 02/07/2026 (transition ended 01/07/2026). Verdict: CONFIRMED.
15. **Never execute a self-hosted-address transfer above EUR 1,000 without an
 ownership/control assessment - only if Treazury is (or becomes) a CASP.**
 Evidence: EU - Regulation (EU) 2023/1113 art. 14(5) (read 2026-10-26,
 EUR-Lex). Verdict: CONFIRMED (obligation) / the applicability trigger is the
 CASP question in the EU profile.

## Brazil (scope: br)

16. **Never custody or intermediate crypto-assets for third parties in Brazil
 without BCB SPSAV authorisation - and never assume a foreign entity is
 exempt: art. 23 gives it 270 days to localize.** Evidence: Brazil -
 Resolução BCB 520/2025 art. 23 (DOU 11/11/2025; vigência 02/02/2026),
 https://www.in.gov.br/en/web/dou/-/resolucao-bcb-n-520-de-10-de-novembro-de-2025-668059151
 (read 2026-10-26) + Lei 14.478/2022 (read 2026-10-25). Verdict: CONFIRMED.
17. **Never move currency into or out of Brazil outside an authorized
 FX-market institution.** Evidence: Lei 14.286/2021 art. 14,
 https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14286.htm
 (read 2026-10-26). Verdict: CONFIRMED.

## Chile (scope: cl)

18. **Never claim a commercial invoice clears Chilean customs, and never claim
 a lawful crypto conversion route before counsel closes the Ley 21.521
 characterisation.** Evidence: Chile - Ley 21.521 arts. 3(3) and 5 (read
 2026-10-25, items 8-9; no VASP service in the art. 5 list is
 INFORMATIONAL); BC Circular 768 excerpt (read 2026-10-26) for the
 export-reporting duty. Verdict: INFORMATIONAL (absence) - do not build product
 claims on it either way.

## Venezuela (scope: ve)

19. **Never process any payment whose parties or wallet addresses touch31 CFR
 Part 591 (SDN, blocked property, 50% rule) or a Government of
 Venezuela/PDVSA nexus - hard refusal before order creation.** Evidence: US -
 31 CFR Part 591 (read 2026-10-25, item 17) + OFAC virtual-currency
 guidance (read 2026-10-25) + Circle USDC Terms blocked-addresses clause
 (read 2026-10-25). Verdict: CONFIRMED.
20. **Never buy or sell currency for a VE corridor outside a BCV-authorized
 operador cambiario.** Evidence: VE - Ley Contra los Ilícitos Cambiarios
 (exclusive BCV competence, excerpt read 2026-10-26) + Régimen Cambiario y
 sus Ilícitos art. 18 (excerpt read 2026-10-26); in-force status of the
 instrument set unresolved. Verdict: SUSPICIOUS (in-force) - treat as a red
 line until counsel confirms which instrument governs in 2026.

## Escalation (founder + licensed attorney, via COO)

- Items 1, 2 and 18: claim-vs-reality decisions that change launch copy.
- Items 14, 16, 19: market-open/market-closed calls (EU authorisation path,
 BR localization clock, VE closed-vs-conditional).
- Item 21 (added 2026-10-28, aven): any external or partner copy
 that positions a structure as evading BCRA enforcement or "cleaning" a CUIT
 — reject before it reaches the founder as an option.
- Every `unknown` verdict in the country profiles: resolving it is legal
 research assigned by L.D, never an engineering guess.
