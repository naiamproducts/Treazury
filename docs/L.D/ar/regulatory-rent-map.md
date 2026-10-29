---
dept: L.D
scope: ar
kind: research
status: provisional
as_of: 2026-10-28
sources:
 - "AR · BCRA TO Exterior y Cambios, texto ordenado al 14/09/2026, última comunicación incorporada A 8481 · §§1.1–1.8, 5.5–5.7, 6.7, 7.1.1–7.1.5, 8.2, 15.1–15.2 · https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf · read 2026-10-28 (pdftotext extraction; section version stamps cited inline)"
 - "AR · Decreto DNU 609/2019 art. 1 (substituted by art. 1 Decreto 91/2019) + recitals · https://www.argentina.gob.ar/normativa/nacional/decreto-609-2019-327566/actualizacion · read 2026-10-28"
 - "AR · Ley de Régimen Penal Cambiario TO 1995 (Ley 19.359 y modif., aprobado por Decreto 480/95) arts. 1, 2, 4, 5, 10–13, 15, 17 · https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm · read 2026-10-28"
 - "AR · Decreto 260/2002 arts. 1–2 (art. 1 substituted by art. 132 Ley 27.444), transcribed in BCRA TO Exterior y Cambios §15.1–15.2 · read 2026-10-28"
 - "AR · BCRA Comunicación 'A' 6780/2019 (export liquidation deadlines, origin of the 15/30/180-day table, now superseded in the current TO) · https://www.argentina.gob.ar/normativa/nacional/comunicaci%C3%B3n-6780-2019-328568/texto + BBVA summary https://www.bbva.com.ar/content/dam/public-web/argentina/documents/actualidad-normativa/Com%20A%206780.pdf · read 2026-10-28"
 - "AR · BCRA Comunicación 'A' 8230 (16/04/2025, addressed 'A LAS ENTIDADES FINANCIERAS, A LAS CASAS DE CAMBIO'; repatriation conditioned on certification by a local financial entity) · https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8230.pdf · read 2026-10-28"
 - "AR · BCRA Comunicación 'A' 8303 (Sistema Nacional de Pagos, Sección 5 'billetera digital' — PSPs are a payments category, not FX authorization) · https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A8303.pdf · read 2026-10-28"
 - "AR · BCRA press release 'Inicio de la Fase 3 del Programa Económico con flexibilización cambiaria y flotación entre bandas' (11/04/2025) · https://www.bcra.gob.ar/noticias/inicio-de-la-fase-3-del-programa-economico/ · read 2026-10-28"
 - "AR · BCRA communiqué of 30/09/2025 as verbatim-quoted by La Nación, TN, Telefe, Chequeado ('únicamente los bancos y las casas de cambio pueden canalizar operaciones de moneda extranjera. No está permitido tercerizar las operaciones'); BCRA president Santiago Bausili on-record (A24) · https://www.lanacion.com.ar/economia/ruido-en-el-mercado-luego-de-que-una-billetera-virtual-dejo-de-vender-dolar-oficial-nid30092025/ ; https://chequeado.com/el-explicador/billeteras-virtuales-sin-dolar-oficial-preguntas-y-respuestas-para-entender-los-cambios-en-la-compra-y-venta-de-la-divisa/ · read 2026-10-28 (press-reported communiqué; primary grounding is TO §1.1/§8.2)"
 - "AR · Banco de la Nación Argentina published cotizaciones + tariff tables, bna.com.ar/Personas (rates dated 27/10/2026: billetes USD 1510/1560; divisas reference 1529.0000/1538.0000) · https://www.bna.com.ar/Personas · read 2026-10-28"
 - "AR · CNV RG 1172/2026 + Ley 25.246 art. 4 bis (PSAV definition incorporated by Ley 27.739) — prior verified pass 2026-10-27 (aven; docs/L.D/ar/ar-sas-cashabroad-equivalent.md), recitals/arts not re-read"
 - "AR · BCRA TO Régimen Disciplinario (Leyes 21.526/25.065) y sumarios Ley 19.359, texto ordenado al 27/03/2026 — RPC reference for casas/agencias de cambio under TO Operadores de Cambio (§2.4.2) · https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-rdbcra.pdf · excerpt read 2026-10-28"
 - docs/L.D/ar/profile.md; docs/L.D/ar/ar-sas-cashabroad-equivalent.md; docs/L.D/global/{flow-matrix,red-lines}.md; aven / /
 - F.D cost-counterfactual components: aven (task todo; referenced, not read)
---

# AR — Regulatory rent map: which instruments create the mandatory channel

Institutional/legal analysis for the founder's strategy question ("setting the
law aside — what would a crypto-dollar payment rail improve, and which AR rules
benefit banks?"). Decision-support for counsel. **Not legal advice**; every
binding commitment is a founder decision surfaced via the COO. Jurisdiction:
Argentina (federal — BCRA, CNV, ARCA/UIF are national organs; nothing here
turns on provincial law). The F.D runs the cost counterfactual in parallel
(aven); this document does no pricing math.

Standing-order note: the brief pinned `as_of: 2026-10-27`; the underlying
primary sources were read on 2026-10-28 and are stamped as read. Per
`docs/C.O/global/info-architecture.md` Rule 0, `as_of` = date facts were
verified, so the header carries 2026-10-28.

## 1. Bottom line

- **CONFIRMED — the mandatory channel is real, statutory, and narrow.** Every
 FX operation in Argentina must have a BCRA-authorized *entidad financiera o
 cambiaria* intervene (BCRA TO Exterior y Cambios §1.1, version Com A 8307
 vig. 26/08/2025, read 2026-10-28); the legal market itself is *constituted
 as* operations "realizadas por las entidades financieras y las demás personas
 autorizadas por el BCRA" (Decreto 260/2002 art. 1, replaced by Ley 27.444
 art. 132, transcribed at TO §15.1).
- **CONFIRMED — export proceeds cannot bypass the channel.** Export collections
 must be ingressed AND liquidated in the FX market within category deadlines
 (Decreto 609/2019 art. 1 as amended by Decreto 91/2019; TO §7.1.1–7.1.2,
 current version Com A 8481 vig. 15/09/2026: 30/60/180/365 calendar days by
 HS position plus an independent 20-business-day limit from the collection
 date), and discharge is *certified by the entity the exporter nominates*
 under SECOEXPO — eligible nominators are "todas las entidades financieras y
 casas de cambio" (TO §8.2, Com A 8481).
- **CONFIRMED — the conversion rate is legally free, so the spread is a
 commercial rent the law protects rather than a state-set fee.** FX operations
 are "realizadas al tipo de cambio que sea libremente pactado entre las
 partes" (TO §1.3; Decreto 260/2002 art. 2 at TO §15.1). No statutory spread
 cap was found in any instrument read this pass. The authorized institution
 keeps whatever bid/ask the market bears, and the penal regime backs the
 exclusivity of the venue where that quote is given (TO §1.5 → Ley 19.359).
- **CONFIRMED — the penal regime protects the regime *and* the channel, both
 by its terms.** Ley 19.359 TO 1995 art. 1 a) criminalizes "toda negociación
 de cambio que se realice sin intervención de institución autorizada";
 art. 1 e) punishes operations not done at the rate/deadlines/conditions set
 by the rules; art. 10 measures "las divisas omitidas de liquidar o
 incorrectamente liquidadas en el mercado"; art. 15 sends fines and forfeited
 amounts *to the BCRA*; art. 17 lets the BCRA refuse FX authorizations and
 block customs clearance (despacho a plaza / boletas de embarque). The text
 supports both the public-interest reading (reserve/tax enforcement) and the
 channel-exclusivity reading; they are bundled, not separable, in the words
 of the statute.
- **CONFIRMED — a crypto (PSAV) layer adds a regulated party without
 displacing the bank layer.** CNV registration (RG 1172/2026, prior read
 2026-10-27) governs the virtual-asset leg; every fiat leg remains an FX
 operation under TO §1.1, which only banks and casas de cambio may execute —
 reinforced by the BCRA's 30/09/2025 position that "únicamente los bancos y
 las casas de cambio pueden canalizar operaciones de moneda extranjera. No
 está permitido tercerizar las operaciones" (press-reported BCRA communiqué;
 primary grounding TO §1.1/§8.2). PSPs/billeteras are a *payments* category
 (Com A 8303), not FX authorization.
- **INFORMATIONAL — Banco de la Nación Argentina benefits as a member of the
 authorized class plus a small set of statutory-adjacent roles; no
 BNA-specific FX privilege and no public evidence of its export-liquidation
 pricing was found this pass.** What IS public: BNA publishes its own
 cash-FX bid/ask (USD billetes 1510/1560 on 27/10/2026 ≈ 3.2% retail
 spread; bna.com.ar/Personas, read 2026-10-28) and a wholesale reference
 (divisas 1529/1538 ≈ 0.6%, expressly "a fines informativos"). Ley 19.359
 TO art. 4 historically used the BNA "tipo vendedor" as the statutory
 conversion reference for penalties (update mechanism partly derogated —
 Ley 23.928 art. 13, noted in the text itself).

## 2. Instrument table — what each one obligates, who is the authorized party, where margin may accrue

| # | Instrument (version read) | What it obligates | Authorized/paying/intermediating party BY LAW | Where margin can legally accrue | Verdict |
|---|---|---|---|---|---|
| 1 | **Decreto DNU 609/2019 art. 1** (substituted by Decreto 91/2019, B.O. 28/12/2019) + **BCRA TO §7.1.1–7.1.2** (Com A 8481, vig. 15/09/2026) | Export contravalor must be ingressed into AR and negotiated/liquidated in the FX market within BCRA-set conditions and deadlines (30/60/180/365 calendar days by HS chapter; independent 20 business days from *fecha de cobro*; natural-person carve-out at §7.1.5 requires ingress in time + funds parked in a local financial entity's FX account + fiscal neutrality) | The exporter is the debtor of the duty; discharge requires an FX-market operation with a TO §1.1 *entidad* and certification by the SECOEXPO-nominated entidad (§7.1.1 last-but-two ¶; §8.2: eligible = financial entities and casas de cambio that have not opted out of foreign trade) | The liquidation leg itself: conversion at a freely pactado rate (TO §1.3) → bid/ask spread of the executing entity; account fees on the mandatory local FX account (§7.1.5 ii); certification/operational fees — no public tariff found | **BENEFIT-TO-CHANNEL** (the duty manufactures mandatory, deadline-bound volume for the authorized class; the spread is uncapped by design) |
| 2 | **MCF constitution: Decreto 260/2002 arts. 1–2** (art. 1 replaced by Ley 27.444 art. 132) at **TO §15.1**; **TO §1.1–1.8** (Com A 8307, vig. 26/08/2025) | Establishes the mercado libre de cambios as the venue for FX ops, conducted by financial entities and other BCRA-authorized habitual traders; every op in the market requires an authorized *entidad financiera o cambiaria*; the entity must verify genuineness and correct classification; one boleto per op; client ID + BCRA registration; prior consultations to BCRA only *through* an authorized entity (§1.8) | Entity types by law: entidades financieras (Ley 21.526 authorization, BCRA-supervised) and entidades cambiarias/casas y agencias de cambio (BCRA Operadores de Cambio regime, RPC/patrimonio requirement referenced in TO Régimen Disciplinario §2.4.2). Becoming authorized = statutory BCRA authorization (banks) or BCRA exchange-operator registry (casas de cambio). Billeteras/PSPs are NOT in the MULC class (BCRA 30/09/2025 position, press-reported; TO §1.1 primary) | Any FX conversion for residents: freely pactado spread (TO §1.3). Public evidence of an exercised spread: BNA billetes 1510/1560 (≈3.2%), bna.com.ar/Personas read 2026-10-28. Export-leg/wholesale spreads: **no public evidence** (bilateral) | **BENEFIT-TO-CHANNEL** (the exclusivity is the instrument; this is the core rent-creating rule) |
| 3 | **Ley 19.359 TO 1995** (Decreto 480/95; read infoleg texact 2026-10-28) | Penalizes: FX negotiation without an authorized institution (art. 1 a); operating unauthorized (1 b); false declarations (1 c–d); operations not at the quantity/currency/rate/deadlines/conditions of the rules (1 e); catch-all infringement (1 f). Sanctions: fine up to 10× the operation (art. 2 a); prison on recidivism (2 b–c); suspension/cancellation of FX authorization and 10-year disqualification as importer/exporter/intermediary (2 e); corporate solidaria liability (2 f). BCRA investigates (art. 5) and quantifies "divisas omitidas de liquidar o incorrectamente liquidadas" (arts. 10–13, incl. transfer-price-style presumptions in art. 13). Fines + forfeited values **enter the BCRA** (art. 15). Precautionary measures: refuse FX authorizations, refuse customs despachos/boletas de embarque, suspend registry inscriptions (art. 17 a) | Enforcer: BCRA (sumario), with judicial escalation (arts. 8–9, 16). The protected object, by the text of art. 1 a) and 1 f), is intervention of an *authorized institution* in every negotiation | Direct fiscal stream: fines/forfeits to BCRA (art. 15). Indirect: the penalty threat is what makes the authorized channel non-bypassable, preserving the spread base of instrument 1–2. Art. 4 historically used the **BNA tipo vendedor** as the statutory conversion reference (update mechanism partly derogated, Ley 23.928 art. 13 — current operative force not verified) | **BENEFIT-TO-CHANNEL (exclusivity + fiscal-to-BCRA function) / NEUTRAL-PROTECTIVE (anti-fraud provisions 1 c–d; anti-avoidance presumptions art. 13)** — mixed by design; both readings are textual |
| 4 | **BCRA TO §§5.5–5.7 (Com A 8307) and §6.7** (settlement/correspondent architecture) | Inbound international transfers are received in the **local entity's cuenta de corresponsalía**; the beneficiary must be notified within 1 business day and the funds put at their disposal "para la concertación de cambio o para su acreditación en cuentas en moneda extranjera abiertas en una entidad financiera local" (§5.6); retransfers only out of that correspondent account once required originator/beneficiary data is complete (§5.5.3); incomplete transfers stay pending FX liquidation (§5.5.4); every FX op is registered with the BCRA (§5.7); entities' external liquid assets are measured net of correspondent balances from FX operations (PGC, §6.7) | The only party that holds the nostro/correspondent relationship and the receiving account is a BCRA-authorized local entity. Foreign correspondent banks appear only as that entity's counterpart, under private bilateral contracts | (i) conversion spread on the inbound leg (TO §1.3, freely pactado); (ii) nostro float on funds parked between credit and payout — lawful, magnitude not public (INFORMATIONAL); (iii) account/commission tariffs (BNA publishes some per-item FX-adjacent charges, e.g. USD 3.60 debit-card use abroad — bna.com.ar/Personas read 2026-10-28); (iv) correspondent fees charged by foreign banks under bilateral agreements — private terms, **no public evidence** | **BENEFIT-TO-CHANNEL (structure: mandatory funnel through local authorized entities) / PROTECTIVE (§5.5 data-completeness rules serve AML/Travel-Rule-style integrity)** |
| 5 | **CNV RG 1172/2026** (B.O. 15-10-2026; arts. 1–2, 4, 6, 9–10 read 2026-10-27, aven) + **Ley 25.246 art. 4 bis PSAV definition** (incorporated by Ley 27.739) | AR-resident legal persons performing PSAV activities must register with CNV **before** operating; no volume carve-out for legal persons; minimum net worth USD 35k–150k by category (halved under USD 2.5M volume); foreign operators must register and constitute a local company/branch; mandatory on-site registration legend | Registrar: CNV. The instrument does **not** grant any FX competence: a PSAV's fiat legs remain TO §1.1 FX operations executable only by banks/casas de cambio. A vertically integrated operator needs BOTH authorizations; the Sep-2025 episode shows even BCRA-regulated PSPs were kept out of the MULC (press-reported BCRA communiqué; Com A 8303 defines billetera digital as a payments service) | No bank spread is created by RG 1172 itself; it adds a compliance-cost layer (registration, net worth, reporting). The combined stack (CNV + BCRA) preserves the bank layer's conversion margins because crypto registration never substitutes for MCF authorization | **PROTECTIVE (stated purpose: AML/FATF, investor/consumer protection, market integrity — recitals per prior read)** — with the structural effect that it **stacks** a regulated party on top of, not instead of, the bank layer (CONFIRMED mechanism) |

## 3. The steelman — what each instrument is genuinely for

Honest statement of the public-interest case a regulator would make, from the
instruments' own recitals and the BCRA's own publications:

1. **Decreto 609/2019 — reserves, volatility containment, macro anchor.** Its
 own CONSIDERANDO cites "medidas extraordinarias tendientes a asegurar el
 normal funcionamiento de la economía", "una administración prudente del
 mercado de cambios", "reducir la volatilidad de las variables financieras y
 contener el impacto de oscilaciones de los flujos financieros sobre la
 economía real", and the BCRA's Carta Orgánica art. 29 inc. b mandate to rule
 the FX regime; art. 3 expressly targets *evasion* of the measure through
 public bonds or other instruments (read 2026-10-28). Critically, the BCRA
 kept the export-ingress deadlines through the April-2025 liberalization:
 "Los plazos de ingreso de divisas al MLC por exportación de bienes y
 servicios no se verán modificados" (BCRA, Fase 3 release, 11/04/2025). So
 the surrender channel is not a leftover of the cepo — it is the part of the
 regime the current administration deliberately preserved while removing
 personal-access restrictions, for reserve-visibility and inflation-anchor
 reasons (same release: "objetivo prioritario de reducir la inflación",
 "reservas de libre disponibilidad que respaldan el programa económico").
2. **MCF exclusivity (Decreto 260/2002 + TO §1.1) — control, traceability,
 consumer/depositor protection.** A single authorized gateway is how the
 BCRA observes every FX flow (registration §5.7, boletos §1.4, genuineness
 checks §1.2), enforces AML rules (§1.7), and supervises the institutions
 that hold client money. The BCRA's post-decision communiqué of 30/09/2025
 frames the wallet exclusion as *enforcing existing law*, not new policy
 (press-reported; Bausili on-record). Regulator's honest argument: an
 unobserved FX market in Argentina's monetary history is a capital-flight
 and tax-evasion channel; exclusivity is the observability mechanism.
3. **Ley 19.359 — teeth for the above.** A penal regime without an
 exclusivity rule would still punish fraud (arts. 1 c–d) and misinvoicing
 (art. 13 presumptions map to transfer-pricing-style abuse of export/import
 prices). The parts that protect the channel as such (art. 1 a, 1 e, 1 f)
 exist because BCRA administrative rules alone could not stop off-market
 negotiation. Fines entering the BCRA (art. 15) fund the enforcer rather
 than the general treasury — consistent with an institutional (not purely
 fiscal) rationale.
4. **Settlement/correspondent rules (TO §5.5–5.7) — AML and payment
 integrity.** The data-completeness and hold-pending-data rules implement
 originator/beneficiary information requirements (Travel-Rule-style); the
 1-business-day notification duty (§5.6) is a consumer-protection norm.
 The nostro funnel is the by-product of building those controls on top of
 the supervised-bank layer.
5. **PSAV registration (RG 1172/2026 / Ley 27.739) — AML/FATF and investor
 protection for a previously thin crypto-asset market.** Prior read
 (2026-10-27): registration-before-operating, net worth floors, public
 legend, extraterritorial nexus tests. Nothing in it grants FX competence —
 it is complementary supervision, not a substitute for the FX channel.

**Synthesis — who is the primary beneficiary of each instrument?**

| Instrument | (a) public/fisc/monetary authority | (b) authorized FIs as a class | (c) both, (b) as by-product | Honest call |
|---|---|---|---|---|
| Decreto 609/2019 + TO §7.1 | Reserve/BOP visibility is the stated end | Recurring forced volume + uncapped spread | — | **(a) primary; (b) real and structural** — the spread is a by-product of the channel design, and the state does not itself capture it |
| MCF exclusivity (Dec. 260/2002, TO §1.1) | Observability/AML/supervision | The exclusivity itself is the rent | — | **(c)** — cannot be honestly reduced to either; the rent is how observability is financed in practice, but no instrument text prices the rent as necessary |
| Ley 19.359 | Enforcement + anti-fraud + art. 13 anti-avoidance; fines to BCRA | Penal backstop to exclusivity | — | **(c)** — art. 1 a)'s wording is channel-protective by its terms; arts. 1 c–d/13 are protective/fiscal; art. 15 is monetary-authority-benefiting |
| TO §§5.5–5.7 settlement | AML/payment integrity | Mandatory funnel + float/fee base | — | **(a) purpose / (b) structure** |
| CNV RG 1172/2026 | AML/FATF + investor protection | No direct bank benefit; stacks cost on crypto entrants | — | **(a)** — and it does NOT displace (b); it coexists with it |

Where the evidence does not let me distinguish: I found no instrument that
*prices* the authorized institutions' spread as a policy instrument (no
reference tariff, no BCRA band on the export-liquidation leg in the texts
read). Whether the rent is "necessary compensation" for compliance costs or
pure surplus is an empirical question this pass could not answer — no public
evidence either way. I do not assert regulatory capture; I assert the
mechanism: exclusivity + free pricing + penal backstop = lawful margin for
the authorized class, coexisting with genuine public functions.

## 4. Who specifically benefits

### 4.1 Banco de la Nación Argentina

- **Class membership (CONFIRMED structural):** as a Ley 21.526 financial
 entity, BNA is inside the TO §1.1/§8.2 class: it may execute MCF
 operations and serve as SECOEXPO certifier; its site offers "Operaciones
 con el Exterior" (Personas) and "Comercio Exterior" (Empresas) and a
 branch/ATM locator (bna.com.ar/Personas, read 2026-10-28). Whether BNA has
 opted out of any specific FX segment: no evidence examined (INFORMATIONAL).
- **Published spread (CONFIRMED, retail cash leg):** USD billetes buy
 1510.00 / sell 1560.00 (rates dated 27/10/2026, ≈3.2% spread) and a
 "divisas" reference 1529.0000/1538.0000 (≈0.6%), which the site labels
 "a fines informativos, como referencia de la cotización de la divisa en el
 mercado mayorista al final de cada día" — i.e., the low number is a
 *reference* of the wholesale close, not necessarily BNA's dealing rate.
 Read 2026-10-28 from https://www.bna.com.ar/Personas.
- **Statutory reference role (CONFIRMED in text, current force partly
 uncertain):** Ley 19.359 TO art. 4 converted infringing-operation amounts
 "al tipo de cambio del BANCO DE LA NACIÓN ARGENTINA tipo vendedor" — a
 symbolic institutional role of BNA's rate as *the* official reference in
 the penal statute; the update mechanism was later derogated (Ley 23.928
 art. 13, noted in the texact read 2026-10-28). Treat current operative
 force as SUSPICIOUS pending counsel.
- **Export-liquidation pricing, certification fees, nostro terms: no public
 evidence** (bilateral). Branch network as national cash-in/cash-out
 presence: the locator exists on-site; the "largest network in the country"
 ranking was **not** sourced this pass (INFORMATIONAL — BNA Memoria y
 Balances / BCRA statistical bulletin would be the source).
- **Net:** BNA captures (i) the class-wide spread opportunity on mandatory
 FX volume, (ii) retail cash-FX spread it voluntarily publishes, (iii) a
 historical statutory reference-rate role. No BNA-only FX privilege was
 found.

### 4.2 Other Argentine authorized institutions

- **Private banks** (Ley 21.526 entities): same class rights as BNA
 (CONFIRMED by class: TO §1.1/§8.2). Per-bank pricing on export
 liquidations: **no public evidence**. Their published normative summaries
 (e.g., BBVA's Com A 6780 summary used in this pass) show market practice of
 intermediating the rules, not a margin disclosure.
- **Casas de cambio:** authorized class under the BCRA Operadores de Cambio
 regime with patrimonio (RPC) requirements (referenced in TO Régimen
 Disciplinario §2.4.2, read 2026-10-28); SECOEXPO-eligible on par with
 banks (TO §8.2). Public tariff evidence: none retrieved this pass.
- **Fintechs / billeteras / PSPs:** **not** MULC-authorized for FX of
 individuals as of the BCRA's 30/09/2025 position (press-reported
 communiqué, verbatim across La Nación/TN/Telefe/Chequeado; Bausili
 on-record; primary grounding TO §1.1 + Com A 8303 defining billetera
 digital as a payments service). Where wallets displayed official-USD
 access, a *bank* performed the FX leg (press-reported: Mercado Libre
 operations via Banco Industrial; Cocos via Banco Industrial — TN,
 30/09/2025). Their current benefit is channeling users to banks; any
 revenue share: **no public evidence**.
- **PSAVs (CNV-registered):** a new regulated layer; fiat legs still route
 banks/casas de cambio (CONFIRMED mechanism, §2 row 5). Zero legal entities
 registered as of the prior pass (aven, 2026-10-27).

### 4.3 International / correspondent banks

Referencing the F.D model's cost components (aven; components
named, not priced here):

- **Correspondent fees:** per-item charges under bilateral
 correspondence agreements — private contracts; **no public evidence** of
 AR-specific levels. Argentine law does not create them; global
 correspondent banking predates and survives any AR FX regime.
- **Nostro float:** under TO §5.6, inbound funds sit in the *local* entity's
 cuenta de corresponsalía until conversion/credit; the float on that
 balance accrues to the local account holder (the AR bank) between credit
 and payout; foreign correspondents earn on their own side of the chain
 under private terms (INFORMATIONAL — magnitudes not public).
- **FX markup:** on any conversion leg executed by the receiving/sending
 bank at a freely pactado rate (TO §1.3) — CONFIRMED lawful; level not
 public for wholesale legs.
- **Structural point (CONFIRMED):** AR law guarantees these actors a
 mandatory funnel — every resident leg terminates/originates at a local
 authorized entity (TO §1.1, §5.6) — but it does not set or share their
 international margins. The Argentine rent lives on the *local* conversion
 and certification legs, not in the correspondent contracts.

### 4.4 Counter-case — if the regime were removed

- **Would lose the margin:** the authorized class (banks + casas de
 cambio, incl. BNA) — forced export-liquidation volume, certification
 touchpoints, mandatory FX-account balances, retail FX spread base. The
 BCRA would lose the art. 15 fine/forfeit stream. Foreign correspondents
 would lose part of inbound nostro flows if exporters could hold proceeds
 offshore (partial, directional inference — INFORMATIONAL).
- **Would go with it, legitimately:** (i) reserve/BOP observability —
 SECOEXPO + §5.7 registration is how the state counts export proceeds
 (BCRA's own Fase 3 framing ties the kept deadlines to reserves and the
 inflation anchor); (ii) tax/customs cross-checks — §8.2/8.3 gives the
 nominated entity ARCA data, and Ley 19.359 art. 13 presumptions use
 declared FX-operation prices to police misinvoicing; (iii) the
 anti-evasion mandate of Decreto 609 art. 3 (evasion via public bonds);
 (iv) AML data completeness on cross-border transfers (TO §5.5).
- **What would NOT be lost:** the international rails themselves
 (SWIFT/correspondents) — they are not an AR legal creation; and the
 *level* of the spread is not needed for any of the public functions (the
 rate is legally free; the state captures none of the spread directly, only
 taxes on bank profits and art. 15 penalties). The honest framing for the
 founder: the regime bundles a genuine public function (observability) with
 a protected private margin (exclusivity + free pricing + penal backstop).
 A reform could keep the reporting/reserve function while widening or
 unbundling the exclusive venue — that is policy design, not law-breaking,
 and it is a founder/decision-maker question, not an L.D call.

## 5. What I could not source this pass

1. **Any bank's (incl. BNA) export-liquidation/SECOEXPO pricing** — no
 public tariffs; bilateral. Stated as "no public evidence", not implied.
2. **Correspondent-fee levels and nostro float magnitudes** for AR corridors
 — private contracts; the F.D model should price them from
 operator quotes, not from law.
3. **BCRA's own web copy of the 30/09/2025 communiqué** — I read it
 verbatim as quoted by four independent outlets + the BCRA president
 on-record; the bcra.gob.ar page itself was not retrieved (SUSPICIOUS
 only as to the URL, not as to the statement; primary grounding is
 TO §1.1/§8.2).
4. **Current operative force of Ley 19.359 art. 4's BNA-rate reference** —
 the 1995 texact carries the derogation note of its update mechanism;
 the consolidated current version on argentina.gob.ar was not read
 (counsel).
5. **Whether any PSAV-shaped operator could itself hold casa de cambio
 authorization** — plausible in theory (nothing in the Operadores de
 Cambio regime was read to exclude it), unverified; would collapse the
 two-layer stack for that operator. Open question for AR counsel.
6. **The original 1971 recitals of Ley 19.359** — this pass read the 1995
 TO operative text; the founding recitals were not read (INFORMATIONAL).
7. **BNA "largest branch network" ranking** — not sourced (would need BNA
 Memoria y Balances or BCRA bulletin).
8. **Casa de cambio published tariffs** — not retrieved.

## 6. Profile delta from this pass

- `docs/L.D/ar/profile.md` `fxControl.citation` updated: the current
 in-force deadline table under TO §7.1.2 (Com A 8481, vig. 15/09/2026) is
 **30/60/180/365 calendar days by HS position + 20 business days from
 fecha de cobro** — the "15/30/180" figure previously carried (from Com A
 6780/2019) is outdated (resolves open question 3 factually; counsel may
 re-verify). Also captured: the mandatory entity nomination at oficialización
 (TO §7.1.1/§8.2) as the certification gate.

## 7. Escalation points (founder + licensed AR counsel, via COO)

- Any product plan that assumes a crypto rail *replaces* the bank's
 conversion/certification role in AR is REJECTED on the current text
 (TO §1.1/§8.2; Ley 19.359 art. 1 a); a crypto rail can only *feed* the
 authorized channel or serve non-AR/non-export flows.
- The "keep the dollars offshore in USDC" exporter flow remains blocked by
 Decreto 609 art. 1 + TO §7.1 regardless of the spread argument
 (docs/L.D/global/red-lines.md items 5–7 unchanged by this pass).
- Open counsel items carried forward: AR-1..AR-6 in
 docs/L.D/ar/ar-sas-cashabroad-equivalent.md §5, plus new: current force
 of Ley 19.359 art. 4 reference; whether a non-bank PSAV can hold Operadores
 de Cambio authorization.
