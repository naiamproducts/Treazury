---
dept: F.D
scope: ar
kind: research
status: provisional
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/F.D/global/corridor-model.py:20-94 (PARAMS), :117-127 (swift_cost)
 - /home/kiox/treazury/docs/F.D/global/corridor-economics.md §1b/§A4 (input ledger; correspondent undercount note)
 - /home/kiox/treazury/docs/F.D/ar/rent-decomposition.py (this report's computations)
 - https://www.bis.org/publications/working-paper-1385-competing-rails-crossborder-payments-banks-fintechs-and-stablecoins (BIS WP 1385 — Du/Huang/Scharfstein, 2026-10-19; bank FX markups ~2-4.7%; fintech MTO all-in 40-150bps; accessed 2026-10-27/28)
 - https://www.bis.org/events/20260626/25th-bis-annual-conference/25th-annual-conference-adrian.pdf (Adrian discussion 2026-06: bank wires 200-400bps FX markup alone; stablecoin Coinbase-Kraken example ~150bps total; accessed 2026-10-28)
 - https://www.bis.org/events/20260626/25th-bis-annual-conference/25th-annual-conference-yogo.pdf (Yogo discussion: wholesale majors 6-9bps per BIS RT survey 2025; fintech 40-150bps; accessed 2026-10-28)
 - https://www.bis.org/events/20260626/25th-bis-annual-conference/25th-annual-conference-du.pdf (Du slides: multi-hop fees accumulate; nostro pre-funding costs; "costs reflect payment architecture rather than FX illiquidity"; accessed 2026-10-28)
 - https://blindpay.com/resources/more/cross-border-payment-cost-beyond-the-rail (Wise marginal-cost table per BIS WP 1385 Table 14: GBP 0.24 fixed = rail 0.02 + support 0.11 + compliance 0.06; variable 0.06%; accessed 2026-10-28)
 - https://www.rionegro.com.ar/economia/dolar-oficial-hoy-jueves-22-de-octubre-2026-que-valores-fija-el-banco-nacion-y-como-se-posiciona-el-mercado-4768416/ (2026-10-22 — BNA 1,500/1,550; BCRA promedio bancos 1,490/1,550; accessed 2026-10-28)
 - https://www.cotizacion-dolar.com.ar/cotizacion-hoy.php (2026-10-27 — BNA venta 1,560.00; BCRA promedio 1,506.87/1,559.939; accessed 2026-10-28)
 - https://www.enteratenoticias.com.ar/economia/el-dolar-mayorista-toco-un-nuevo-record-nominal-de-1-528-mientras-el-bcra-sostiene-las-compras-de-divisas (2026-10-24 — mayorista venta 1,528; accessed 2026-10-28)
 - https://tn.com.ar/economia/2026/10/19/dolar-a-cuanto-cotizan-el-oficial-y-las-otras-opciones-cambiarias-este-lunes-19-de-octubre/ (2026-10-19 — mayorista 1,524.50; BNA 1,490/1,540; tarjeta 2,002; cripto 1,604-1,622; accessed 2026-10-28)
 - https://tn.com.ar/economia/2026/10/27/dolar-oficial-hoy-y-dolar-blue-a-cuanto-cotizan-este-martes-27-de-octubre/ (2026-10-27 — cripto 1,672.88-1,675.37; accessed 2026-10-27)
 - https://www.bcra.gob.ar/archivos/Pdfs/comytexord/A7506.pdf (Com A 7506, 05/05/2022 — bank digital-asset prohibition; accessed 2026-10-28)
 - https://www.iproup.com/finanzas/72239-el-bcra-extiende-el-cepo-cripto-pero-bancos-avanzan-en-otro-negocio (2026-10-12 — ban stays this mandate; USDC 46% of AR stablecoin volume; Circle/Tether investing in AR fintechs; accessed 2026-10-28)
 - https://www.bcra.gob.ar/normativa-de-exterior-y-cambios (Decreto 260/02 arts. 1-2 / Ley 27.444 art. 132 — FX ops in the MCLC at freely agreed rates via BCRA rules; accessed 2026-10-28)
 - /home/kiox/treazury/docs/L.D/ar/profile.md:28-80,121-126 (surrender duty, MCF channel, PSAV licensing — L.D confirmed 2026-10-27)
 - https://www.rankia.com.ar/blog/dolar-hoy/6731536-impacto-cepo-cambiario-precio-dolar-blue (updated 2026-08-09 — post-2025-lift brecha ~0%; Impuesto PAIS ended Jan-2026; accessed 2026-10-28)
---

# Treazury — rent decomposition of the AR payment stack: service cost vs. incumbent margin

F.D/ar deliverable for aven (founder question: which parts of
the current cost exist because of the regulation, and who — BNA, other banks
— captures them). Companion to `ar-counterfactual.md`; located under
`docs/F.D/ar/` per Rule 1 (`docs/C.O/global/info-architecture.md:49-58`).
Reproduce: `python3 docs/F.D/ar/rent-decomposition.py`.

Tagging as before: model cells INFORMATIONAL; benchmarks and quotes SOURCED
with URL + date; splits between service and rent are **stated assumptions
benchmarked to public evidence**, never measured AR-bank cost curves.

## 0. Headline (two framings — both honest)

- **Wire-only framing** (what the corridor model compares): of the current
 all-in SWIFT cost on AR→US / AR→CN (1.66–2.03% at $25k–$100k, mid band):
 **≈ 45% genuine service / ≈ 55% rent and margin capture** (central case;
 defensible band: service 15–55%, i.e. **rent 45–85%**; confidence
 **LOW-MEDIUM** — the split rests on benchmark transfer from BIS WP 1385,
 not on measured costs of Argentine banks).
- **Regime framing** (exporter's all-in cost of getting paid — the one the
 founder's question is really about): wire ~2.0% **plus** the surrender
 loss at official-rate liquidation **6.82%** of market value (SOURCED rates
 2026-10-27) → total ≈ 8.8%, of which **≈ 10% service / ≈ 90% regulatory
 transfer and rent** (confidence LOW-MEDIUM on the wire split, but the
 surrender-loss arithmetic itself is CONFIRMED given the rates). The
 surrender loss is 100% regulation-created and is ~5–10× the entire rent
 inside the wire stack.
- **Who gets it (wire stack, central case, $25k AR→US):** ~$250 of the
 $267 rent accrues on the **AR side** (FX markup $225 + sender-fee margin
 $25 — the AR/MCF-executing bank); ~$17 accrues to **international banks**
 (intermediary + beneficiary fee margins), with float and repair counted
 as genuine cost. Multi-hop reality likely shifts more to international
 banks than the model shows (one hop modelled, `corridor-economics.md` A4).
- **The regulation's biggest gift to incumbents is not a fee — it is a
 barrier.** Com A 7506/7759 bars banks AND payment providers from offering
 stablecoins to clients (in force; government said it stays this mandate,
 iproup 2026-10-12). It does **not** hand BNA the crypto rent (that goes to
 VASPs — USDC is 46% of AR stablecoin volume, same source); it protects the
 bank fee/spread business from substitution.

## 1. Method

The current-regime all-in for AR→US / AR→CN (mid band, `corridor-model.py`)
is decomposed component-by-component into (a) genuine service cost —
processing, compliance, fraud, technology, capital — and (b) rent/margin.
The benchmark for "rent-free competitive price" is **BIS WP 1385** (Du,
Huang, Scharfstein, 2026-10-19):

| Benchmark input | Value | Source |
|---|---|---|
| Bank FX markup alone (retail wires) | ~200–400 bps even on liquid pairs; sample 2–4.7% | BIS WP 1385 + Adrian/Yogo discussions (2026-06/10) |
| Fintech MTO all-in cost | 40–150 bps, bottom of range at ≥$10k | same |
| Wise marginal cost (per transfer) | GBP 0.24 fixed = **rail £0.02 + support £0.11 + compliance £0.06**, variable 0.06% | WP 1385 Table 14 (via blindpay.com) |
| Wholesale FX, majors | 6–9 bps | BIS RT survey 2025 (via Yogo discussion) |
| BIS structural claim | "retail cross-border payment costs primarily reflect **payment architecture**, not FX illiquidity"; multi-hop fees accumulate; nostro pre-funding is a real capital cost | Du slides |

Central-case splits (each ASSUMED, benchmarked as stated):

| Modelled component ($25k AR→US, mid) | Model $ | Service $ | Rent $ | Basis for the split |
|---|---|---|---|---|
| FX markup 1.5% | 375 | 150 (60bps) | 225 | competitive all-in conversion benchmark = fintech low end at ≥$10k (60bps, mid of 40–150bps BIS band); wholesale floor is 6–9bps |
| Sender wire fee | 45 | 20 | 25 | Wise marginal cost is pennies; fixed bank fees carry margin — ASSUMED ~45/55 split |
| Correspondent/intermediary | 20 | 10 | 10 | BIS: fees accumulate per hop → markup share; ASSUMED 50/50 |
| Beneficiary fee (US) | 15 | 8 | 7 | ASSUMED ~50/50 (incoming-wire processing + margin) |
| Nostro float (2d @10%/yr) | 13.7 | 13.7 | 0 | genuine cost of capital of the correspondent architecture (BIS: nostro pre-funding) — deliberately counted fully as cost |
| Repair gross-up EV | 30 | 30 | 0 | genuine friction of failed/repaired payments — ASSUMED amount (`corridor-model.py:62`) |

## 2. Decomposition table (central case, mid band)

From `rent-decomposition.py` (asserts components sum to the model total):

| Corridor | Ticket | All-in $ (%) | Service $ (%) | Rent $ (%) |
|---|---|---|---|---|
| AR→US | 25k | 499 (1.99%) | 232 (0.93%) | **267 (1.07%)** |
| AR→US | 100k | 1,665 (1.66%) | 723 (0.72%) | **942 (0.94%)** |
| AR→CN | 25k | 509 (2.03%) | 239 (0.96%) | **270 (1.08%)** |
| AR→CN | 100k | 1,695 (1.70%) | 750 (0.75%) | **945 (0.95%)** |

Rent share is stable at **53–57%** across corridors and tickets because the
FX markup dominates and scales linearly. Worked arithmetic ($25k AR→US):
`service = 150 (fx@60bps) + 20 + 10 + 8 + 30 + 13.7 = $231.7`;
`rent = 225 (fx) + 25 + 10 + 7 = $267`; `total = $498.7 = model $499` ✓.

## 3. Sensitivity — how much of the stack you call rent

| Corner | AR→US 25k rent | AR→US 100k rent | Reading |
|---|---|---|---|
| Central (fx-svc 60bps; float+repair = cost) | **54%** | **57%** | the report's headline |
| All FX markup = rent; explicit fees = service | 84% | 95% | "conversion is a commodity; fees cover processing" — defensible at large tickets |
| FX service = wholesale 8bps; fees = service | 80% | 90% | upper corner of the BIS-consistent band |
| FX service = 150bps (fintech top); fees = service | 9% | 5% | treats the bank markup as mostly legitimate operating cost — **in tension with BIS's own decomposition** (wholesale 6–9bps) |

Defensible band given BIS's evidence: **rent 45–85% of the wire all-in**,
central 55%. Confidence LOW-MEDIUM. Note the honest asymmetry: every corner
above that treats float and repair as cost is generous to the banks — the
correspondent architecture's pre-funding is a *chosen* (and avoidable)
structure, so a stricter accounting would push rent higher still.

## 4. The off-wire rent — the part no wire-fee table ever shows

Under the current regime an Argentine **exporter** liquidating at the
official rate surrenders the difference to the market rate of the very
dollar they delivered:

- SOURCED 2026-10-27: oficial venta 1,559.94 (BCRA promedio / BNA 1,560);
 dolar cripto mid 1,674.12 (1,672.88–1,675.37). → **surrender loss =
 1 − 1,559.94/1,674.12 = 6.82% of market USD value** (quoted brecha
 convention: +7.32% vs oficial).
- Per collection: **$1,705 on $25k; $6,821 on $100k** (INFORMATIONAL
 mapping of sourced rates to the surrender mechanics in
 `L.D/ar/profile.md:28-32`).
- Comparison: the entire on-wire rent is ~$267–$270 per $25k payment. The
 surrender transfer is **~6.4× larger**.
- **Who captures it:** not a fee to a named institution — a transfer to
 whoever accesses official-rate dollars (importers' quotas, privileged
 channels) and, via export duties levied on official values, to the state.
 For an **importer** with MULC access the same 6.8% is a **subsidy** (they
 buy market-valued dollars ~7% cheap). Agencies are mixed; their exporter
 clients are net losers. This asymmetry is the core political economy of
 the control regime.
- **Natural experiment:** the gap collapsed to ~0% after the April-2025 lift
 (Rankia, updated 2026-08-09) and re-widened to 5–7.5% with rising country
 risk and residual controls in Oct-2026 (infobae 2026-10-22). So of
 today's 6.82%: the **control component is removable by law**; the
 **country-risk component is not**. Split not sourceable → INFORMATIONAL.

## 5. Which components exist BECAUSE of the regulation (the founder's question)

| Cost component | Regulation-created? | Evidence / reasoning |
|---|---|---|
| Surrender transfer ~6.8% (off-wire) | **YES — entirely** | exists only while liquidation at a rationed/official rate is mandatory; vanished when lifted (Rankia 2026-08-09); duty still binds legal persons (Com A 8417, boletinoficial 2026-04-13) |
| Channel mandate (MCF) multiplying bank FX volume | **YES — channel effect** | FX ops must run through BCRA-authorised entities (Decreto 260/02 art. 2 via bcra.gob.ar); trade-flow conversions cannot bypass bank desks → the ~1.7% one-way retail bank spread is earned on mandated volume it would not otherwise touch |
| Retail FX spread ~1.7% one-way over mayorista (BNA 1,500/1,550 vs mayorista 1,524.5, 2026-10-19/22) | **PARTLY** | bank retail FX markup exists in every free market; the *mandate* enlarges the volume base; competition (fintech MTOs at 40–150bps, BIS) would compress it absent the mandate |
| Bank wire fee + correspondent + beneficiary fees (~$80–115 fixed) | **NO — architecture** | same in free markets worldwide (BIS global samples); Argentine law neither creates nor removes them |
| Nostro float | **NO — architecture** | correspondent-banking design choice (BIS: pre-funded balances); avoidable by any modern rail, but not AR-law-created |
| FX markup 1.5–4% on cross-border conversion | **NO (global) / PARTLY (AR)** | BIS observes 200–400bps for banks in *uncontrolled* markets — pure margin capture, but not AR-specific regulation |
| Tarjeta FX ~30% over oficial (2,002 vs 1,540, 2026-10-19) | **YES — tax wedge** | residual taxes/levies on non-privileged FX (composition unverified post-PAIS; INFORMATIONAL) — state rent, not bank rent |
| PSAV licensing capital (USD 35k–150k min net worth, RG 1172/2026) | **YES — barrier** | protects incumbents and excludes new rails; quantified in `ar-counterfactual.md` §7 |
| Bank/PSP crypto ban (Com A 7506 + 7759) | **YES — pure protection** | bars the incumbent channel from stablecoin competition "until a possible second mandate" (iproup 2026-10-12, citing superintendente Curutchet); the foregone innovation is the rent |

## 6. Banco de la Nación Argentina — named answer

| Claim | Status | Evidence |
|---|---|---|
| BNA is THE official-rate reference bank — national press prices "el dólar oficial" off BNA's screens | **CONFIRMED** | tn.com.ar 2026-10-19 (BNA 1,490/1,540); rionegro 2026-10-22 (BNA 1,500/1,550); cotizacion-dolar.com.ar 2026-10-27 (BNA venta 1,560) |
| BNA operates as an FX intermediary in the MCF (buys/sells USD daily against clients) | **CONFIRMED** | its published daily client quotes ARE MCF client operations; all supervised banks/casas de cambio are the authorised universe (Decreto 260/02 art. 2 via BCRA normativa page) |
| BNA's observable retail spread over the wholesale market: ask +1.67% vs mayorista venta (1,550 vs 1,524.5, 2026-10-22 basis) | **CONFIRMED arithmetic, SOURCED inputs** | rionegro 2026-10-22; enteratenoticias 2026-10-24 (mayorista 1,528). System-wide: BCRA promedio 1,506.87/1,559.94 (2026-10-27) ≈ 3.4% round-trip |
| BNA is a *designated market-maker* with a formal BCRA obligation | **NOT SOURCED** — no public market-maker designation found; the mayorista segment is described as "comandado por el BCRA" with major banks as participants (tn.com.ar 2026-10-19) | would need BCRA's list of mayorista market-makers |
| Magnitude of BNA's FX profit / volume share | **INFORMATIONAL — could not source** | would require BNA's segment reporting or BCRA entidad-level FX volume series |
| BNA captures stablecoin rent | **REJECTED** | Com A 7506 bars BNA (and every bank) from offering crypto to clients; the stablecoin spread accrues to VASPs (Bitso et al.); USDC = 46% of AR stablecoin volume, Circle/Tether investing in AR fintechs as indirect route (iproup 2026-10-12; inversoy 2026-10-12) |

**So: does the regulation benefit BNA?** Yes, indirectly and materially:
(1) the MCF mandate funnels mandatory trade conversions through bank desks
where BNA is the reference institution, earning its ~1.7% one-way spread on
volume that could otherwise route around banks; (2) Com A 7506 removes the
substitution threat that would compress those spreads (no bank can offer
USDC); (3) under the pre-2025 full cepo, official-rate access itself was the
rent, and BNA was a primary channel of that access. But the *largest*
single transfer — the 6.8% surrender loss — accrues to official-rate access
holders and the state, not to BNA as a fee line, and the stablecoin market
rent goes to the VASPs the regulation does not cover. The honest statement:
**regulation protects BNA's position; it does not directly pay BNA the
brecha.**

## 7. International banks — named answer

Components of the AR→US/AR→CN stack accruing to non-Argentine institutions
(model mid, $25k): intermediary $20 (rent portion ~$10), US beneficiary fee
$15 (rent ~$7), nostro float $13.7 (capital cost, 2–3 days) — ~$49 all-in,
of which ~$17 is rent under the central split. AR→CN adds a CN beneficiary
fee ($18 mid, ASSUMED). Critically, the model counts **one** intermediary
hop; AR→Asia routes realistically run ≥2, adding $15–50 per hop
(`corridor-economics.md` A4) — international-bank take is understated.

Are these regulation-created? **No.** Correspondent fees, nostro pre-funding
and cross-border FX markup are the global correspondent architecture's rent
— BIS WP 1385 documents the same 200–400bps bank markups and multi-hop
accumulation in uncontrolled markets, and documents that fintech MTOs have
compressed all-in costs to 40–150bps precisely by collapsing that
architecture. The international-bank rent would exist in a free Argentina
too; what Argentine regulation adds on top is the **AR-side** layer (channel
mandate, spread on mandated volume, surrender transfer, crypto ban). Under
the model's central split at $25k AR→US: **AR-side rent ≈ $250 (94%) vs
international rent ≈ $17 (6%)** — on the wire stack, the Argentine layer is
where the rent sits; the international layer is mostly fees and capital
(service-heavy). Caveat (SUSPICIOUS, from `corridor-economics.md` A4): the
single-hop assumption biases this split toward the AR side.

## 8. Not sourced / open

| Gap | Impact | Resolves it | Owner |
|---|---|---|---|
| Real cost curves of AR banks (processing, compliance, capital) | the 45/55 split stays benchmark-transferred, confidence capped LOW-MEDIUM | BNA/banco publishes or a banking-cost study (BCRA Working Papers sometimes have spreads-and-margins studies) | F.D |
| BCRA list of mayorista market-makers / whether BNA has formal obligations | upgrades the BNA "market-maker" claim from inference | BCRA CAMEX communications | F.D → L.D |
| BNA FX segment profit / volume share | sizes rent capture per institution | BNA annual report segment note | F.D |
| Control-premium vs risk-premium split of the 6.82% | sizes what a law change alone removes | event study around 2025-04-13 lift using daily oficial/CCL series | F.D |
| Composition of the ~30% tarjeta premium post-PAIS | state-rent sizing | ARCA/BCRA tax composition | F.D → L.D |
| Multi-hop count on AR→US/AR→CN correspondent chains | shifts AR-vs-international rent split | SWIFT tracker sample or bank quote with SHA breakdown | F.D with T.D |
