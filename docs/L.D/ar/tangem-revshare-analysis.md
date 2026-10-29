---
dept: L.D
scope: ar
kind: analysis
status: draft
as_of: 2026-10-28
sources:
 - "AR · CNV RG 1172/2026 (B.O. 15-10-2026), Cap. III Tít. XIV — arts. 1 (¶1–3), 2 (i–iv), 3, 4 (modalities 1–5), 5 (a–c), 9 (cats 1–5), 10, 33 (¶1–3), 34, 35, 36, 38 ¶2 · https://www.argentina.gob.ar/normativa/nacional/norma-431259/texto (read 2026-10-28, full texto original re-extracted this pass)"
 - "AR · Ley 25.246 art. 4 bis (PSAV definition, five activities, 'como negocio… para o en nombre de otra persona') — verbatim in RG 1172/2026 considerandos (read 2026-10-28)"
 - "AR · Ley 19.359 TO 1995 art. 1 a) (negotiation of foreign currency without an authorized institution — criminal core) + art. 2 a)/e)/f) (carried from docs/L.D/ar/fideicomiso-viability.md:208-217, CONFIRMED 2026-10-28)"
 - "CH · Tangem — affiliate/referral program pages + in-app swap/staking provider disclosures · https://tangem.com/en/affiliates · https://tangem.com/en/help-center/swap/ · https://tangem.com/en/blog/post/how-to-stake-cryptocurrency/ · https://tangem.com/en/blog/post/tangem-moonpay-trade/ · https://tangem.com/en/blog/post/tangem-mobile-wallet-vs-bluewallet/ · https://stakekit.ghost.io/tangem-powering-mobile-first-multi-chain-staking/ (read 2026-10-28 via search extraction — snippet-level, flagged where verbatim)"
 - repo: docs/L.D/global/non-custody-boundary.md (aven, 2026-10-28); docs/L.D/global/red-lines.md items 1–27; AGENTS.md hard rule 5 / PA-R5 (AGENTS.md:202-203); docs/L.D/ar/fideicomiso-viability.md §3; docs/L.D/ar/export-flow-escrow.md A.2/A.4
 - aven (this task, 2026-10-28); Engram topic naiam-si/treazury/legal.tangem-revshare
---

# Argentina — Tangem affiliate rev-share (30% on in-app swaps/staking): can Treazury collect?

Decision-support for the founder and for licensed AR counsel. **Not legal
advice, not a binding opinion, no commitment on behalf of Treazury or the
founder.** Jurisdictions: Argentina (CNV RG 1172/2026, BCRA/Ley 19.359) as
the exposure side; Switzerland (Tangem AG, payer) as the contract/tax side.
Non-lawyer limits: the affiliate/partner **agreement text has not been
reviewed** (a 33-contracts-review pass is a precondition — red-line 32
below); no CNV giros or enforcement practice on promoter/rev-share
characterization were read; Swiss withholding and AR income-tax treatment of
crypto-denominated service fees are flagged INFORMATIONAL for the CFO.
Verdict vocabulary: structural/compliance claims use VALIDATED / PROMISING /
UNVALIDATED / REJECTED; factual findings use CONFIRMED / SUSPICIOUS /
INFORMATIONAL.

**Top-line verdict: CONDITIONAL.** Receiving a marketing/referral fee from
Tangem AG for promoting **self-custody hardware** is not, on the current
RG 1172/2026 text, one of the five art. 4 bis PSAV activities, and therefore
does not by itself trigger CNV registration for Treazury or the founder.
But the fee as confirmed — **30% of the revenue of in-app swaps and staking**
— is not a classic flat referral fee: it is a volume-linked participation in
the economics of AV↔AV exchange activity (Cat 2) performed in Argentina-adjacent
flows by Tangem's third-party providers. Collecting it while **promoting those
features to Argentine residents** is the version that approaches the
"participation" threshold escalated in `non-custody-boundary.md` escalation 3
and should be treated as BLOCKED until counsel signs off. The defensible
version — collect the 30% on the **self-custody/hardware** angle, no
swap/staking marketing to AR residents, contract assigned to the entity,
segregated accounting — is CONDITIONAL-to-PERMITTED.

---

## 1. Nature of the payment: referral fee vs "participation in a PSAV activity"

**Who is the obligated subject under RG 1172/2026 (CONFIRMED text).**
Art. 1 ¶1 obligates "*las personas humanas residentes… y las personas
jurídicas constituidas en la República Argentina que realicen una o más de
las actividades u operaciones comprendidas en la Definición de PSAV*" —
the subject is the **performer** of one of the five activities. Art. 4 bis
(the definition, quoted in the considerandos) requires the activity be
performed "*como negocio… para o en nombre de otra persona humana o
jurídica*". **There is no standalone "promoter / introducer / revenue-share
participant" registration category in the regulation.** The five categories
of art. 9 are exhaustive activity labels (exchange AV↔fiat, exchange AV↔AV,
transfer, custody/administration, issuer-offering services). A person who
performs none of the five is not a registrable PSAV, whatever their
marketing relationship with one.

**"Participación" in Cat 5 is not a rev-share concept (CONFIRMED — this is
the load-bearing textual finding).** Cat 5 reads: "*Participación y
provisión de servicios financieros relacionados con la oferta o venta de un
Activo Virtual por parte de un emisor. Se considerará en esta categoría a
quienes presten servicios a través de plataformas, aplicaciones móviles a
emisores para la realización de la oferta inicial de Activos Virtuales o
como medio público de captación de fondos destinados al financiamiento de
sus proyectos*" (art. 9 Cat 5; read 2026-10-28). "Participación" there
means **participating in an issuer's (initial) offering** — ICO/launchpad
economics — not sharing in the operating revenue of an exchange or staking
service. Cat 5 therefore does **not** capture a marketing fee on swap/staking
volume. (This corrects a possible misreading of the founder brief: there is
no Cat 5 hook in this arrangement, and the boundary memo's Cat 5 = LOW-risk
verdict for this venture is unchanged.)

**Does the high percentage (30%) change the characterization? (UNVALIDATED —
counsel question, honestly framed.)** On the text, the *rate* of a fee does
not convert a non-performer into a performer: art. 1/4 bis turn on whether we
"realizamos" (perform) one of the activities for another person, not on how
our revenue correlates with someone else's. However, two conduct-level
postures cut against a clean answer: (i) **art. 38 ¶2** — the CNV expressly
looks to "*la naturaleza jurídica y económica de los derechos conferidos y a
la operatoria efectivamente desarrollada, con independencia de la
denominación comercial del producto o la tecnología utilizada*". That clause
is written for offerings of securities, but it is the CNV's stated
substance-over-form posture, and the same "control o influencia suficiente"
logic appears in art. 2 iii). (ii) A fee that is **30% of the in-app swap
and staking revenue of referred users** is economically a franchise/agency
share of an exchange-and-staking book, not a marketing invoice. The argument
"we merely promote" gets weaker the more our P&L is a linear function of the
AV-exchange volume of AR-resident users we introduced. **This is precisely
the counsel escalation 3 already on file** (`non-custody-boundary.md`: "at
what fee-linkage does a software vendor recommending an OTC become
'participation' in Cat 1/2"). 30% is a high linkage; no CNV guidance on a
threshold was read (INFORMATIONAL gap, not a REJECTED structure).

**Art. 33 ¶3 — promoters exist as a regulated concept, but the constraint
runs the other way (CONFIRMED text).** "*Las personas que promocionen las
actividades del PSAV deberán abstenerse de promocionar, publicitar o difundir
actividades vinculadas al mercado de capitales y viceversa… exclusivamente
respecto de las actividades que el PSAV se encuentre autorizado a realizar*"
(art. 33 ¶3). Two things: (a) CNV contemplates "persons who promote the
activities of a PSAV" without making them registrable — the constraint on
promoters is a **cross-promotion ban** (don't mix capital-markets promotion
with PSAV promotion), not a registration duty; (b) it presupposes the
promoted entity is a **registered, authorized PSAV**. Tangem is not one (art.
2 iv carve-out — self-custody hardware/software provider; see boundary memo
§C). So art. 33 ¶3 does not literally bind our Tangem promotion — but it
shows the CNV's expectation that promotion of AV services track back to an
authorized operator, and it signals how a promoter would be treated if the
underlying operator were ever registered.

**Art. 34 — the "don't look like a PSAV" rule (CONFIRMED text).** No
non-registered person may "*utilizar un nombre o una razón social, emitir
comunicaciones publicitarias… o valerse de cualquier otro medio de difusión
que sugiera que es un PSAV o que pueda crear confusión al respecto*". Any
Treazury content that presents our brand as the exchange/staking surface
(banner swaps, "trade on Treazury", rate tables) crosses this. Art. 35 (third
parties may *reference* a registered PSAV, with identification and clear
info) is the safe-harbor-shaped clause — again presupposing a registered
PSAV, which Tangem is not, so it cannot be leaned on directly
(INFORMATIONAL — no CNV practice read on referencing a foreign non-PSAV).

**Factual finding on the payment rail (CONFIRMED, Tangem's own pages).**
The **public** in-app referral program pays a flat **5–10 USDT per hardware
wallet purchase**, delivered "*no later than 30 days after each purchase*",
commission "*sent directly to your USDT TRC20 wallet address*"
(tangem.com/en/affiliates + referral FAQ, read 2026-10-28). A **30% rev-share
on in-app swaps and staking is not that program** — it is a custom /
ambassador-tier commercial arrangement. **SUSPICIOUS until the actual
agreement text is reviewed** (red-line 32): the founder-confirmed figure is
taken as verified for this analysis, but L.D has not seen the contract, and
the contract's definition of the revenue base (does it include buy/sell
on-ramp fees? which territories? assignment and termination clauses?) decides
how much of this memo's risk analysis even applies.

---

## 2. Who actually operates the in-app swaps and staking? (CONFIRMED at snippet level; register queries not performed)

**Swaps — third-party providers, Tangem as aggregator/frontend.** Tangem's
own help center: "*The Tangem app supports in-app exchanges through
third-party services… The Tangem app will show you the provider offering the
best rates*" (tangem.com/en/help-center/swap, read 2026-10-28). Tangem's
own disclaimer, repeated across its content: "*Crypto transaction services
are provided by third-party providers. Tangem provides no advice or
recommendation on the use of these third-party services*". The provider list
is public: 1inch, OKX DEX, LI.FI, Jupiter, Changelly, ChangeHero, SimpleSwap,
ChangeNOW, plus MoonPay Trade and SwapKit/Chainflip routes (tangem.com
comparison and blog pages, read 2026-10-28). For CEX-style providers, KYC
and ToS are the *provider's*, not Tangem's ("*Tangem cannot determine the
KYC rules and is not responsible for services' actions*").

**Staking — third-party validator/infra providers, user signs from own
wallet.** "*Yield.xyz — Tangem Wallet's staking provider — covers slashing
protections and all node downtime*" (tangem.com staking guide, read
2026-10-28); Cardano staking via **P2P.org** ("*Users keep full control of
their private keys*"); a Tangem-branded Solana validator is run through
Yield.xyz white-label (stakekit.ghost.io, read 2026-10-28). Stablecoin
yield is an Aave integration (Tangem Annual Report 2025 page). In every
documented flow, **the user taps their own card to sign**; the provider
executes against the user-signed transaction.

**Legal read (PROMISING for the "mere marketing of a self-custody tool"
thesis, with a caveat).** On this evidence, the Cat 2 (AV↔AV) operatoria of
a Tangem swap is performed by **the third-party provider** (Changelly et al.)
against a **user-signed** transaction; Tangem's role is aggregation, rate
display, and signing UX — its own art. 2 iv) posture ("*exclusivamente
servicios de software o hardware de billeteras de autocustodia*"). The user
retains control of the assets and of the access means at all times; no one in
the chain we rely on takes custody. That makes a referral commission for
**recommending a self-custody hardware wallet** — flat or percentage — the
most defensible version: we point users at a tool whose defining feature is
that the user stays in control, and the exchange legs are the user's own
on-chain acts signed with the user's own keys.

**Caveat (SUSPICIOUS, partner-side, not ours).** If the CNV were ever to
characterize Tangem's aggregation + best-rate routing + fee share as
performing "intermediación" itself, Tangem's art. 2 iv) carve-out ("*siempre
que no realicen actividades comprendidas en la definición de PSAV*") would
be in question — and a fee stream we depend on is only as durable as the
payer's own characterization. Also unverified this pass: whether any of the
named providers holds a CNV PSAV registration (no register query performed —
INFORMATIONAL absence). Neither point changes Treazury's own art. 1/4 bis
analysis; both matter to the **durability of the revenue stream** and to
indemnity/termination terms in the contract (red-line 32).

---

## 3. Concrete exposure for Treazury — verdict per scenario

| # | Scenario | Verdict | Why (article / evidence) |
|---|---|---|---|
| 3a | Collect the rev-share while Treazury runs its non-custodial trade-docs SaaS (current stack) | **CONDITIONAL** | The fee itself is not one of the five art. 4 bis activities (we perform no exchange/transfer/custody for the referred user — they sign with their own Tangem). A second commercial relationship with a Swiss counterparty is lawful in itself. CONDITIONAL because: (i) the agreement text is unreviewed (red-line 32); (ii) the fee must stay contractually and operationally **outside** the core product — no netting, no discount embedded in the SaaS price, no "use Treazury → Tangem rewards" inside the agency app (analogue of red-line 26, which exists for exactly this characterization logic); (iii) if AR-resident promotion of swaps/staking is in the picture, see 3b/3e. Separate invoicing/accounting, own-account receiving wallet, non-custody stack untouched → the second activity stays a **receivable**, not a parallel PSAV. |
| 3b | Does collecting a rev-share on AV activity obligate registration even if we don't operate? | **CONDITIONAL → BLOCKED if AR-targeted swap/staking promotion** | On the text: NO. Art. 1 ¶1 + art. 4 bis obligate the **performer** ("que realicen… para o en nombre de otra persona"); Cat 5's "participación" is issuer-offering participation (art. 9 Cat 5, quoted §1), not rev-share; art. 33 ¶3 regulates promoters but does not register them. There is no promoter/revenue-sharee registration hook in RG 1172/2026 (CONFIRMED). CONDITIONAL because art. 38 ¶2 (nature over form) and art. 2 iii)'s influence test show the CNV's conduct-level posture, and a 30%-of-swap-volume economics is the exact "participation" question escalated at `non-custody-boundary.md` escalation 3 — UNVALIDATED, counsel must answer. **BLOCKED variant:** running paid promotion of Tangem swaps/staking **clearly directed at AR residents** — that is not us registering, but it manufactures the art. 4 modality 3/4 nexus ("claro direccionamiento" / "publicidad claramente dirigida a residentes") for the **foreign** providers/Tangem, makes us the documentary evidence of that targeting, and drags our economics into an unregistered cross-border Cat 2 flow — conduct we already treat as blocked when performed by ourselves (red-line 23). |
| 3c | Is the rev-share incompatible with PA-R5? | **PERMITTED (with segregation conditions)** | PA-R5 / hard rule 5 bars platform wallets, passthroughs, and structures that hold **client** USDC (`AGENTS.md` hard rule 5, at :202-203). The rev-share custodies nothing of anyone's: it is a receivable from Tangem AG paid in USDT **to the payee's own wallet** (Tangem's payout rail, tangem.com/en/affiliates). Receiving AVs as consideration for one's own services is expressly outside the PSAV definition (art. 2 ii) — "*reciban o entreguen Activos Virtuales como contraprestación por… la prestación de sus productos o servicios*"); holding them own-account is art. 2 i) territory. Conditions: the receiving wallet must never be, or look like, a platform/client-value structure; never commingle with any client flow or platform contract; never market it as part of the "stack". |
| 3d | Does collecting a rev-share on swaps/staking reach Ley 19.359 art. 1 a) even without touching ARS? | **PERMITTED for AV↔AV / self-custody promotion; BLOCKED for any ARS-leg or on/off-ramp promotion** | Art. 1 a) criminal core = negotiation of foreign currency without a TO §1.1-authorized institution (carried: `fideicomiso-viability.md:208-217`). AV↔AV swaps (USDC↔BTC, USDT↔SOL) are **not** exchange of divisas — crypto are not "moneda de curso legal" nor foreign currency under the BCRA regime read (INFORMATIONAL — the BCRA/CNV boundary of "divisa" vs AV is stable in our prior reads but no fresh instrument was pulled for this memo). A referral fee on AV↔AV volume, with no ARS leg and no counterparty role for us, does not enter art. 1 a). **But**: the Tangem app also embeds fiat on/off-ramps (Mercuryo, MoonPay, Simplex, Unlimit — buy with card/Apple Pay/bank transfer; MoonPay off-ramp). If the contract's 30% base includes **buy/sell (fiat↔AV) revenue** of referred AR residents, promoting that leg to AR residents is promoting an AV↔fiat operation (Cat 1) by an unregistered foreign provider into Argentina, with us as the introducer paid on its volume — the version closest to the criminal-adjacent conduct family (red-lines 5/8/21/23). Verify the revenue-base definition in the contract **before** collecting (red-line 32); if on-ramp revenue is included and AR-targeted promotion exists → BLOCKED. |
| 3e | Does promoting the Tangem app to AR residents have its own restriction? | **CONDITIONAL** | There is no standalone "advertising ban" for AVs outside the PSAV regime in the text read — the hooks are: **art. 34** (don't suggest *we* are a PSAV / create confusion — CONFIRMED); **art. 33 ¶1** anti-misleading standard (by analogy; it binds PSAVs directly, and false-as-to-us is still false); **art. 4 modalities 3/4** (a foreign legal person performing PSAV activities is dragged into the CNV register by "claro direccionamiento a residentes" or "publicidad claramente dirigida a residentes", reverse-solicitation carve-out only) — i.e., **our AR-targeted promotion is the legal trigger for the foreign party's registration duty**, and a revenue-sharing promoter is the strongest possible evidence of "clear direction"; **art. 45** (even unregistered foreign PSAVs get only a narrow event-sponsor carve-out, reinforcing that promotion-to-AR is the regulated gateway). No CNV/BCRA rule specific to "promoters of AV services" was found beyond art. 33 ¶3 (INFORMATIONAL absence). Net: promoting **hardware/self-custody** to AR residents is not itself restricted (a wallet is a tool, art. 2 iv); promoting **swap/staking/on-ramp services** to AR residents while taking 30% of their revenue is the CONDITIONAL-to-BLOCKED line — treat as restricted until counsel clears it. |

---

## 4. Agency and cross-border risk

**Persona física vs entity (founder decision — surfaced, not decided here).**
The founder registered "*posiblemente como individuo*" (founder-confirmed
fact, this task). Three reasons the assignment to the entity is the better
posture once an entity exists:

1. **Registration-threshold asymmetry (CONFIRMED text).** If the conduct were
 ever recharacterized as performing a PSAV activity, a *persona humana
 residente* must register once the activities exceed **UVA 35.000 per
 calendar month** (art. 1 ¶3) — a low bar in USD terms (exact USD
 equivalent at today's UVA/TC not computed here — INFORMATIONAL, CFO to
 model). Worse for an individual: **natural persons may only register for
 cats 1 and 2** (art. 9, final paragraph before the categories: "*Las
 personas humanas sólo podrán realizar las actividades previstas en las
 CATEGORÍAS 1° y 2°*") — an individual has no path to register a
 cat-3/4/5 activity at all, so a personal posture that drifts into
 anything beyond exchange is unregistrable, not just unregistered. An
 entity (SAS/SRL/SA) also carries the USD 150k/75k/35k net-worth ladder
 (art. 10) — real cost, but at least a path.
2. **Personal liability tail (carried, CONFIRMED).** Ley 19.359 art. 2 f)
 imposes solidaria liability where directors/legal reps use the company's
 means for an FX infraction "en nombre, con la ayuda o en beneficio de la
 misma" — an individual acting personally has no corporate shield and no
 allocation of conduct. Personal receipt of a rev-share whose base is
 ever questioned puts the individual's own patrimony directly in scope.
3. **Credibility of the non-custody story.** The whole stack thesis
 (`non-custody-boundary.md` §D) runs on Treazury being a software company
 with licensed partners — a rev-share booked to the founder's personal
 USDT wallet is the opposite optic for any future partner, investor, or
 regulator conversation.

**Recommendation (via COO):** assign the affiliate/partner agreement to the
entity (or a to-be-formed entity) as soon as it exists; if no entity exists
yet, the founder should decide whether to (i) form the entity first and then
assign, or (ii) collect personally in the interim under a written side letter
reserving assignment — **founder decision, surfaced via COO, with counsel
reviewing the assignment mechanics** (the contract's assignment clause must
be read — red-line 32).

**Is he "Tangem's agent in Argentina"? (SUSPICIOUS — depends on the
contract.)** Under Argentine private law, an *agencia* involves permanence
and a power to **bind** the principal vis-à-vis third parties (CCyC agency
regime — not re-read article-by-article this pass, INFORMATIONAL, counsel).
A pure performance-based marketing affiliation with **no representation
power, no authority to contract on Tangem's behalf, no client-facing
contracts in Tangem's name** is not an agency — but many affiliate agreements
contain "agent", "representative", "reseller" or "partner in territory X"
language that creates exactly that argument, plus (in crypto affiliate
deals) indemnity and "comply with local law" clauses that backfill the
compliance risk onto the promoter. **The contract must be read for: the word
"agent/representative", territory grants ("Argentina"), exclusivity,
indemnification, the revenue-base definition, and payment-in-crypto
mechanics.** Until then, treat the agency question as SUSPICIOUS and avoid
the words "agent"/"representative"/"official partner in Argentina" in any
AR-facing content (supports red-lines 30/32).

**Tax/withholding — model, don't assume (INFORMATIONAL, CFO-owned).**
Payer: Tangem AG (Switzerland). Payee: AR resident (individual or entity).
Flags for the CFO model, none verified here: (i) Swiss federal withholding on
service/agency fees to non-residents is generally lighter than on
royalties/dividends, and may be nil absent a Swiss PE — **verify with a CH
adviser**, do not assume zero; (ii) AR side: income qualifies as
exportación de servicios (Ganancias, tech/export regime — rates and the
bring-the-funds-home deadline matter; monotributo exportación treatment if
individual); (iii) the fee arrives **in USDT TRC-20 to a Tangem wallet** —
crypto-denominated service income has ARCA reporting consequences (GAN/RCG
crypto regimes) and an FX-layer question: receiving AVs as consideration for
services is art. 2 ii)-clean on the PSAV side, but the **tax**
characterization of "paid in stablecoin" is a separate AR/CH workstream;
(iv) a foreign payer may run its own KYC/tax forms (W-8BEN-E / CH forms) —
the founder should not sign tax certifications without the CFO seeing them.
**None of this is a CNV/PSAV issue; all of it is a "should we collect as
individual or entity" input.**

---

## 5. New red lines (added to `docs/L.D/global/red-lines.md`, items 28–32)

Conditions under which the rev-share moves from BLOCKED-adjacent to
COLLECTIBLE. Each is a never-do, appended to the global red-lines index
(scope-tagged):

- **28 (ar / global-PSAV):** Never promote Tangem's in-app swap, staking,
 yield, or fiat buy/sell (on/off-ramp) features to Argentine residents or
 in any content clearly directed at AR residents (Spanish-for-AR landing
 pages, AR-targeted ads, AR-influencer campaigns paid by the rev-share).
 Promote only the **self-custody hardware / wallet-security** angle of
 Tangem, and only outside AR-targeted paid promotion, until licensed AR
 counsel clears a broader scope. Basis: RG 1172/2026 art. 4 modalities
 3/4 (publicity/direction as the foreign operator's nexus trigger), art. 9
 Cat 1/2 (the promoted acts), art. 34 (no confusion as PSAV); red-line 23
 family.
- **29 (global):** Never let the rev-share touch a value flow or the core
 product funnel — no netting into SaaS pricing, no fee-skim from any client
 collection, no "use Treazury and earn Tangem rewards" inside the agency
 app or payment pages; book and invoice it as a separate third-party
 marketing receivable, in fiat-accounting terms, outside every client flow.
 Basis: analogue of red-line 26 (fee-inside-the-flow embeds our economics
 in the exchange activity); art. 4 bis conduct test.
- **30 (global):** Never describe the rev-share — in contract, deck, copy,
 or accounting narrative — as "participation in operations", "revenue share
 on crypto transactions", or anything implying Treazury participates in an
 exchange/staking business; never use "agent", "representative", or
 "official partner in Argentina" for Tangem; never present Treazury's brand
 as the swap/staking surface. Basis: art. 34 (confusion as PSAV); art. 38
 ¶2 substance-over-form posture; art. 33 ¶1 anti-misleading standard by
 analogy.
- **31 (global):** Never receive the rev-share into any wallet, account, or
 address that holds or touches client value, platform contracts, or
 settlement flows — a dedicated own-account receiving wallet only, fully
 segregated, never described as part of the product "stack". Basis: PA-R5 /
 AGENTS.md hard rule 5 (:202-203); art. 2 i) own-account and art. 2 ii)
 consideration-for-own-services exclusions depend on the segregation being
 real.
- **32 (global):** Never **collect or accrue** the rev-share before the
 affiliate/partner agreement text has been reviewed under
 33-contracts-review — specifically the revenue-base definition (does it
 include fiat on/off-ramp fees?), territory/targeting and exclusivity
 clauses, assignment clause, indemnities, termination, and the
 crypto-payment mechanics. Basis: SUSPICIOUS — founder-confirmed 30%
 figure taken as verified, but the contract is unseen; every scenario in §3
 depends on the contract's actual scope.

---

## Verdict summary + founder decisions

**Structural verdict on "can Treazury collect the 30%?": CONDITIONAL.**
Validated building blocks: the fee is not one of the five art. 4 bis
activities on its face; Cat 5's "participación" is issuer-offering
participation, not rev-share (CONFIRMED, art. 9); receiving AVs as
consideration for own services is expressly excluded (art. 2 ii); the swap
and staking operatoria is performed by user-signed third-party providers
(CONFIRMED at snippet level); PA-R5 is not violated by a segregated
receivable. Conditions that must hold simultaneously: contract reviewed
(red-line 32), no AR-targeted promotion of swap/staking/on-ramp (red-line
28), economics kept outside the core funnel and value flows (red-line 29),
no PSAV/agency framing (red-line 30), segregated own-account receipt
(red-line 31). The one BLOCKED variant: paid, AR-resident-targeted promotion
of Tangem's exchange/staking/on-ramp features on a 30%-of-revenue basis.

**Founder decisions (via COO — not decided here):**
1. **Entity vs individual:** assign the agreement to the entity (recommended
 once an entity exists), or collect personally in the interim under a
 written assignment-reservation side letter — with the tax model from the
 CFO in hand (CH withholding, AR export-of-services, crypto-income
 reporting).
2. **Scope of promotion:** accept the "self-custody hardware only, no
 AR-targeted swap/staking marketing" boundary (red-line 28) — or
 commission a licensed-AR-attorney opinion on promoting foreign
 swap/staking to AR residents before any such campaign.
3. **Revenue base:** confirm from the contract whether the 30% base includes
 fiat on/off-ramp revenue; if yes and AR residents are in the referral
 base, treat the AR-targeted version as BLOCKED (§3d) pending counsel.
4. **Product-funnel separation:** decide whether any Tangem mention may
 appear inside the Treazury app/landing at all during alpha, or only on a
 standalone/neutral channel.

**Counsel escalation (licensed AR attorney, via COO — extends
`non-custody-boundary.md` escalation 3):**
1. At what fee-linkage does a promoter of a foreign non-PSAV's AV services
 to AR residents become a participant in Cat 1/2 conduct under art. 38
 ¶2 / art. 2 iii) reasoning? Is 30%-of-revenue above or below any CNV
 practice threshold? (Load-bearing; no giros read.)
2. May a non-registered person lawfully promote a foreign provider's
 swap/staking services to AR residents at all, given art. 4 modalities
 3/4 make that publicity the operator's registration trigger — and does
 the promoter share any exposure (art. 36 convenios logic by analogy, or
 general AML-promoter risk under Ley 27.739)?
3. Does the Tangem art. 2 iv) carve-out survive its aggregator role
 (best-rate routing + fee share) — relevant to the durability of the
 payment stream, not to our registration.

**Evidence index & limits.** Primary AR text (RG 1172/2026 full texto
original) read at article level 2026-10-28 for arts. 1–10, 33–36, 38, 45;
Ley 19.359 carried from `fideicomiso-viability.md` (CONFIRMED 2026-10-28).
Tangem facts from its own public pages (search extraction, snippet-level —
verbatim quotes flagged where load-bearing). Not done this pass: CNV/ESMA
register queries for the named swap providers; Swiss and Argentine tax
advice; review of the affiliate contract text (blocking — red-line 32); CNV
giros/enforcement practice on promoters and rev-share characterization
(INFORMATIONAL gap, the reason the top-line verdict is CONDITIONAL and not
VALIDATED). Non-lawyer limits: decision-support by a non-attorney agent;
applicability determinations, regulator correspondence and any binding
commitment belong to a licensed Argentine attorney and the founder
(surfaced via the COO).
