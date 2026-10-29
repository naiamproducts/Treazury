---
dept: T.D
scope: global
kind: audit
status: draft
as_of: 2026-10-28
sources:
 - docs/T.D/global/mvp-v1-scope.md:31-265 (V1 mainnet-first scope, 4 slices, acceptance criteria A-H)
 - docs/T.D/global/mainnet-first-rescope.md:94-233 (Escenario A slice list, config flip table, acceptance greps, effort table)
 - docs/P.D/global/product-explanation-agent-viability.md:36-99,138-162 (CPO brief: Ledger Gate, honest statement)
 - docs/T.D/global/adr-001-jurisdiction-engine.md:147-172 (port+wire same-change rule)
 - contracts/PaymentRouter.sol (custodial: OrderVault, refund, fee sweep — candidate for contracts/legacy/)
 - src/modules/payments/providers/usdc-arc.ts:52-53,190,239-274,328-411 (fee consts, owner key, vault branches, direct fallback)
 - src/components/PaymentPage.tsx:91-113,185-219,224,302 (vault-first routing, vault polling, luxe-landing scope)
 - src/components/PayWithWallet.tsx:4,112 (isVault atomic deposit path)
 - src/store/index.ts:1167-1204 (markChargePaid — no doc release), :1087-1160 (updateOrder, fiscal-only trigger)
 - src/modules/commercial-docs/renderers/{invoice,packing-list}.ts (stubs returning '')
 - src/modules/jurisdiction/index.ts:202 (assertCorridorAllowed), profiles/mx.ts:1-30 (skeleton all-unknown), profiles/ar.ts (only ar+mx exist; no us.ts)
 - src/i18n/en.ts:29-64 (red-line claims: 2–6h x3, ARGENTINA LIVE, 100% Self-custody, SEPA/ACH partner claim)
 - index.html:7-19 (meta description + og:description carry the 2–6h claim; Vite shell, no static landing markup)
 - src/components/LandingPage.tsx:186 (.luxe-landing root), :275 (ARGENTINA region tag)
 - src/components/dashboard/Shell.tsx:58-285 (light theme var(--ink)/var(--bg-gradient); 0 luxe refs in dashboard/)
 - tailwind.config.js + src/index.css:6-40 (shared tokens; body font 'DM Sans' legacy vs token sans)
 - DESIGN.md:1-80 (tokens, luxe-dark-only-in-.luxe-landing rule, light dashboard theme)
 - e2e/04-landing-en.spec.ts:154-290 (L-R1..L-R6; L-R2 hard-asserts '2–6 hours, end to end' at :183)
 - supabase/functions/check-payment/index.ts:1-491 (3 reorg gates; 0 commercial/release refs), verify-payment/index.ts:42
 - scripts/test-jurisdiction.ts (19 tests), scripts/test-commercial-docs.ts (28 tests incl. PA-R5 static guard)
 - package.json:6-17 (scripts; no deploy path), playwright.config.ts:23-28 (webServer bun run dev)
 - .env (VITE_ROUTER_OWNER_KEY set, value length 66 — name/length only inspected), .gitignore:15 (dist/ ignored)
 - git status 2026-10-28: 8 untracked paths, tracked tree clean, last commit 1d2057e 2026-10-25
 - Tests run 2026-10-28 (this audit): `bun run check` green (0 diff after --fix); `bun scripts/test-jurisdiction.ts` 19/19; `bun scripts/test-commercial-docs.ts` 28/28; `bunx playwright test e2e/04-landing-en.spec.ts` 8 passed / 7 failed (all failures = browserType.launch, missing chrome-headless-shell-1248 — env, not assertions); `forge test` NOT RUN (forge not installed in env)
 - python3 dist scan 2026-10-28: VITE_ROUTER_OWNER_KEY value found in dist/assets/index-BMqBlNJA.js (CONFIRMED); 221 total 64-hex matches across 12 dist files (mostly library constants)
 - skill 04-code-quality-review (repo_risk_scan.py --top 15: 497 src files, 139573 lines, 9 markers, no critical flags in app code)
 - aven (this task, ref 42S7); Engram topic naiam-si/treazury/tech.code-readiness-ui-audit
---

# Treazury code & UI readiness audit — V1 mainnet-first slice

Read-only audit against `mvp-v1-scope.md` + `mainnet-first-rescope.md` (Escenario A)
and the CPO brief (`product-explanation-agent-viability.md`). No code was
modified; `bun run check --fix` produced zero diff. Verdict vocabulary:
`VALIDATED / PROMISING / UNVALIDATED / REJECTED`; findings: `CONFIRMED /
SUSPICIOUS / INFORMATIONAL`, severity blocker/major/minor (max 10 findings).

## 0. Global verdict

**REJECTED as mainnet-ready today: 11% of the minimum mainnet slice.**
Weighting by the rescope effort table (`mainnet-first-rescope.md:211-218`,
26–37 working days total): S1 5% × 9d, S2-min 15% × 8.5d, S3-min 30% × 4d,
chain flip 10% × 3.5d, mainnet verification 0% × 3d, hosting 10% × 4d,
repo/grant 10% × 5.5d → ≈ 4.3/37.5 ≈ **11%**.

The *foundation* is `VALIDATED`: verification edge functions, buyer payment UI,
jurisdiction engine, commercial-docs module, i18n catalog and the lint/type
gate all exist and their tests pass. What is missing is everything that makes
the slice *mainnet + honest*: custody removal, doc release wiring, gate
wire-up + MX port, chain flip, hosting, and the claims quarantine.

## 1. Readiness by area

| Area | % | Evidence |
|---|---|---|
| Contracts / custody path (S1) | **5%** | Nothing stripped: `PaymentRouter.sol` still active path; fee consts `usdc-arc.ts:52-53`; owner-key read `:190`; 115 `vault` refs across 14 files (`usdc-arc` 40, `PaymentPage` 31, `PayWithWallet` 22); key→vault-deploy branch still primary `:246-248`; claims quarantine 0% |
| Frontend flows (link, wallet, verify) | **70%** | `PaymentPage`/`PayWithWallet`/`check-payment` work on testnet; direct `?to=` fallback exists (`usdc-arc.ts:267-274`); but vault-first UX must be inverted by S1, and no e2e covers the payment flow (specs are 01–04, 09 only) |
| Document pipeline (S2-min) | **15%** | Module + factory + CSV + migration 006 exist (28 tests green); renderers return `''` (stubs); **0** `commercial` refs in `src/store/` or `supabase/functions/`; `markChargePaid` (`store/index.ts:1167`) flips paid with no release gate; no export UI; e2e 05/06/07 absent |
| Jurisdiction gate (S3-min) | **30%** | Engine + `assertCorridorAllowed` (`jurisdiction/index.ts:202`) + 19 tests green, fail-closed; **0 imports outside the module** (not wired); MX profile is skeleton all-unknown (`profiles/mx.ts`) — wiring before porting would refuse every MX flow; only `ar.ts`/`mx.ts` exist, no `us.ts` |
| i18n / landing | **55%** | Machinery solid (591-line catalog, `t()`, e2e 04/09); red-line claims live in `en.ts:29,31,41,52,64` and `index.html:12,19` — incl. an uncontracted SEPA/ACH partner claim (`en.ts:64`) |
| Tests / e2e | **60%** | `bun run check` green; jurisdiction 19/19; commercial-docs 28/28; e2e 04 = 8 pass/7 fail (env: missing `chrome-headless-shell-1248`, all failures at browser launch); `forge test` not runnable (forge absent); `test-modules.ts` not run (may broadcast with key set, per AGENTS.md) |
| Config / chain flip | **10%** | Mainnet facts already generated (`onchain-facts.ts:84-90`, chainId 5042, `rpc.mainnet.arc.io`); flip untouched — `5042002` in 9 src files + `check-payment` |
| Infra (hosting/CI/Supabase) | **10%** | No `.github/workflows/`, no host config, no deploy path (package.json deploy scripts are contract deployers); `bun run build` type-checks (tsc in check); repo private; migration-006 prod status unverified |

## 2. Findings (10, classified)

1. **BLOCKER · CONFIRMED** — `VITE_ROUTER_OWNER_KEY` value (length 66, set in `.env`) is present in the built bundle `dist/assets/index-BMqBlNJA.js` (python value-match scan, 2026-10-28). `dist/` is gitignored (0 tracked files) so it is not in git, but **hosting this build publishes the key**; the rescope acceptance `grep -RE "0x[0-9a-f]{64}" dist/` fails today (221 hits incl. the key). Fix is S1 (remove key from flow) + purge/rebuild `dist/` before any deploy.
2. **BLOCKER · CONFIRMED** — S1 not started: custody path still primary (`usdc-arc.ts:246-274`), fees live (`:52-53`), owner key read client-side (`:190`), `PaymentRouter.sol` not archived, 115 vault refs remain. Any public "non-custodial" claim violates red-line 1 until this lands.
3. **MAJOR · CONFIRMED** — Red-line 2 claims live: `index.html:12,19` (meta + og: "2–6 hours", "pay out to your supplier's local bank"), `en.ts:29,31,52` (2–6h), `en.ts:64` (named-partner SEPA/ACH claim — no rail contracted), `en.ts:34-36` + `LandingPage.tsx:275` ("ARGENTINA · LIVE · VE·MX·CO·CL coming soon"), `en.ts:41` ("Paid into the supplier's bank"), `en.ts:38-40` ("100% Self-custody" — false while the vault path exists).
4. **MAJOR · CONFIRMED** — S2-min absent end-to-end: renderers are empty stubs, store and `check-payment` have zero `commercial_docs` references, no export UI, no release gate at either attach point (DRG requirements unimplemented).
5. **MAJOR · CONFIRMED** — S3-min half-done: engine tested but unwired; MX profile skeleton (`profiles/mx.ts`) contradicts `docs/L.D/mx/profile.md:20-35` (confirmed, `buyerToSellerDirect` permitted) — ADR-001 requires port + wire in the same change or the gate blocks the beachhead.
6. **MAJOR · CONFIRMED** — No CI, no hosting config, no deploy/rollback path; repo private with 8 untracked paths (jurisdiction module, its tests, all department `docs/`) and last commit `1d2057e` on 2026-10-25.
7. **MAJOR · SUSPICIOUS** — `006_commercial_docs.sql` applied to production Supabase unknown (manual operator apply, no CI, not idempotent per AGENTS.md). Verify: `select to_regclass('public.commercial_docs'), to_regprocedure('public.next_commercial_doc_number()');`
8. **MINOR · CONFIRMED** — Landing e2e hard-asserts the claims we must quarantine: `e2e/04-landing-en.spec.ts:183` asserts `'2–6 hours, end to end'` (L-R2). Claims quarantine must update e2e 04 in the same change or the suite goes red.
9. **MINOR · CONFIRMED** — e2e env broken in this workspace: Playwright points at `/home/kiox/.config/naiam-si-v1/cache/ms-playwright` and `chromium_headless_shell-1248` is missing (7 launch failures, 0 assertion failures). `npx playwright install chromium` restores it. `forge` likewise absent → `bun run contracts:test` unrunnable here (low impact: contracts get archived in S1).
10. **MINOR · CONFIRMED** — Swallowed errors on the vault path: empty `catch` at `usdc-arc.ts:262-264` and warn-and-continue at `:249-251` mean a broken RPC silently produces `?vault=` links; AGENTS.md documents the "success with no funds moved" no-op hazard (`PaymentPage.tsx:97` `hasVault = isAddress` is syntactic). S1 removes this class of bug by deleting the path.

**Verdicts:** correctness — flows work but the custody behavior contradicts the
product claim (REJECTED for public claims, VALIDATED as testnet mechanics);
error handling — adequate on the payment path, silent-catch debt on vault
fallback (minor); tests — unit/harness `VALIDATED`, e2e `UNVALIDATED` today
(env), coverage gap on the payment flow; security — **REJECTED for deploy**:
owner key in `dist/` (finding 1) must clear before hosting.

## 3. Aesthetic consistency: landing vs internal routes

**Verdict: the two buyer-facing surfaces already share one design system; no
side needs a big adaptation.** `index.html` is not a static landing — it is a
33-line Vite shell (fonts + meta + `<div id="root">`, `index.html:21-31`); the
landing is React `LandingPage.tsx:186` scoped to `.luxe-landing`, and the
payment routes (`PaymentPage.tsx:224,242,302`, `PayWithWallet.tsx`) reuse the
same `.luxe-landing` / `.luxe-glass` / `font-serif` utilities and the same
tokens (`tailwind.config.js`: onyx/graphite/platinum/silver/icyCyan/luxeCyan;
Cormorant Garamond + Plus Jakarta Sans + Space Grotesk). The dashboard is
*deliberately* light (`Shell.tsx:210` `var(--bg-gradient)`, `var(--ink)`, 0
`luxe` refs) per DESIGN.md's documented rule "luxe-dark only inside
`.luxe-landing`" and AGENTS hard rule 6 — that is governance, not drift, so
**do not adapt the dashboard toward the landing**; changing it would be a
DESIGN.md amendment (product/UX call, via CPO). The only real divergences are
micro: (a) body default font is legacy `'DM Sans'` (`src/index.css:37`) while
the token sans is Plus Jakarta Sans — retire DM Sans/JetBrains Mono from the
`index.html:25` font request; (b) `index.html` meta copy diverges from the
i18n catalog (AGENTS.md notes this) — both carry red-line claims and should be
rewritten together. **Net: internals already match the landing; only font
cleanup + unified meta copy adapt, landing-side and shell-side, not dashboard.**

## 4. Landing modifications (`index.html` + `en.ts` + `LandingPage.tsx`)

Prioritized by impact/effort (copy surgery ≈ 1.5–2 working days total,
including the e2e 04 assertion update):

1. **[compliance, blocker] Remove all speed claims** — `en.ts:29` (hero
 line3), `:31` (subtitle), `:52` (comparison speed cell), `index.html:12,19`
 (description + og). Red-line 2. Effort S.
2. **[compliance] Remove the uncontracted partner/rail claim** — `en.ts:64`
 "a regulated liquidity partner pays out by SEPA Instant or ACH" (and the
 bank half of `:46` "your supplier still gets a regular bank deposit").
 Effort S.
3. **[positioning] Replace region tags** — `en.ts:34-36` + `LandingPage.tsx:275`
 "ARGENTINA / LIVE / VE·MX·CO·CL coming soon" → MX/US beachhead framing
 (statement: settlement-and-documents layer for merchanting trade). Effort S.
4. **[red-line 1] Fix the trust tiles** — `en.ts:38-42` "100% · Self-custody ·
 Paid into the supplier's bank" → "0% · platform custody · Buyer pays your
 wallet" (only truthful after S1; ship the tile with S1, not before).
 Effort S.
5. **[SEO/tech] Rewrite `index.html` meta** (title `:7`, description `:11-13`,
 og `:16-19`) to the honest statement; keep `lang="en"`, viewport, favicons
 and the font `<link>` structure. Optionally drop legacy DM Sans/JetBrains
 Mono. Effort S.

**Do not touch:** the `.luxe-landing` visual system, LandingPage structure and
responsive layout, the Terms/Privacy dialog (freshly fixed in `1d2057e`),
`AccessRequestForm` flow, the `t()` catalog architecture, favicons.
**Coupling:** `e2e/04` L-R2 asserts the deleted copy (`:183`) — update in the
same change. Also gate the remaining "documents released the moment an order
is paid" claim (`en.ts:31,63`) on S2-min shipping, or soften to present-tense
capability only when true.

## 5. What is missing for the live mainnet link (checkboxes, ordered)

- [ ] **[FOUNDER]** Confirm pivot + standing commit authorization
 (git history shows commits through 2026-10-25 — one "yes" unblocks all
 technical work below)
- [ ] **[TECH 0.5d]** Commit the 8 untracked paths (jurisdiction module,
 `scripts/test-jurisdiction.ts`, `docs/`) as baseline work-unit commits
- [ ] **[TECH 8-10d] S1 de-custodize**: move `contracts/PaymentRouter.sol` →
 `contracts/legacy/`; strip 115 vault refs (usdc-arc 40 / PaymentPage 31 /
 PayWithWallet 22 / App, store, sdk, en.ts); delete `PLATFORM_FEE_BPS`
 `DEV_FEE_BPS` (`usdc-arc.ts:52-53`) and `VITE_ROUTER_OWNER_KEY` read
 (`:190`); remove key from `.env`; **purge and rebuild `dist/`**; claims
 quarantine (§4.1-4) + e2e 04 update; acceptance: `grep -r
 "PLATFORM_FEE_BPS\|DEV_FEE_BPS\|VITE_ROUTER_OWNER_KEY" src/` = 0,
 `grep -r "2–6" src/i18n/en.ts index.html` = 0
- [ ] **[TECH 7-10d] S2-min**: draft-gen on `pending_payment → invoiced`
 (2 rows via `next_commercial_doc_number()`), release gate idempotent
 `draft → released` at `markChargePaid` + `check-payment`, real HTML
 renderers + CSV export with `status === 'released'` guard, e2e 05/06/07.
 *Assumption to confirm: platform-generated pack (open question 1)*
- [ ] **[TECH 3-5d] S3-min**: port `docs/L.D/mx/profile.md` → `profiles/mx.ts`
 and wire `assertCorridorAllowed` at charge creation **in the same
 change** (adr-001:153-156) + ≥3 wire-up tests; MX-only (US profile =
 founder call, open question 3)
- [ ] **[TECH 3-4d] Chain flip**: `5042002 → 5042` across 9 src files +
 `check-payment:51,463`; derive from `onchain-facts.ts:84-103`; two
 independent mainnet RPCs; `MIN_CONFIRMATIONS` re-validated; 48h soak;
 edge secrets in Supabase Secrets
- [ ] **[FOUNDER]** Hosting pick (Vercel/Netlify/CF Pages + account owner)
 → **[TECH 3-5d]** static deploy + rollback runbook + minimal CI
 (`bun run check` + `bun run build`) + secrets scan
- [ ] **[FOUNDER]** Public-repo flip timing + which untracked `docs/` publish
 → **[TECH 0.5d]** hygiene exclusions (`nodepod-ref/`, `arc-studio-plans/`,
 `.engram/`, `*.jsonl`) + `grep -RE "0x[0-9a-f]{64}" dist/` = 0
- [ ] **[FOUNDER]** $10-25 USDC float → **[TECH 2-3d]** 3 consecutive clean
 mainnet end-to-end runs + grant pack (README with "why no contracts",
 demo video)
- [ ] **[FOUNDER]** WTP interviews (founder time, parallel — does not wait
 for the build)

**Can start now without founder síes** (prepare, hold commits): claims
quarantine diff, MX profile port (L.D content exists), e2e browser install,
migration-006 verification query, `check.sh` stale-profile enforcement
(adr-001 follow-up). **Blocked:** everything that lands in git/deploy/hosting
until commit authorization + hosting + repo decisions arrive.

**Effort total unchanged from the rescope: 26–37 working days.**

## 6. Open decisions for the founder

1. Commit authorization (confirm standing — history suggests yes) +.
2. Hosting provider + account owner (gates the live link).
3. Public repo timing + publishable `docs/` set (L.D/M.D/F.D legal work).
4. Doc-pack authorship (platform-generated vs agency-uploaded) — S2-min design.
5. US profile in the demo (MX-only recommended) and the $10-25 USDC float.

---
*Status: draft for founder review via CoCEO. Writeback: aven note +
Engram `naiam-si/treazury/tech.code-readiness-ui-audit`.*
