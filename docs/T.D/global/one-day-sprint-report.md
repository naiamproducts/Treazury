---
dept: T.D
scope: global
kind: report
status: draft
as_of: 2026-10-28
sources:
 - docs/T.D/global/code-readiness-ui-audit.md:47-90,114-160 ( baseline: 11%, findings 1-10, landing surgery plan §4)
 - docs/P.D/global/product-explanation-agent-viability.md:36-59 (CPO approved honest statement: settlement-and-documents layer for merchanting trade)
 - aven (this sprint, ref MQD7); red-lines 1-32 vigentes; corridors call Engram #1462 (beachhead US→MX, MX→US, CO→US)
 - src/i18n/en.ts, index.html, src/components/LandingPage.tsx, e2e/04-landing-en.spec.ts (Bloque 1 edits, this run)
 - .env:15-16 (pre-edit owner key present; removed this run), .gitignore:1-6 (.env + dist/ ignored)
 - src/onchain-facts.ts:83-103 (GENERATED mainnet facts: 5042, rpc.mainnet.arc.io, explorer.arc.io, USDC 0x3600…0000)
 - src/modules/payments/providers/usdc-arc.ts (paymentPath flag + chain flip, this run); src/lib/arc-chain.ts (new, chain derived from onchain-facts)
 - supabase/functions/check-payment/index.ts (chain/RPC flip, testnet URL construction removed, this run); verify-payment/index.ts:217 (testnet fallback NOT touched — out of listed scope)
 - Tests run 2026-10-28 (this sprint): bun run check EXIT=0; bunx vite build EXIT=0 ("✓ built in 13m 27s", NODE_OPTIONS heap raise after OOM at default); bunx playwright test e2e/04 → 15 passed (4.6m); bun scripts/test-commercial-docs.ts → 28 passed; /tmp/opencode/trz-smoke.ts → PASS (direct path offline)
 - Live RPC reads 2026-10-28 (read-only, no txs): eth_chainId=0x13b2 (5042), eth_blockNumber=0x1b10de7 (~28.3M), eth_getCode(USDC 0x3600…0000) returns bytecode (CONTRACT present on mainnet)
 - skill 04-code-quality-review (checklist applied to the 3 blocks; e2e-as-evidence)
---

# Treazury — one-day public-demo sprint report

Sprint de 1 día previo a publicación (link demo + video). Sin commits (founder
no autorizó). Veredicto global: **los 3 bloques completados**; la publicación
queda habilitada desde el lado técnico, pendiente de decisiones del founder
(hosting, env de deploy, video, repo).

## 1. Bloque 1 — Quarantine de claims (completado, ~100%)

| Archivo | Cambio |
|---|---|
| `src/i18n/en.ts` | Velocidad fuera: `hero.title.line3` → "straight to your wallet" (:29), subtitle → statement honesto "settlement-and-documents layer for merchanting trade … buyer pays your wallet directly — verified on-chain, never holding funds" (:31), `comparison.speed.usdc` → "On-chain settlement — no correspondent legs" (:52). Partner claim (:64) reescrito sin rail prometido: verify-on-chain hoy + doc pack "rolls out to alpha accounts next". Region tags (:34-36) → claves renombradas `regions.beachhead='MEXICO · US'` / `regions.focus='MERCHANTING TRADE'` / `regions.upcoming='Invite-only alpha'` (sin ARGENTINA·LIVE·coming-soon). Trust tiles (:38-43) → "0% · Platform custody · USDC · Buyer pays your wallet directly · On-chain · Payment verified" (sin "paid into the supplier's bank" ni "Hours"). Subheading (:46) sin "regular bank deposit". 6 strings "Arc Testnet" → "Arc" (:90,:436,:442,:483,:488,:496) |
| `index.html` | title/description/og:title/og:description reescritos al statement honesto (EN); eliminado "2–6 hours" + "pay out to your supplier's local bank" (:7,:12,:16,:19) |
| `src/components/LandingPage.tsx` | Región en :272-279: bandera 🇦🇷 hardcodeada eliminada, keys migradas (`argentina`→`beachhead`, `live`→`focus`); estructura/visual `.luxe-landing` intacta |
| `e2e/04-landing-en.spec.ts` | Asserts actualizados en el mismo cambio: L-R1 subtitle, L-R2 velocidad, L-R3 flow completo (con `not.toMatch(/SEPA Instant or ACH/)` y `not.toMatch(/2–6 hours/)`), I18N-R3 title+og |

**Decisión item 5 (justificada):** "release the document pack" es overclaim
hoy (S2 no cableado: renderers stub, 0 refs en store — audit §2 finding 4).
Suavizado a "rolling out in the alpha" en flow heading/steps/statement.
**No rompe posicionamiento**: la categoría ("settlement-and-documents layer")
se mantiene en hero + meta — categoría ≠ claim de feature; el claim presente
que sí es true (pago directo + verificación on-chain) queda en presente.
E2E L-R3 ahora ASSERTA el framing honesto, no solo lo tolera.

## 2. Bloque 2 — Purge de dist + hardening (completado, 100%)

- `.env`: `VITE_ROUTER_OWNER_KEY` (líneas 15-16) eliminado + comentario de
 por qué. El read en `usdc-arc.ts` permanece (S1 lo borra) pero con env
 ausente produce `''` → rama vault no se ejecuta nunca.
- `dist/` purgado por rebuild (Vite `emptyOutDir`); chunk viejo
 `index-BMqBlNJA.js` ya no existe; build nuevo `index-BHs1gdG9.js`.

### Greps de aceptación (comandos exactos + output)

```
$ grep -rE "0x<valor-de-.env-original,mascarado-aqui>" dist/ ; echo $?
1 # 0 matches — la key NO está en dist (BLOCKER cleared)
$ grep -r "VITE_ROUTER_OWNER_KEY" dist/ ; echo $?
1 # 0 matches — ni el nombre (VITE_* inlined)
$ grep -rE "PLATFORM_FEE_BPS|DEV_FEE_BPS" dist/ ; echo $?
1 # 0 matches — minificados a nada; no quedan strings muertos
$ grep -rEoh "0x[0-9a-fA-F]{64}" dist/ | sort -u | wc -l
56 # 40 líneas totales: constantes de librería conocidas
```
Detalle de los 56: `0x60806040…` (prologue solc), `0xffffffff…`, padding ABI
`0x0000…`, y constantes secp256k1/BLS conocidas (Gx `0x79be667e…`, Gy
`0x216936d3…`, N `0x3617de4a…`/`0x011839296…`, BLS `0xaa87ca22…`) en chunks
coinbase/walletconnect/secp256k1 — **cero key material** (los anteriores 221
hits incluían la key; los library-constant son inevitables en cualquier bundle
web3 y la aceptación real — "la key no está" — pasa).

```
$ grep -rn "5042002" src/ supabase/
src/onchain-facts.ts:62: "chainId": 5042002, # ÚNICO hit
$ grep -rn "5042002" src/ supabase/ --exclude=onchain-facts.ts | wc -l
0 # 0 fuera del registro GENERADO
$ grep -rn "arcTestnet" src/ | grep -v src/lib/arc-chain.ts ; echo $?
1 # 0 refs en código de app
```
Nota: `5042002` en `onchain-facts.ts:62` es **por diseño** — el registro
GENERADO contiene ambas cadenas (AGENTS.md: never edit).

## 3. Bloque 3 — Mainnet flip mínimo + demo path (completado, ~90%)

- **`src/lib/arc-chain.ts` (nuevo, 1 archivo shared)**: Chain viem de Arc
 mainnet DERIVADO de `requireChain(5042)` (viem 2.57 no exporta arc mainnet).
 Id/RPC/explorer no se reescriben en ningún lado.
- **Flip (9 archivos + check-payment)**: `usdc-arc.ts` (const, RPC
 `rpc.mainnet.arc.io`, clients, `parseAmount(this.cfg.chainId)` — antes
 hardcodeaba testnet), `PaymentPage`, `PayWithWallet`, `useUsdcBalance`,
 `SendFundsDialog`, `config.ts` (wagmi chains/transport/registerChain),
 `sdk/index.ts`, `sdk/types.ts` (comentario), `check-payment/index.ts`
 (chain 5042, `PUBLIC_RPC_URL`→mainnet, **construcción de URL Alchemy
 testnet eliminada** — verificaba contra la cadena equivocada; ahora fail
 closed `misconfigured`).
- **Demo path sin vault (mínimo, reversible, 1 archivo)**: env flag
 `VITE_PAYMENT_PATH` en `usdc-arc.ts`, default `'direct'` → ambas ramas
 vault se saltan → URL `?to=<merchant>` (fallback existente en :267-274).
 `VITE_PAYMENT_PATH=vault` restaura el legacy (testnet only — no hay router
 en mainnet). **Smoke test** (`/tmp/opencode/trz-smoke.ts`): PASS —
 `?to=`, `chainId=5042`, sin `vault`, 10ms, sin RPC ni firma.
- **check-payment vs mainnet**: code-read + lecturas live (read-only, cero
 transacciones): chainId `0x13b2`=5042, bloque ~28.3M activo, USDC
 `0x3600…0000` tiene código (mismo address que testnet, coincide con
 onchain-facts). Constantes del edge fn ahora apuntan a mainnet. No hay
 tests unitarios del edge fn (no existen) — no se ejecutó.

### Comandos de build + preview

```bash
bun run check # EXIT=0 (oxlint --fix + tsc)
NODE_OPTIONS="--max-old-space-size=5120" bun run build # EXIT=0, ✓ built in 13m 27s
# (sin NODE_OPTIONS OOM-eó a heap default con load ~18 en esta caja;
# en CI limpio puede no hacer falta, pero dejalo en el pipeline)
bunx vite preview --port 4173 # sirve dist/ — verificado: title nuevo HTTP 200
```

### Config que falta para deploy (hosting = decisión del founder, no la elijo)

1. **[FOUNDER]** Hosting (Vercel/Netlify/CF Pages + cuenta owner) → artefacto
 estático = `dist/` con SPA fallback a `index.html`.
2. **[Supabase Secrets]** `ALCHEMY_RPC_URL` (o `ALCHEMY_ARC_TESTNET_RPC_URL`,
 nombre legacy conservado) apuntando a un RPC **Arc MAINNET** — es el
 backend primario de `check-payment` (rpcB público ya verificado). **Sin
 esto check-payment devuelve `misconfigured` y el demo nunca muestra
 "Verified on-chain ✓"**. Un endpoint gratis de Alchemy/QuickNode para
 Arc mainnet alcanza (dual-backend free tier).
3. **[FOUNDER]** Redeploy de edge functions:
 `supabase functions deploy check-payment --no-verify-jwt` (código
 cambiado) + secrets seteados.
4. **[FOUNDER]** `VITE_ROUTER_OWNER_KEY` debe seguir AUSENTE en el env de
 build; presentes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
 `VITE_PRIVY_APP_ID`; opcional `VITE_WALLETCONNECT_PROJECT_ID`
 (fallback dev-placeholder), `VITE_SHOW_REGISTER` (flag de registro).
5. **[FOUNDER]** Video demo + link (contenido/marketing) + timing de repo
 público — fuera de T.D.

## 4. Estado de tests

| Test | Resultado |
|---|---|
| `bun run check` (lint --fix + tsc) | **EXIT=0** |
| `bunx vite build` | **EXIT=0** (✓ 13m 27s) |
| `bunx playwright test e2e/04-landing-en.spec.ts` | **15 passed** (0 failed; baseline audit era 8 pass/7 env-fail — chromium 1248 instalado con `npx playwright install chromium`) |
| `bun scripts/test-commercial-docs.ts` | **28 passed** |
| Smoke `createCharge` direct (offline) | **PASS** |
| e2e 01/02/03/09, `forge test`, `test-modules.ts` | NO corridos (fuera del sprint; 02 solo asserta `Arc Testnet` count=0 → compatible con el flip) |

## 5. Qué NO entra (declarado, no hecho)

Strip completo de vault/S1 (115 refs, 8-10d) · pipeline documental S2 (doc
release) · perfil US del gate jurisdicción · dual-RPC soak 48h (riesgo
aceptado: flip comprimido con wallets del founder ≤$5, founder-only, hasta
L.D) · e2e completo · forge · commits · hosting elegido · repo público.

## 6. Riesgos residuales para la publicación

1. **RPC único en frontend** (viem client apunta solo a `rpc.mainnet.arc.io`;
 sin failover) — SIN soak 48h. Mitigación: founder-only, ≤$5.
2. **`verify-payment/index.ts:217`**: fallback `arc-testnet.g.alchemy.com`
 sigue construyéndose si `ALCHEMY_RPC_URL` no está seteado — **no lo toqué**
 (archivo fuera del alcance listado). Falla-seguro (no marcaría paid nunca
 con esa URL) pero deja el fast-path muerto. Fix =1 línea, pedir autorización.
3. **`MIN_CONFIRMATIONS=12` sin re-validar** para mainnet (cadencia de bloques
 distinta) — podría demorar/adelantar "wait_finality".
4. **Terminología legal**: `legal.terms.alpha` decía "Arc Testnet, where assets
 have no real value" — corregido a "Arc blockchain" (factual), pero la Terms
 en mainnet merece review del CLO antes de publicar.
5. **Vault refs muertas quedan** (~115): `PaymentPage` aún parsea `?vault=`,
 `PayWithWallet` conserva ABI `deposit*`, `check-payment` resuelve
 `vault_address` (inerte si null). El demo NO las ejercita — los links
 generados llevan solo `?to=` (verificado por smoke). Riesgo: un link legacy
 con `?vault=` seguiría renderizando el modo vault (no existe en mainnet →
 no-op). S1 las elimina.
6. **Key vieja en distribuciones pasadas**: si `dist/assets/index-BMqBlNJA.js`
 fue compartido, la key testnet quedó expuesta (solo controla PaymentRouter
 de testnet, sin fondos; no hay router mainnet). Rotar si hubo difusión.
7. **Landing audience badge** sigue "For import/export agencies" — línea de
 audiencia, no red-line; ajuste de ICP = CPO.

---
*Status: draft. Writeback: aven note + Engram
`naiam-si/treazury/tech.one-day-sprint`. Sin commits.*
