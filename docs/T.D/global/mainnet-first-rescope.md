---
dept: T.D
scope: global
kind: scope
status: draft
as_of: 2026-10-28
sources:
 - docs/T.D/global/mvp-v1-scope.md:31-265 (prior V1 scope; Engram #1483, aven — supuesto)
 - docs/M.D/global/nocustody-pivot.md:173-186 (WTP pre-registered thresholds, 14-day timebox, founder-time experiment)
 - src/onchain-facts.ts:83-103 (GENERATED Arc mainnet facts: chainId 5042, USDC 0x3600…0000 6-dec, rpc.mainnet.arc.io, explorer.arc.io; :62-82 testnet entry)
 - node_modules/viem/_esm/chains/definitions/arc.js:2-30 (viem `arc` mainnet chain built-in; 4 mainnet RPC URLs incl. drpc/quicknode/blockdaemon)
 - .agents/skills/use-arc/SKILL.md:4,11,33,53-60 (Arc: USDC-as-gas, stable/predictable fees, sub-second finality — vendor claims, INFORMATIONAL; chain table 5042/5042002)
 - .agents/skills/use-arc/references/deploying-on-arc.md:7 (viem ships `arc` + `arcTestnet`)
 - supabase/functions/check-payment/index.ts:18-57 (three reorg gates, Oct-2026 testnet split lessons), :195-203 (env-driven primary RPC w/ testnet fallback, hardcoded testnet public RPC :57), :463 (chain_id written)
 - supabase/functions/verify-payment/index.ts:42 (MIN_CONFIRMATIONS=12), :217 (Alchemy arc-testnet URL fallback)
 - src/config.ts:7,13,21-23; src/components/PaymentPage.tsx:20,71,191,273; src/components/PayWithWallet.tsx:26; src/components/dashboard/SendFundsDialog.tsx:17,25,29,199; src/hooks/useUsdcBalance.ts:11,14; src/modules/payments/providers/usdc-arc.ts:27,42-43,239,389,455; src/sdk/index.ts:32,42,56 (hardcoded arcTestnet/5042002 touchpoints — flip = 10 files + 2 edge fns)
 - .env.example:20-33 (VITE_ROUTER_OWNER_KEY: testnet-only, NEVER on mainnet; VITE_* inlined into public bundle)
 - .gitignore:3-5,15,27 (.env, dist/, *.jsonl ignored); git status (untracked docs/{T.D,L.D,M.D,F.D}, src/modules/jurisdiction, scripts/test-jurisdiction.ts; 6 paths)
 - git remote origin github.com/naiamproducts/Treazury.git; GitHub API unauthenticated GET → 404 (repo exists in remote config, not publicly visible — SUSPICIOUS private)
 - package.json:6-17 (deploy scripts = contract deployers, testnet-only: scripts/self-deploy.ts:13 DEFAULT_CHAIN='ARC-TESTNET', :71-79 mainnet faucet impossible); no .github/workflows/ (root listing — CI gap, CONFIRMED)
 - docs/L.D/global/red-lines.md:40-58 (items 1-4), :68-125 (items 22-27), :189-250 (items 10-13), :290-301 (item 19)
 - docs/T.D/global/mvp-v1-scope.md:179-201 (ADR Decisions 1 & 3), :231-242 (build sequence S1-S4), :48-59 (metrics)
 - AGENTS.md:135-149 (onchain verified), :196-203 (PA-R5, custody table), hard rules 1-10
 - Arc Microgrants requirements (founder-read 2026-10-28: "deployed and working on Arc mainnet", live link + public repo, no testnet-only, USDC pays gas, "work must be yours"; deadline 14-oct passed)
 - aven (this task, ref S6VV); aven (pivot confirmation, prerequisite); aven (prior scope)
---

# Treazury V1 re-scope — mainnet-first (Arc mainnet demo slice)

Decision-support for the founder. Verdict vocabulary: `VALIDATED / PROMISING /
UNVALIDATED / REJECTED`. **Supuesto (unchanged): the founder confirms the
no-custody pivot and authorizes commits** — every build step below
depends on it, exactly as in `mvp-v1-scope.md:35-38`.

## 0. Verdict

**RECOMMEND Escenario A (mainnet-first, constrained).** Ship a *narrow*
mainnet demo slice (Slice 1 + minimum of Slices 2/3 + chain flip + hosting +
public repo) instead of the full testnet V1: it costs ~5-8 days more than the
equivalent testnet subset, delivers the grant artifact (live link on Arc
mainnet) in the same build, removes a deadline-driven future flip, and the
mainnet demo is *better* for WTP interviews **provided** demo transactions stay
in founder-controlled wallets and the demo passes 3 consecutive clean
end-to-end runs before any interview. WTP itself is not delayed (interviews
are founder-time, `mvp-v1-scope.md:52,241-242`).

## 1. What changes vs the prior scope (`mvp-v1-scope.md`)

| Prior decision | Mainnet-first change |
|---|---|
| Decision 3: Arc **testnet** for V1; mainnet = post-`VALIDATED` stack decision (`:195-201`) | Demo chain = **Arc mainnet now** (grant-gated, not validation-gated). Testnet remains the e2e/dev target. |
| Mainnet excluded (`:118-119`, AGENTS pending list) | Mainnet enters V1 as the *deployment target of the demo slice* only — production hardening stays out. |
| Slice 4 = WTP demo readiness on testnet (`:236`) | Slice 4 grows: hosting + live link + public repo + grant pack (README/video) — new grant deliverable, not in prior scope. |
| Slice 3 = gate + plazos (`:235`) | **Plazos (`due_date`) deferred** out of the mainnet slice (core job iii slips; acceptable — demo proves jobs i+ii). Gate stays (red-line 4). |
| Slice 2 = full doc pipeline, effort L (`:234`) | **S2-min**: draft-gen → release gate → export for the invoice pack only; editor polish, multi-doc UX deferred. |
| WTP metric & thresholds (`:48-52`) | **Unchanged** — pre-registered (`nocustody-pivot.md:182-186`); build is not the metric. |

## 2. Escenario A vs Escenario B — honest comparison

**Escenario A (mainnet-first):** Slice 1 + S2-min + S3-min(gate only) + chain
flip + hosting/repo/grant pack → live Arc mainnet demo (payment link → real
USDC cents → `check-payment` → ≥1 doc `draft → released` → export) before/parallel WTP.

**Escenario B (testnet now, flip at grant window):** prior plan unchanged
(4 slices, testnet); flip to mainnet only when a grant window opens.

| Dimension | A | B |
|---|---|---|
| Time to a demoable product | **~5-7 wk** (subset + flip) | ~7-9 wk (full V1) for the *same* interview value; a testnet subset demo would be ~1-1.5 wk earlier than A |
| WTP interview start | Day 1-3 (founder outreach; metric is interview-time, `mvp-v1-scope.md:52`) | Same — B does not accelerate WTP either |
| Demo credibility | **Better**: real USDC, `explorer.arc.io` tx links a trade operator can verify; matches "live product" expectations | Weaker: testnet tokens invite "toy" skepticism from institutional ICP |
| Demo risk | Worse: mainnet txs irreversible; a live config bug is permanent and visible | Testnet resets freely |
| Grant readiness | **Now**: live link + repo + mainnet tx = submission-ready for next microgrants window / Circle Grant Program | Later: flip still owed, done under deadline pressure, second demo artifact to build |
| Double work | One artifact serves interviews + grants | Testnet demo built, then mainnet demo rebuilt (flip + hosting + pack still owed) |
| Legal exposure | Only if prospects transact real value (red-lines 10/11/12) — bounded by founder-wallet-only rule | Lower on-chain exposure, same exposure when the flip eventually happens |

**Why A, honestly:** the flip + hosting + repo + grant-pack work (~5-8 days)
is owed under *both* scenarios; B only chooses *when* — and "when" under a
grant deadline is the worst time to touch money-path config. A also does not
delay WTP (interviews never waited on V1: `mvp-v1-scope.md:52,241-242`); it
delivers a *narrower* V1 (plazos/US-profile/editor deferred) — those deferrals
are reopened only if WTP comes back `VALIDATED`. The one real cost of A:
mainnet demo failures are permanent → mitigated by the 3-clean-runs acceptance
(below) and founder-wallet-only rule.

**Does the mainnet demo help or hurt interviews?** Net **better** *after*
dry-run gating: real money + public explorer links are unusually strong proof
for a non-custodial claim (red-line 1 is satisfied by Slice 1 before any demo
ships). It turns **worse** if a demo tx fails live (irreversible, embarrassing)
or if a prospect's real money moves before L.D clearance (red-lines 10/11/12:
ITF/Banxico, FinCEN MSB — both `CONFIRMED`, analysis not done). Guardrails are
therefore part of the slice, not optional.

## 3. Slice mínimo mainnet — exact feature list

### IN (must ship for the demo)

1. **S1 — De-custodize** (unchanged, `mvp-v1-scope.md:233`): archive
 PaymentRouter/OrderVault to `contracts/legacy/`, strip 31 vault refs +
 `PLATFORM_FEE_BPS/DEV_FEE_BPS` (`usdc-arc.ts`), remove
 `VITE_ROUTER_OWNER_KEY` from the flow, claims quarantine (`en.ts`,
 `index.html`). *Hard prerequisite: `.env.example:20-23` — owner key never
 on mainnet; red-line 1 blocks any non-custodial claim until done.*
2. **S2-min — doc release, one pack**: draft-gen on `pending_payment →
 invoiced` (2 rows: invoice + packing list), release gate idempotent
 `draft → released` at both attach points (store `markChargePaid` +
 `check-payment`), HTML export of the invoice with commercial-not-customs
 disclaimer (red-line 3 / CD-R5), CSV export. **No** editor polish beyond
 basic field edit, no multi-pack UX.
3. **S3-min — jurisdiction gate only**: wire `assertCorridorAllowed` at charge
 creation + port MX profile (`docs/L.D/mx/profile.md:20-35` → `profiles/mx.ts`,
 same change per `adr-001:147-172`); unknown countries fail closed. **No**
 plazos/`due_date`. US profile: MX-only demo (open question 3).
4. **Chain flip → Arc mainnet**: 10 src files + 2 edge fns (source list in
 header). Prefer deriving chain/RPC/explorer from the generated
 `onchain-facts.ts` (already carries mainnet, `:83-103`) over new
 hardcoded constants — the current per-file literals *are* the flip debt.
5. **Verification on mainnet**: `check-payment` three gates re-pointed to two
 *independent mainnet* backends (public `rpc.mainnet.arc.io` + second of the
 4 viem-listed providers, `arc.js:9-14`); chain_id constant → 5042
 (`check-payment/index.ts:51,463`); `MIN_CONFIRMATIONS=12` re-validated on
 mainnet (see §5.1).
6. **Hosting + live link**: static host for `bun run build` output (no
 deploy path exists today — no CI, no host config, CONFIRMED gap) + runbook
 "redeploy previous build" (one-step rollback, skill 06).
7. **Public repo + hygiene**: repo is private today (GitHub API 404) and
 carries uncommitted work (6 untracked paths incl. all of `docs/`); work-unit
 commits, then public flip after a secrets scan (`.env`/`*.jsonl` already
 gitignored, `.gitignore:3-5,27` — verify `dist/` build has zero key
 material: `grep -RE "0x[0-9a-f]{64}" dist/` → 0 hits).
8. **Grant pack**: README (architecture, why zero contracts, mainnet tx +
 explorer links, provenance disclosure of Arc Studio-generated files),
 2-4 min demo video, builder profile — §6.

### OUT (frozen from prior scope, plus mainnet-only deferrals)

- Plazos/deadline tracking (deferred; reopen post-WTP), ES locale, email
 notifications, reconciliation, multi-entity ledger, partner `?ref=`, xlsx,
 P3 in-product invoicing (manual invoice stands), FX/ramp partners,
 Shield Protocol/Tangem, AR corridor (BLOCKED/REJECTED), US profile port
 (open q3), in-product fee, **any smart contract deploy**, production
 hardening (alerting, autoscaling, SLOs), prospect-initiated mainnet
 payments (until L.D clears).

### Config that changes (exact)

| Item | Testnet today | Mainnet target | Where |
|---|---|---|---|
| chainId | 5042002 | **5042** | 10 src files + `check-payment:51` |
| viem chain | `arcTestnet` | `arc` (built-in, `arc.js:2`) | config.ts, PaymentPage, SendFundsDialog, useUsdcBalance, usdc-arc |
| RPC | `rpc.testnet.arc.io` | `rpc.mainnet.arc.io` + 2nd independent backend | usdc-arc:43, check-payment:57, env `ALCHEMY_ARC_*` |
| Explorer | `explorer.testnet.arc.io` | `explorer.arc.io` | PaymentPage:273, SendFundsDialog:199 |
| USDC ERC-20 | `0x3600…0000` (6 dec) | **same address** (`onchain-facts.ts:99`) | none — no change |
| Gas token | USDC 18-dec native | same (`:92-96`) | none — `onchain-money.ts` generated, untouched |
| Edge secrets | `ALCHEMY_ARC_TESTNET_RPC_URL` | mainnet RPC URL secret (Alchemy mainnet endpoint **unverified — SUSPICIOUS**, verify pre-flip) | Supabase secrets |
| `VITE_ROUTER_OWNER_KEY` | testnet-only | **absent from bundle** (S1) | build grep |

### Cero contratos — confirmed, with the counter-argument

The demo's on-chain footprint is **buyer wallet → seller wallet USDC
transfers**, verified by receipt inspection (`check-payment:34-37` "never
moves funds"). No contract of ours is called: Slice 1 archives the router/vault
path; direct `?to=` mode is the only path. Deploying even a minimal contract
would be strictly worse: red-line 25 (`red-lines.md:95-106`) makes *any*
admin-capable contract over client value a custody exposure, and a token
wrapper/escrow contradicts PA-R5 and the direct-transfer demo. **Grant-wording
risk:** "deployed and working on Arc mainnet" *could* be read as
contract-required — SUSPICIOUS; mitigate with an explicit README section
"Why Treazury deploys no contracts" citing the non-custodial design. The app
itself *is* deployed (static host) and transacts real USDC on Arc mainnet.

### Gas / USDC budget (USD)

- Contract deploys: **$0** (zero contracts, CONFIRMED).
- Gas for the demo lifecycle (~20-50 txs: transfers, checks, dry-runs, video
 takes): Arc fees are USDC-denominated, "stable and predictable" (vendor
 claim, `use-arc/SKILL.md:4` — INFORMATIONAL until first mainnet tx
 measured). Envelope: **≤ $5 USDC gas**.
- Demo float: USDC moves founder buyer-wallet → founder seller-wallet (net
 zero except gas); plus bridge-in of float from another chain (CCTP/Portal)
 ≈ $1-5 source-chain gas (INFORMATIONAL).
- **Total budget to request: $10-25 USDC** (gas buffer + bridge dust),
 INFORMATIONAL — re-price after the first mainnet dry-run. The $500
 microgrant covers it ~20x.

### Mainnet security requirements (skill 06)

1. **Secrets**: no private key in any `VITE_*` (post-S1 the key is gone from
 code — grep `VITE_ROUTER_OWNER_KEY` in `src/` → 0 hits); edge secrets only
 in Supabase Secrets (`check-payment:39-43`); never in Postgres (hard rule 9);
 `.env` gitignored (`.gitignore:3-5`) — pre-push scan of tracked files.
2. **Public-repo hygiene**: exclude/untrack `nodepod-ref/`, `.atl/`,
 `console.jsonl`/`traces.jsonl` (ignored via `*.jsonl`), `.engram/`; review
 `docs/` untracked set before push (contains legal work — founder decides
 what is public, open q2).
3. **CI (gap → minimal)**: one GitHub Actions job running `bun run check` +
 `bun run build` on PR — doubles as "work is yours" evidence for reviewers.
4. **Deploy runbook**: `bun run build` → static host; rollback = redeploy
 previous build (one step); host choice = founder decision (open q1).
5. **Abuse surface**: `check-payment` is public/no-JWT by design
 (`:34-37`) — on mainnet each bogus hash costs *our* RPC quota; add a
 trivial per-IP throttle or accept + monitor Supabase logs (open q4).
6. **No signer, ever**: mainnet code must never gain a server-side signer
 (red-line 24, `red-lines.md:88-94`).

## 4. Timeline (after confirmed + commit authorized)

Effort scale as prior scope: **S = 2-4 days, M = 8-12 days, L = 15-20 days**
(solo CTO, working days; dates assume start 2026-11-02).

| # | Slice | Effort | Days | Window |
|---|---|---|---|---|
| 1 | S1 de-custodize + claims quarantine | **M** | 8-10 | Nov 2-13 |
| 2 | S2-min doc pipeline (draft-gen → release gate → export) | **M** | 7-10 | Nov 16-27 |
| 3 | S3-min jurisdiction gate (MX port + wire) | **S-M** | 3-5 | Nov 30-Dec 3 |
| 4 | Chain flip + dual-RPC reorg-gate validation (48h soak) + edge secrets | **S** | 3-4 | Dec 3-8 |
| 5 | Hosting + live link + CI + public repo + secrets scan | **S-M** | 3-5 | Dec 8-11 |
| 6 | Grant pack (README, demo video, profile) + 3-clean-runs acceptance + `bun run check`/e2e green | **S** | 2-3 | Dec 11-15 |

**Total: 26-37 working days ≈ 5.5-7.5 weeks → public Arc mainnet link
expected 2026-12-04 … 2026-12-18 (mid-point ~2026-12-10).** Fast path (slice
2 compressed, hosting same-day): 2026-11-27. WTP interviews: outreach can
start week 1; the 14-day WTP clock starts when the founder decides, not when
the demo lands — **delay of WTP attributable to A = 0 days**; delay of the
*demo* vs an equivalent testnet subset = **+5-8 days** (flip + hosting + pack),
while A still beats the prior full-V1 testnet timeline to a demo by ~2 weeks.

**Acceptance before any interview shows the demo:** 3 consecutive clean
end-to-end mainnet runs (link → real USDC cents → 3 gates pass → doc released →
export) + `bun run check` green + affected e2e green (AGENTS verification
rule) + `grep -RE "0x[0-9a-f]{64}" dist/` = 0 hits + `grep -r "5042002" src/
supabase/functions` = 0 hits (docs excepted).

## 5. Riesgos mainnet-first

1. **Reorg gates unvalidated on mainnet — UNVALIDATED.** The *mechanism*
 (shared head → dual receipt/canonical anchor → state proof,
 `check-payment:18-32`) is chain-agnostic, but every constant is
 testnet-tuned: chain id (`:51`), public RPC (`:57`), Alchemy testnet URL
 (`:198`), `MIN_CONFIRMATIONS=12` (`:52`), and the dual-backend pairing
 assumes Alchemy+public (Alchemy Arc *mainnet* endpoint existence
 unverified — SUSPICIOUS). Mainnet finality is claimed sub-second
 (vendor, INFORMATIONAL) — 12 confirmations may be either plenty or
 wrong; the Oct-2026 split lessons transfer as *procedure*, not as numbers.
 Mitigation: re-point to two independent mainnet RPCs, 48h head-agreement
 soak before the public link, keep 12 initially and raise only if soak shows
 divergence. **Does not break any red-line** (gates fail-closed by design).
2. **Irreversible config errors / demo failure.** Ten src files + 2 edge fns
 carry testnet literals; one miss = payment page hitting testnet RPC while
 the wallet is on mainnet (silent wrong-network failure) or a released doc
 driven by a testnet receipt. On mainnet there is no "reset". Mitigation:
 derive from `onchain-facts.ts` instead of new literals, flip acceptance
 greps (§4), dry-run video take after acceptance.
3. **Real USDC × legal red-lines.** Prospects sending real value during
 interviews touches red-line 10 (MX ITF), 11 (MX payout claims), 12 (US
 FinCEN MSB — analysis never done, `red-lines.md:244-246`), 19 (OFAC VE —
 N/A for MX/US but address screening is cheap). Mitigation = **hard rule of
 the slice**: demo txs founder-wallet-only, ≤ $5; interviewees see the
 flow and may pay *nothing* on-chain; real prospect payments wait for L.D
 clearance (same gate the first pre-order needs anyway). Also: no new
 settlement-speed or partner claims in demo/grant copy (red-line 2), no
 non-custodial claim before S1 merges (red-line 1), docs carry the
 commercial-not-customs disclaimer (red-line 3), gate fail-closed (red-line
 4). **Under these guardrails the rescope breaks no red-line.**
4. *(minor)* **Cost/hosting surprises**: gas envelope is INFORMATIONAL until
 measured; static host + Supabase free tiers expected $0/mo but uncited —
 confirm at host choice. **Repo hygiene leak** on the public flip —
 scan gate above.

## 6. Alineación con grants

Microgrants-future / Circle Grant Program requirements vs this slice:

| Requirement | Status after this slice | Gap |
|---|---|---|
| Working on **Arc mainnet** | ✅ real USDC transfers + verification + doc release on chain 5042 | none (if "deployed" is read app-side — README argues it; contract-reading risk SUSPICIOUS) |
| **Live link** | ✅ static host (new) | host not chosen yet (open q1) |
| **Public repo** | ✅ after flip + scan | today private + uncommitted (CONFIRMED) |
| "Work must be yours" | ✅ conventional work-unit commits + CI; Arc Studio-generated files disclosed in README | commits start only after authorization |
| Description / builder profile | ⬜ | README + profile + entity (SAS AR) — packaging, S |
| Demo video | ⬜ | 2-4 min live mainnet run with explorer link — S |
| Production maturity ("path to production") | ⚠ partial: CI, secrets, rollback yes; monitoring/rate-limits minimal; **no traction yet** | Circle Grant Program likely wants WTP `VALIDATED` + usage — UNVALIDATED until the 14-day experiment runs |

**Verdict: PROMISING.** With §4 items 5-6 done, the deliverable *is* a
complete submission for the next microgrants-style window (live link + repo +
mainnet tx + description). For the Circle Grant Program proper, add the WTP
result and office-hours readiness; that is founder-time, not build-time.

## 7. Open questions for the founder (max 5)

1. **Hosting**: Vercel / Netlify / Cloudflare Pages (all free-tier capable)?
 Who owns the account — you (recommended: your GitHub org, my deploy = PR
 merge)? Nothing exists today; this gates the live link.
2. **Public repo**: flip `naiamproducts/Treazury` to public when — at slice 5
 (my plan) or earlier? And which untracked paths are publishable (`docs/`
 contains L.D/M.D/F.D legal work — publish all, publish T.D only, or hold)?
3. **US profile**: demo MX-only (my recommendation — US is `provisional`,
 `mvp-v1-scope.md:258-261`), or port the provisional US base flow now?
4. **Demo money rule**: confirm founder-wallet-only mainnet transactions until
 L.D clears prospect payments (red-lines 10/11/12) — this caps the "prospect
 pays a cent live" move I would otherwise use in interviews.
5. **Gas float**: approve $10-25 USDC on Arc mainnet (budget envelope,
 INFORMATIONAL) + the bridge-in to get it there?

---
*Status: draft for founder review. Supuesto; no code written, no
commits made under this document. Writeback: aven note +
Engram `naiam-si/treazury/tech.mainnet-first`.*
