---
dept: M.D
scope: global
kind: research
status: provisional
as_of: 2026-10-27
sources:
 - https://cashabroad.one/ (accessed 2026-10-27; JS-only SPA — content via search cache of same URL)
 - https://www.cashabroad.one/tss (T&C, accessed 2026-10-27)
 - https://app.cashabroad.one/ (accessed 2026-10-27)
 - https://communityfund.stellar.org/project/cashabroad-smart-treasury-wla (accessed 2026-10-27)
 - https://communityfund.stellar.org/dashboard/submissions/recRhRDNW8zDJZBPA (accessed 2026-10-27)
 - https://www.techstars.com/newsroom/techstars-payments-powered-by-stellar-and-moneygram-announces-2024-class (2024-01-22, accessed 2026-10-27)
 - https://tracxn.com/d/companies/cashabroad/__eY2tV109f8JYVBFFRfvi5QFCzRUGOxGr-iE8Ew2XuxI (accessed 2026-10-27)
 - https://linkedin.com/company/cashabroad (via search cache, accessed 2026-10-27)
 - https://www.descubre.vc/noticia/cashabroad-la-plataforma-financiera-que-empodera-a-los-importadores-y-exportadores-mexicanos-2025-03-19 (2025-03-19)
 - https://www.dallasfed.org/research/pubs/25trade/a1 (2025-07-09)
 - https://www.imarcgroup.com/mexico-b2b-payments-market (accessed 2026-10-27)
 - https://mastercardcontentexchange.com/news/media/xl2l42gr/fxc_mc_whitepaper-en-final-25_06.pdf (accessed 2026-10-27)
 - https://www.worldports.org/china-bans-a-practice-that-affects-50-of-argentine-imports/ (2025-10-05)
 - https://forbes.co/2025/10/10/activos-digitales/fintech-latinoamericanas-abren-paso-a-un-nuevo-corredor-financiero-con-asia/ (2025-10-10)
 - https://mesta.xyz/resources/case-studies/mandioca (accessed 2026-10-27)
 - https://mesadepagos.com/en/learn/pay-china-suppliers/colombia (accessed 2026-10-27)
 - https://business.bitso.com/en/blog/stablecoins-business-payments-real-use-cases-latam (2026-08-03)
 - https://www.velafi.com/blog/velafi-and-minteo-strengthen-cross-border-payments-between-colombia-and-asia (2025-10-09)
 - https://www.ventureradar.com/organisation/Cash%20Abroad/76fae679-69ad-403a-8ffc-bf068bb2da11 (accessed 2026-10-27)
 - https://9439345.fs1.hubspotusercontent-na1.net/hubfs/9439345/INFORME_BITSOBusiness2025_ingles%20%281%29.pdf (Bitso Business H1 2025 report, accessed 2026-10-27)
 - https://ripple.com/ripple-press/ripple-and-bitso-expand-partnership/ (2026-06-11)
 - https://www.velafi.com/blog/best-stablecoin-payment-providers-latam (2026-08-10)
 - /home/kiox/treazury/docs/L.D/global/flow-matrix.md:38-84
 - /home/kiox/treazury/docs/T.D/global/crypto-rails-benefit.md:62-114
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:96-106
 - /home/kiox/treazury/docs/L.D/ar/profile.md:26-57,118-124
 - /home/kiox/treazury/docs/L.D/co/profile.md:24-55,115-121
 - /home/kiox/treazury/docs/L.D/mx/profile.md:24-55
 - /home/kiox/treazury/docs/L.D/us/profile.md:28-59
 - /home/kiox/treazury/docs/L.D/cl/profile.md:30-35
 - /home/kiox/treazury/docs/L.D/br/profile.md:29-33
 - /home/kiox/treazury/docs/L.D/global/red-lines.md:34-52
 - /home/kiox/treazury/src/i18n/en.ts:26-36
 - /home/kiox/treazury/src/onchain-facts.ts:62-65
 - aven (legal pass, 2026-10-26)
 - aven (this task)
---

# Treazury — candidate corridors for first international launch

Scope note (Rule 1 reconciliation, same pattern as `docs/L.D/global/flow-matrix.md`):
this is a **marketing index**, not a source of jurisdictional rules. Every
"legal delta" cell is a pointer to the corresponding `docs/L.D/<cc>/profile.md`
via the flow matrix; where the profiles are silent, the cell says so and is
marked INFORMATIONAL. Where a cell disagrees with a country file, the country
file wins. Market-pull cells carry their own URLs with access dates.

Verdict vocabulary: market/positioning claims → `VALIDATED / PROMISING /
UNVALIDATED / REJECTED`; factual findings → `CONFIRMED / SUSPICIOUS /
INFORMATIONAL`. Positioning sentences at the end are **drafts** — the founder
has not approved any new claim.

Hard constraint inherited from legal (aven, 2026-10-26): **no corridor
is sellable today** until the L.D profiles are ported into
`src/modules/jurisdiction/profiles/` and pass `bun run check`
(`flow-matrix.md:32-34,79-84`). Nothing in this document overrides that.

## 1. Corridor table

| Corridor | Payment pain today (evidence) | Incumbent / alternative | Market pull (evidence) | Legal delta (L.D pointer) | Fit with Treazury today |
|---|---|---|---|---|---|
| **AR→CN** | Argentine importers can only pay FX at customs clearance; ~60-day China transit makes supplier payment terms hard to negotiate (`infobae.com/movant/2025/08/22/...`, 2025-08-22); China STA 17/2025 killed license-borrowing for ~50% of Chinese sellers to Argentina (`worldports.org`, 2025-10-05) | Banks/SWIFT + comisionista; no stablecoin corridor player evidenced for AR→CN (INFORMATIONAL) | China exports to AR US$1.42B in July 2025, +66.9% YoY (`worldports.org`, 2025-10-05) | **Modified process, heaviest** — MCF/SECOEX liquidation, no fee netting, no platform payout; direct USDC receipt does not discharge surrender duty (`flow-matrix.md:40`; `ar/profile.md:26-30,118-124`) | **Poor.** USDC loses to SWIFT at every ticket once the AR FX gap is priced (`crypto-rails-benefit.md:64-65,76-80`) AND legal delta is the heaviest. REJECTED as a launch corridor |
| **MX→US** | Cross-border wires up to ~4% and 3–5 days while domestic SPEI clears in minutes (`openfx.com/blog/fx-cross-border-payments-mexico`, accessed 2026-10-27); 40% of LatAm international payments (ex-US) take >4 days (Mastercard/PCMI/K2 via `fastcompany.mx`, 2025-08-25) | US receiving banks/SWIFT; Bitso Business (licensed, SPEI, Ripple partnership `ripple.com` 2026-06-11); CashAbroad; Airwallex/Payoneer-class fintechs | Mexico = largest US trading partner; 15.5% of US goods imports 2024 (`dallasfed.org` 2025-07-09); MX B2B payments US$19.09B 2025 → US$34.08B 2034 (`imarcgroup.com`) | **No-delta** — base flow `permitted`, no FX channel (`flow-matrix.md:42,58-63`; `mx/profile.md:24-28`; `us/profile.md:28-32`) | **Good on law, tie on cost** — USDC ≈ SWIFT at $25k and $100k (`crypto-rails-benefit.md:66-67`). Sell = documents + transparency, not savings. Needs MXN off-ramp partner (none contracted, `mx/profile.md:50-55`) |
| **CO→US** | Colombian importers file Form 5/Declaración de Cambio on every outbound payment; bank monetización spread rarely best (`mesadepagos.com/en/learn/pay-china-suppliers/colombia`, accessed 2026-10-27) | Bancolombia/Davivienda/BBVA wires; Mesa de Pagos; Mandioca; EFY Finance (`forbes.co` 2025-10-10) | 13.7% of CO fintechs already use stablecoins, expected to double by 2027 (Finnovista via `velafi.com`, 2025-10-09); Mandioca moves "hundreds of millions" LATAM↔Asia with strong CO–China presence (`mesta.xyz`) | **Light/modified, direction matters** — export surrender blocks the *seller* side (`co/profile.md:24-28`); CO importer paying a US supplier is an outbound FX-declaration flow — profile is export-centric, import direction not directly covered = **INFORMATIONAL** (`co/profile.md:110` open question) | **Best economics of any non-mirror corridor** — USDC cheaper at every ticket (+$309 @ $25k, +$935 @ $100k; `crypto-rails-benefit.md:68-69`). Target CO *importers* (payers), not exporters, until L.D confirms |
| **AR→US** | Same AR payment-timing friction as AR→CN (`infobae` 2025-08-22) | US banks/SWIFT; local fintechs | US is AR's #2 trade partner (INFORMATIONAL — not re-cited here) | **Modified process, heaviest** (`flow-matrix.md:40`; `ar/profile.md:26-57`) | **Poor.** USDC loses to SWIFT at every ticket with the AR gap priced (`crypto-rails-benefit.md:70-71,76-80`). REJECTED |
| **CL→CN** | No corridor-specific pain source collected | Banks/SWIFT (INFORMATIONAL) | No demand evidence collected = **UNVALIDATED** | **Light delta** — BC Circular 768 export reporting >FOB $10k is a document-release gate; Ley 21.521 custody characterisation unresolved (`flow-matrix.md:46`; `cl/profile.md:30-35`) | **Unknown** — no CL→CN row in `corridor-model.py:96-106`, no cost numbers. UNVALIDATED, do not prioritize |
| **BR→US** | No corridor-specific pain source collected | Banks/SWIFT; Bitso BR/Pix ecosystem (INFORMATIONAL) | BR stablecoin volume growing (+2pp YoY share, Bitso Business H1 2025 report, accessed 2026-10-27) | **Light delta** — no surrender duty, but all currency legs through authorized FX institution; custody barred (SPSAV) (`flow-matrix.md:45`; `br/profile.md:29-39`) | **Unknown** — not in the cost model. UNVALIDATED pending F.D modeling and a demand check |
| **MX→CN** | China = 21% of Mexican imports, US$129.79B in 2024 (`dallasfed.org` 2025-07-09); suppliers need payment certainty under STA 17/2025 (`worldports.org` 2025-10-05) | Banks/SWIFT; CashAbroad explicitly targets "México, USA ó China" (`cashabroad.one`, accessed 2026-10-27) | Same China→MX import flow as above; MX nearshoring keeps inputs flowing (Dallas Fed) | **MX side no-delta; CN side has no L.D profile at all** — `docs/L.D/` contains no `cn/` (glob 2026-10-27); unknown = blocked for money movement (`flow-matrix.md:31-34`; `red-lines.md:50-52`) | **Blocked by missing CN profile.** Strong pull, zero legal footing today. Port a CN profile before considering |
| **US→MX** (mirror) | US payers lose 1.5–4% FX markup (`crypto-rails-benefit.md:93`) + 2–5 days on wires (`crypto-rails-benefit.md:111`) | Bitso Business, CashAbroad, bank wires | Same nearshoring pull as MX→US; Stellar SCF: CashAbroad customers process **$50K–$200K per payment**, US/MX-based with suppliers in CN/HK/BR (`communityfund.stellar.org`, accessed 2026-10-27) | **No-delta on both ends** — US `permitted`, MX `permitted` (`flow-matrix.md:42-43,58-63`) | **Best legal + economic fit.** USDC cheaper at every ticket (+$297 @ $25k; `crypto-rails-benefit.md:72,104-105`). Crowded market — needs the document layer to differentiate |
| **US→CO** (mirror) | Same US-side wire pain | Bank wires; Mesa de Pagos, Mandioca on the CO leg | CO stablecoin adoption evidence as above | **Seller-side blocked for resident exporters** — direct USDC receipt does not discharge reintegro (`co/profile.md:24-28`); merchanting (goods never cross CO) removes the duty but changes exporter of record (`co/profile.md:120`) | **Economically strong (+$243 @ $25k, `crypto-rails-benefit.md:73`), legally conditional** — only sell to non-resident/merchanting CO entities until L.D says otherwise |
| **US→AR** (mirror) | Same US-side wire pain | Bank wires; local casas de cambio | Weakest pull of the three mirrors — AR import easing since April 2025 (`trade.gov` 2025-04-23) reduced some friction | **Seller-side blocked** for resident exporters; heaviest delta (`ar/profile.md:26-30`) | Economically (+$251 @ $25k, `crypto-rails-benefit.md:74`) but legally the same surrender wall. Merchanting/non-resident only. Not a launch corridor |

Untested mirrors (US→CL, US→BR, MX→CO, etc.): no cost model row, no demand
evidence — INFORMATIONAL, not ranked.

## 2. Top 3 corridors for a first international launch

**#1 — US→MX (USD payer → Mexican seller).** The only corridor that is
simultaneously no-delta on both ends (`flow-matrix.md:42-43,58-63`),
economically USDC-positive at every ticket size (`crypto-rails-benefit.md:72`),
and demand-proven by two funded competitors (CashAbroad's $50K–$200K tickets on
the MX–US corridor, `communityfund.stellar.org`; Bitso Business handling 47% of
LatAm stablecoin volume from Mexico, Bitso H1 2025 report). Risk: it is the
most crowded corridor — Treazury wins only on the document layer, not on rails.

**#2 — MX→US (Mexican payer → US seller).** Also no-delta both ends, cost tie
with SWIFT (`crypto-rails-benefit.md:66-67`) — so the pitch is commercial
documents released on payment plus on-chain visibility, not savings. Pull is
the strongest of any corridor pair: Mexico is the largest US trading partner
with 15.5% of goods imports (`dallasfed.org`), MX B2B payments growing to
US$34B by 2034 (`imarcgroup.com`), and 90% of SMEs in Mastercard's cross-border
panel say they would consider changing providers (Mastercard SME whitepaper,
accessed 2026-10-27 — panel composition not re-verified, INFORMATIONAL). The landing already lists MX as coming soon
(`src/i18n/en.ts:36`) — the market is queued, the law permits it, the cost is
neutral.

**#3 — CO→US (Colombian payer → US supplier).** The only non-mirror corridor
where USDC beats SWIFT at every ticket size (+$309 @ $25k, +$935 @ $100k;
`crypto-rails-benefit.md:68-69,104-105`). Demand is independently evidenced:
CO fintech stablecoin adoption at 13.7% and rising (`velafi.com`), Mandioca
moving hundreds of millions on the CO–China axis (`mesta.xyz`), EFY Finance
building a LatAm–China stablecoin corridor with ICBC (`forbes.co`). Legal
caution: the L.D profiles are written around the *exporter* side — target CO
**importers paying suppliers** (outbound FX declaration flow, INFORMATIONAL
pending L.D confirmation of `co/profile.md:110`) or merchanting structures,
never a resident exporter receiving USDC directly (`co/profile.md:24-28`).

Why not AR: both AR corridors modeled lose to SWIFT once the official-vs-crypto
gap is priced (`crypto-rails-benefit.md:76-80`), AR carries the heaviest legal
delta of all eight profiles (`flow-matrix.md:40,68-72`), and the profiles say
plainly that merchanting is "a separate product line, not a label used to keep
the AR corridor alive" (`ar/profile.md:124`). Launching on AR first would be
launching on the worst economics behind the highest wall.

## 3. Where the landing's AR-centric message is wrong

`src/i18n/en.ts:34-36` leads with `ARGENTINA / LIVE` and groups
`VE · MX · CO · CL coming soon`. Three problems, all evidenced:

1. **"LIVE" is legally false.** No corridor is sellable until profiles are
 ported and `bun run check` passes (`flow-matrix.md:32-34`); AR is the
 *least* sellable of the eight — heaviest delta, surrender duty unextinguished
 by USDC (`ar/profile.md:26-30`), platform payout and fee netting both
 `blocked` (`flow-matrix.md:40`).
2. **AR is the worst-performing corridor in our own model.** AR→CN and AR→US
 both lose to SWIFT at $25k and $100k (`crypto-rails-benefit.md:64-65,70-71`).
 The landing sells the corridor our economics reject.
3. **The winning corridor (US→MX) is not on the list at all.** The mirror
 direction is where USDC wins at every ticket size (`crypto-rails-benefit.md:72,81-86`)
 — and the model doc itself flags this as a positioning input for the CMO.

Also inherited, still open: the "bank in 2–6 hours" claim
(`src/i18n/en.ts:29-31`) has no fiat off-ramp behind it (`crypto-rails-benefit.md:41-45`
— CONFIRMED absence) and is a standing red line (`red-lines.md:40-45`). No
landing edits in this task; the fix list goes to the founder via the COO.

## 4. Draft positioning sentences (NOT approved — founder must vouch)

- **US→MX:** "For US importers paying Mexican suppliers, Treazury is the
 settlement-and-documents layer that releases the commercial invoice the
 moment USDC lands — not a wire that sits in correspondent limbo for days."
 *(proof needed: document release gate actually shipped; USDC leg live on
 mainnet, not Arc Testnet)*
- **MX→US:** "For Mexican exporters invoicing US buyers, Treazury settles in
 stablecoin rails with full on-chain visibility and packing list + invoice
 released on payment — your bank shows you a number days later, if at all."
 *(proof needed: same as above; MXN/USDC ramp partner named)*
- **CO→US:** "For Colombian importers paying US suppliers, Treazury skips the
 multi-day SWIFT chain at a cost our model puts below every bank quote — with
 the paperwork generated, not re-keyed from WhatsApp threads."
 *(proof needed: corridor-model re-run with contracted partner fees; L.D
 confirmation that the importer direction is clear)*

All three are drafts under skill 12; none may ship without founder approval
and the proof prerequisites marked above.

## 5. Segment correction — who the ICP actually is

**The legal finding inverts the landing's audience.** A domestic Argentine or
Colombian goods exporter paid directly in USDC does *not* discharge its
FX-surrender duty (aven; `ar/profile.md:26-30`; `co/profile.md:24-28`),
so the person the current copy addresses — "import/export agencies" settling
for local exporter clients — is standing on the weakest possible footing. The
strongest footing is offshore merchanting/triangulation, where goods never
cross the seller's country and no local export-surrender duty attaches
(`ar/profile.md:124`; `co/profile.md:120`; `crypto-rails-benefit.md:148`).

**Operational ICP (what a salesperson can prospect):** a *triangular-trade
trading company or merchanting intermediary* — legal entity registered in a
no-delta or offshore jurisdiction (US, MX, or a free-zone/trading house),
buying from suppliers in one country and selling to buyers in another without
the goods transiting its own country's customs. Size signal: **US$15K–US$200K
per payment, recurring weekly or monthly** (range observed on CashAbroad's
described customer base — $50K–$200K at `communityfund.stellar.org`, $15K–$200K
at `ventureradar.com`, both accessed 2026-10-27 — INFORMATIONAL as a market
signal, not our data). Where they bank: operating
accounts in the US and/or Mexico (the no-delta pair), already comfortable with
USDC or one conversation away (71% of LatAm institutions use stablecoins for
cross-border payments — Fireblocks via `business.bitso.com`, 2026-08-03). What
they trade: physical goods with real commercial paperwork — electronics, auto
parts, nearshoring inputs moving China → MX/US (`dallasfed.org`) — where an
invoice + packing list with HS code and Incoterm is a daily artifact, not a
nice-to-have. Secondary segment: the **import/export agency** itself as a
multi-tenant operator serving exactly those merchanting clients, which is the
audience the product architecture (tenant, payment link, document release)
already assumes.

**Confidence: PROMISING.** The legal structure is cited ( + country
profiles), the demand signals are cited but borrowed from adjacent players
(CashAbroad, Bitso, Mandioca — none of them selling *our* combination of
non-custodial settlement + gated commercial documents), and we have **zero
first-party interviews or LOIs** with merchanting firms. That is the gap.

**Falsification test:** interview 10 triangular-trade operators or trading
companies (prospect list built from customs-broker and freight-forwarder
referrals in MX and CO). The ICP is REJECTED if fewer than 3 of 10 will commit
to routing one real US$50K+ payment through a non-custodial USDC rail with
document release on payment, **or** if L.D's answer to
`co/profile.md:110`/merchanting questions comes back that the structure still
triggers the FX duty for the local entity — either result kills the segment as
defined. Upgrade to VALIDATED only on cited LOIs/waitlist signups; today it is
PROMISING on borrowed evidence.
