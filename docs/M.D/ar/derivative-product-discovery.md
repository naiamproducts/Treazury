---
dept: M.D
scope: ar
kind: research
status: draft
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/L.D/ar/profile.md (CONFIRMED AR flow verdicts: buyerToSellerDirect/platformHoldsFunds/platformChargesFeeOnValue/platformPaysSupplier = blocked; process delta :122-128 — read 2026-10-28)
 - /home/kiox/treazury/docs/L.D/ar/export-flow-escrow.md (:48-63 component verdicts — escrow-until-cumplido BLOCKED, Treazury-as-trustee REJECTED; :66-80 two cumulative deadlines CONFIRMED; :174-185 claim audit — read 2026-10-28)
 - /home/kiox/treazury/docs/L.D/ar/fideicomiso-viability.md (:40, :55, :160 PA-R5 REJECTED, :178 BLOCKED/CONDITIONAL, :242 "DIFFERENT PRODUCT — out of scope", :265-269 claim audit — read 2026-10-28)
 - /home/kiox/treazury/docs/L.D/ar/regulatory-rent-map.md (:62-66 Ley 19.359 channel exclusivity; :100 fines up to 10× the operation; :98 Decreto 609/2019 surrender duty — read 2026-10-28)
 - /home/kiox/treazury/docs/L.D/global/red-lines.md (:40-56 items 1-3; :68-113 items 22-26 custody; :135 item 28 swaps/staking; :189-196 AR items 5-7; :203-217 item 21 structuring-to-evade)
 - /home/kiox/treazury/docs/M.D/global/corridors.md:67-120 (AR corridors REJECTED on economics + heaviest legal delta; :127-131 "AR LIVE" message wrong)
 - https://leyradar.com/ (pricing CONFIRMED: Starter USD 199/mes, Professional USD 499/mes, Enterprise desde USD 1.500/mes; coverage includes BCRA, ARCA, CNV, Boletín Oficial; accessed 2026-10-28)
 - https://www.agenteagora.com/ (export document-flow SaaS, Chile-focused, quote by season volume; pain numbers: BL correction USD 100-150, demurrage USD 400+/day, 16-28 docs/shipment; accessed 2026-10-28)
 - https://www.solucionesmarco.com/products/customs (software para despachantes: OCR de BL/factura/packing list, alertas ARCA, predicción de plazos de liberación — via DDG snippet, accessed 2026-10-28)
 - https://www.bing.com/search + Google AI Overview via r.jina.ai (7.619 empresas exportadoras 2025 / 7.931 2026 según PromArgentina; 9.123 en 2024 — AI Overview + camponoticias.com 2025-08-11, SUSPICIOUS)
 - https://ciudadano.news/economia/situacion-pymes-exportadoras-argentina-2026-n117491 (2026-04-20: exporters fell from ~15.000 in 2006 to ~9.000 in 2026; pymes = 6,3% of export value — accessed 2026-10-28)
 - https://www.infobae.com/economia/2025/04/11/el-2025-comenzo-con-mas-pymes-exportadoras... (CAME: pymes exportadoras 2.362 ene-2025 vs 2.106 en 2024; pyme exports USD 755M +22,2% YoY — via DDG snippet, accessed 2026-10-28)
 - https://ucema.edu.ar/sites/default/files/2025-09/IndicadoresUCEMA_PyMEs092025.pdf (515.599 pymes registradas abr-2025, 98% de firmas empleadoras — via DDG snippet, accessed 2026-10-28)
 - Competidores observados (via DDG lite snippets, accessed 2026-10-28): kargoit.com (generador gratis de factura proforma/packing list), docksy.com.ar, darsys.com.ar, integracomex.com.ar, naimitech.com, mymtec.com.ar, freit.cl; leyradar.com; mbasystems.com.ar (Normas Financieras: normativa financiera/cambiaria/comex); crombie.dev (RegTech BCRA a medida); insside.net (GRC con normativa BCRA); complianceargentina.com.ar (consultora boutique)
 - https://bitzo.com/2026/08/argentina-psav-register-rules... (CNV PSAV register "still lists 0" — SUSPICIOUS, via DDG snippet, accessed 2026-10-28)
 - https://www.redcame.org.ar/estadisticas-pyme/154/monitor-de-exportacion-pyme (CAME MEP methodology — accessed 2026-10-28)
 - skills/10-market-research/scripts/tam_sam_som.py runs 2026-10-28 (outputs inline below)
 - aven (this task, ref 13R2); Engram topic: naiam-si/treazury/market.ar-derivative-product
---

# AR derivative product discovery — products WITHOUT cross-border payments (2026-10-28)

Decision this unlocks: is there a parallel, legally-clean AR product derived from
existing Treazury capabilities that justifies deep discovery? This does NOT
replace the validated MX/US merchanting core (`corridors.md:67-120`); every
hypothesis below is checked for cannibalization (§6). Verdict vocabulary:
market/positioning → `VALIDATED / PROMISING / UNVALIDATED / REJECTED`; factual
findings → `CONFIRMED / SUSPICIOUS / INFORMATIONAL`.

## 1. Capability → AR pain map (no money moves in any of these)

### (a) Motor jurisdictional fail-closed con perfiles por país (`src/modules/jurisdiction/`, 19 tests)
1. **H3 — "API de reglas cambiarias AR"**: fintechs/ERPs/contables/despachantes need to know if a given operation is permitted before acting (Ley 19.359 fines up to 10× the operation, `regulatory-rent-map.md:100`). A machine-readable, versioned rules API (fail-closed, like our engine) answers "¿puedo hacer esto?" without touching funds. Buyer: fintechs, ERPs, estudios contables, despachas. WTP: **ASSUMPTION** USD 300–1.500/mo (anchored below by LeyRadar). Competitors: LeyRadar (alerting, not rules-as-API), mbasystems.com.ar, crombie.dev (custom), tributum.news (content only) — none observed offering a machine-readable decision API (INFORMATIONAL, absence-of-search not proof).
2. **H4 — Dashboard de brecha cambiaria + plazos para tesorerías**: countdowns over the two-clock export regime (`export-flow-escrow.md:66-80`, CONFIRMED) + FX gap visibility. Buyer: treasury of AR exporters/importers. WTP: weak — the gap data is free everywhere (Ámbito, Invertir Online — INFORMATIONAL). **Verdict: REJECTED as standalone** (commoditized data, no wedge).

### (b) Generación y release condicionado de pack documental comercial
1. **H1 — "Reloj de cumplimiento + dossier del exportador"** (top pick, §5): SaaS that runs the two cumulative clocks (20 bd from *fecha de cobro*; 30/60/180/365 d from *cumplido* — CONFIRMED `export-flow-escrow.md:66-80`) per operation, with the document dossier (factura E, packing list, cert. de origen status) as the visual centerpiece and alerts before vencimiento. The release gate logic we already built (`orders.status='paid'` → docs released, AGENTS.md guardrails) becomes "dossier completeness gates internal approval", never a money gate. Buyer: pymes exportadoras (2.362, CAME/Infobae ene-2025) + agencias + despachantes. WTP anchor: LeyRadar USD 199–499/mes (CONFIRMED, leyradar.com).
2. **H2 — Extracción/validación de docs comerciales con AI (DUAs, facturas, certificados)**: buyer = despachantes/agencias/importadores; cross-check before customs filing. Competitors already ship this: Marco (OCR + ARCA alerts + plazos), Agora (reads email/WhatsApp/docs), IntegraComex. **Verdict: UNVALIDATED, crowded** — differentiator would be AR export-clock context, i.e. it folds into H1.

### (c) Tracking de plazos/due dates con countdown
Feeds **H1** (per-operation regulatory clocks) and **H3** (regime version dates: Com A 8417 abr-2026, A 8481 sep-2026 — normative churn is frequent and observable, aduananews.com / jebsen.com.ar snippets). Standalone to-do/timer trackers exist everywhere → value is only in the AR-export regulatory content layer.

### (d) Verificación de pagos on-chain (check-payment, Arc)
No honest AR non-cross-border use: a domestic ARS↔USDC/cash-in flow lands on Ley 19.359 (FX negotiation only by authorized entities, `regulatory-rent-map.md:62-66`) and `platformChargesFeeOnValue = blocked` (`profile.md:39-43`). **REJECTED for AR** — see anti-goals §7. The capability only earns inside corridors that are already legal (core MX/US).

### (e) i18n, whitelist, harness e2e
Not a product — it is the reason H1/H3 are cheap to ship (multi-tenant, gated rollout, regression safety). Zero standalone pain.

### (f) Conocimiento legal AR acumulado (`docs/L.D/ar/`)
Is the *content moat* behind H3 (rules API), H1 (clock logic + disclaimer language) and **H6 — "Auditoría de compliance cambiario"** (services-shaped: a checklist/report product built on the claim audits already written, e.g. `fideicomiso-viability.md:265-269`). Buyer: exporters mid-size + their counsel. WTP: **ASSUMPTION** USD 2–10k per engagement (no observed AR anchor — UNVALIDATED). OPEN-LEGAL (advice vs product, §4).

## 2. Legal filter (fast, from `docs/L.D/` — no new legal research)

| Hypothesis | Hits any dead verdict? | Verdict |
|---|---|---|
| H1 Reloj + dossier | No funds, no FX act, no AV, fee = flat subscription invoiced separately (`profile.md:125` process delta) | **CLEAN** — with 2 guards: (i) docs stay "commercial, not customs" (red-line 3); (ii) never worded as discharging the liquidation duty (advisory only) → wording = OPEN-LEGAL light |
| H2 AI doc validation | No; but DUA/customs *issuance* would hit red-line 3 — read/validate only, despachante still files | **CLEAN** (scope-locked) |
| H3 Rules API | No funds/FX; risk = advice characterization + structuring-to-evade content (red-line 21) | **OPEN-LEGAL** (publishable scope of "decision") |
| H4 FX-gap dashboard | No | **CLEAN but REJECTED on market** |
| H6 Compliance audit services | Services = advice under founder's SAS; no custody/FX | **OPEN-LEGAL** |
| PSAV/fideicomiso preparedness | Fideicomiso = "DIFFERENT PRODUCT — out of scope" (`fideicomiso-viability.md:242`); PSAV ops = red-lines 22-26/PA-R5 | **REJECTED — anti-goal, §7** |

## 3. Market filter (top hypotheses)

**Segment base (cited).** Export-active firms AR: ~9.000 in 2026 vs ~15.000 in 2006 (ciudadano.news 2026-04-20, CONFIRMED read); 7.619 empresas exportadoras 2025 / 7.931 2026 (PromArgentina via Google AI Overview — **SUSPICIOUS**, AI-mediated); 9.123 en 2024 (camponoticias 2025-08-11, secondary). Pyme exporters: 2.362 (ene-2025, CAME via Infobae snippet — **INFORMATIONAL**). Broader base: 515.599 pymes registradas (UCEMA abr-2025, snippet — INFORMATIONAL). Pyme exports USD 755M ene-2025 +22,2% YoY (CAME, CONFIRMED snippet). Use **~7.600–9.100 reachable export-active firms; beachhead = 2.300–3.000 active pymes + agencias**.

**H1 sizing (bottom-up, `tam_sam_som.py --customers 3000 --arpu 1800 --segment-share 100 --capture-rate 5`):**
- TAM USD 5,4M/yr (3.000 × USD 1.800; ARPU **ASSUMPTION**, anchored on LeyRadar Starter USD 199/mes × 12 = 2.388, discounted ~25% for smaller AR pymes); SOM @5% (ASSUMPTION) = **USD 270K/yr**.
- Cross-check top-down: if AR compliance-monitoring SaaS is worth even USD 10/empresa/año across 515k pymes = USD 5M — rough agreement (all inputs ASSUMPTION).
- Competitors: Agora (CL-rooted, quote-based, no AR export-clock observed), Marco (despachante-centric), Kargoit (free generators), Darsys/Docksy/IntegraComex (legacy comex ERPs), LeyRadar (normative alerts, no per-operation clock/dossier). No direct "two-clock countdown + dossier" product found (INFORMATIONAL — absence in this scan).

**H3 sizing:** buyer set = fintechs/ERPs/estudios (est. 200–1.000 accounts AR — **ASSUMPTION**) × USD 300–1.500/mo (**ASSUMPTION**) → TAM USD 0,7–12M, wide band, **UNVALIDATED**. WTP anchor indirect (LeyRadar). Competitors above; none observed with rules-as-API (INFORMATIONAL).

**H2:** crowded (Marco/Agora/IntegraComex observed) → UNVALIDATED, absorbed into H1.

**Demand signals (H1):** (i) real pain costs published by an adjacent vendor (BL correction USD 100–150, demurrage USD 400+/day, agenteagora.com — CONFIRMED as their claim, observed; CL context → INFORMATIONAL for AR); (ii) two-clock regime CONFIRMED complex (`export-flow-escrow.md:66-80`); (iii) regime changed ≥2× in 2026 (A 8417 abr, A 8481 sep — churn observed); (iv) pymes exporting more, not less (+22,2% YoY, CAME). No AR-specific complaint thread found → demand verdict **PROMISING, not VALIDATED**.

## 4. Ranking

| # | Hipótesis | Dolor | Comprador | Tamaño rough | Competencia | Legal | Esfuerzo | PRIORIDAD | Veredicto |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **H1 Reloj de cumplimiento + dossier exportador** | Dos relojes acumulativos + docs dispersos = multa/demora (regime CONFIRMED) | Pyme exportadora (2.362), agencia, despachante | TAM USD 5,4M; SOM 270K (inputs ASSUMPTION) | Agora/Marco/LeyRadar (parcial, ninguno con reloj+dossier) | **CLEAN** (disclaimer OPEN-LEGAL light) | **S** (countdown + docs ya existen) | **1** | PROMISING |
| 2 | **H3 API de reglas cambiarias AR** | Operar sin saber si es lícito = multa 10× + prisión reincidencia | Fintechs, ERPs, estudios, despachas | TAM 0,7–12M (todo ASSUMPTION) | LeyRadar, MBA Systems, crombie (sin rules-API) | **OPEN-LEGAL** | **M** (perfil→API + mantenimiento normativo) | **1** | UNVALIDATED |
| 3 | **H2 Validación AI de docs comerciales** | Errores de campo = rechazo/multa (Agora claim) | Despachantes, agencias | Medio, saturado | **Marco, Agora, IntegraComex** | CLEAN (solo lectura) | **M** (sin código AI en repo hoy) | **2** | UNVALIDATED |
| 4 | **H6 Auditoría compliance cambiario (servicios)** | Miedo a sumario BCRA | Exportadores medianos + sus abogados | Sin ancla WTP | Consultoras boutique (complianceargentina) | OPEN-LEGAL | **S/M** (contenido ya escrito) | **2** | UNVALIDATED |
| 5 | H4 Dashboard brecha + plazos | Visibilidad tesorería | Tesorías AR | Datos gratis | Ámbito/IO (INFORMATIONAL) | CLEAN | S | **3** | REJECTED (sin wedge) |

## 5. Recomendación

**Top-2 para discovery profundo: H1 (reloj + dossier) y H3 (rules API).** H1 es la
mejor relación dolor×esfuerzo×limpieza legal: reutiliza (b)+(c)+(f), no mueve
dinero, y su único costo legal es el disclaimer (pasada L.D corta). H3 es el
activo más defendible (el corpus L.D convertido en producto) pero necesita
definición legal de hasta dónde llega "recomendar".

**¿Antes o en paralelo al core MX/US?** **Secundarios — ninguno va antes del
core.** Ninguno cannibaliza: H1/H3 no compiten por el mismo comprador del
merchanting MX/US, no tocan fondos y no prometen corredores (el landing ya no
debe decir "ARGENTINA LIVE" — `corridors.md:127-131`). **Paralelo sí, como
piloto acotado**: H1 es S-effort con lo ya construido y el founder tiene
distribución local argentina — un piloto con 10–20 exportadores no roba
roadmap al core y sirve de demand-test para H3. Cannibalization watch: si H1
absorbe 100% del foco, se cae el único corredor legalmente sano (US→MX);
mantenerlo como línea de producto separada, no como pivote.

## 6. Amenazas a la validez

- Exporter counts conflict (7.619 vs 9.123 vs ~9.000) — AI Overview-mediated, SUSPICIOUS; confirmar con INDEC/ARCA antes de deck.
- ARPU ancla es de un competidor anglo/global (LeyRadar) — AR pyme WTP real desconocido; el test barato es 10 llamadas de precio.
- "No direct competitor found" = absence in this scan, INFORMATIONAL (same caveat as `competitor-scan-positioning-2026-10.md`).
- Agora pain numbers are CL-observed.

## 7. Anti-goals — ya matados por L.D, NO reabrir por este canal

1. **Importaciones AR con crypto** → REJECTED (`fideicomiso-viability.md:265` claim 1; TO §10 + Ley 19.359).
2. **Escrow-until-cumplido / reloj acumulativo** → BLOCKED (`export-flow-escrow.md:52`, veredicto 1).
3. **Cualquier custodia** → PA-R5, red-lines 1–32 (`red-lines.md:68-113`; `fideicomiso-viability.md:160`).
4. **Fee sobre valor en AR** (`platformChargesFeeOnValue`) → todo pricing AR = suscripción facturada aparte (`profile.md:39-43,125`).
5. **Fideicomiso como producto** → "DIFFERENT PRODUCT — out of scope" (`fideicomiso-viability.md:242`) + red-line 21 anti-evasión.
6. **PSAV preparedness como producto-núcleo**: registro PSAV en CNV lista 0 (bitzo, SUSPICIOUS); ops PSAV = red-lines 22–26. Si alguien lo reabre, es vía L.D/CFO con licencia, no como derivado nuestro.
7. **Reutilizar (d) check-payment para cobros cripto domésticos AR** → Ley 19.359 + fee-on-value blocked → REJECTED.
8. **"Yield/swap" derivative con Tangem** → red-line 28 (`red-lines.md:135`).

## 8. Open-legal (requieren pasada L.D antes de build)

- **O1**: disclaimer wording H1 — "advisory clock, no discharge del deber de liquidación" (contra `profile.md:31`, TO §7.1).
- **O2**: H3 — alcance publicable de decisiones ("permitido/bloqueado") vs asesoramiento; filtro anti-evasión (red-line 21).
- **O3**: H6 — qué puede facturar la SAS del founder como consultoría vs producto.
- **O4**: si H1/H3 se marketan fuera de AR → RG 1172/2026 art. 4 nexus (extraterritorial, `profile.md:79-80`).
