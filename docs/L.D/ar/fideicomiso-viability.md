---
dept: L.D
scope: ar
kind: decision
status: provisional
as_of: 2026-10-28
sources:
 - "AR · Código Civil y Comercial de la Nación (Ley 26.994, texto ordenado), Capítulo 30 arts. 1666–1700 (Contrato de fideicomiso) + art. 1701 ss. (Dominio fiduciario) · https://www.argentina.gob.ar/normativa/nacional/codigo-civil-y-comercial-de-la-nacion-ley-26994-235975/texto · read 2026-10-28"
 - "AR · BCRA TO Exterior y Cambios, texto ordenado al 14/09/2026 (última comunicación incorporada A 8481) · §§1.1–1.8, 3 (preamble), 3.7, 3.10, 3.11, 3.16.1–3.16.4, 7.1.1–7.1.2, 10.1–10.4 · https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf · read 2026-10-28 (pdftotext, section version stamps cited inline)"
 - "AR · Ley de Régimen Penal Cambiario TO 1995 (Ley 19.359 y modif., aprobado por Decreto 480/95), arts. 1, 2, 10, 17 · https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm · read 2026-10-28"
 - "AR · CNV RG 1172/2026 (B.O. 15-10-2026), arts. 1–10 (registro PSAV, exclusiones, categorías, patrimonios) · https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto · read 2026-10-28 (arts. 1–10 text re-extracted; prior pass 2026-10-27 aven)"
 - "AR · Ley 25.246 art. 4 bis (definición PSAV, incorporada por Ley 27.739) — quoted verbatim in RG 1172/2026 considerandos · https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto · read 2026-10-28"
 - "AR · Decreto DNU 609/2019 arts. 1–3 (art. 1 substituted by art. 1 Decreto 91/2019) · https://www.argentina.gob.ar/normativa/nacional/decreto-609-2019-327566/actualizacion · read 2026-10-28"
 - docs/L.D/ar/profile.md; docs/L.D/ar/regulatory-rent-map.md; docs/L.D/ar/ar-sas-cashabroad-equivalent.md; docs/L.D/global/{flow-matrix,red-lines}.md (prior verified passes, aven / / /)
 - aven (this task, 2026-10-28)
---

# AR — Does the local fideicomiso enter the viability equation post-pivot? + external-proposal claim review

Decision-support for the founder and for licensed AR counsel. **Not legal
advice, not a binding opinion.** Jurisdiction: Argentina (federal — BCRA, CNV,
ARCA; Registro Público inscription is provincial but the registry act is not a
financial licence). Every binding commitment (signing a fideicomiso contract,
marketing any structure, contracting a fiduciary) is a FOUNDER decision
surfaced via the COO.

The object of review: an external AI proposal ("Treazury structure for
Argentine importers") that transfers pesos from the importer to a **local
fideicomiso de administración**, dollarizes the fideicomiso via **MEP/CCL
bonos**, and has an **offshore entity** trigger crypto dollars + SWIFT to the
foreign supplier, with Tangem corporate multi-sig cards as signers and
on-chain Collateral Vault/Escrow/Multi-Sig smart contracts, promising
"24–48 hours" and "eliminando la burocracia cambiaria".

## 0. Direct answer (one line)

**CONDITIONAL — the fideicomiso itself is a lawful private contract (CCyC
arts. 1666–1700), but the specific structure as proposed (dollarize via
MEP/CCL + offshore crypto+SWIFT remittance as a replacement for the Mercado
de Cambios) is BLOCKED on the current text, and the only lawful version of an
AR-importer fideicomiso routes every FX leg through a BCRA-authorized entity
with prior-BCRA-conformity handling — which is a different, heavier product
than anything in our roadmap.**

## 1. Four-leg leg-by-leg analysis

The proposal bundles four distinct legal legs. They must be separated; the
external framing ("sin violar ninguna norma cambiaria") launders legs 2–4
behind leg 1.

| Leg | What happens | Verdict | Authority (instrument · article · read) |
|---|---|---|---|
| **L1 — ARS in** (importer → local fideicomiso, pesos, domestic) | Transfer of ARS between resident accounts; fideicomiso constituted/ funded | **PERMITTED (narrow)** — an ARS→ARS domestic transfer is not an "operación de cambio, canje y/o arbitraje", so §1.1 does not engage on this leg alone. Conditions: valid fideicomiso contract with the contents of CCyC art. 1667, inscription "en el Registro Público que corresponda" (CCyC art. 1669), a fiduciary that can lawfully act (CCyC art. 1673), corporate authority of the fiduciante, and no false characterization (the leg is clean only as a domestic transfer — it says nothing about legs 2–4) | BCRA TO (14/09/2026) §1.1 (Com A 8307, vig. 26/08/2025, read 2026-10-28); CCyC arts. 1666, 1667, 1669, 1673 (read 2026-10-28) |
| **L2 — Dollarization via MEP/CCL by the fideicomiso** | The fideicomiso (a "universalidad constituida en el país") buys FX/external assets via securities-market settlement | **CONDITIONAL — and NOT the frictionless step claimed.** For legal persons and *universalidades incl. fideicomisos*, FX-market access for "formación de activos externos" **requires prior BCRA conformity** (TO §3.10, Com A 8481, vig. 15/09/2026), requested **only through an authorized entity** (TO §1.8). Separately, any entity giving a non-natural-person client access to the FX market (incl. import payments, via the §3 preamble → §3.1 → Section 10 chain) must obtain either **prior BCRA conformity** or a sworn statement that in the access day + prior 90 days and the following 90 days the client did NOT do MEP/CCL-type operations — sales of securities with FX settlement, exchanges of resident securities for external assets, transfers to foreign depositories — NOR delivered pesos to anyone (resident or not, related or not, directly or indirectly) in exchange for external assets, **criptoactivos** or foreign-deposited securities (TO §3.16.3.1–3.16.3.2). A fideicomiso that "dollarizes via MEP/CCL" and then needs an FX egress cannot self-certify clean: every such egress then requires prior BCRA conformity through the entity, with no legal SLA | TO §3.10, §3.16.3.1–3.16.3.2, §3 preamble + §3.1 (read 2026-10-28) |
| **L3 — Outbound remittance / crypto+SWIFT to the foreign supplier** | Fideicomiso (or its offshore alter ego) sends value abroad to pay the supplier | **BLOCKED as proposed; CONDITIONAL in the lawful version.** Every FX operation requires intervention of a BCRA-authorized entity (TO §1.1). Import payments are governed by Section 10: beneficiary must be the *proveedor del exterior* (or qualifying financing entity) (TO §10.2.5); documentation + SEPAIMPO certification by the nominated tracking entity (TO §10.2.6, §10.3.2.1); no payment before the contractual due date (TO §10.3.2.3); boletos under B06/B14/B15/B22 concepts (TO §10.3.7). Sending USDC/divisas offshore *outside* the channel is "negociación de cambio sin intervención de institución autorizada" (Ley 19.359 art. 1 a)) with fines up to 10× (art. 2 a)), corporate solidaria liability (art. 2 f)), and BCRA precautionary measures (art. 17). An **offshore entity** does not remove the AR-side duty: the payer/universalidad is resident (TO §1.1, §3.16.3.3 requires disclosure of the control group); and an offshore operator serving AR residents under RG 1172/2026 art. 4 modalities (.ar domain, local ramp agreements, targeting, advertising, >20% AR volume) must register as PSAV **and** constitute a local company/branch (RG 1172/2026 art. 1 ¶2, art. 4) | TO §1.1, §10.2.5, §10.2.6, §10.3.2.1, §10.3.2.3, §10.3.7 (read 2026-10-28); Ley 19.359 arts. 1, 2, 17 (read 2026-10-28); RG 1172/2026 arts. 1, 4 (read 2026-10-28) |
| **L4 — Crypto layer (USDC held/triggered in the structure)** | Whoever holds/administers/exchanges the AVs in the fideicomiso or offshore vehicle | **CONDITIONAL — PSAV registration attaches to the OPERATOR (fiduciary/entity), not to the fideicomiso "patrimonio" as such; see §3 below.** Fiat legs remain TO §1.1 FX operations regardless of crypto registration | Ley 25.246 art. 4 bis (def. PSAV, quoted in RG 1172/2026); RG 1172/2026 arts. 1–3, 9–10 (read 2026-10-28); TO §1.1 |

Key structural finding (CONFIRMED): the BCRA text itself contemplates
fideicomisos as FX-market *clients* — "las entidades podrán dar acceso al
mercado de cambios a las personas humanas o jurídicas y los **patrimonios y
otras universalidades**" (TO §1.2, read 2026-10-28) — and the only fideicomiso
access regimes it spells out are narrow, purpose-bound and anti-laundering:
§3.7 (fideicomisos constituted by a resident to guarantee debt service get
access **only "en la medida que verifique que el deudor hubiese tenido acceso
para realizar el pago a su nombre"** — i.e., a fideicomiso cannot launder
access the underlying resident does not have) and §3.11.1–3.11.3 (guarantee
constitution with caps, verification and 5-business-day liquidation of
unused FX). A general-purpose "importer fideicomiso" that dollarizes and
remitss offshore has **no access regime in the TO**; it falls in the
residual that requires prior BCRA conformity (§3.10, §3.16.3) — or outside
the law entirely (Ley 19.359 art. 1 a)).

## 2. (a) What is a fideicomiso de administración, and who may be fiduciary?

**CONFIRMED — nature of the contract.** "Hay contrato de fideicomiso cuando
una parte, llamada fiduciante, transmite o se compromete a transmitir la
propiedad de bienes a otra persona denominada fiduciario, quien se obliga a
ejercerla en beneficio de otra llamada beneficiario... y a transmitirla al
cumplimiento de un plazo o condición al fideicomisario" (CCyC art. 1666, read
2026-10-28). Mandatory contents: art. 1667 (individualization of assets,
term/condition, beneficiary, destination/residual beneficiary, fiduciary
rights and replacement). Max term 30 years (art. 1668). Object: all assets in
commerce, including universalidades (art. 1670). The fideicomited assets form
a **patrimonio separado** from the estates of fiduciary, fiduciante,
beneficiary and fideicomisario (art. 1685), exempt from the fiduciary's and
fiduciante's creditors **"quedando a salvo las acciones por fraude y de
ineficacia concursal"** (art. 1686) — i.e., the separation is real but not a
fraud shield. Form: public or private instrument, and the contract "debe
inscribirse en el Registro Público que corresponda" (art. 1669).

**CONFIRMED — any person may be a PRIVATE fiduciary; a LICENSED fiduciary is
required only to offer fiduciary services to the public or to run a
fideicomiso financiero.** CCyC art. 1673: "El fiduciario puede ser cualquier
persona humana o jurídica. **Sólo pueden ofrecerse al público para actuar
como fiduciarios las entidades financieras autorizadas a funcionar como tales
[BCRA] y las personas jurídicas que autoriza el organismo de contralor de los
mercados de valores [CNV]**" (read 2026-10-28). A **fideicomiso financiero**
is the regime where the fiduciary is a financial entity or CNV-authorized
society and the beneficiaries are holders of títulos valores (arts.
1690–1692); public offering of those securities makes the CNV the applying
authority (art. 1691). Consequences for the proposal:

- A one-off, closed fideicomiso where the importer is (also) beneficiary and
 the fiduciary is e.g. an affiliate: legally constructible under arts.
 1666–1673 **as a contract** — but the fiduciary then must execute every FX
 leg through a TO §1.1 entity (L2/L3 above), and the "fiduciary-as-a-service"
 version (vendor administrating many importers' pesos) is exactly "offering
 to act as fiduciary" → BCRA/CNV-authorized entities only (art. 1673 ¶2).
- The fideicomiso is **not** a CNV-registered instrument by default.
 CNV/registration bites in two distinct regimes: (i) fideicomiso financiero
 with securities/public offering (CCyC arts. 1690–1691), and (ii) the PSAV
 registration of any *operator* performing virtual-asset activities for third
 parties (RG 1172/2026 — §3 below). Ordinary private fideicomisos need only
 the Registro Público inscription of art. 1669.
- Anti-avoidance hooks inside the contract law itself: the fiduciary may not
 be dispensed from rendición de cuentas, culpa/dolo liability, or the
 prohibition of acquiring fideicomited assets for itself (art. 1676); acts of
 the fiduciary "en fraude" are revocable by the beneficiary (art. 1681); and
 the fiduciary's disposition power exists only "cuando lo requieran los
 fines del fideicomiso" (art. 1688) — a fiduciary executing an unlawful FX
 operation is not acting within the trust's lawful purposes.

Verdict on (a): **CONFIRMED** (cited text). The private-fideicomiso door is
real, narrow, and does not confer any FX privilege.

## 3. (d) PSAV registration (RG 1172/2026) and custody — categories, and the PA-R5 collision

**CONFIRMED — categories (RG 1172/2026 art. 9, read 2026-10-28):**
Categoría 1 = intercambio AV↔moneda fiduciaria; Categoría 2 = AV↔AV;
Categoría 3 = transferencia de AVs; **Categoría 4 = custodia o administración
de AVs o instrumentos que permitan el control sobre los mismos, "excluidos los
servicios en los que el usuario conserve el control exclusivo"**;
Categoría 5 = services around an issuer's AV offering. Minimum net worth
(art. 10): USD 150,000 (cats 1/2/4), USD 75,000 (cat 3), USD 35,000 (cat 5);
halved under USD 2.5M trailing volume; natural persons only cats 1–2 and only
above UVA 35,000/month (art. 1 ¶3).

**Application to "the fideicomiso holds USDC":**

- The PSAV obligation attaches to **persons** performing the activity "como
 negocio... para o en nombre de otra persona" (Ley 25.246 art. 4 bis, quoted
 in RG 1172/2026). A fideicomiso is a universalidad/patrimonio separado
 (CCyC art. 1685), not a registrable "persona jurídica" — the registrable
 subject is the **fiduciary** administering the USDC for the beneficiary.
- If that fiduciary administers/custodies AVs for third parties as a
 business → **Categoría 4** (administración/custodia), USD 150k net worth
 (75k if under USD 2.5M volume), registration **before** operating
 (RG 1172/2026 arts. 1, 9, 10). If it also exchanges AV↔fiat → add
 Categoría 1; if it executes the transfers → Categoría 3.
- The cat-4 exclusion ("usuario conserve el control exclusivo") only helps if
 the user — not the fiduciary — keeps exclusive control. That is
 structurally incompatible with a real fideicomiso administration mandate
 (fiduciary disposition powers, CCyC art. 1688; separate estate, art. 1685).
 A "fideicomiso" whose multi-sig quorum keeps control at the company is
 form-over-substance and runs into the genuineness check of TO §1.2 and the
 group disclosure of TO §3.16.3.3. CONFIRMED tension.
- **Our PA-R5 guardrail (no platform custody):** a fideicomiso in which
 *Treazury* is the administering fiduciary (or holds any signing key, or can
 move the assets) is PSAV cat-4 activity by Treazury and **collides with
 PA-R5** — REJECTED by our own red line (docs/L.D/global/red-lines.md item 1
 family; ar-sas-cashabroad-equivalent.md §2–3). Treazury-as-software for
 self-custody can stay inside RG 1172/2026 art. 2 iv) (providers of exclusive
 self-custody wallet software/hardware, user keeps control, provider holds no
 custody/administration/disposition powers) — CONFIRMED text, same carve-out
 already relied on in ar-sas-cashabroad-equivalent.md §3.4.
- An **offshore entity** performing these activities for AR residents under
 art. 4 modalities must register and constitute a local society/branch
 (RG 1172/2026 arts. 1 ¶2, 4) — the offshore wrapper is transparent to the
 regime. CONFIRMED.

Verdict on (d): **CONDITIONAL** — PSAV cat 4 (likely + cat 1/3) registration
is triggered for the fiduciary-operator; PA-R5 forbids that operator being
Treazury; and the structure only "works" as a fideicomiso if the fiduciary is
a third party with the right to dispose, which is itself a regulated posture.

## 4. (c) Does the structure comply with the current text, or is it the "shadow bank bypassing the MULC"?

**Verdict: BLOCKED as proposed / CONDITIONAL only in the licensed version.**
Reasoning on the current text (all read 2026-10-28):

1. **Exclusivity.** Every FX operation routed through the MCF requires a
 BCRA-authorized financial or exchange entity (TO §1.1; Decreto 260/2002
 arts. 1–2 at TO §15.1); breaches are penal (TO §1.5 → Ley 19.359).
2. **The anti-structure screen is explicit, not inferred.** For every
 non-natural-person client, the entity must obtain prior BCRA conformity or
 the §3.16.3 sworn statements — including the forward 90-day commitment
 never, directly or indirectly or "por cuenta y orden de terceros", to
 deliver pesos/local assets to anyone in exchange for external assets,
 **criptoactivos** or foreign-deposited securities (§3.16.3.2 vii). The
 proposal's core move — importer delivers pesos → structure delivers crypto
 dollars offshore — is the literal pattern this provision screens. The
 §3 preamble makes §3.16 complementary to import payments (§3.1 → Sections
 10/11). [L.D reading of the incorporation chain; flagged for counsel
 confirmation against any BCRA practice note — see escalation list.]
3. **Fideicomisos cannot launder access.** Where the TO does grant fideicomiso
 access (§3.7, §3.11.1), it is conditioned on the underlying resident
 having had access itself ("en la medida que verifique que el deudor hubiese
 tenido acceso", §3.7) — the anti-fronting principle is textual.
4. **Observability follows the client, not the wrapper.** Client ID + BCRA
 registration of operations (§1.6); genuineness check of the operation and
 its correct classification (§1.2 ¶2); SEPAIMPO links the payment to the
 oficialización (§10.2.6); §3.16.3.3 forces disclosure of control relations
 and the economic group; §3.16.4 makes entities check the CUIT list of
 inconsistent operations, abstain on detected inconsistencies, and file
 penal-regime denuncias on fraud indicators. A fideicomiso does not keep
 anything "clean" — it adds a patrimonio whose every egress still needs an
 authorized entity and a boleto.
5. **Penal backstop.** Ley 19.359 art. 1 a) (negotiation without authorized
 institution), c)–d) (false declarations / failure to rectify), e)
 (operation not at the quantity/currency/rate/deadlines/conditions of the
 rules), f) (catch-all infringement of FX norms); art. 2 a) fines up to 10×
 the operation; art. 2 e) up-to-10-year ban as importer/exporter/intermediary;
 art. 2 f) corporate solidaria liability where directors/legal reps use the
 company's means for the act "en nombre, con la ayuda o en beneficio de la
 misma"; art. 17 BCRA precautionary measures (refuse FX authorizations,
 refuse despachos a plaza and boletas de embarque, suspend registry
 inscriptions).
6. **Policy signal against bond-routed evasion.** Decreto 609/2019 art. 3
 empowers the BCRA to regulate against "prácticas y operaciones tendientes a
 eludir, a través de títulos públicos u otros instrumentos" its measures
 (read 2026-10-28). Its direct scope is that decree's measures (export-side
 ingress); it is cited here as regulatory-intent evidence for the
 MEP/CCL-evasion pattern, not as a directly applicable import-payment
 prohibition. INFORMATIONAL as intent / CONFIRMED as text.

A compliant version exists in theory — fideicomiso + bank/casa-de-cambio
partner executing legs 2–3 inside the MCF with SEPAIMPO documentation and
handling §3.16.3/§3.10 conformities — but that is a licensed, document-heavy,
prior-conformity workflow, not "24–48 hours" and not "eliminating" anything.
It also requires a PSAV-registered or bank fiduciary for the crypto parts
(§3 above).

## 5. (e) Where does this leave OUR product?

Our architecture (AGENTS.md; ar/profile.md): buyer→seller direct USDC, platform
never custodies (PA-R5), commercial (not customs) docs released on
`orders.status='paid'`, agency multi-tenant SaaS; AR flow verdicts:
buyerToSellerDirect **blocked** (export-surrender), platformHoldsFunds
**blocked**, platformPaysSupplier **blocked**, platformConvertsToFiat
**conditional** on a licensed MCF/PSAV partner (ar/profile.md flows).

**Verdict: DIFFERENT PRODUCT — out of scope. Not an overlay.**

- An "overlay" would be a compliance *wrapper around the same rail*: our
 docs+payment-link SaaS, with the AR importer doing FX conversion and
 remittance **at its own bank**, and Treazury never touching funds. That is
 compatible with the current architecture (and is the only AR shape our
 profiles allow).
- The proposed fideicomiso structure is a **managed import-payment service**:
 receives third-party money (platformHoldsFunds analog — blocked), converts
 value (platformConvertsToFiat — conditional only via licensed partner),
 pays suppliers on behalf of the payer (platformPaysSupplier — blocked),
 plus collateral/OTC/SWIFT final leg. It is a fiduciary/PSAV business, not
 agency SaaS. Building or marketing it would cross red-line items 1, 5–7 and
 the new item 21 (below) before a single line of code exists.
- If a licensed fiduciary/bank partner someday runs such a fideicomiso and
 wants our non-custodial software and docs, that is a partner integration
 question for a future scope decision (CPA/COO + counsel) — it is not this
 proposal, and PA-R5 still forbids Treazury holding keys or funds.

## 6. Deliverable 2 — claim-by-claim review of the external proposal

| # | External claim | Verdict | Basis (instrument · article · read 2026-10-28 unless noted) |
|---|---|---|---|
| 1 | "30 to 90 days of obligatory waiting due to BCRA regulations" for importers paying abroad | **REJECTED (conflation)** | No importer waiting period exists in the current TO. What exists: (i) exporters' liquidation deadlines 30/60/180/365 calendar days by HS position + independent 20 business days from fecha de cobro (TO §7.1.1–7.1.2.1/.2/.4/.5, Com A 8481) — a *different obligation, different subject*; (ii) for importers, a prohibition on paying *before* the obligation's due date (TO §10.3.2.3 — a cap on prepayment, the opposite of a waiting period, RIGI-VPU carve-out aside); (iii) for *advance* payments of goods without customs entry yet, a post-payment 90-day (270 for capital goods) deadline to evidence the registro de ingreso aduanero or return the funds (TO §10.4.2.4) — a tracking deadline after money moved, not a wait before. The "30–90 days" is the exporter table's shadow plus the 90-day post-advance tracking figure, fused into a false importer claim |
| 2 | "24–48 business hours from receipt of pesos until the supplier is paid" | **REJECTED as a product claim / UNVALIDATED as a feasibility claim** | No contracted rail exists (`rails.licensedPartners: []`, ar/profile.md; red-lines.md item 2, CONFIRMED empty rails 2026-10-26). Even the lawful version requires entity verification of genuineness (TO §1.2), SEPAIMPO certification (TO §10.2.6, §10.3.2.1), boletos (§10.3.7), and — precisely for a fideicomiso/legal person with MEP/CCL activity — **prior BCRA conformity** (§3.10, §3.16.3) with no legal SLA. A timing promise without a named, contracted, licensed partner is marketing copy violating our own red line 2 |
| 3 | "The company transfers pesos to the local fideicomiso without violating any exchange rule" | **CONFIRMED for the ARS-in leg only, in isolation; REJECTED as used (it launders legs 2–4)** | An ARS→ARS domestic transfer is not an FX operation (TO §1.1 defines the covered ops: cambio, canje, arbitraje). But the same sentence is deployed to bless the dollarization and outbound legs, which are FX operations requiring authorized-entity intervention (§1.1), prior conformity for universalidades (§3.10) and the §3.16.3 sworn-statement/conformity screen, with the penal regime at §1.5/Ley 19.359. Clean leg ≠ clean structure |
| 4 | "Operar a través de un fideicomiso local independiente… evita el bloqueo… la empresa preserva su CUIT limpio" | **REJECTED — red line (structuring to evade)** | Positioning a structure as a device to avoid enforcement consequences and to keep a corporate tax ID "clean" while operating is evasion structuring, not compliance. Instruments: Ley 19.359 art. 1 a)/c)/d)/e)/f), art. 2 a)/e)/f), art. 17 (precautionary measures are person- and operation-level; they are not erased by a wrapper); TO §3.16.3.3 (control-group and economic-group disclosure defeats the "independent" fiction), §3.16.4 (CUIT list of inconsistent operations; mandatory abstention + penal-regime denuncia on fraud indicators); CCyC art. 1686 (fraud and concursal inefficacy actions reserved against the separated estate) and art. 1681 (fraud revocation). Added as red-line item 21 with exact forbidden wording |
| 5 | "Eliminando la burocracia cambiaria" / phrasing implying bypassing norms | **REJECTED** | The founder already corrected this framing externally. Normative reality: the FX regime is not "bureaucracy" to be eliminated but an exclusivity regime with a penal backstop (TO §1.1/§1.5; Decreto 260/2002 at §15.1; Ley 19.359). Compliant alternative phrasing: **"We prepare the commercial documents and the USDC payment flow; for Argentine residents, currency conversion and cross-border remittance run through BCRA-authorized entities — our software makes that path fast and auditable, it does not replace it."** |
| 6 | A local fideicomiso is "la única puerta de entrada regulada" for importers | **REJECTED (contradicted); the underlying claim is unsourceable (INFORMATIONAL)** | No instrument read makes any fideicomiso a gateway for importers. The TO's own structure is the opposite: importers access the FX market directly through their entity under Section 10 (§10.1–10.3) with no fideicomiso anywhere in the chain; fideicomiso access regimes exist only for debt-service guarantees (§3.7, §3.11.1). Absence of any instrument naming a fideicomiso as "the" regulated door: INFORMATIONAL absence-of-evidence, but as a legal statement it is contradicted by the text |
| 7 | Tangem multi-sig as corporate signer — any Argentine legal obstacle? | **INFORMATIONAL (no specific prohibition found in the instruments read) + CONFIRMED structural points** | No AR instrument read this pass regulates hardware-card multi-sig for corporate payment authorization as such (absence of evidence — INFORMATIONAL; corporate representation mechanics live in sociedades law and the company's own bylaws — not re-read this pass, counsel). Two structural points ARE confirmed: (i) inside a fideicomiso, the party legally positioned to dispose of the trust estate is the **fiduciary** (CCyC arts. 1682, 1688) — the multi-sig merely implements the fiduciary's authorized signature, so the "signer" is the fiduciary, not the company; and (ii) if the cards/keys keep exclusive control with the user, the provider of the tooling stays in RG 1172/2026 art. 2 iv) (self-custody carve-out), but if the fiduciary administers AVs for third parties it is PSAV **Categoría 4** (art. 9) regardless of the card brand |

## 7. New red-line item (added to docs/L.D/global/red-lines.md as item 21)

Exact wording of the forbidden positioning, for product, marketing, sales and
partner copy:

> **Never present any structure — fideicomiso, offshore entity, smart-contract
> vault, or otherwise — as a way to avoid BCRA enforcement (bloqueos,
> conformidad previa, SEPAIMPO/SECOEXPO controls) or to keep a company's CUIT
> "clean" while operating. Never claim to "eliminate", "bypass" or "remove"
> exchange-control obligations or bureaucracy.** The only lawful AR framing:
> obligations run through BCRA-authorized entities and our software speeds the
> documented path.

Scope: ar. Evidence: Ley 19.359 TO 1995 arts. 1 a)/c)/d)/e)/f), 2 a)/e)/f),
17 (infoleg texact, read 2026-10-28); BCRA TO Exterior y Cambios (14/09/2026)
§§1.1, 1.2, 3.7, 3.10, 3.16.3.2 vii, 3.16.3.3, 3.16.4, 10.2.6, 10.3.2
(read 2026-10-28); CCyC arts. 1681, 1686 (read 2026-10-28); Decreto 609/2019
art. 3 (read 2026-10-28). Verdict: CONFIRMED.

## 8. Counsel escalation list (licensed AR attorney, via COO)

1. Confirm the §3 preamble → §3.1 → Sections 10/11 incorporation chain: does
 BCRA in practice apply §3.16.3 sworn statements/prior conformity to
 import-payment egresses for legal-person importers as the TO text
 indicates? (Load-bearing for verdicts L2/L3.)
2. Confirm that no BCRA normative/FAQ residue of the 2024–25 import-payment
 restrictions (stock exhaustion etc.) survives outside the current TO
 consolidation — our claim is "no importer waiting period" on the
 14/09/2026 TO text; counsel to re-verify against BCRA communications
 after that date.
3. Whether a bank acting as fiduciary under its BCRA regime may administer
 virtual assets inside a fideicomiso without PSAV registration (RG
 1172/2026 art. 5 b) "regulación específica" interaction) — open question
 from ar-sas-cashabroad-equivalent.md, now material.
4. Corporate-law review of any actual fideicomiso the founder may consider:
 Registro Público inscription act (CCyC art. 1669), fiduciante corporate
 benefit, and tax treatment of the patrimonio separado (coordinate with CF).
5. If the founder wants a licensed-partner version scoped (bank/casa de
 cambio + PSAV fiduciary + SEPAIMPO workflow), commission it as a NEW
 product-regulatory study — do not let it enter via marketing copy.

## 9. Sources (instrument · article · URL · date read · verdict of the read)

| Instrument | Articles/sections read | URL | Date read | Read verdict |
|---|---|---|---|---|
| CCyC (Ley 26.994) | 1666–1700 (Cap. 30), 1701–1707 noted | https://www.argentina.gob.ar/normativa/nacional/codigo-civil-y-comercial-de-la-nacion-ley-26994-235975/texto | 2026-10-28 | CONFIRMED (full text extracted) |
| BCRA TO Exterior y Cambios (14/09/2026, A 8481) | §§1.1–1.8 (Com A 8307), 3 preamble, 3.1, 3.7, 3.10, 3.11 (Com A 8481), 3.16.1–3.16.4 (Com A 8481), 7.1.1–7.1.2 (Com A 8481), 10.1–10.4 (Com A 8307/8481) | https://www.bcra.gob.ar/archivos/Pdfs/Texord/t-excbio.pdf | 2026-10-28 | CONFIRMED (pdftotext; version stamps per section) |
| Ley 19.359 TO 1995 (Decreto 480/95) | arts. 1, 2, 4, 10–12, 16, 17 | https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm | 2026-10-28 | CONFIRMED (texact re-read) |
| CNV RG 1172/2026 (B.O. 15-10-2026) | arts. 1–10 + considerandos quoting Ley 25.246 art. 4 bis | https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto | 2026-10-28 | CONFIRMED (text extracted; consistent with 2026-10-27 pass) |
| Decreto DNU 609/2019 (actualizada) | arts. 1–6 (esp. 1 substituted by Decreto 91/2019; 2; 3 anti-evasion clause) | https://www.argentina.gob.ar/normativa/nacional/decreto-609-2019-327566/actualizacion | 2026-10-28 | CONFIRMED |
| Prior L.D artifacts | ar/profile.md, regulatory-rent-map.md, ar-sas-cashabroad-equivalent.md, flow-matrix.md, red-lines.md | docs/L.D/{ar,global}/ | 2026-10-25..28 | cited, not re-derived |

Non-lawyer limit, flagged plainly: this memo is decision-support by a
non-attorney agent. Every verdict is textual analysis of the cited primary
sources; applicability determinations, regulator correspondence and any
binding commitment belong to a licensed Argentine attorney and the founder
(decisions surfaced via the COO).
