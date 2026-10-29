---
dept: T.D
scope: global
kind: decision
status: confirmed
as_of: 2026-10-26
sources:
 - /home/kiox/treazury/contracts/PaymentRouter.sol:27-199
 - /home/kiox/treazury/contracts/PaymentRouter.sol:201-412
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:42-53
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:149-195
 - /home/kiox/treazury/src/modules/payments/providers/usdc-arc.ts:203-306
 - /home/kiox/treazury/src/onchain-facts.ts:59-82
 - /home/kiox/naiam-si/docs/C.O/global/country-regulatory-profile.md:21-98
 - /home/kiox/naiam-si/docs/C.O/global/info-architecture.md:59-66
 - /home/kiox/treazury/AGENTS.md:148-149
 - aven (this task)
 - aven (custody model — open founder decision, dependency)
---

# ADR-001: Jurisdiction-parameterized settlement engine (country rules as data)

## Context

Treazury settles cross-border trade in USDC. The payment path that exists
today: `USDCArcProvider.createCharge` (`src/modules/payments/providers/usdc-arc.ts:203-306`)
signs `PaymentRouter.createOrder` with an owner key held client-side for the
PoC (`usdc-arc.ts:156-160`, "PoC only"), which deploys a deterministic
per-order `OrderVault` (`contracts/PaymentRouter.sol:74-128`). The buyer
deposits USDC; `_sweep` (`PaymentRouter.sol:394-411`) credits `pendingClaims`
and the merchant/treasury/dev pull with `claimFees` (`:345-351`). The platform
takes 1% + 0.5% of settled value, netted inside the sweep
(`PaymentRouter.sol:398-400`; deployment constants `usdc-arc.ts:52-53`,
`AGENTS.md:139-140`). Default chain is Arc Testnet (`onchain-facts.ts:62-65`);
no fiat off-ramp exists anywhere in `src/` — the "to their bank in 2–6 hours"
landing line (`AGENTS.md:5-6`) is marketing copy, not an implemented flow.

Forces:

1. **International by construction** (founder mandate, aven): a new
 market must be a new profile file plus evidence, never a rewrite. The
 harness standard is explicit: country is data, not code paths
 (`docs/C.O/global/info-architecture.md:59-66`, Rule 2).
2. **The law varies per corridor and nothing in the codebase can express
 that.** Country today appears only as display metadata
 (`src/lib/currency.ts:42-57`, `src/modules/shared/types.ts:90`) and as a
 marketing fact ("Argentina LIVE", `AGENTS.md:148`). No module answers
 "may this corridor settle this way?" before money moves.
3. **The custody shape is an open founder decision** (aven): the
 verified on-chain facts (sweep credits claims, USDC stays in the vault
 until `claimFees`, refund can send to an arbitrary recipient
 `PaymentRouter.sol:185-192`) are in tension with the published PA-R5
 no-custody guardrail (`AGENTS.md:202-203`). This ADR does **not** touch
 `contracts/` or redesign the vault; it treats the custody model as a
 dependency and shows below how the engine absorbs whichever way the
 founder decides.
4. **L.D already produces per-country regulatory profiles** under the shared
 `CountryRegulatoryProfile` contract
 (`naiam-si/docs/C.O/global/country-regulatory-profile.md:21-79`); T.D
 consumes them in code. The contract fixes consumption rules: blocked and
 unknown refuse money movement, never warn
 (`country-regulatory-profile.md:82-93`).
5. **Alpha, invitation-only, tiny team** (`AGENTS.md:78-79`): the engine
 must be pure TypeScript with zero framework/viem/Supabase imports so the
 same module runs in the browser and in edge functions.

## Options considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | `if (country === 'AR')` branches at each decision point | fastest to write for the first market | violates Rule 2 (`info-architecture.md:59-66`); every new market is a code change in N places; legal content lives in code review, not in L.D's hands |
| 2 | Feature flags per country | familiar ops tooling; toggles without deploys | flags encode availability, not legality: a flag can be flipped without a citation, has no "unknown" state, and defaults to opt-in — the contract requires unknown to default to blocked (`country-regulatory-profile.md:89-90`) |
| 3 | Hardcode AR as the only supported market in the payment path | matches today's "Argentina LIVE" reality (`AGENTS.md:148`) | contradicts the founder mandate (international by construction); the moment MX/CO launch, the hardcode is rewritten — exactly the failure Rule 2 predicts |
| 4 | **Jurisdiction engine reading `CountryRegulatoryProfile` data** | country = data file; unknown fails closed; legal authorship stays with L.D; pure functions are unit-testable without network | requires the profile contract to exist (it does); shipping with provisional skeletons means zero corridors are offerable until L.D confirms profiles — correct fail-closed default |

Options 1–3 are rejected: each violates a hard constraint (Rule 2, or the
contract's default-blocked semantics), so they are excluded before scoring.

## Decision

**We will build a jurisdiction engine (`src/modules/jurisdiction/`) that
reads `CountryRegulatoryProfile` data at corridor-selection time. Country
rules never appear as code branches.**

### Settlement state machine

Every order advances through eight stages. Each stage is gated by profile
fields; any refusal is terminal for that order, not dismissible.

| # | Stage | Question | Gating profile fields | On refusal |
|---|-------|----------|----------------------|------------|
| 1 | Order | May this origin country create orders? | `status` + minimum coverage (`blockingGaps`: `flows.buyerToSellerDirect`, `fxControl`, `licensing.platform`, `aml.obligedEntity`, `docs.invoiceCurrency`, `sanctions.screening`) | refuse order creation |
| 2 | Corridor | May this origin corridor be sold? | origin profile offerability (`isOfferable`); destination profiles are a v1 extension | refuse |
| 3 | Flow | Which settlement pattern is legal? | `flows.<pattern>.verdict / .rule / .citation / .condition` | refuse if `blocked` or `unknown` |
| 4 | Legal preflight | Licensing, AML, sanctions baseline? | `licensing.*`, `aml.*`, `sanctions.*` | refuse; screening evidence required |
| 5 | Payment intent | FX / conversion constraints? | `fxControl.*`, `rails.licensedPartners`, `licensedPartnerConversion.condition` | refuse, or bind a licensed partner via satisfied condition |
| 6 | On-chain transfer | Which payment rail executes? | `flows.platformHoldsFunds`, `flows.platformChargesFeeOnValue` — **interacts with the open custody decision**: whichever flow the final vault/fee model uses must be the flow the engine gates | refuse flows the custody model cannot support |
| 7 | Evidence | What must be recorded with the order? | every cited field + profile `asOf`, persisted with the order | order cannot advance without the evidence record |
| 8 | Docs release | May commercial docs be released? | `docs.*` (invoice currency, customs requirements, commercial-invoice allowed) plus stage-5 evidence where a jurisdiction requires liquidation proof | docs stay `draft` |

### Hard rule

`flows.*.verdict` of `blocked` **or** `unknown` refuses order creation
server-side. It is never a dismissible warning, never a UI toggle. `unknown`
means L.D has not answered yet and behaves exactly like `blocked`
(`country-regulatory-profile.md:89-90`). A `conditional` verdict with no
satisfied `condition` is also refused. This is enforced by
`assertCorridorAllowed` / `evaluateCorridor`
(`src/modules/jurisdiction/index.ts:115-209`), which return a discriminated
`allowed | blocked` decision carrying `reason` + `citation`
(`index.ts:71-103`).

### Partner abstraction — LicensedRail

Licensed local conversion/payout runs behind a `LicensedRail` adapter
interface, never a partner SDK in the UI:

```ts
interface LicensedRail {
 readonly key: string // must match an entry in profile.rails.licensedPartners
 readonly countries: readonly string[]
 quote(amount: string, corridor: string): Promise<RailQuote> // fee + spread + ETA
 execute(intent: PaymentIntent): Promise<RailExecutionRef>
 status(ref: RailExecutionRef): Promise<RailStatus>
}
```

The engine's stage 5 accepts a rail only if its `key` satisfies the flow's
`condition` and appears in `rails.licensedPartners`. UI components never
import a rail implementation (same rule as `factory.ts` being the sole
import point for providers, `AGENTS.md:193-195`).

### How the engine absorbs the custody decision

The engine is custody-model-agnostic: it gates whichever flow key the chosen
model uses. Buyer→seller direct gates `flows.buyerToSellerDirect`; a
vault/sweep model gates `flows.platformHoldsFunds` and
`flows.platformChargesFeeOnValue`. If the founder moves the product off the
vault, stage 3 simply evaluates a different flow key — no engine change. The
profiles (not the engine) encode whether a given custody shape is legal in a
given country.

## Consequences

- **Positive**: a new market is `profiles/<cc>.ts` + an L.D markdown profile —
 zero engine changes, zero UI branches (Rule 2 satisfied by construction).
 Legal authorship stays in L.D; T.D owns only the gate. The gate is pure and
 unit-tested (`scripts/test-jurisdiction.ts`) with no network.
- **Positive**: fail-closed by default. Shipping the engine with provisional
 skeleton profiles (`status: 'provisional'`, all flows `unknown`, citation
 `pending L.D`) means **no corridor is offerable until L.D confirms a
 profile** — the correct state for a regulated money-movement product.
- **Negative / coordination cost**: the engine is not wired into order
 creation yet (deliberate — aven scope). When it is wired, L.D's
 confirmed profiles (e.g. `docs/L.D/ar/profile.md`, `docs/L.D/mx/profile.md`)
 must be ported into the `.ts` mirrors **in the same change**, or the wire-up
 will block every corridor including the marketed Argentina one
 (`AGENTS.md:148`). This AR-marketed-vs-engine-blocked gap is surfaced for
 the founder via aven, not resolved unilaterally here.
- **Negative**: contract rule 4 (`status: stale` fails `bun run check`,
 `country-regulatory-profile.md:91`) is not yet enforced by
 `scripts/check.sh` — a follow-up task.
- **Invariant**: `grep -r "AR|MX|CO" src/ --exclude-dir=profiles` returns
 nothing *meaningful* — no country-coded branch, constant, or regulatory
 literal outside `profiles/`. Today the literal grep still matches
 substring noise (`ARC_…`, `CHARGE_…`) and pre-existing country **data
 registries** (`src/lib/currency.ts:42-57`, country `CountryCode` union at
 `src/modules/shared/types.ts:90`); those registries are display metadata,
 not settlement logic, and are out of this ADR's scope. A mechanical check
 for real country branches runs in `scripts/test-jurisdiction.ts`.
- **Risks / follow-ups**: (a) port L.D confirmed profiles into `.ts`
 mirrors before wiring; (b) enforce stale-profile failure in `check.sh`;
 (c) destination-side profiles (corridor = origin × destination) in v1 of
 the engine; (d) stage-7 evidence persistence needs a schema home once the
 backend story firm up (today: edge functions only, `AGENTS.md:156`).

## Evidence

- Payment path and fees: `contracts/PaymentRouter.sol:27-199,201-412`;
 `src/modules/payments/providers/usdc-arc.ts:42-53,149-195,203-306`;
 `AGENTS.md:133-142`
- No fiat off-ramp in `src/`: only provider is `usdc-arc.ts` (payments
 module inventory `AGENTS.md:109-113`; grep of `src/modules/payments/`
 finds no partner/off-ramp integration) — landing "2–6 hours" is
 `AGENTS.md:5-6` marketing copy, UNVALIDATED as an implemented flow
- Custody open decision: aven; verified mechanics vs PA-R5
 tension at `PaymentRouter.sol:394-412,345-349,185-192` vs `AGENTS.md:149,202-203`
- Shared contract and consumption rules:
 `naiam-si/docs/C.O/global/country-regulatory-profile.md:21-98`
- Country-as-data mandate: `naiam-si/docs/C.O/global/info-architecture.md:59-66,91-100`
- Engine implementation: `src/modules/jurisdiction/{types,index}.ts`,
 `src/modules/jurisdiction/profiles/{ar,mx}.ts`; tests:
 `scripts/test-jurisdiction.ts` (aven)
