---
dept: L.D
scope: cn
kind: profile
status: draft
as_of: 2026-10-28
sources:
 - https://www.pbc.gov.cn/tiaofasi/144941/3581332/2026020619591971323/index.html # 银发〔2026〕42号 PBoC+NDRC+MIIT+MPS+SAMR+NFRA+CSRC+SAFE, 2026-02-06 — full text read 2026-10-28
 - https://www.gov.cn/zhengce/zhengceku/2008-08/07/content_2150.htm # 中华人民共和国外汇管理条例 (State Council Order 532) — arts. 8, 9, 21, 24, 36, 39-49, 53 read 2026-10-28
 - https://www.safe.gov.cn/safe/2020/0831/17002.html # 经常项目外汇业务指引（2020年版）汇发〔2020〕14号 — notice + annex arts. 1, 6-12, 20, 23 read 2026-10-28
 - https://www.safe.gov.cn/safe/2025/0508/26065.html # SAFE+SPP typical FX-crime cases 2025-05-08 — read 2026-10-28
 - https://www.gov.cn/zhengce/zhengceku/2021-10/08/content_5641404.htm # 银发〔2021〕237号 — REPEALED by 银发〔2026〕42号 (supersession confirmed in the repealing text)
 - secondary (SUSPICIOUS where cited): jylawyer.com trade-crypto-FX analysis (2025-12)
---

# CN — China (mainland)

Decision-support for counsel. Not legal advice; not a binding opinion.
Jurisdiction: People's Republic of China (mainland). PRC criminal/FX matters
require licensed PRC counsel — everything marked SUSPICIOUS/INFORMATIONAL
below was read at secondary or partial level. Hong Kong and Macau are
separate jurisdictions (HK regime not read this pass — INFORMATIONAL).

**Supersession warning:** 银发〔2021〕237号 (2021 ten-agency notice) was
**expressly repealed** by 银发〔2026〕42号 (2026-02-06). Any briefing,
profile or deck citing the 2021 notice as current law is stale; 42号 is the
operative instrument (pbc.gov.cn, read 2026-10-28).

```ts
const cn: CountryRegulatoryProfile = {
 country: 'CN',
 asOf: '2026-10-28',
 status: 'confirmed',
 flows: {
 buyerToSellerDirect: {
 verdict: 'blocked',
 rule: 'A mainland party paying or receiving USDC for trade takes part in virtual-currency activity that 银发〔2026〕42号 defines as illegal financial activity, and any fiat conversion around it is unlicensed FX; the related civil acts are void against public order.',
 citation: 'CN - PBoC et al. 银发〔2026〕42号 (一) and (十九) (read 2026-10-28, pbc.gov.cn); 外汇管理条例 arts. 40 and 45 (变相买卖外汇, read 2026-10-28, gov.cn)',
 },
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Holding or clearing virtual currency for mainland users is banned outright (no licence exists to hold it), and an offshore provider doing so is expressly prohibited from serving onshore subjects.',
 citation: 'CN - 银发〔2026〕42号 (一) "境外单位和个人不得以任何形式非法向境内主体提供虚拟货币相关服务" and (六) bars financial institutions and non-bank payment institutions from accounts, fund transfer and clearing for VC activity (read 2026-10-28)',
 },
 platformChargesFeeOnValue: {
 verdict: 'blocked',
 rule: 'A fee inside a USDC flow is part of the banned activity; only a fiat-denominated SaaS fee invoiced entirely outside any virtual-currency flow could be assessed separately, and naming/advertising limits still apply.',
 citation: 'CN - 银发〔2026〕42号 (一) (read 2026-10-28); (八) bars "虚拟货币/加密货币/稳定币/RWA" in business names, scopes and advertising',
 condition: 'No crypto touches the fee: invoiced in RMB or USD to the agency as software service, with no deduction from any USDC amount, and no VC terminology in CN-facing copy.',
 },
 platformConvertsToFiat: {
 verdict: 'blocked',
 rule: 'Onshore crypto-to-fiat exchange is an illegal financial activity; enforcement treats fiat-versus-crypto dealing as illegal FX trading with criminal referral for large cases.',
 citation: 'CN - 银发〔2026〕42号 (一), (十)-(十一) (read 2026-10-28); 外汇管理条例 art. 45 (私自/变相买卖外汇: warning, confiscation, fine up to 30%, serious 30%+, criminal) (read 2026-10-28); SAFE/SPP typical cases 2025-05-08 (read 2026-10-28)',
 },
 platformPaysSupplier: {
 verdict: 'blocked',
 rule: 'Paying a mainland supplier in USDC uses non-legal-tender value as money and, where it settles an FX-payable obligation, is unlicensed FX business; suppliers cannot invoice it as lawful settlement.',
 citation: 'CN - 银发〔2026〕42号 (一) (no legal-tender status; VC business banned) and (十九) (read 2026-10-28); 外汇管理条例 arts. 8 (no FX pricing onshore), 40, 45 (read 2026-10-28)',
 },
 licensedPartnerConversion: {
 verdict: 'blocked',
 rule: 'Mainland China has no VASP licence for crypto-fiat conversion — the activity is prohibited, not merely reserved — so there is no licensed partner that can convert crypto for a CN corridor.',
 citation: 'CN - 银发〔2026〕42号 (一)-(二) (prohibition, no authorisation path except approved RWA on designated infrastructure) (read 2026-10-28); 外汇管理条例 art. 53 (non-financial institutions need State Council FX-department approval even to do 结售汇) (read 2026-10-28)',
 },
 },
 fxControl: {
 required: true,
 channel: 'SAFE-designated banks — 贸易外汇收支企业名录 registration + 经常项目外汇业务指引 (2020)',
 deadlineDays: 'n/a',
 citation: 'CN - 外汇管理条例 arts. 4, 6, 8, 9 (read 2026-10-28, gov.cn); 经常项目外汇业务指引 (2020) arts. 1, 7-9, 11, 20 (汇发〔2020〕14号, read 2026-10-28, safe.gov.cn): collection "timely and in full" per contract (art. 8), 谁出口谁收汇/谁进口谁付汇 (art. 9), bank review of contract/invoice/customs docs (art. 11); no fixed statutory day count — advances >30 days must be reported within 30 days (art. 20)',
 },
 licensing: {
 platform: {
 required: true,
 regime: 'No licensing path: virtual-currency business is banned outright (not authorisable); RWA tokenisation only with competent-department approval on designated financial infrastructure.',
 citation: 'CN - 银发〔2026〕42号 (一), (二), (六) (read 2026-10-28)',
 },
 agency: {
 required: false,
 regime: 'A pure trade agency needs no financial licence; buying/selling FX for others or running 结售汇 requires SAFE approval, and FX operations must go through designated banks.',
 citation: 'CN - 外汇管理条例 arts. 24 and 53 (read 2026-10-28, gov.cn)',
 },
 extraterritorial: true,
 citation: 'CN - 银发〔2026〕42号 (一) bars offshore persons from providing VC services to onshore subjects "in any form"; (十八) punishes onshore helpers who knowingly or should knowingly assist them; (十三)-(十五) police onshore entities going offshore (read 2026-10-28)',
 },
 aml: {
 obligedEntity: 'partner',
 travelRule: 'unknown',
 kycThresholds: {
 banks: 'Full customer due diligence and FX-document review by the receiving/paying bank; banks must report client FX violations to SAFE (外汇管理条例 art. 36, read 2026-10-28)',
 crypto: 'No VASP layer exists onshore — travel-rule questions are moot for mainland corridors (INFORMATIONAL)',
 },
 citation: 'CN - 外汇管理条例 arts. 7, 11, 36 (read 2026-10-28); PRC AML Law obligations - INFORMATIONAL (not read this pass)',
 },
 docs: {
 invoiceCurrency: 'USD or CNY - INFORMATIONAL (customs practice not verified this pass)',
 customsRequires: ['customs declaration (报关单)', 'commercial invoice', 'packing list', 'trade contract'],
 commercialInvoiceAllowed: true,
 citation: 'CN - 经常项目外汇业务指引 (2020) art. 11 lists contract, invoice, customs declaration, bills of lading as reviewable trade documents (read 2026-10-28); customs-form specifics - INFORMATIONAL',
 },
 tax: {
 valuationRule: 'Customs value on transaction value; exports exempt from VAT with refund rate set by HS code - INFORMATIONAL (not read this pass).',
 citation: 'CN - PRC customs/VAT export-refund rules - INFORMATIONAL (not read this pass)',
 },
 sanctions: {
 screening: 'OFAC/UN screening before order creation (plus PRC counter-sanctions screening); the USDC issuer can freeze listed addresses.',
 issuerBlocklist: true,
 citation: 'OFAC SDN list; Circle USDC Terms; PRC Anti-Foreign Sanctions Law - INFORMATIONAL',
 },
 rails: {
 licensedPartners: [],
 citation: 'No contracted partner; no lawful onshore crypto rail exists (银发〔2026〕42号 (一)); fiat rails = SAFE-designated banks under 经常项目外汇业务指引',
 },
 openQuestions: [
 'Does a mainland importer paying a foreign exporter in USDC from an offshore wallet fall under (一) itself, or only through 外汇管理条例 arts. 40/45 — and what is the personal exposure of the buyer signatory?',
 'Does Treazury, by merely displaying a seller wallet address to a PRC-located user, count as "providing virtual-currency services to onshore subjects", and what does the "非法" qualifier plus the (十八) "明知或应知" helper standard require?',
 'Which charges and thresholds apply to trade settled via USDT/USDC — 逃汇, 非法经营 or 洗钱 — under PRC criminal law? (secondary sources conflict: SUSPICIOUS, counsel to verify against 立案追诉标准)',
 'Is a HK-incorporated entity serving PRC beneficial owners compliant with (十三)-(十五) and AML beneficial-ownership rules? (HK Stablecoins Ordinance/SFC VASP regime not read this pass — INFORMATIONAL)',
 'Does receiving export proceeds in USDC outside the banking system forfeit the VAT export refund (退税)? (secondary source only — SUSPICIOUS)',
 'Can any RMB-pegged stablecoin or approved offshore issuance by an affiliate fall within the 42号 (一) third paragraph approval requirement if a partner later proposes it?',
 ],
};
```

## Enforcement notes

- **CONFIRMED — the ban is financial-system-wide, not exchange-specific.**
 42号 (一) bans fiat↔VC exchange, VC↔VC exchange, central-counterparty
 dealing, information-intermediation/pricing for VC trading, token issuance
 financing and VC financial-product trading, onshore; (六) extends to
 accounts, transfers, clearing, collateral (不得将虚拟货币…纳入抵质押品
 range), and insurance; (七)-(八) reach websites, apps, ads, business
 registrations (read 2026-10-28).
- **CONFIRMED — FX crimes carry the practical teeth.** 外汇管理条例 (Order
 532): art. 39 逃汇 (order to repatriate + fine ≤30%; serious 30%+;
 criminal), art. 40 非法套汇, art. 45 变相买卖外汇 (≤30%; serious 30%+;
 criminal), art. 46 unlicensed 结售汇 (confiscation + 1–5× gains, or
 RMB 500k–2M), art. 43 unauthorised offshore guarantee/foreign debt (≤30% —
 relevant to any offshore-collateral idea), art. 49 personal liability of
 responsible persons (read 2026-10-28, gov.cn).
- **CONFIRMED — banks are the only rail.** 经常项目外汇业务指引 (2020):
 名录 registration is a precondition for goods-trade FX (art. 1); banks must
 verify trade documents and consistency (art. 11); 谁出口谁收汇、谁进口谁付汇
 (art. 9); documents retained 5 years (art. 12) (read 2026-10-28).
- **CONFIRMED (pattern) / SUSPICIOUS (figures)** — SAFE+SPP joint typical
 cases (2025-05-08) publish crypto-mediated FX trading prosecuted as 非法经营罪
 with administrative fines in the RMB millions and criminal-administrative
 "reverse linkage" (read 2026-10-28). Exact fine ranges and case thresholds
 quoted from secondary sources remain SUSPICIOUS pending counsel.
- **SUSPICIOUS — export tax-refund loss** for exporters collecting through
 USDT/USDC: asserted only by secondary sources this pass; do not state as
 fact.

## Process delta

- **Remove CN from crypto-settlement scope**: no direct USDC, no platform
 holding, no crypto off-ramp, no "CN stablecoin corridor" in roadmap copy —
 red-line 2 discipline plus 42号 (七)-(八) advertising/naming bans inside
 the CN market itself.
- CN counterparties run fiat-only: SAFE-designated bank, 名录 registration,
 contract + invoice + customs declaration, collection per 谁出口谁收汇.
- Any offshore structure serving PRC beneficial owners must clear (十三)-(十五)
 before it is even modelled; screen every PRC nexus against OFAC and PRC
 counter-sanctions lists.
- Keep `rails.licensedPartners: []` — there is no lawful onshore crypto
 partner to name (red-line 2).
