---
dept: P.D
scope: global
kind: product-brief
status: draft
as_of: 2026-10-28
sources:
 - /home/kiox/treazury/docs/T.D/global/mvp-v1-scope.md (hypothesis V1, RICE cut, out-of-scope congelado, acceptance criteria, secuencia de slices)
 - /home/kiox/treazury/docs/M.D/global/nocustody-pivot.md:68-186 (Ledger Gate/Shield/Corridor Desk, pricing P3, posicionamiento, umbrales WTP pre-registrados)
 - /home/kiox/treazury/docs/M.D/global/tazapay-agentic-deepread.md (landscape agentic 2026: ≥8 majors con producto, 0 en B2B trade docs; Doc Verification Agent recomendada V1.5; regla de anuncio post-evals)
 - /home/kiox/treazury/docs/M.D/global/competitor-scan-positioning-2026-10.md:111-151 (stress-test del statement externo: veredicto previo ADAPT; reescritura PROMISING)
 - /home/kiox/treazury/docs/L.D/global/non-custody-boundary.md:177-188 (matriz de comportamientos: #2 escrow no-administrado NO-PSAV/GRIS; #3 recovery key nuestra = PSAV Cat 4; #7 escrow self-custodial GRIS→NO-PSAV estricto, counsel pendiente)
 - /home/kiox/treazury/docs/T.D/global/mainnet-first-rescope.md (Escenario A mainnet-first: 4 slices+flip, cero contratos, link ~2026-12-04…18, WTP no depende del build)
 - /home/kiox/treazury/docs/M.D/ar/derivative-product-discovery.md:89,97,123 (H1 reloj de cumplimiento+dossier = PROMISING piloto; escrow-until-cumplido = BLOCKED)
 - /home/kiox/treazury/docs/L.D/ar/tangem-revshare-analysis.md:31,197-201,333 (rev-share Tangem = CONDITIONAL con segregación; funding stream, no producto)
 - /home/kiox/treazury/docs/F.D/ar/crypto-utility-verdict.md (importaciones AR REJECTED; P3 +$101.01/pago facturado aparte)
 - /home/kiox/treazury/AGENTS.md:202-203 (PA-R5 no custodia); grep repo llm|openai|agentic = 0 hits (CONFIRMADO 2026-10-28, vía competitor-scan:39)
 - Engram #1486 (tazapay agentic deepread — hueco B2B trade docs, apuesta Doc Verification Agent)
 - skills naiam-si: 02-mvp-scoping (cut line MUST-HAVE), 40-strategy-decision-framework (matriz de decisión), 07-ai-feature-integration (eval-harness antes de ship)
 - aven (this task, ref NV22)
---

# Treazury — explicación del producto + viabilidad de "The Agent-Native Settlement Layer for Global Trade"

Decision-support para el founder vía CoCEO. Skills cargados: `02-mvp-scoping`
(primario) y `40-strategy-decision-framework` (veredicto de viabilidad).
Vocabulario de veredicto: `VALIDATED / PROMISING / UNVALIDATED / REJECTED`;
hallazgos factuales: `CONFIRMED / SUSPICIOUS / INFORMATIONAL`.

---

## ENTREGABLE 1 — ¿En qué quedó el producto?

### 1.1 Una frase + un párrafo

**En una frase:** Treazury es hoy el **Ledger Gate**: una capa no-custodia de
settlement-and-documents para empresas de comercio triangular/merchanting en el
corredor MX/US — el comprador paga USDC **directo a la billetera del vendedor**
(sin que Treazury toque un dólar), la plataforma verifica el pago on-chain,
libera el pack documental (invoice + packing list, PDF/CSV) y trackea
vencimientos; cobra un fee fijo P3 ($75 ≤$50K / $150 >$50K por pago),
**facturado aparte**, nunca descontado del flujo.

**El párrafo:** El ICP es la firma de triangular-trade/merchanting con tickets
de $15K–200K (y la agencia que opera por varias de ellas). El dolor validado no
es "pagar más barato": es que **los documentos van detrás del dinero** —
invoice y packing list re-teclados por email/WhatsApp, errores que frenan
aduana, y nadie puede probar cuándo cayó el pago. CashAbroad (el competidor
directo, custodial, 2–4 personas) no tiene capa documental
(`cashabroad-teardown.md`); los bancos mueven la plata sin tocar los docs. La
inversión de Treazury respecto de todos: **el dinero se mueve primero
(cliente→cliente, directo) y lo que se libera condicionado son los
DOCUMENTOS**, no el dinero. El fee es fijo e invoiced-apart porque es la única
configuración contribution-positive y legal (+$101.01/pago,
`crypto-utility-verdict.md`). Estado: **V1 en preparación** — mainnet-first
para Arc (link público esperado ~2026-12-04…18, `mainnet-first-rescope.md`),
y el gating real del negocio no es el build sino el **WTP: 10 entrevistas de
falsificación con el fee P3 dicho en voz alta** (≥3/10 pre-órdenes a precio
completo = `VALIDATED`; ≤1/10 = `REJECTED`).

### 1.2 Qué NO es (caminos descartados, con veredicto)

| Camino descartado | Veredicto | Por qué (fuente) |
|---|---|---|
| Importaciones Argentina | **REJECTED** | El importador pagaría premio 6.82%; sin demanda a ningún ticket (`F.D/ar/crypto-utility-verdict.md`) |
| Custodia de cualquier tipo | **PA-R5 (hard rule)** | Nunca billeteras de plataforma, passthroughs ni estructuras que retengan USDC (`AGENTS.md:202-203`) |
| Conversión fiat / off-ramp | **Blocked** | `platformConvertsToFiat: blocked` en MX; el FX es de un banco/OTC licenciado, nunca nuestro (`flow-matrix.md`) |
| Fee % sobre valor / fee on-flow | **REJECTED** | P3 es fijo y facturado aparte; netting del fee del valor destruye la economía y la caracterización legal (red-line 6, `non-custody-boundary.md` matrix #8) |
| Fideicomiso | **Different product** | Línea distinta, fuera de scope (`fideicomiso-viability.md`) |
| China | **BLOCKED** | Rieles crypto prohibidos (银发〔2026〕42号, `cn/profile.md`) |
| Escrow-until-cumplido argentino | **BLOCKED** | Retención hasta cumplido = reloj acumulado 20bd imposible + PSAV (`export-flow-escrow.md:52`) |

**Productos derivados (secundarios, no el core):**
- **Reloj de cumplimiento + dossier exportador AR (H1)** — PROMISING, discovery
 profundo; puede correr como **piloto paralelo** (`derivative-product-discovery.md:89`).
- **Rev-share Tangem (30%)** — **CONDITIONAL** (segregación estricta; funding
 stream, nunca producto ni parte del stack; no cobrar antes de revisar el
 contrato, red-line 32) (`tangem-revshare-analysis.md:333`).

### 1.3 Estado actual de build

V1 mainnet-first = **4 bloques** (`mainnet-first-rescope.md` §3):
1. **De-custodizar** — archivar PaymentRouter/OrderVault del runtime, quitar
 vault branches y owner-key, cuarentena de claims ("2–6h" etc.). *Prerequisito
 de toda palabra "non-custodial" pública (red-line 1).*
2. **Pipeline documental mínimo** — draft-gen (invoice + packing list) →
 release gate idempotente `draft → released` al confirmarse el pago → export
 HTML/CSV.
3. **Gate de jurisdicción** — port del perfil MX (confirmed) + wire
 `assertCorridorAllowed` fail-closed (red-line 4).
4. **Demo readiness** — chain flip a Arc mainnet (5042), hosting, link vivo,
 repo público, grant pack.

**Cero contratos desplegados** (CONFIRMED — el footprint on-chain es transfer
USDC buyer→seller verificada por receipt; ninguna respuesta de código de
contrato propio se invoca). Link mainnet esperado: **~diciembre 2026**. El
gating real de negocio: **WTP de 10 entrevistas** — el build existe para
convertir y cumplir la primera pre-orden, no para validar la demanda (que se
valida con las entrevistas, en paralelo, sin esperar al demo).

---

## ENTREGABLE 2 — ¿Es viable "The Agent-Native Settlement Layer for Global Trade. Agents verify documents, generate confirmations, and release funds automatically."?

### 2.0 Framing (skill 40)

- **Decisión:** ¿adoptamos este statement como dirección y claim de producto?
- **Reversibilidad:** como *north-star interno* = **puerta de dos hojas**
 (positioning + roadmap, reversible, decide ya); como *claim público* = la
 parte "release funds" es one-way door (promesa pública + red-lines + riesgo
 vaporware) → founder decision, gated por WTP + evals.
- **Litigado antes:** el stress-test M.D de este mismo statement
 (`competitor-scan-positioning-2026-10.md:111-151`) ya dio **ADAPT**. No se
 re-litiga sin evidencia nueva; la evidencia nueva = el landscape agentic
 (Engram #1486, `tazapay-agentic-deepread.md`) que permite evaluar
 "agent-native" con datos frescos. El veredicto se **profundiza y confirma**.
- **Opciones evaluadas:** (O1) ADOPT tal cual · (O2) ADAPT — statement honesto
 hoy + agent-native como apuesta faseada · (O3) REJECT agent-native, Ledger
 Gate puro · (O4) agent-native solo como V2 opportunistic.

### 2.1 Claim por claim

| # | Componente del statement | Veredicto | Versión donde es verdad | Qué hay que construir |
|---|---|---|---|---|
| (a) | "Settlement Layer for Global Trade" | **ADAPT** — acotar HOY | V1: "…for **merchanting trade** (MX/US)"; "global" llega con la 2ª o 3ª corridor validada | Nada de build: es copy. Expandir el claim cuando un segundo corredor pase WTP. North-star defendible: sí, la ambición es legítima como dirección; el beachhead validado es merchanting MX/US, no "global trade" (`nocustody-pivot.md:138-142,164-171`) |
| (b) | "Agent-Native" | **UNVALIDATED hoy** → **PROMISING como dirección condicionada** | V1.5 (post-WTP) | Cero AI en el repo (grep CONFIRMED). Landscape: ≥8 gigantes con producto agentic pero **0 con producto en B2B cross-border trade con documentos** — hueco vacío (Engram #1486). Condiciones para que sea viable: (i) WTP ≥3/10 primero; (ii) eval harness (skill 07) construido ANTES del agente; (iii) anuncio solo con métricas publicables; (iv) "agent-native" como arquitectura (el agente es parte del flujo core, no un chatbot bolt-on) — no como claim de marketing antes de hora |
| (c) | "Agents verify documents, generate confirmations" | **PROMISING** (con evals) | V1.5 — Doc Verification Agent | Verificación: invoice ↔ packing list ↔ monto pagado ↔ HS/Incoterm por LLM extraction + reglas; flaggea excepciones; **release queda humano** (`tazapay-agentic-deepread.md:81-92`). Confirmaciones: generadas deterministamente desde datos extraídos + template (no "el agente redacta libre"). **Métricas mínimas antes de claims públicos** (skill 07: golden set ≥20 casos reales, scoring, threshold; números propuestos = UNVALIDATED hasta que el CTO corra el harness): precisión de extracción de campos ≥95%; **recall de detección de discrepancias ≥95%** (un mismatch silencioso es el fallo caro — libera docs sobre una operación rota); false-release rate = **0** en el golden set (el gate determinista es el piso, el agente solo agrega señales); p95 latencia y costo/1k calls medidos en run real. Sin estos números: no hay claim de "verify" público |
| (d) | "Release funds automatically" | **REJECTED tal cual** (V1); **CONDITIONALmente viable solo como Shield V2** | V1: release de **documentos** automático y determinista al confirmarse el pago (eso ya es verdad y es el producto). V2: release de **fondos** solo si el retenerlo vive en un escrow cuyas llaves son DEL CLIENTE y el **contrato** libera bajo condiciones — nunca Treazury | En V1 Treazury **no retiene fondos que pueda liberar**: el pago es client→client y lo que se libera son documentos (release determinista, no agent). Como Shield Protocol V2: escrow multi-sig estilo Gnosis Safe, signers = las dos partes (opcional Tangem como signers hardware), **sin admin key, sin upgrade, sin pause, timeout-refund a los remitentes** — L.D matrix #2 = NO-PSAV(Treazury)/GRIS(producto), matrix #7 = GRIS→NO-PSAV solo bajo condiciones estrictas y **counsel debe confirmar**; recovery key que nosotros designemos = PSAV Cat 4 = **REJECTED** (`non-custody-boundary.md:182-187`). Además requiere founder call sobre PA-R5 ("structures that hold USDC" barra solo controladas o cualquier escrow — `non-custody-boundary.md:294-298`). Reconciliación "automatic" vs release humano (M.D): **sí se reconcilia** — auto-release de DOCUMENTOS en V1 (determinista), auto-release de FONDOS en V2 solo vía contrato con llaves del cliente; el agente en V1.5 **nunca** tiene autoridad de release de nada: solo flaggea, el humano decide y el gate determinista ejecuta |

### 2.2 Veredicto global

**ADAPT** (confirma y profundiza el ADAPT previo de M.D). El statement tal cual
es **REJECTED**: claim (d) contradice PA-R5 y las red-lines 22–24, (a) es
demasiado amplio vs el beachhead, (b)/(c) son UNVALIDATED sin evals, y "Instant"
(el adjetivo del statement original) ya era REJECTED (sin rail contratado).

**En qué versión sería verdad completo:**
- **V1 (hoy→dic 2026):** "settlement-and-documents layer for merchanting
 trade MX/US. Non-custodial: your buyer pays your wallet directly; we verify
 the payment on-chain and release the commercial document pack."
 Sin AI, sin "agent", sin "release funds".
- **V1.5 (post-WTP + evals):** + "agents verify documents and generate
 confirmations" (Doc Verification Agent, release humano, métricas
 publicadas). + auto-release determinista de docs (ya en V1, ganancia de UX).
- **V2 (post-counsel + PA-R5 call):** + Shield Protocol — "funds release
 automatically **under conditions your own keys control**" (escrow
 cliente-keyed, contrato auto-libera; Treazury nunca).

**Statement honesto para decir HOY (post-WTP, pre-annuncio de agente):**

> Treazury — the settlement-and-documents layer for merchanting trade.
> Non-custodial USDC settlement: your buyer pays your wallet directly;
> Treazury verifies the payment on-chain, then releases the commercial
> document pack — invoice, packing list — and tracks the due dates. Your keys
> stay on your side; FX stays with your licensed bank. Unlike custodial
> payment apps or bank wires where paperwork chases the money, at Treazury we
> never hold a dollar of your funds.

(Es la reescritura ya scored PROMISING 4/5/4 en
`competitor-scan-positioning-2026-10.md:135-151`; traducción criolla: el
comprador te paga directo, nosotros verificamos y soltamos los papeles; tu
plata nunca pasa por nosotros.)

**North-star (para después, no para hoy):**

> The Agent-Native Settlement Layer for merchanting trade: agents verify
> documents and generate confirmations; funds never touch Treazury —
> settlement is buyer→seller direct (V1/V1.5), or customer-keyed Shield
> escrow that releases automatically under contract conditions (V2).

### 2.3 Orden de construcción para que cada claim sea cierto

1. **S1–S4 mainnet-first** (actual) → hace verdad (a)-acotado y el non-custodial.
2. **WTP 10 entrevistas** → gating de todo: si ≥3/10, P3 VALIDATED y el
 roadmap V1.5 se activa; si ≤1/10, re-price y el agent-native espera.
3. **Eval harness** (skill 07: golden set ≥20 casos reales de packs
 invoice/packing list del corredor, scoring, thresholds) — **antes** del
 agente, no después.
4. **Doc Verification Agent (V1.5)** detrás de flag, release humano, medido.
 Anuncio con números, solo post-WTP + evals (regla M.D: nada de "agente" en
 copy público antes).
5. **Shield V2** solo después de: counsel sobre escrow no-administrado
 (matrix #7), founder call PA-R5, y señal de WTP de protección-impago (P1).

### 2.4 Recomendación de producto (CPO)

**Agent-native como apuesta estratégica central — pero faseada y con puertas
de gating duras, no como roadmap de marketing hoy.** Ni "central ya" ni
"opportunistic en V2".

- **Por qué central (no opportunistic):** el hueco es **CONFIRMADO**
 (≥8 majors con producto agentic, **0** en B2B cross-border trade con
 documentos — Engram #1486); el wedge validado (documents, no money) es
 exactamente el suelo donde el agente aplica; y es la inversa nítida de todos
 los gigantes (ellos agent-izan el pago, nosotros agent-izamos el documento).
 Dejarlo como "V2 opportunistic" le regala el lenguaje de la categoría a
 Tazapay (que ya siembra la narrativa sin producto) y a Visa (que lo nombra
 aspiracionalmente). Es la única apuesta de defensa a largo plazo que nace de
 una ventaja que ya tenemos: acceso al flujo documental del merchanting.
- **Por qué faseada:** sin WTP validado, el agente es una feature sin
 demanda pagada; sin evals, anunciarlo es exactamente la crítica que nosotros
 mismos le hicimos a Tazapay (thought-leadership sin producto = vaporware).
 El esfuerzo de evals + pipeline LLM es capability nueva para el equipo
 (hoy cero AI en el repo) — se invierte **después** de que el Ledger Gate
 cobre su primera pre-orden, no antes.
- **Riesgo de vaporware, mitigado por diseño:** la regla es binaria —
 (i) WTP completado, (ii) harness con threshold publicable, (iii) recién
 entonces "agents" en copy. Mientras tanto, el claim externo es el
 Ledger Gate honesto, que ya es diferenciado y defendible.

---

## Decisiones que quedan para el founder (via CoCEO)

1. **ADAPT del statement** (aprobar el honesto de hoy + north-star faseado).
2. **Arranque del WTP** (14 días, founder time) — es el gating real de V1.5
 y del agent-native; no depende del build.
3. **PA-R5 scope:** ¿"structures that hold USDC" barra solo escrows
 controladas por nosotros o cualquier escrow? — desbloquea el diseño V2.
4. **Autorizar o no la inversión V1.5 (evals + Doc Verification Agent)** como
 siguiente bloque de roadmap post-WTP `VALIDATED`.
5. Confirmar que **Shield V2 y Tangem signer** siguen OUT de V1 (ya congelado
 en scope) y que el rev-share Tangem queda como funding stream CONDITIONAL
 segregado, nunca como producto.

---
*Status: draft for founder review via CoCEO. Writeback: aven note;
Engram `naiam-si/treazury/product.explanation-agent-native`.*
