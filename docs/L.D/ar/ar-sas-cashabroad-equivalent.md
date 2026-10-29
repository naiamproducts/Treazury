---
dept: L.D
scope: ar
kind: research
status: provisional
as_of: 2026-10-27
sources:
 - "AR · CNV RG 1172/2026 (substitutes Capítulo III, Título XIV, Normas TN 2013) · arts. 1–4, 6, 9, 10 · https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto (sanción 14-10-2026, B.O. 15-10-2026) · read 2026-10-27"
 - "AR · CNV RG 1058/2025 · https://www.argentina.gob.ar/normativa/nacional/norma-410635/texto (B.O. 14-03-2025; superseded in turn by RG 1172/2026) · read 2026-10-27"
 - "AR · CNV RG 994/2024 · https://www.argentina.gob.ar/normativa/nacional/resolución-994-2024-397598/texto (B.O. 25-03-2024; registration articles superseded by RG 1058/2025 → RG 1172/2026) · read 2026-10-27"
 - "AR · Ley 25.246 art. 4 bis (PSAV definition, incorporated by Ley 27.739) · quoted in the considerandos/operative texts of RG 994/2024, RG 1058/2025 and RG 1172/2026 on argentina.gob.ar · read 2026-10-27"
 - "AR · Decreto 609/2019 art. 1 (as amended by Decreto 91/2019); BCRA TO Exterior y Cambios (14/09/2026) Sección 7.1; Ley 19.359 — prior verified pass 2026-10-25 (aven), not re-read"
 - docs/L.D/ar/profile.md (prior verified pass, 2026-10-25)
 - docs/M.D/global/cashabroad-teardown.md (aven, 2026-10-27)
 - aven (this memo)
---

# AR — Could an Argentine SAS in Córdoba deliver a CashAbroad-like service?

Decision-support for counsel. Not legal advice; not a binding opinion.

## 1. What CashAbroad actually does (CMO teardown, aven — cited, not invented)

B2B cross-border payments in stablecoins; MXN↔USDC conversion 24/7; digital
USD/EUR accounts; custodial wallets (T&C ch. 4: the platform "ofrecerá los
servicios de custodia"); commission per operation + platform-use commission
(T&C ch. 9/16); WhatsApp payment orders that are binding (T&C); "salidas
bancarias locales en +8 países" (partner rails not named). Entity:
CashAbroad México, S.A. de C.V. (`docs/M.D/global/cashabroad-teardown.md` §1–2).

## 2. Flow mapping — each capability under AR law today

| CashAbroad capability (teardown cite) | Flow key (CountryRegulatoryProfile) | AR verdict | Instrument (jurisdiction · article · read) |
|---|---|---|---|
| MXN↔USDC conversion ("Convert pesos to USDC and back instantly", §2) | platformConvertsToFiat | **conditional** — for AR-resident clients this is a PSAV Category-1 activity: registration with CNV **before** operating; fiat legs inside the Mercado de Cambios | AR · Ley 25.246 art. 4 bis i (AV↔fiat exchange) + CNV RG 1172/2026 arts. 1–2, 9 (read 2026-10-27); BCRA TO §1.1/7.1 (read 2026-10-25) |
| Custodial wallets (T&C ch. 4, §2) | platformHoldsFunds | **REJECTED for Treazury** (global red line, blocked/unknown in all 8 profiles) and, for an AR SAS, only reachable as PSAV Category 4 with USD 150k net worth (75k small-volume) + FX duties on every fiat leg | AR · RG 1172/2026 arts. 9–10 (read 2026-10-27); BCRA TO §7.1; CNV registration per RG 1172 art. 1 |
| Commission on operation amounts + platform-use fee (T&C ch. 9/16, §1) | platformChargesFeeOnValue | **blocked** if netted from an export collection (the netting itself breaches surrender); separately invoiced fee lawful for non-export services (INFORMATIONAL, L.D analysis) | AR · Decreto 609/2019 art. 1; BCRA TO §7.1 (read 2026-10-25) |
| Paying suppliers / "salidas bancarias locales" (§2) | platformPaysSupplier | **blocked** for AR-resident payers: FX operations only via BCRA-authorised MCF entities; penal exchange regime in the background | AR · BCRA TO §7.1; Ley 19.359 (read 2026-10-25) |
| B2B cross-border settlement in stablecoins (§1) | buyerToSellerDirect | **blocked** for AR-origin goods exporters (USDC receipt does not discharge surrender); merchanting/non-AR goods = separate product line with MCF liquidation gate | AR · Decreto 609/2019 art. 1; BCRA TO §7.1 (read 2026-10-25); ar/profile.md process delta |
| Digital USD/EUR accounts (§1) | (adjacent to platformHoldsFunds / issuance) | **UNVALIDATED** — no AR instrument examined this pass governs a non-bank "digital dollar account"; likely PSAV cat 1/3 + FX entanglement — counsel | absence this pass — INFORMATIONAL |
| WhatsApp binding payment orders (§2) | order mechanics, not a flow key | **INFORMATIONAL** — no AR instrument identified this pass; not a licensing trigger per se | absence — INFORMATIONAL |
| Licensed-partner conversion (generic) | licensedPartnerConversion | **conditional** — BCRA-authorised MCF entity for the fiat leg + CNV-registered PSAV for the crypto leg; export declaration as release gate | ar/profile.md (BCRA TO §7.1; RG 1172/2026) |

## 3. Does an Argentine SAS in Córdoba have a structural advantage?

1. **FX surrender / export-proceeds duty — no advantage.** The duty attaches to
 the AR-resident exporter regardless of the exporter's or platform's entity
 form (AR · Decreto 609/2019 art. 1 as amended by Decreto 91/2019; BCRA TO
 (14/09/2026) Sección 7.1, 15/30/180-day channel — read 2026-10-25,
 ). An AR SAS is AR-resident; the duty follows.
2. **PSAV licensing — the SAS makes registration MANDATORY, not optional.**
 Under the current text (AR · CNV RG 1172/2026, B.O. 15-10-2026, read
 2026-10-27):
 - art. 1: AR-resident legal persons performing any Ley 25.246 art. 4 bis
 activity must inscribe in the Registro de PSAV **before** operating. The
 UVA 35,000/month carve-out covers **natural persons only** — no volume
 exemption for an SAS. CONFIRMED.
 - art. 2: unregistered persons must abstain; sanctions per art. 37 Ley
 27.739. CONFIRMED.
 - art. 1: foreign legal persons operating directly must register **and**
 constitute a local company (Ley 19.550 art. 123) or a branch (art. 118) —
 the SAS is the entry vehicle a foreign operator must build, not a shield
 from registration. CONFIRMED.
 - art. 10: minimum net worth USD 150,000 (cats 1/2/4), USD 75,000 (cat 3),
 USD 35,000 (cat 5); halved for players under USD 2.5M trailing-12-month
 volume; capital fully integrated and inscribed in the Registro Público.
 CONFIRMED.
 - art. 6: mandatory on-site legend "Inscripto bajo el N° … en el Registro
 de PSAV de la CNV". CONFIRMED.
 - Supersession note: RG 1172/2026 substituted the entire Capítulo III;
 RG 1058/2025 (which had substituted RG 994/2024 arts. 1–6) is itself
 superseded for these articles. The prior citation "RG 994/2024" in
 ar/profile.md was corrected on 2026-10-27. CONFIRMED.
3. **Penal exchange regime — no advantage.** Ley 19.359 is entity-form-neutral
 (prior verified pass, 2026-10-25): it bites the exchange operation that
 breaches BCRA rules, wherever it sits in the chain.
4. **Does "software only" hold?** Under RG 1172/2026 art. 2 iv), providers of
 **exclusive self-custody wallet software/hardware** fall outside the PSAV
 definition "siempre que no realicen actividades comprendidas en la
 Definición", with the user keeping control and the provider holding no
 custody/administration/disposition powers; art. 2 ii) also carves out
 receiving/delivering AVs **as consideration for one's own products or
 services** at any amount. CONFIRMED (text). Consequence: a genuinely
 non-custodial AR SAS can avoid PSAV registration — but only by giving up
 exactly what CashAbroad is (custody + conversion + digital accounts).
 "Software only" therefore holds for a non-custodial Treazury, and does NOT
 hold for a CashAbroad clone.
5. **Córdoba specifically — plainly: there is no advantage.** Virtual-asset,
 AML and FX regulation in Argentina is federal: the competent organs in
 every instrument read (BCRA, CNV, UIF) are national (CONFIRMED by the
 instrument set itself). No provincial virtual-asset or payment-services
 licence exists in any source read this pass (absence of evidence —
 INFORMATIONAL, stated plainly as none found). Córdoba's only roles are the
 Registro Público de Comercio for the SAS's constitutive/ capital
 inscriptions (RG 1172/2026 art. 10 requires Registro Público inscription
 of capital) and any **provincial tax** incentives, which are not financial
 licensing and were not verified this pass — route to CF + AR counsel; do
 not rely on provincial "tech promotion" folklore.

## 4. Verdict

- **REJECTED (structural claim): an AR SAS in Córdoba cannot realistically
 operate a CashAbroad-equivalent service** (custody + MXN↔USDC conversion +
 digital USD/EUR accounts + supplier payouts) as a lean path: PSAV
 registration is mandatory pre-operation (RG 1172/2026 art. 1), net worth
 USD 150k-class applies (art. 10), every fiat leg must route the MCF
 channel, the penal regime sits in the background, and Córdoba adds zero.
- **PROMISING (narrow slice): an AR SAS as non-custodial software** (own-service
 invoicing possibly in USDC under art. 2 ii), self-custody tooling under
 art. 2 iv)) with licensed MCF/PSAV partners, restricted to merchanting /
 non-AR-origin flows — that is a different product from CashAbroad's, and it
 is already the direction ar/profile.md process delta points to.

## 5. Open questions for licensed AR counsel (see also reply §5)

1. AR-1: Confirm RG 1172/2026 is the operative Capítulo III text and the
 transitional position of pending RG 994/2024/RG 1058/2025 registrations.
2. AR-2: For a non-custodial payment-orchestration platform that never holds
 keys, do RG 1172/2026 art. 2 ii)/iv) keep it outside the PSAV definition,
 and where does art. 4 bis v (participation in issuance/sale-related
 financial services) start to bite a USDC settlement layer?
3. AR-3: For AR residents paying foreign suppliers in stablecoins, which BCRA
 instrument governs and must every leg route through the Mercado de
 Cambios? Current TO consolidated version date and the Sección 7.1 deadline
 table by HS chapter.
4. AR-4: Ley 19.359 exposure quantification for a platform intermediating
 FX-linked crypto operations without an MCF entity.
5. AR-5: Confirm no Córdoba provincial licence or registration substitutes for
 CNV/BCRA; list the Córdoba Registro Público steps for a PSAV-bound SAS
 (art. 10 capital inscription).
6. AR-6: Withholding/IVA on the platform fee; any provincial tax incentive
 actually available to a PSAV/software SAS (coordinate with CF).

## 6. Profile delta from this pass

- `docs/L.D/ar/profile.md` licensing and flow citations updated from RG
 994/2024 to RG 1172/2026 (current text), sources + as_of updated;
 `docs/L.D/global/red-lines.md` item 7 got a supersession note.
