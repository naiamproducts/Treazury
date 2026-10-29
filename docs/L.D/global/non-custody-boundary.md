---
dept: L.D
scope: global
kind: analysis
status: draft
as_of: 2026-10-28
sources:
 - "AR · CNV RG 1172/2026 (B.O. 15-10-2026), Capítulo III Título XIV — arts. 1–10, 12–21, 33–36, 38, 45 + considerandos quoting Ley 25.246 art. 4 bis · https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto · read 2026-10-28 (full texto original extracted this pass)"
 - "AR · Ley 25.246 art. 4 bis (def. PSAV, incorporated by Ley 27.739) — verbatim in RG 1172/2026 considerandos (read 2026-10-28)"
 - "AR · Ley 19.359 TO 1995 arts. 1 a)/e), 2, 10, 17 · https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/28133/texact.htm (read 2026-10-28, carried from fideicomiso-viability.md)"
 - "AR · BCRA TO Exterior y Cambios (14/09/2026, Com A 8481) §§1.1, 7.1 (read 2026-10-28, carried from export-flow-escrow.md)"
 - "CH · Tangem AG — company page + ToS (Tangem AG, Zug/Luzern, UID CHE-390.112.525) · https://tangem.com/company · https://tangem.com/docs/en/terms-of-service.pdf · https://www.moneyhouse.ch/en/company/tangem-ag-14771977121 (read 2026-10-28 via search extraction — snippets, flag below)"
 - repo: AGENTS.md:202-203 (PA-R5); docs/L.D/global/red-lines.md:35-85; docs/L.D/ar/profile.md; docs/L.D/ar/export-flow-escrow.md; docs/L.D/ar/fideicomiso-viability.md:126-174; docs/L.D/cn/profile.md; docs/L.D/global/flow-matrix.md; docs/L.D/global/profile-corrections.md
 - aven (this task, 2026-10-28)
---

# Global — Non-custody boundary: PSAV frontier vs software (RG 1172/2026)

Decision-support for the founder and for licensed AR counsel. **Not legal
advice, not a binding opinion, no commitment on behalf of Treazury.** Every
binding decision (product scope, marketing claims, partner contracts) is a
FOUNDER decision surfaced via the COO. Jurisdiction: Argentina (CNV/BCRA) as
primary; Tangem facts are Swiss/EU. Non-lawyer limits: primary texts read at
article level this pass; **no CNV administrative guidance ("giros"),
interpretive opinions, or enforcement practice on PSAV was reviewed** — every
"CNV could reclassify by conduct" flag below is exactly that gap. Verdict
vocabulary: structural/compliance claims use VALIDATED / PROMISING /
UNVALIDATED / REJECTED; factual findings use CONFIRMED / SUSPICIOUS /
INFORMATIONAL.

**Category-mapping correction (material).** The founder brief labeled the
categories "Cat 1 emisión, Cat 2 intercambio/intermediación, Cat 5
asesoría/plataforma". The primary text says otherwise and wins: **Cat 1 =
intercambio AV↔moneda fiduciaria; Cat 2 = intercambio AV↔AV; Cat 3 =
transferencia de AVs; Cat 4 = custodia o administración (con exclusión de
control exclusivo del usuario); Cat 5 = servicios financieros en torno a la
oferta/venta de un AV por un emisor** (RG 1172/2026 art. 9, read 2026-10-28).
Emission by the issuer itself is expressly *not* reached (art. 9 Cat 5 final
sentence). Any deck using the old mapping must be fixed before it reaches a
partner.

**Governing definition (Ley 25.246 art. 4 bis, quoted in RG 1172
considerandos, read 2026-10-28).** PSAV = any natural or legal person who,
**as a business**, performs **one or more** of five activities **for or on
behalf of another person**: i) AV↔fiat exchange; ii) AV↔AV exchange; iii)
transfer of AVs; iv) custody and/or administration of AVs **or instruments
that permit control over them**; v) participation/provision of financial
services tied to an issuer's AV offering. Two limiting principles run through
everything below: **"para o en nombre de otra persona"** (doing it for
yourself is out — art. 2 i) and **"como negocio"**.

---

## A. The PSAV frontier, category by category

Registration is required **before** operating (art. 1 ¶1); operating without
registration is prohibited (art. 3) with sanctions per Ley 27.739 art. 37.
Foreign legal persons performing PSAV activities **directly** under any art. 4
nexus (.ar domain; local ramp agreements; clear targeting; advertising to AR
residents — reverse-solicitation carve-out; >20% AR volume of the registered
activity) must register **and** constitute an art. 123 society or art. 118
branch (art. 1 ¶2, art. 4). Net worth: USD 150k (cats 1/2/4), 75k (cat 3),
35k (cat 5), halved under USD 2.5M trailing-12-month volume (art. 10).
**0 entidades jurídicas registradas hoy** (brief context; CONFIRMED as
starting fact).

### Non-registration exclusions — RG 1172/2026 art. 2 (read 2026-10-28, CONFIRMED)

| Art. 2 | Excluded subject | Boundary condition |
|---|---|---|
| i) | Persons exchanging AV↔fiat or AV↔AV **for themselves** (a título personal), any amount | Only own-account; the moment it is for another person as a business, art. 4 bis engages |
| ii) | Persons receiving/delivering AVs **as consideration for their own products/services**, any amount | Payment *acceptance*, not payment *intermediation* |
| iii) | Decentralized protocols, **iff no person exercises sufficient control or influence** over their functioning and provides PSAV services | A protocol with a known operator holding keys/upgrades is NOT excluded |
| iv) | Providers of **exclusively** self-custody wallet **software or hardware**, iff they perform no PSAV-definition activity; self-custody = user keeps control of the AVs **and the access means**, provider holds **no faculties of custody, administration or disposal** | This is Tangem's lane — and the only "crypto custody" carve-out that exists |

Foreign group-company carve-out (art. 2 ¶2): a foreign entity participating in
an AR-incorporated PSAV-registered company (own or same economic group) is
exempt from the **registration obligation**, provided **no direct contractual
relationship with AR clients** and no art. 4 nexus. This helps a foreign
*affiliate of a registered PSAV*, not a non-registered foreign SaaS.

### Per-category: conduct that enters / conduct that exits / reclassification risk

**Cat 1 — AV↔fiat exchange.**
(i) *Enters:* Treazury (or its entity) receives USDC and pays ARS/USD — or
pays USDC and receives ARS/USD — **as counterparty for a client**, including
as an OTC desk, market-maker, or "we buy your export USDC" flow, even for
minutes, even if the client's keys live on Tangem. The custody arrangement of
the *client* is irrelevant: the exchange act is ours. (ii) *Exits:* never
being counterparty to an AV↔fiat trade for another person — the client (or a
licensed OTC/bank) trades with the counterparty; Treazury's software only
tracks, documents, displays routes. Also art. 2 i) if a founder trades the
company's own treasury (own account — but then *cambiario* law, Ley 19.359
art. 1 a), still bites the ARS/USD leg outside TO §1.1 entities). (iii)
*Reclassification risk:* **HIGH.** Any spread capture on AV↔fiat, any
"instant quote we execute", any receiving-then-paying sequence — even with
"Tangem holds the keys" branding — is conduct-level Cat 1. Substance over
form is textual in this regime (art. 38 ¶2: nature of rights and **operatoria
efectivamente desarrollada**, regardless of commercial name or technology —
written for offerings, but the same CNV posture; art. 2 iii)'s "control or
sufficient influence" test is the custody-side twin).

**Cat 2 — AV↔AV exchange.**
(i) *Enters:* Treazury swaps USDC↔ARS-backed-token, USDC↔USDT, or routes
client orders between AV venues as principal or agent for a fee tied to the
swap. (ii) *Exits:* displaying two addresses and letting the client execute
both legs with their own keys; aggregation/information without order
execution. (iii) *Risk:* **MEDIUM-HIGH.** "Routing" that becomes order
handling with discretion = intermediation. Quote-apis that we execute = Cat 2.

**Cat 3 — transferencia de AVs.**
(i) *Enters:* Treazury's servers initiate, sign, broadcast or submit a client
transfer (relayer, paymaster/gas sponsorship with our signer, meta-transactions,
"Treazury pays address X on behalf of the client"), or we hold the session
key that triggers it. (ii) *Exits:* we return a payment **route** ("pay to
address X — the wallet is yours"); the client's Tangem signs; our infra never
holds a key and never broadcasts. Displaying an address is information, not a
transfer. (iii) *Risk:* **MEDIUM.** Any "gasless" or "one-click pay" feature
where our key signs is the classic slip into Cat 3.

**Cat 4 — custodia o administración (o instrumentos que permitan el
control).**
(i) *Enters — be specific:* (a) the platform retains a private key, seed
shard, MPC share, session key or signing credential, **even for seconds**;
(b) an escrow/vault **recovery key** is held by Treazury or by a third party
we designate, control, can replace, or instruct; (c) the balance lives in a
smart contract whose admin/upgrade/pause/param/fee-drain keys we hold;
(d) our servers must approve, countersign or co-sign a movement;
(e) funds pass through a wallet we control even as a passthrough;
(f) we can block a client's exit from a contract (blacklist/pause we
control). All of these are "instrumentos que permitan el control" (art. 9
Cat 4) and destroy the art. 2 iv) carve-out ("sin que el proveedor disponga
de facultades de custodia, administración o disposición"). (ii) *Excludes:*
the user keeps **control exclusivo** of the assets and of the access means
(art. 9 Cat 4 exclusion + art. 2 iv) definition) — keys on the client's
Tangem card, contract signers = the two counterparties only, no admin key, no
upgrade, timeout refund to original senders. (iii) *Risk:* **VERY HIGH.**
Cat 4 is the category CNV wrote the most operational teeth into (arts. 16–18:
custody architecture disclosure, **public proof of reserves**, segregation,
key-scheme prudentials; art. 21 smart-contract audit when the operatoria uses
them) — the detailed drafting signals enforcement attention. A "we only have
a recovery key" design will be read as control, not as UX. Also note: 0 legal
entities exist today, so any Cat 4 posture would additionally require
constituting an art. 123/118 entity + USD 150k (75k halved) +Registro
Público capital integration (art. 10) **before** operating.

**Cat 5 — issuer-offering services.**
(i) *Enters:* Treazury runs an platform/app for an AV issuer's initial offer
or public fundraising (launchpad, cap-table token, "treasury token" sale).
(ii) *Exits:* everything else — our USDC settlement product is *not* an
issuer offering; mere emission by the issuer is expressly not reached (art. 9
Cat 5 final sentence). (iii) *Risk:* **LOW for this venture** — only if a
future "Treazury token" or client-token-sale feature appears; then also check
Ley Mercado de Capitales art. 2 (valores negociables) per art. 38 ¶2.

### Cross-cutting reclassification doctrine (CONFIRMED text)

- Art. 2 iii): sufficient **control or influence** by any person pierces the
 "decentralized protocol" label — the same logic applies to any "the
 contract controls itself" pitch (scenario 7).
- Art. 2 iv): the carve-out is lost the moment the provider has **any** of
 custody / administration / disposal faculties — it is a zero-threshold
 test, not a materiality test.
- Art. 38 ¶2: CNV expressly looks through commercial names and technology to
 the **operatoria efectivamente desarrollada**.
- Art. 5 b): entities under specific regulation that does not allow PSAV
 operation cannot register as PSAV (relevant to banks — open question on
 whether a BCRA bank administers AVs under its own regime; carried from
 `fideicomiso-viability.md` escalation 3).
- Art. 36: a PSAV may delegate functions to third parties (incl. foreign,
 FATF-clean, regulated) but **remains fully responsible** and must report
 convenios within 5 days — so "we just integrate with a PSAV" does not
 launder conduct onto the partner if we in fact perform the activity.

---

## B. Product-behavior matrix

| # | Scenario | Verdict | Basis (article / exclusion) |
|---|---|---|---|
| 1 | SECOEXPO/Com A 8481 deadline tracker + alerts + commercial-doc generation, no funds touched | **NO-PSAV** | None of the art. 4 bis five activities is performed; docs are commercial (red-line 3). Clock/oracle SaaS is information |
| 2 | Non-custodio smart-contract escrow: buyer + exporter are the only signers, Treazury deploys code, holds no key | **NO-PSAV (Treazury)** / **GRIS (product-wide)** | Art. 2 iv) logic: no custody/admin/disposal faculty on our side; contract holding funds ≠ our custody when neither party nor we can be overruled (art. 2 iii) control test passes). GRIS: PA-R5 wording ("structures that hold USDC", AGENTS.md:202-203) needs a founder clarification — red-line 1's evidence was the **owner-key refund power**, not vault existence; and AR export use still dies on the 20-bd clock (export-flow-escrow.md A.2) |
| 3 | Escrow with recovery key held by Treazury — or by a third party **we designate** | **PSAV-CAT 4** (Treazury) / **GRIS→CAT 4** (designated third party) | Art. 9 Cat 4 "instrumentos que permitan el control"; art. 2 iv) lost on any disposal faculty; a designee we instruct/replace is our effective control (art. 2 iii) influence test by analogy). A genuinely client-chosen, contractually independent trustee is a different actor's problem — and if it administers AVs for clients as a business, **it** is Cat 4 |
| 4 | Treazury as OTC mesa: receives USDC one side, pays ARS/USD the other — even if client keys are on Tangem | **PSAV-CAT 1** + **FX-illegal leg** | Art. 4 bis i) + art. 9 Cat 1 (AV↔fiat for another, as a business). Tangem custody of the client's wallet is irrelevant to our exchange act. ARS/USD leg additionally = Ley 19.359 art. 1 a) outside TO §1.1 entities — criminal core, red-lines 5/8-family |
| 5 | Software returns payment routes ("paga a X, la wallet es tuya") — client signs | **NO-PSAV** / **GRIS** if we broadcast | Displaying an address ≠ transferencia (Cat 3 attaches to performing the transfer for another). GRIS the moment our infra signs/broadcasts/relays (relayer, paymaster, meta-tx) |
| 6 | Stack: Tangem custodies (client keys on hardware) + Treazury software & plazos oracle + licensed bank/OTC does FX | **NO-PSAV (Treazury)** / **NO-PSAV (Tangem, art. 2 iv)** / **actor-specific (bank-OTC)** | Treazury: software + information = outside art. 4 bis; PA-R5-compliant on the software-only shape. Tangem: self-custody hardware provider, user keeps control (art. 2 iv carve-out matches its own ToS). Bank/OTC: fiat leg must be a TO §1.1 entity; if it intermediates the crypto leg it needs its own PSAV Cat 1/2/3 registration (or art. 5 b) specific-regulation question). **This stack avoids PSAV for Treazury and satisfies PA-R5 — conditional on no control faculty and on the partner being actually contracted (red-line 2: rails.licensedPartners is empty)** |
| 7 | Self-custodial escrow: client signs with Tangem, funds in a contract only the contract controls (no human custodian) | **GRIS → NO-PSAV under strict conditions** | Art. 9 Cat 4 exclusion requires user **control exclusivo**; art. 2 iii) shows CNV's anti-label posture (sufficient control/influence by a person pierces it). Viable only if: no admin/upgrade/pause/fee-drain key anywhere (ours or third party's), both counterparties sign, timeout-refund to senders, and we cannot influence parameters post-deploy. No CNV guidance read on code-only escrow — **UNVALIDATED, counsel must confirm**; the "indirect custody" reclassification risk is real because we deployed and documented the contract |
| 8 | Fixed fee (P3) per processed transaction, funds never touched, invoiced in fiat to the agency | **NO-PSAV** / **GRIS if netted** | Software fee ≠ art. 4 bis activity. GRIS/REJECTED if deducted from any AV amount (fee netting: red-line 6, TO §7.1 surrender breach for AR exports; and netting embeds our economics inside the value flow → Cat 1/2 characterization argument). Invoice separately, fiat, to the agency — as already decided in `ar/profile.md` process delta |

---

## C. Tangem's legal role in the stack

**What Tangem is (CONFIRMED, with extraction caveat).** Tangem AG —
Switzerland, UID **CHE-390.112.525**, Zug commercial register
CH-170.3.041.481-0, founded 2017-07-28, sector classified "IT services"
(moneyhouse.ch); HQ stated Zug (Baarerstrasse) with a 2025 annual report
mentioning a new Luzern HQ — LOCATION DISCREPANCY, INFORMATIONAL, immaterial
here. Backed by SBI Holdings. Its own company page states: "Tangem AG
provides **only hardware wallets and non-custodial software solutions**…
**Tangem is not regulated as a financial services provider or cryptocurrency
exchange. Tangem does not hold, custody, or control users' assets or
transactions**" (tangem.com/company, read 2026-10-28). ToS defines the
Tangem Wallet as the physical device **storing** the user's private/public
key pair (tangem.com/docs/en/terms-of-service.pdf, read via search extraction
2026-10-28 — snippet-level, flag SUSPICIOUS-lite for verbatim quoting).

**Is Tangem a CASP/PSAV anywhere?** No registration found in any regime read.
Under MiCA, self-custody wallets are **not** CASP services (wallet holds user
keys; no third-party custody service) — consistent with Tangem's own learning
content and with the ESMA register logic; **not independently queried in the
ESMA/CNV registers this pass — INFORMATIONAL absence, not CONFIRMED
non-registration**. In Argentina, nothing in RG 1172/2026 requires a
self-custody hardware maker to register: art. 2 iv) is precisely their
carve-out. **Tangem is not registered before the CNV as of this pass
(INFORMATIONAL).**

**Can Tangem be "the licensed custodian" replacing an Argentine PSAV?
NO — category error.** Tangem does not custody: it sells hardware and
software for the **user** to keep control (art. 2 iv definition: user keeps
control of the AVs and the access means; provider has no custody/administration/
disposal faculties). You cannot replace a Cat 4 PSAV with an art. 2 iv)
carve-out actor — they sit on opposite sides of the same line. And the
custody question was never the FX question: even a fully licensed AR Cat 4
custodian **cannot** do the ARS/USD leg — that is reserved to TO §1.1
BCRA-authorized entities (Ley 19.359 art. 1 a). A "foreign custodian"
argument does not help either: art. 1 ¶2 + art. 4 make a foreign PSAV
register and localize when serving AR residents under the nexus modalities.

**Does Tangem multi-sig by the exporter's board resolve anything legally?
No — it is governance UX, not authorization.** No AR instrument read
(Ley 19.359, BCRA TO, RG 1172, CCyC parts read) regulates hardware-card
multi-sig for corporate payment authorization as such (INFORMATIONAL
absence — sociedades law and the company bylaws govern who binds the company;
not re-read this pass, counsel). What multi-sig does: implement the company's
internal signing policy on the device. What it does **not** do: discharge the
export-surrender duty (TO §7.1 runs on cobro/cumplido, not on signature
ceremony), substitute MCF liquidation, or convert a Ley 19.359-forbidden FX
operation into a lawful one. This confirms the prior finding
(`fideicomiso-viability.md` claim 7, CONFIRMED structural points).

**Partnership posture.** A Tangem partnership is compatible with the
non-custodial stack **as a tools + distribution partnership** (co-marketing
of self-custody for corporate signers, SDK integration for signing UX). It
must never be positioned as "Tangem is our custodian" or "our regulated
custody layer" — that would be misleading advertising under this regime's
posture (art. 33 anti-misleading standard for PSAVs; art. 34 name-confusion
prohibition — and we are not a PSAV, so also false-as-to-us) and would
contradict Tangem's own public positioning. New red-line 27 below.

---

## D. Verdict + recommended stack

**Verdict: PROMISING.** A legal, non-custodial stack with crypto on the rail
exists — narrowly, and with an explicit list of things Treazury never does.

**The product, in eight lines.** Treazury is the **compliance-clock and
commercial-documentation layer** for export/import agencies: it tracks the
Com A 8481 / SECOEXPO deadlines (20 bd from cobro as the binding inner clock,
30/60/180/365 from cumplido as the outer cap), generates and gates commercial
documents, and returns payment routes — never funds. Crypto sits on the rail
as **client-side self-custody**: buyer and exporter hold keys on their own
Tangem cards (art. 2 iv carve-out for Tangem; control exclusivo stays with the
user, keeping everyone outside Cat 4). Where protection against impago is
needed, an **optional non-administered escrow smart contract** (both parties
signers, no admin/upgrade key, timeout refund) can hold value — usable inside
the lawful ≤20-bd window for AR exporters, or as the default shape for the
no-surrender corridors (MX/US direct, per `flow-matrix.md`). The **ARS/USD
conversion and any cross-border remittance leg is executed by a contracted
BCRA-authorized MCF entity**, and the crypto leg — if intermediated at all —
by a CNV-registered PSAV partner (none contracted today; red-line 2).
Treazury earns a **fixed fiat SaaS fee invoiced separately to the agency** —
never netted from any collection. **What Treazury never does** (→ red-lines
22–27): hold keys/shards/recovery material or any signing credential; custody
or administer client AVs or hold any faculty over a contract that does;
execute, sign, broadcast or relay client transfers; act as OTC
counterparty or market-maker on any AV↔fiat or AV↔AV leg; deduct fees from
value flows; or market any actor (including Tangem) as "our custodian".
Result: **PROMISING** — the software pivot is clean on the current text; the
crypto-on-rail value is real but thin (route + clock + docs); and the
monetizable AR pain (escrow-until-cumplido) remains BLOCKED
(`export-flow-escrow.md`). NOT VALIDATED until (a) counsel confirms the
smart-contract-escrow / "indirect custody" question and the Cat 4
reclassification practice, (b) an MCF/PSAV partner is actually contracted,
and (c) the founder accepts the ≤20-bd window as the product's outer promise.

**Explicitly out (re-escrow-until-cumplido, Treazury-as-fiduciario,
imports-AR, China) stays out** — nothing in this boundary memo reopens those
verdicts.

## Founder decisions (via COO — not decided here)

1. **PA-R5 scope:** does "structures that hold USDC" (AGENTS.md:202-203) bar
 *any* escrow contract, or only platform-*controlled* ones (the red-line 1
 evidence was the owner-key refund power)? Needed before scenario 2/7 can
 leave GRIS at the product-policy layer. (Regulatory answer is separate:
 NO-PSAV only under the strict conditions in matrix #7.)
2. **Corridor posture:** ship the clock/docs SaaS with crypto rails only for
 no-surrender corridors first (MX/US), or hold AR until a licensed partner
 exists?
3. **Partner mandate:** authorize the COO to source (i) a BCRA-authorized
 MCF entity for FX legs and (ii) a CNV-registered PSAV for any intermediated
 crypto leg — no named partner in copy until signed (red-line 2).
4. **Tangem outreach:** approve a tools/distribution partnership framing (no
 custody language anywhere), and commission a counsel-checked partner brief
 before any joint marketing.

## Counsel escalation (licensed AR attorney, via COO)

1. CNV practice on Cat 4 "instrumentos que permitan el control": smart
 contracts with **no** admin key, deployed by a non-PSAV software vendor —
 is the vendor ever treated as indirect custodian? (Load-bearing for matrix
 #7.)
2. The art. 5 b) bank question (carried): may a BCRA-authorized bank perform
 AV custody/administration under its own regime without PSAV registration,
 or must the FX partner be dual-rail (bank + PSAV affiliate)?
3. Referral/affiliation economics: at what fee-linkage does a software
 vendor recommending an OTC become "participation" in Cat 1/2 (art. 4 bis
 v)-adjacent reasoning)?
4. Foreign-entity posture: if Treazury Inc. is non-AR, confirm that zero
 art. 4-bis activity + no art. 4 nexus keeps it fully outside RG 1172 (the
 text so indicates — art. 4 only bites foreign entities performing PSAV
 activities — but counsel to confirm against any CNV guidance on SaaS to
 AR users).

## Evidence index & limits

- Primary AR: RG 1172/2026 texto original (argentina.gob.ar norma-431259,
 read 2026-10-28) — arts. 1–10 (registration, exclusions, nexus, categories,
 net worth), 16–18 (custody architecture, proof of reserves, prudentials),
 21 (smart-contract audit for PSAV operatoria), 33–34 (advertising),
 36 (third-party convenios, full PSAV responsibility), 38 ¶2 (nature over
 form), 45 (foreign sponsor carve-out). Ley 25.246 art. 4 bis definition via
 considerandos (same read).
- Carried AR: Ley 19.359 + BCRA TO §1.1/§7.1 clocks (`export-flow-escrow.md`
 A.2/A.4, CONFIRMED 2026-10-28); fideicomiso/PA-R5 collision
 (`fideicomiso-viability.md` §3); CN block (`cn/profile.md`, 银发〔2026〕42号).
- Tangem: tangem.com/company + ToS + moneyhouse.ch (search-extracted
 snippets 2026-10-28 — verbatim quotes marked; ESMA/CNV register queries
 not performed: INFORMATIONAL).
- Repo: PA-R5 AGENTS.md:202-203; red-lines 1–7, 21; flow-matrix rows AR/MX/US.
- Non-lawyer flag: decision-support by a non-attorney agent. No CNV giros,
 no enforcement cases, no BCRA/CNV administrative practice reviewed.
 Applicability determinations, regulator correspondence and any binding
 commitment belong to a licensed Argentine attorney and the founder
 (surfaced via the COO).
