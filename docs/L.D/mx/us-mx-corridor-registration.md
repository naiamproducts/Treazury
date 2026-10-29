---
dept: L.D
scope: mx
kind: research
status: provisional
as_of: 2026-10-27
sources:
 - "MX · Ley Fintech (LRITF) · arts. 22, 26, 30, 32, 45, 110, 124 · https://dof.gob.mx/nota_detalle.php?codigo=5515623&fecha=09/03/2018 (DOF 09/03/2018, text as published; last reform DOF 14-11-2025 touched only art. 102) · read 2026-10-27"
 - "MX · Banxico Circular 4/2019 · Disposiciones 3.a and definitions (Operaciones Internas) · https://www.banxico.org.mx/marco-normativo/normativa-emitida-por-el-banco-de-mexico/circular-4-2019/%7B8D7769AF-03F6-701A-68AA-EF25A73AD035%7D.pdf (DOF 08/03/2019) · read 2026-10-27"
 - "MX · LFPIORPI · art. 17 XVI (reformed DOF 16-07-2025) · DOF decree codigo 5763161, mirror https://sidofqa.segob.gob.mx/notas/docFuente/5763161 · read 2026-10-27"
 - docs/L.D/mx/profile.md (prior verified pass, 2026-10-25)
 - docs/M.D/global/cashabroad-teardown.md (aven, 2026-10-27)
 - aven (19-source appendix), aven (profiles), aven (this memo)
---

# MX — US→MX corridor: when is Mexican registration required?

Decision-support for counsel. Not legal advice; not a binding opinion.
Scope note: every claim below is MX unless tagged. The founder's question is
split into the two legal questions it actually contains: (1) does the US→MX
corridor require a Mexican registration, and (2) what is the minimum structure
that lets it run lawfully.

## 1. What triggers registration under the Ley Fintech — read from the statute

Primary text: DOF 09/03/2018 (codigo 5515623), read 2026-10-27. The latest
reform (DOF 14-11-2025) amended only art. 102 third paragraph (procedure) —
arts. 22/26/30/32 are unchanged since 2018 (CONFIRMED via the reform decree
text and the diputados reform index).

| Trigger | Statute | What it catches | Verdict |
|---|---|---|---|
| Performing, habitually and professionally and via electronic means, the FPE services — opening/controlling e-money accounts (incl. receiving money or Banxico-determined AVs), transferring balances between clients, transferring money/FX/AV between clients and third parties (incl. foreign entities), delivering money/AV against e-money, keeping the account registry | MX · Ley Fintech art. 22 · DOF 09/03/2018 · read 2026-10-27 | "solo podrán prestarse por las personas morales autorizadas por la CNBV ... como instituciones de fondos de pago electrónico" — i.e. only CNBV-authorized **Mexican legal persons** may provide these services | CONFIRMED |
| Operating with virtual assets | MX · Ley Fintech art. 30 · read 2026-10-27 | Only ITFs may operate with Banxico-determined AVs, and only with prior Banxico authorization; AV definition excludes legal tender and divisas | CONFIRMED |
| Custody/control of AVs | MX · Ley Fintech art. 32 · read 2026-10-27 | "custodia y control de activos virtuales = la posesión de las firmas, claves o autorizaciones que sean suficientes para ejecutar las Operaciones" — key control is itself an AV operation | CONFIRMED |
| FX-referenced e-money issuance / FX money transmission | MX · Ley Fintech art. 26 · read 2026-10-27 | FPE issuance in FX or AVs and money transmission in FX require prior Banxico authorization | CONFIRMED |
| Client-facing AV exchange/custody/transmission even BY an authorized institution | MX · Banxico Circular 4/2019 disp. 3.a · DOF 08/03/2019 · read 2026-10-27 | Authorized institutions may only do AV operations that are "Operaciones Internas" (internal to their own client/base operations); operations by which an institution would directly provide clients with "intercambio, transmisión o custodia de activos virtuales" are **ineligible for authorization** | CONFIRMED |
| Acting as an ITF without authorization | MX · Ley Fintech art. 110 · read 2026-10-27 | CNBV may inspect, suspend operations immediately, or administratively close a business presumed to be acting as an ITF without authorization; using "ITF/IFPE"-type naming without authorization: fine 2,000–20,000 UMA + closure until renamed | CONFIRMED |
| Performing reserved ITF operations without authorization | MX · Ley Fintech art. 124 I · read 2026-10-27 | Criminal: prison 7–15 years + fine 5,000–150,000 UMA | CONFIRMED (text) / reach over a fully foreign actor = SUSPICIOUS (no express extraterritorial clause; criminal-territoriality analysis not read this pass — counsel) |
| AV exchange/custody/transfer services to **Mexican citizens from another jurisdiction** | MX · LFPIORPI art. 17 XVI (first paragraph, reformed DOF 16-07-2025) · read 2026-10-27 | Express extraterritorial reach for the AML (Actividad Vulnerable) regime: "incluidas las operaciones que se realicen con ciudadanos mexicanos desde otra jurisdicción". Aviso thresholds: per-client operation ≥ 210× UMA daily value, or fee charged ≥ 4× UMA daily; recordkeeping on originator, receptor and Beneficiario Controlador | CONFIRMED |

**Synthesis (CONFIRMED on text):** the Ley Fintech registration trigger keys to
**the entity that performs the enumerated services toward the public in
Mexico** (arts. 22/26) **or that holds keys/authorisations sufficient to
execute operations** (art. 32) — not to the geographic leg of the money flow as
such. Conversion is not an independent licence head in arts. 22/26/30/32; it is
captured when performed as part of FPE/ITF services or AV operations. Absence
of any general "money transmitter" licence outside FPE in the LRITF text is an
absence of evidence, not a confirmed negative (INFORMATIONAL).

## 2. The three scenarios

### (a) US payer → MXN beneficiary, conversion executed by an already-licensed third party (IFPE/Bitso-class)

- **Treazury: no Ley Fintech registration needed** — CONDITIONAL/PROMISING —
 **if and only if** Treazury (i) never accepts, holds, transmits value or keys
 (no vault, no fee netting — red-lines.md item 10), (ii) does not itself
 provide art. 22 services to the Mexican public, (iii) invoices its fee
 separately. Basis: arts. 22/30/32 bind service providers and key-holders;
 art. 110 targets a person "actuando como ITF sin contar con la
 autorización" — a fact test, not a nationality test. This is textual
 analysis by L.D, not a counsel opinion.
- **The partner must be authorized** — CONFIRMED as a requirement, but the
 partner's actual lawful basis for a **client-facing** USD-stablecoin→MXN
 off-ramp is SUSPICIOUS/unverified: Circular 4/2019 disp. 3.a makes direct
 client-facing AV exchange/custody/transmission **ineligible** even for
 authorized institutions. A bank executing a **pure FX conversion with no
 virtual-asset leg** (SPEI payout) sits outside the AV regime and is the
 cleanest current-text path (`docs/L.D/mx/profile.md` licensedPartnerConversion).
 What a Bitso-class partner actually holds was NOT verified this pass —
 counsel question MX-2.
- **Residual Treazury exposure even with no MX entity:** LFPIORPI art. 17 XVI
 (CONFIRMED extraterritorial clause) — AML padrón/aviso analysis required
 before marketing AV services to Mexican citizens; plus art. 124
 characterization risk (SUSPICIOUS as to foreign reach).

### (b) Treazury itself converts or custodies

- **REJECTED without prior authorization — and probably not achievable as
 designed.** Custody of keys/authorisations = art. 32 test → platformHoldsFunds
 blocked (`docs/L.D/mx/profile.md` flows). Platform conversion = art. 30 AV
 operation requiring Banxico authorization, and Circular 4/2019 disp. 3.a
 makes the client-facing model ineligible for that authorization. So even an
 IFPE + Banxico AV authorization does not currently unlock a CashAbroad-style
 in-house conversion — that is exactly the tension in CashAbroad's own T&C
 ("software only" + custody + self-as-comisionista; teardown §2, verdict
 SUSPICIOUS). Criminal backstop: art. 124 I (7–15 years).

### (c) Treazury is pure software with no Mexican entity

- **Ley Fintech does not reach pure software that performs no reserved
 activity** — CONFIRMED on text (arts. 22/26/30/32 operate on providers and
 key-holders; art. 110 presumes "acting as an ITF"). The Ley Fintech itself
 contains no foreign-platform clause (absence — INFORMATIONAL);
 `docs/L.D/mx/profile.md` licensing.extraterritorial=false stands **for the
 Ley Fintech scope only**.
- **The absence of a Mexican entity is NOT a blanket exemption:**
 1. LFPIORPI art. 17 XVI expressly reaches AV services to Mexican citizens
 from another jurisdiction (CONFIRMED, DOF 16-07-2025) — AML registration
 and avisos regardless of entity domicile.
 2. Whether art. 124 I reaches a fully foreign actor is not express in the
 text — SUSPICIOUS, counsel (criminal territoriality not read this pass).
 3. Serving Mexican residents habitually/professionally could feed an art. 110
 "acting as an ITF" presumption — fact-dependent, counsel.

## 3. Minimum structure for a lawful US→MX corridor (practical)

1. **US-side counterparty entity** (needed anyway for the US leg: FinCEN MSB
 analysis under `docs/L.D/us/profile.md` — MSB status flips if the platform
 accepts or transmits value).
2. **Non-custodial architecture on the MX leg:** no vault, no owner refund key,
 no fee netting; fee invoiced separately to the agency (red-lines.md items
 10–11; mx profile process delta).
3. **Contracted MX rail:** cleanest on current text = bank FX conversion
 (USD wire → MXN SPEI) with **no virtual-asset leg** (mx profile
 licensedPartnerConversion condition). A stablecoin MXN off-ramp requires
 counsel to first identify the partner's lawful basis (Circular 4/2019 3.a).
4. **AML:** OFAC/UN screening before order creation (mx profile sanctions);
 LFPIORPI art. 17 XVI padrón analysis before any AV-facing marketing to MX
 citizens (counsel MX-3).
5. **What it comprises / costs (INFORMATIONAL — no figures verified this
 pass):** partner contract + counsel opinion on partner authorization scope;
 architecture change (already required by red line); AML policies; if the
 founder instead chooses an own MX entity: CNBV IFPE dossier (art. 39-type
 requirements), Banxico AV authorization (Circular 4/2019 Capítulo II),
 governance (art. 59 board rules), capital — months-scale and
 capital-intensive; exact capital/time figures unverified (counsel MX-5).

## 4. Open questions for licensed MX counsel (see also reply §5)

1. MX-1: Does a non-custodial US-side platform that displays an MX beneficiary
 wallet and invoices a separate fee fall within art. 22 when its users are
 Mexican residents? (arts. 22, 110)
2. MX-2: Which Mexican authorization actually covers a third-party-facing
 USD-stablecoin→MXN off-ramp today, given Circular 4/2019 3.a's ineligibility
 rule? What do Bitso-class partners actually hold?
3. MX-3: Does LFPIORPI art. 17 XVI require the US-side entity to register in
 the Padrón de Actividades Vulnerables and file avisos? Thresholds/records?
4. MX-4: Does art. 124 I reach an entity with no Mexican establishment
 operating remotely for Mexican users? (criminal territoriality)
5. MX-5: Minimum capital, timeline and cost of IFPE + Banxico AV
 authorization if the founder chooses an own MX entity.
6. MX-6: Can the MX leg run USD-fiat-only via SPEI with a US payer-of-record —
 any Banxico/CIIS reporting on the beneficiary side? (not researched this
 pass)
7. MX-7: CFDI/withholding/IVA treatment of the platform fee invoiced into
 Mexico. (not researched this pass)

## 5. Profile deltas from this pass

- `docs/L.D/mx/profile.md` aml.citation extended with LFPIORPI art. 17 XVI
 (read 2026-10-27); licensedPartnerConversion condition extended with
 Circular 4/2019 3.a ineligibility; sources + as_of updated.
- `docs/L.D/global/red-lines.md` item 7 (AR) citation note: RG 994/2024
 Capítulo III registration articles superseded by CNV RG 1172/2026 — see
 `docs/L.D/ar/ar-sas-cashabroad-equivalent.md`.
