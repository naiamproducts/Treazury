---
dept: M.D
scope: mx
kind: research
status: provisional
as_of: 2026-10-27
sources:
 - https://cashabroad.one/ (accessed 2026-10-27; React SPA — HTML shell only, `div id="root"` + `/assets/index-ms9hHeoE.js`; content obtained via search cache of the same URL)
 - https://www.cashabroad.one/tss (T&C, accessed 2026-10-27)
 - https://www.cashabroad.one/ppm (privacy notice, accessed 2026-10-27)
 - https://app.cashabroad.one/ (accessed 2026-10-27)
 - https://cashabroad.webflow.io/ (legacy marketing site; 404 on direct fetch 2026-10-27, content via search cache)
 - https://communityfund.stellar.org/project/cashabroad-smart-treasury-wla (SCF #41, accessed 2026-10-27)
 - https://communityfund.stellar.org/dashboard/submissions/recRhRDNW8zDJZBPA (SCF #11, accessed 2026-10-27)
 - https://communityfund.stellar.org/project/cashabroad (SCF #14/#21 listing, via search cache 2026-10-27)
 - https://www.techstars.com/newsroom/techstars-payments-powered-by-stellar-and-moneygram-announces-2024-class (2024-01-22)
 - https://tracxn.com/d/companies/cashabroad/__eY2tV109f8JYVBFFRfvi5QFCzRUGOxGr-iE8Ew2XuxI (accessed 2026-10-27)
 - https://tracxn.com/d/companies/cashabroad/__eY2tV109f8JYVBFFRfvi5QFCzRUGOxGr-iE8Ew2XuxI/funding-and-investors (accessed 2026-10-27)
 - https://linkedin.com/company/cashabroad (via search cache, accessed 2026-10-27)
 - https://www.descubre.vc/noticia/cashabroad-la-plataforma-financiera-que-empodera-a-los-importadores-y-exportadores-mexicanos-2025-03-19 (2025-03-19)
 - https://www.ventureradar.com/organisation/Cash%20Abroad/76fae679-69ad-403a-8ffc-bf068bb2da11 (accessed 2026-10-27)
 - https://medium.com/stellar-community/scf-10-candidate-pitches-7e5c137df858 (2022-06-23)
 - https://www.velafi.com/blog/best-stablecoin-payment-providers-latam (2026-08-10, competitor landscape)
 - /home/kiox/treazury/docs/M.D/global/corridors.md
 - /home/kiox/treazury/docs/T.D/global/crypto-rails-benefit.md:31-53,107-114
 - /home/kiox/treazury/docs/L.D/mx/profile.md:24-75
 - /home/kiox/treazury/docs/L.D/global/red-lines.md:79-90
 - aven (this task)
---

# CashAbroad — competitor teardown

Scope note: scoped `mx` because CashAbroad's entity, ramp, and home market are
Mexican; their claims about other jurisdictions are recorded as *their* claims,
not as facts about those jurisdictions. Every cell carries its observed source.
Pricing that is not public is stated as "not disclosed" — never estimated.

Access note: `https://cashabroad.one` is a JavaScript-only SPA (fetch 2026-10-27
returned only `<div id="root">` + bundle tags and tracking pixels). All page
content below comes from search-engine cache of the same URLs, read 2026-10-27;
quoted strings are from that cache. The blog (`/noticias`) is also SPA-only and
returned no readable content.

## 1. What they sell, to whom, which corridors

| Dimension | Finding | Evidence | Confidence |
|---|---|---|---|
| Product | Cross-border B2B payments + MXN↔USDC conversion using stablecoins; digital-dollar/euro accounts; concierge service; historical roadmap included invoices, mass/scheduled payments, approvals, accounting imports, and a Letter of Credit product (SCF award #21, $60K) | `cashabroad.one` homepage cache (headline + feature blocks); SCF #11 and #21 listings; `ventureradar.com` (loans/credits, $15K–$200K payments) | CONFIRMED (what they claim); actual product depth INFORMATIONAL |
| Buyer | Exporters/importers and manufacturers/logistics operators; personas físicas y morales (individuals and companies) with KYC/KYB; described elsewhere as SMEs | `cashabroad.one` FAQ cache; SCF #41 "manufacturers and logistics companies"; `descubre.vc` 2025-03-19 | CONFIRMED |
| Corridors | Stated: "operan entre México, USA ó China" with "salidas bancarias locales en +8 países". SCF: customers "based in the U.S. or Mexico with suppliers in China, Hong Kong, and Brazil", tickets $50K–$200K, in the "$900B Mexico–U.S. payment corridor" (their number). Origin pitch (2022) was Mexico→Colombia | `cashabroad.one` cache; SCF #41; SCF #11; Medium SCF #10 (2022-06-23) | CONFIRMED (claims) / corridor coverage INFORMATIONAL |
| Pricing | **Not disclosed publicly.** T&C: commission on operation amounts + a platform-use commission, "presentadas al usuario en cada operación" (shown per operation, in-app); free registration; no annual fee/membership | `cashabroad.one/tss` ch. 9 & 16; homepage FAQ "¿CashAbroad tiene anualidad? No" | CONFIRMED (structure), rate = not disclosed |
| Entity | CashAbroad México, S.A. de C.V. | `cashabroad.one/tss` | CONFIRMED |
| Scale | Founded 2022; 4 employees (LinkedIn, -50% YoY) / 2 (Tracxn, Sep 2026); 616 LinkedIn followers; total disclosed funding USD 20K (Techstars seed 2024) + Stellar Community Fund grants ($180K across SCF #11/#14/#21 per SCF dashboard; a third-party tracker says $255K total incl. #41 $75K — discrepancy INFORMATIONAL); offices Mexico City + San Francisco | linkedin.com/company/cashabroad (cache); Tracxn; SCF dashboard; lumenloop.com/projects/cashabroad | CONFIRMED except grant total (SUSPICIOUS — two sources disagree) |
| Backing | Techstars Payments powered by Stellar and MoneyGram (2024 class); Draper University × Stellar Embark (Nov 2024–Mar 2025) | techstars.com newsroom 2024-01-22; founders' LinkedIn posts 2025 | CONFIRMED |

## 2. Rails — stated vs inferred

| Rail element | Status | Evidence |
|---|---|---|
| Blockchain | **Stated:** "Operamos sobre Stellar y Starknet" | `cashabroad.one` homepage cache |
| Stablecoin | **Stated:** USDC ("Paridad 1:1 al USD… $60B+ en circulación"), digital USD/EUR accounts | homepage cache; legacy webflow cache |
| Custody | **Stated (T&C):** the platform "ofrecerá los servicios de custodia" of users' stablecoins; wallets live inside the platform | `cashabroad.one/tss` ch. 4 |
| Licensing posture | **Stated (T&C):** "CashAbroad no es una entidad financiera ni cuenta con autorización de autoridad alguna… únicamente ofrece servicios de software"; buy/sell executed by "Comisionistas autorizados" (authorized brokers, which the T&C's definition includes CashAbroad itself); claims operations are outside Mexican FX regulation; separately claims SAT alignment for "actividades vulnerables" | `cashabroad.one/tss` ch. 4 + definitions |
| On/off ramp | **Stated:** "Convert pesos to USDC and back instantly… 24/7" (app); MXN bank transfer in → quote → digital dollars. **Historic (stated 2022):** custodial wallet + ramps "In partnership with Wyre", Stellar rails, Spreedly for PCI — Wyre is defunct, so this stack is presumed replaced = **INFERRED stale** | `app.cashabroad.one` cache; SCF #11 |
| Bank payout | **Stated:** "salidas bancarias locales en +8 países". Bank/PSP partners **not named** anywhere found = not disclosed | homepage cache |
| Payment instructions via WhatsApp | **Stated (T&C):** orders can be given via WhatsApp and are binding | `cashabroad.one/tss` |
| App stores | No iOS/Android listing found — web app only | search for app-store listings returned none (absence, INFORMATIONAL) |

**Internal tension worth flagging (to CLO via COO, not a public claim):** the
T&C simultaneously says the platform is "software only, no authorization"
*and* offers custody of user stablecoins *and* defines the company itself as a
"comisionista". In Mexico, custody of client keys/authorizations is exactly the
Ley Fintech art. 32 test (`docs/L.D/mx/profile.md:29-33`). Also: their T&C's
prohibited-jurisdictions list includes the United States, China, and Hong Kong
while the homepage sells the México–USA–China triangle — probably a
US-person/residency carve-out, but it reads contradictory. Verdict: SUSPICIOUS,
INFORMATIONAL — do not use publicly without CLO review.

## 3. Positioning and speed/cost claims (theirs)

| Claim (theirs) | Source | Verdict as fact |
|---|---|---|
| "TUS PAGOS A PROVEEDORES GLOBALES CON STABLECOINS EN 4 HORAS, NO EN 5 DIAS" | homepage cache | THEIR claim — INFORMATIONAL, no methodology published |
| "Entregas en 4 horas" vs traditional 3–5 business days | homepage; SCF #41 | INFORMATIONAL |
| "Empieza a operar en menos de 48h no semanas" | homepage | INFORMATIONAL |
| "Hasta 50% de mejora en margen de spreads de conversion" | homepage | INFORMATIONAL — no comparator stated |
| "Cero comisiones ocultas" + no annual fee | legacy webflow cache; homepage FAQ | Their claim; actual rates not disclosed → the transparency claim is unverifiable |
| "Control regulatorio y trazabilidad", "100% alineados con los requisitos del SAT" | homepage | Their claim; SUSPICIOUS against the software-only T&C posture |

## 4. What Treazury would have to match in Mexico to be credible

MX is the no-delta market where both incumbents live (`docs/M.D/global/corridors.md`
§2) — entering it means matching, at minimum:

1. **A working MXN leg.** CashAbroad converts MXN↔USDC 24/7 via its app. Treazury
 has **no fiat off-ramp anywhere in `src/`** — CONFIRMED absence
 (`docs/T.D/global/crypto-rails-benefit.md:41-45`), and only Arc Testnet is
 wired (`src/onchain-facts.ts:62-65`). No MX corridor ships without a
 contracted `licensedPartnerConversion` (`docs/L.D/mx/profile.md:50-55`).
2. **Sub-48h onboarding.** Their bar; our alpha is invitation-only with manual
 approval — fine for alpha, but a public MX launch must state its own SLA.
3. **A speed claim we can keep.** Their "4 horas" is theirs to make; our
 "2–6 hours" is currently a red line (`red-lines.md:40-45`) with no ramp
 behind it. Match the *experience*, not the headline, until a partner's
 `settlementWindowHours` is evidenced.
4. **Local entity / KYB posture.** They operate as a Mexican S.A. de C.V. with
 SAT-aligned KYB. Our licensing answer for MX is "no licence for pure
 software; never custody, never net fees" (`mx/profile.md:63-68,
 24-39`) — that is a credible story only if the vault/fee-sweep build stays
 out of the MX flow.
5. **Per-operation price transparency** — they show commissions in-app per
 operation; if we publish corridor economics (F.D model), we beat them on
 the one thing their own marketing claims ("cero comisiones ocultas") but
 cannot prove.

## 5. What CashAbroad demonstrably does NOT have (what Treazury could own)

1. **Trade documents tied to payment.** No invoice/packing-list generation,
 HS-code/Incoterm fields, or release-gating found anywhere in their site, app
 copy, or SCF submissions. Their historical "Invoices" feature (SCF #11) was
 *requesting* payment, not generating settlement-gated commercial documents.
 Treazury's `commercial_docs` table + release-on-paid design is the gap.
 (Caveat: SCF #21 funded a "CashAbroad Letter of Credit" — trade-finance
 adjacent, so the gap may be closing. SUSPICIOUS, re-check in 90 days.)
2. **Non-custodial settlement.** They are explicitly custodial (T&C ch. 4).
 We are designed non-custodial (buyer→seller direct, PA-R5) — but note our
 own red line: we cannot *claim* it publicly while OrderVault's owner can
 refund (`red-lines.md:34-39`). Build fix first, then own the difference.
3. **Multi-tenant agency model.** They sell to the end importer/exporter;
 Treazury sells to the *agency/operator* that settles for many clients
 (tenant + payment link + partner attribution). No agency-facing product
 found in their material (INFORMATIONAL).
4. **Legal-delta honesty for AR/CO.** They do not operate in Argentina (no AR
 presence found; their T&C is a Mexican entity's) — Treazury can own the
 merchanting/triangulation framing for AR/CO once L.D confirms it, which is
 a segment no MX competitor is even addressing.
5. **Published corridor economics.** Nobody in this set publishes per-corridor
 cost-vs-SWIFT math. Our F.D model is a differentiator if the founder wants
 to publish it (founder/CFO call).

## 6. Threat verdicts

| Entry | Threat verdict | Reasoning |
|---|---|---|
| CashAbroad — MX→US / US→MX corridor | **HIGH threat (PROMISING evidence)** | Direct corridor overlap, live MXN ramp, local entity, Techstars/Stellar backing, claims 4h settlement. Mitigating: 2–4 people, ~$20K disclosed funding, pricing opaque, product depth unverified, custody posture legally exposed (`mx/profile.md:29-33`) |
| CashAbroad — MX→CN (their headline triangle) | **HIGH as a messaging threat, INFORMATIONAL as a product** | They market exactly the MX–US–China triangle Treazury would want; whether they execute CN payouts is unverified |
| CashAbroad — AR, CO, CL, VE corridors | **REJECTED as a threat** | No presence in any of these markets found; Mexican entity, MX/US/China focus; their T&C even lists Venezuela (and the US/China) as prohibited jurisdictions |
| CashAbroad — trade documents / agency workflow | **REJECTED today, SUSPICIOUS trend** | No document-gating product found; SCF Letter-of-Credit award suggests movement — re-check in 90 days |
| Bitso Business (context competitor, not this task's target) | **HIGH for MX rails** | Licensed, SPEI/Pix, MXNB, Ripple partnership (2026-06-11), 47% of LatAm stablecoin volume from Mexico — but sells *infrastructure/API*, not agency workflow + documents |
| Overall | **PROMISING (sourced core cells; pricing and product depth unverified)** | To confirm: create an account or request a demo quote to capture their real per-operation commission (never guess it), and verify active corridors in-app |

Next steps: (a) demo-quote capture for real pricing — owner CMO; (b) re-check
SCF Letter-of-Credit status in 90 days — CMO; (c) the T&C custody tension goes
to the CLO via the COO if the founder wants it used in competitive positioning —
never as a public claim first.
