---
dept: L.D
scope: ar
kind: analysis
status: draft
as_of: 2026-10-28
sources:
 - https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf # BCRA TO Exterior y Cambios al 14/09/2026 (Com A 8481, B.O. 15/09/2026) — read 2026-10-28, extracted /tmp/opencode/trz/t-excbio.txt
 - https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm # Ley 19.359 TO 1995 — read 2026-10-28
 - https://www.bcra.gob.ar/Pdfs/comytexord/A7506.pdf # Com A 7506 (05/05/2022) — read 2026-10-28, extracted /tmp/opencode/trz/a7506.txt
 - CNV RG 1172/2026 (B.O. 15-10-2026) — cited via docs/L.D/ar/ar-sas-cashabroad-equivalent.md
 - CCyC arts. 1666-1673, 1685-1688 (Ley 26.994) — read 2026-10-28 via docs/L.D/ar/fideicomiso-viability.md
 - Decreto DNU 609/2019 art. 1 (subs. art. 1 Decreto 91/2019), art. 3
 - repo: AGENTS.md:202-203 (PA-R5); docs/L.D/global/red-lines.md:57-84; docs/L.D/ar/profile.md:60-70; docs/L.D/ar/regulatory-rent-map.md:46-66; docs/L.D/ar/ar-sas-cashabroad-equivalent.md:74,105-106; docs/F.D/global/corridor-economics.md:152; docs/F.D/ar/ar-counterfactual.md:71
---

# AR — Offshore pre-shipment escrow export flow: legality (A) + 7-claim review (B)

Decision-support for counsel. Not legal advice, not a binding opinion, no
commitment on behalf of Treazury. Binding decisions are FOUNDER decisions
surfaced via the COO. Jurisdiction: Argentina only (the CN limb is
`docs/L.D/cn/profile.md`). Non-lawyer limits: primary texts were read this
pass at section level (cited); no BCRA/CNV administrative practice, entity
guidance ("giros") or case law was reviewed — items marked SUSPICIOUS below
are exactly those.

Citation shorthand: `TO §X.Y.Z` = BCRA TO Exterior y Cambios al 14/09/2026
(Com A 8481, read 2026-10-28; machine-readable extract
`/tmp/opencode/trz/t-excbio.txt:<line>`); `red-line N` =
`docs/L.D/global/red-lines.md`.

---

## Part A — Legality of the flow as pitched

### A.0 The flow as pitched (reconstructed from the founder brief)

1. Offshore escrow holds the foreign buyer's USD (or the escrow holds USDC
 and converts offshore) from pre-shipment payment until the AR exporter's
 `cumplido de embarque` (customs clearance of export), then releases to the
 exporter (possibly via OTC conversion to ARS or USD ingress + MCF sale).
2. A fiduciary/trust-company operator runs the escrow; Treazury provides the
 software/docs layer; an OTC desk supplies crypto↔fiat legs; an Argentine
 bank or *casa cambiaria* handles the FX leg.
3. Rationale pitched: avoid the brecha loss (`6.82%`, F.D figure) by keeping
 the value in USD/USDC offshore until the exporter decides to convert.

### A.1 Component verdicts (PERMITTED / CONDITIONAL / BLOCKED / REJECTED)

| # | Component | Verdict | Basis (primary) |
|---|---|---|---|
| 1 | Hold the buyer's pre-shipment payment offshore from cobro until `cumplido` (no ingress/liquidation meanwhile) | **BLOCKED** | TO §7.1.1 ¶1–2 (`:4694-4712`): ingress + liquidation due within the §7.1.2 table **and**, independently, within **20 días hábiles of fecha de cobro** — "La posibilidad de utilizar este plazo quedará supeditada … al cumplimiento del plazo … 7.1.2" (both cumulative). Pre-shipment payment = anticipos: TO §7.1.3 (`:4817-4821`) keys the same 20 bd to "fecha de cobro o desembolso en el exterior". Max hold = earlier of the two clocks, not `cumplido` |
| 2 | "Wait for the §7.1.2 table (30/60/180/365 d) as the deadline" | **CONDITIONAL** (as outer limit only) | TO §7.1.2.1–7.1.2.6 (`:4725-4813`): 30/60/60-related/365/180-default/365-Exporta Simple days **computed from fecha del cumplido de embarque otorgado por la Aduana** — an outer cap, never a right to keep proceeds outside the market (`t-excbio.txt:4756`, `:4809`) |
| 3 | USDC receipt as export-surrender discharge | **BLOCKED** | red-line 5 (`red-lines.md:57`, CONFIRMED); TO §7.1.1 requires divisa ingress + MCF liquidation; crypto counts as *activo externo líquido*, not as divisa (TO §3.16.2.1, `:2635`) |
| 4 | Treazury itself as escrow/trustee or wallet holder | **REJECTED** | Hard rule PA-R5 "No custody": never platform wallets, passthroughs, or structures that hold USDC (`AGENTS.md:202-203`); red-line 21 (`red-lines.md:71`) forbids presenting structures as BCRA-evasion; `docs/L.D/ar/ar-sas-cashabroad-equivalent.md:36` |
| 5 | Third-party licensed fiduciary as escrow operator | **CONDITIONAL** | Fideicomiso financiero requires express legal authority and a BCRA/CNV-authorized fiduciary (CCyC art. 1673 ¶2; `fideicomiso-viability.md:93-108`); fiduciary holding USDC for clients collides with PA-R5 for *our* product even if lawful for them — software-to-licensed-operator (no keys, no signing, no oracle) is the only shape that stays inside the product red lines |
| 6 | Escrow operator needs a licence | **CONDITIONAL** (precondition) | Intermediation/custody of crypto for third parties = PSAV; RG 1172/2026: registration **before operating** (art. 1), minimum net worth USD 150,000 for cats 1/2/4 (art. 10), Registro Público inscription (art. 10) — `ar-sas-cashabroad-equivalent.md:105-106`, `fideicomiso-viability.md:126-136`. Cat 4 (custody + admin) if it holds assets; Cat 1 if it intermediates |
| 7 | OTC desk: crypto↔crypto / crypto↔ARS as PSAV | **CONDITIONAL** | CNV PSAV registration (RG 1172/2026); the **peso↔USD FX leg is reserved**: every FX operation must run through a BCRA-authorized entidad financiera/cambiaria (TO §1.1, `:297`; Decreto 260/2002 art. 1) — a PSAV cannot borrow a bank's FX licence. `red-lines.md:57-66` bars fee netting and settling without MCF liquidation |
| 8 | Piggy-back FX on a bank's licence / negotiate FX outside §1.1 entities (incl. OTC desks doing change) | **REJECTED** | Ley 19.359 art. 1 a) — FX negotiation outside authorized entities is the core criminal type; art. 2 a)/e)/f) fines ×10, 10-year ban, directors *solidaria*; TO §1.5 (`:318`) points at the Ley Régimen Penal Cambiario. See `fideicomiso-viability.md:71` |
| 9 | Offshore collateral / offshore crypto left in the exporter's name as "asset" (escrow reuse) | **CONDITIONAL → BLOCKED if evasion-purpose** | TO §1.9 Relevamiento de activos y pasivos externos is required "incluso cuando no se haya producido un ingreso de fondos al mercado de cambios" (`:341-345`); TO §3.10 (`:2001`) prior-BCRA conformity for *formación de activos externos* (jurídicas/fideicomisos/universalidades); TO §3.16.3 conformity-or-sworn-statement (`:2751`) and §3.16.3.2 vii) `:2819` (no local funds against foreign crypto/títulos for 90 days); red-line 21 (`red-lines.md:71-84`) |
| 10 | Keeping proceeds abroad because the sale is through a zona franca | **UNVALIDATED / default BLOCKED** | No export-liquidation carve-out for zona francas found in TO §§2.7, 7.1, 7.5 on this pass (absence of provision = INFORMATIONAL); the ZFI exemptions referenced in the brief are import-side (TO §10.2.5). Counsel must confirm before any such claim |
| 11 | Documents released "inmediato/minutos" on payment | **REJECTED** | TO §8.4.1 (`:6524`, docs-gate paragraph `:6537-6541`): commercial documentation is *requisito excluyente* for the certificación de cumplido; discharge exists only when the nominated entity certifies (TO §7.1.1 ¶4); red-line 2, red-line 7 (`red-lines.md:41,64`) |

### A.2 The clock that kills the design (the core finding)

- **CONFIRMED — two cumulative deadlines, both mandatory.**
 (i) §7.1.2 table (30/60/180/365 days) measured from the **cumplido de
 embarque** (`t-excbio.txt:4725-4813`); (ii) **20 días hábiles from fecha de
 cobro** for *every* export collection, "independientemente de los plazos
 máximos fijados" (`t-excbio.txt:4703-4712`), and for advances/prefinancing
 the same 20 bd from "fecha de cobro o desembolso en el exterior"
 (`:4821-4827`). Effective ingress+liquidation deadline = the **earlier** of
 the two. A pre-shipment escrow therefore buys at most ~20 business days
 from the buyer's payment — holding USDC/USD offshore until the cumplido
 (typically 30–180 days later) **breaches** the TO for a legal-person goods
 exporter.
- **CONFIRMED — discharge is certification, not possession.** "La obligación
 … se considerará cumplida cuando la entidad haya certificado tal situación"
 (§7.1.1 ¶4, `:4708-4712`), via the nominated entity (§8.2, `:6464`) and the
 SECOEXPO system (§7.1.1 ¶3).
- **SUSPICIOUS — "fecha de cobro" inside an escrow.** Whether the clock runs
 from the escrow deposit or from release to the exporter is not resolved by
 the text read; a conservative reading (earliest date funds are at the
 exporter's disposal in an account attributable to it, incl. offshore
 accounts of the exporter) must be assumed until counsel confirms
 (open question Q1).
- **SUSPICIOUS — the "20-day documentation extension" framing.** The TO
 contains **no documentation prórroga of 20 bd**. Documentation is the
 *gate* of certification (§8.4.1 `:6524`, `:6537-6541`), with vencimiento =
 cumplido + §7.1.2 table (§8.4.2 `:6543-6551`), certification enabling
 ARCA payments (§8.4.4 `:6623-6632`), and denuncia de incumplido within
 **10 bd** of expiry (§8.4.5 `:6633-6641`). The 20-bd figure is a
 substantive money-movement deadline, not a paperwork window.

### A.3 What is lawfully available instead (the conditional path)

- **§7.5 extensions** (§7.5.1 destination minimum financing term; §7.5.2
 pre/post-financing liquidated in the MCF; §7.5.3 funds retained in
 associated accounts to the 5th business day; §7.5.4 related parties;
 §7.5.5 revisable prices; §7.5.6/7.5.7 regime-specific) — `:5157-5300`.
 None of them is "hold crypto offshore"; each requires either prior MCF
 liquidation or an enumerated circumstance granted by the tracking entity.
- **§7.4 other imputations** (§8.5 situations) — `:5140`.
- **§7.9/7.10 + §9 tracking** of anticipos/prefinancing: nominated entity,
 certificaciones de aplicación (§9.3.1 `:7395`), genuineness of the
 financing documented.
- **§2.7 conditional non-liquidation** for services-type receipts — but only
 if funds sit in **local** FX accounts of the client or local correspondent
 accounts and are applied to permitted FX-access operations, fiscally
 neutral, with sworn statement (`:702-740`) — it does **not** authorize
 offshore crypto retention.
- **§7.1.5 natural persons**, **§2.2.2.2/§2.6.1 knowledge economy** (30% cap,
 special account), **§14.1 RIGI VPU** — narrow, client-specific; none of
 them fits a corporate goods exporter using escrow as pitched.

### A.4 Penalty exposure if the escrow runs as pitched

- **Ley 19.359 art. 1 a)** — FX negotiation outside §1.1 entities;
 **art. 1 e)/art. 10** — divisa operations not liquidated ("divisas omitidas
 de liquidar"): fine equivalent to the omitted amount + up to 10-year
 exclusion from the market; **art. 17** — BCRA may block customs clearances;
 **art. 2 a)/e)/f)** — fraud-type aggravations, fines ×10, directors'
 solidary liability (i.e., Treazury-signer founders if the company acts)
 (infoleg Ley 19.359, read 2026-10-28; repo transcriptions
 `red-lines.md:78-84`, `fideicomiso-viability.md:71`).
- **TO §1.5** — breaches hit by the Ley Régimen Penal Cambiario (`:318`).
- **TO §8.4.5** — denuncia de incumplido within 10 bd after expiry (`:6633`);
 §8.4.4 ties certification to ARCA release (`:6623`).

### A.5 Restructured flow (the CONDITIONAL shape)

1. Buyer pays; escrow (licensed third party, never Treazury) releases ≤20 bd
 from cobro → **or** the deal is documented from day one as export
 financing under §7.9/§9 with §7.5.2 extension machinery — pick one; "hold
 to cumplido" is not on the menu.
2. Ingress + MCF liquidation executed through the exporter's nominated
 entity (bank or casa cambiaria, §8.2); certification via SECOEXPO.
3. Treazury = software + commercial documents only: no wallets, no
 passthrough, no signing, no fee netting from collections (PA-R5;
 red-lines 5/6/7).
4. Crypto↔fiat conversion: PSAV-authorized intermediary for the crypto leg;
 the peso↔USD leg only at an entity authorized in TO §1.1 (`:297`).
5. Compliance payloads: Relevamiento (§1.9 `:341`), conformity/sworn
 statement for external-asset movements (§3.16.3 `:2751`), no peso payment
 against a crypto-delivery promise (§3.16.3.2 vii `:2819`).

**Overall flow verdict: CONDITIONAL** (as restructured above) — **BLOCKED**
as pitched (component 1), **REJECTED** in its Treazury-as-trustee variant
(component 4).

### A.6 Founder decisions (surfaced via COO — not decided here)

1. Accept the ≤20-bd release window (or fund the §7.5/§9 documentation
 machinery), i.e., drop "hold until cumplido" as a product promise.
2. Choose the escrow operator path: licensed third-party fiduciary/PSAV with
 Treazury as pure software (PA-R5-compliant) vs. abandon escrow for the AR
 corridor.
3. Decide whether AR export corridors ship at all before an OTC/bank partner
 is contracted (red-line 2: no named rails/partners before contract).

---

## Part B — 7-claim review

Provenance: claim wording is reproduced from the founder brief carried in
session context; no repo artifact contains it, so the **texts are
INFORMATIONAL** as to verbatim wording. Verdicts below are mine, from
primary sources read 2026-10-28. Vocabulary: VALIDATED / PROMISING /
UNVALIDATED / REJECTED for the compliance claim; sub-findings use
CONFIRMED / SUSPICIOUS / INFORMATIONAL.

| # | Claim (brief) | Verdict in brief | Verdict now | Basis |
|---|---|---|---|---|
| 1 | Export collections can be immobilized offshore until `cumplido`; deadlines 30/60/180/365 days; "Inmediato/Minutos" does not apply | SUSPICIOUS | **REJECTED** (as an entitlement) | Table CONFIRMED as an **outer** limit from cumplido (TO §7.1.2 `:4725-4813`), but the 20-bd-from-cobro rule is cumulative and earlier (§7.1.1 `:4703`, §7.1.3 `:4821`) → no right to hold until cumplido. The "no inmediato" half is CONFIRMED (certification gate §8.4.1 `:6524`; red-line 2) |
| 2 | 100% of collections liquidated at the official rate; "no aplica: ninguna (excepción)" | REJECTED | **REJECTED** as stated; **CONFIRMED** that the duty binds the target client (AR legal-person goods exporter) | Duty: §7.1.1 `:4694` + Decreto 609/2019 art. 1; rate = libremente pactado in the MCF (§1.3, `regulatory-rent-map.md:66`), not a fixed "oficial" price. Exceptions exist: §7.1.5 natural persons, §2.2.2.2/§2.6.1 knowledge economy (30% cap), §2.7 conditional, §14.1 RIGI VPU → "total/no-exception" is false |
| 3 | Escrow offshore mitigates the 6.82% breach loss for exporters | SUSPICIOUS | **REJECTED** | As a *lawful* mitigation it fails: keeping the proceeds offshore beyond 20 bd breaches §§7.1.1/7.1.3 (A.2), so the "saving" is the penalty target of Ley 19.359 art. 10 + red-line 21. The 6.82% itself = F.D measurement, refreshed to 7.24–7.45% on 2026-10-27 (`corridor-economics.md:152`; `ar-counterfactual.md:71`) |
| 4 | 20 días hábiles = prórroga para documentación, not a substantive limit; "riesgo cero" | SUSPICIOUS | **REJECTED** | §7.1.1 ¶2 and §7.1.3 make 20 bd a **money-movement deadline** (ingress+liquidation), "independientemente de los plazos máximos"; no documentation-prórroga of that shape exists in the TO text read. "Cero riesgo" REJECTED: §§1.1/7.1 + Ley 19.359 + §8.4.5 denuncia (A.4). Documentation is the certification *gate* (§8.4.1 `:6537-6541`), vencimiento at cumplido+table (§8.4.2 `:6543`), denuncia 10 bd (§8.4.5 `:6633`) |
| 5 | The 6.82% loss is legally mandatory and non-avoidable; "no aplica: ninguna" | REJECTED | **REJECTED** as literal; **CONFIRMED** in substance for the default client | There is no legal figure "6.82%" — it is an F.D model output (brecha refreshed 7.24–7.45%, `corridor-economics.md:152`). What *is* mandatory: liquidation of the contravalor in the MCF for legal-person goods exporters (§7.1.1; Decreto 609/2019 art. 1) → the conversion cost is unavoidable **unless** an enumerated exception (A.3) applies; "ninguna excepción" is false |
| 6 | China: crypto settlement/liquidation of exports is banned (wallet/entity prohibition) | (carried) | **VALIDATED** (strengthened, with a supersession correction) | 银发〔2026〕42号 (PBoC+7 agencies, 2026-02-06, pbc.gov.cn, read this pass): onshore fiat↔VC exchange and VC business = illegal financial activity, "境外单位和个人不得以任何形式非法向境内主体提供虚拟货币相关服务"; VC barred as collateral; **expressly repeals 银发〔2021〕237号** — any briefing citing the 2021 notice as current is stale. Plus 外汇管理条例 arts. 39/40/45/46 (gov.cn, read this pass). Full analysis: `docs/L.D/cn/profile.md` |
| 7 | OTC/platform can buy USD "inmediato" (minutes) for the exporter; "no aplica: ninguna" | (carried) | **REJECTED** (legal claim) / **INFORMATIONAL** (settlement practice) | No minutes-scale legal settlement exists for AR exports: discharge = nominated-entity certification after commercial docs (§8.4.1 `:6537-6541`, §7.1.1 ¶4); FX ops only via §1.1 entities (`:297`); red-lines 2 and 7. An OTC buying USD "instantly" with its own balance is a commercial accommodation whose FX leg still lands in the §1.1/§7.1 chain — and any *advance* of export proceeds must itself be a documented §9 operation |

### Claim-level notes

- Rows 1/4/5 interact: the brief's "escrow is legal because of the 20-day
 rule" collapses into REJECTED — the 20-day rule is precisely the deadline
 the escrow design violates.
- Row 6 is the one claim that survives review **better** than briefed — but
 only against the **2026** notice, not the repealed 2021 one.
- Row 7's "inmediato" exclusion is right for a *claim*; actual OTC USD
 acquisition speed is market practice, not a legal status — do not put it
 in copy (red-line 2).

---

## Evidence index & limits

- Primary AR text: `t-excbio.txt` lines — §1.1 `:297`, §1.3 `:312`, §1.5
 `:318`, §1.9 `:341`, §2.7 `:702`, §3.10 `:2001`, §3.16.2.1 `:2635`,
 §3.16.3 `:2751`, §3.16.3.2 vii `:2819`, §4.1.4.5 `:3479`, §7.1.1 `:4694`,
 §7.1.2 `:4725` (180-day default `:4809`), §7.1.3 `:4817`, §7.4 `:5140`,
 §7.5 `:5157`, §8.2 `:6464`, §8.4.1 `:6524`, §8.4.2 `:6543`, §8.4.4
 `:6623`, §8.4.5 `:6633`, §9.1 `:7309`, §9.3.1 `:7395`.
- Repo anchors: PA-R5 `AGENTS.md:202-203`; red-lines 1/2/5/6/7/21
 `red-lines.md:35,41,57,62,64,71`; AR deadline profile
 `docs/L.D/ar/profile.md:60-70`; rent map `regulatory-rent-map.md:46-66`.
- Non-lawyer flag: this is decision-support. Open questions Q1 (fecha de
 cobro inside escrow), zona-franca absence, and any PSAV-category call are
 for a licensed Argentine attorney; verdicts above are analysis, never a
 binding commitment (FOUNDER decisions via COO).
