#!/usr/bin/env bun
/**
 * test-jurisdiction.ts — jurisdiction engine checks
 *
 * Same no-framework bun harness as test-commercial-docs.ts / test-modules.ts.
 * Verifies the engine contract from
 * naiam-si/docs/C.O/global/country-regulatory-profile.md:
 * - blocked and unknown refuse the flow (unknown behaves as blocked)
 * - conditional without a satisfied condition refuses the flow
 * - conditional with a satisfied condition allows the flow
 * - permitted allows the flow
 * - stale profiles and unknown countries refuse everything
 * - isOfferable is false for provisional/pending profiles
 * - no country code leaks into engine logic outside profiles/
 *
 * Run: bun scripts/test-jurisdiction.ts
 * Offline, no network, no side effects.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { CountryRegulatoryProfile, FlowRule } from '../src/modules/jurisdiction/types'

// ── minimal harness (mirrors test-commercial-docs.ts) ───────────────────────

let passed = 0
let failed = 0

function test(name: string, fn: () => void): void {
 try {
 fn()
 console.log(` ✓ ${name}`)
 passed++
 } catch (err) {
 console.error(` ✗ ${name}`)
 console.error(` ${err instanceof Error ? err.message: String(err)}`)
 failed++
 }
}

function assert(condition: boolean, message: string): asserts condition {
 if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertEqual<T>(a: T, b: T, label: string): void {
 if (a !== b) throw new Error(`${label}: expected ${String(b)}, got ${String(a)}`)
}

// ── artifacts under test ────────────────────────────────────────────────────

type EngineMod = typeof import('../src/modules/jurisdiction/index')

let engine: EngineMod
try {
 engine = await import('../src/modules/jurisdiction/index')
} catch (err) {
 console.error('jurisdiction module must resolve:', err)
 process.exit(1)
}

const {
 getProfile,
 listProfiles,
 assertCorridorAllowed,
 evaluateCorridor,
 isOfferable,
 isProfileOfferable,
 blockingGaps,
 isResolvedCitation,
 BASE_FLOW,
} = engine

// ── fixture: a fully-permitted profile (test-only, never shipped) ───────────

function fixtureProfile(overrides: Partial<CountryRegulatoryProfile> = {}): CountryRegulatoryProfile {
 const permitted = (rule: string): FlowRule => ({
 verdict: 'permitted',
 rule,
 citation: 'Test Instrument art. 1 (fixture)',
 })
 const base: CountryRegulatoryProfile = {
 country: 'ZZ',
 asOf: '2026-10-26',
 status: 'confirmed',
 flows: {
 buyerToSellerDirect: permitted('Direct wallet settlement permitted'),
 platformHoldsFunds: permitted('Vault permitted'),
 platformChargesFeeOnValue: permitted('Fee permitted'),
 platformConvertsToFiat: permitted('Conversion permitted'),
 platformPaysSupplier: permitted('Supplier payout permitted'),
 licensedPartnerConversion: permitted('Partner conversion permitted'),
 },
 fxControl: { required: false, citation: 'Test FX Instrument art. 2 (fixture)' },
 licensing: {
 platform: { required: false, citation: 'Test Licensing Act art. 3 (fixture)' },
 agency: { required: false, citation: 'Test Licensing Act art. 3 (fixture)' },
 extraterritorial: false,
 citation: 'Test Licensing Act art. 3 (fixture)',
 },
 aml: {
 obligedEntity: 'agency',
 travelRule: 'permitted',
 citation: 'Test AML Act art. 4 (fixture)',
 },
 docs: {
 invoiceCurrency: 'USD',
 customsRequires: ['commercial invoice'],
 commercialInvoiceAllowed: true,
 citation: 'Test Customs Code art. 5 (fixture)',
 },
 tax: { valuationRule: 'transaction value', citation: 'Test Tax Code art. 6 (fixture)' },
 sanctions: { screening: 'UN list', issuerBlocklist: false, citation: 'Test Sanctions Act art. 7 (fixture)' },
 rails: { licensedPartners: ['fixture-rail'], citation: 'Test Rail Registry art. 8 (fixture)' },
 openQuestions: [],
 }
 return { ...base, ...overrides }
}

// ── Registry basics ─────────────────────────────────────────────────────────

console.log('\n── Registry ────────────────────────────────────')

test('registry ships AR and MX profiles', () => {
 const countries = listProfiles().map((p) => p.country).sort()
 assertEqual(countries.join(','), 'AR,MX', 'registered countries')
})

test('getProfile is case-insensitive and trims', () => {
 assert(getProfile('ar') !== null, 'lowercase ar resolves')
 assert(getProfile(' MX ') !== null, 'padded MX resolves')
 assert(getProfile('ZZ') === null, 'unregistered country is null (not a throw)')
})

test('shipped profiles are provisional skeletons with pending citations', () => {
 for (const cc of ['AR', 'MX']) {
 const p = getProfile(cc)
 assert(p !== null, `${cc} profile exists`)
 assertEqual(p.status, 'provisional', `${cc}.status`)
 assertEqual(p.asOf, '2026-10-25', `${cc}.asOf`)
 for (const [key, rule] of Object.entries(p.flows)) {
 assertEqual(rule.verdict, 'unknown', `${cc}.flows.${key}.verdict`)
 assert(rule.citation.startsWith('pending'), `${cc}.flows.${key}.citation is pending`)
 }
 }
})

// ── blocked / unknown / conditional / allowed ───────────────────────────────

console.log('\n── Corridor decisions ───────────────────────────')

test('blocked flow refuses with reason + citation', () => {
 const p = fixtureProfile({
 flows: {
 ...fixtureProfile().flows,
 platformHoldsFunds: {
 verdict: 'blocked',
 rule: 'Vaulting client funds is prohibited',
 citation: 'Test Custody Act art. 9 (fixture)',
 },
 },
 })
 const d = evaluateCorridor('ZZ', p, 'platformHoldsFunds')
 assertEqual(d.allowed, false, 'blocked → not allowed')
 assert(!d.allowed, 'discriminant narrows to blocked')
 assertEqual(d.reason, 'flow-blocked', 'reason')
 assertEqual(d.verdict, 'blocked', 'verdict carried')
 assert(d.citation !== null && d.citation.includes('Test Custody Act'), 'citation carried')
 assert(d.detail.includes('prohibited'), 'detail carries the rule text')
})

test('unknown flow refuses exactly like blocked (never warns)', () => {
 const d = assertCorridorAllowed('AR', 'platformHoldsFunds')
 assertEqual(d.allowed, false, 'unknown → not allowed')
 assert(!d.allowed, 'discriminant narrows')
 assertEqual(d.reason, 'flow-unknown', 'reason is flow-unknown, not a warning')
 assertEqual(d.verdict, 'unknown', 'verdict is unknown')
 assert(d.citation !== null && d.citation.startsWith('pending'), 'pending citation carried')
})

test('every flow of every shipped profile is refused', () => {
 const flowKeys = [
 'buyerToSellerDirect',
 'platformHoldsFunds',
 'platformChargesFeeOnValue',
 'platformConvertsToFiat',
 'platformPaysSupplier',
 'licensedPartnerConversion',
 ] as const
 for (const cc of ['AR', 'MX']) {
 for (const flow of flowKeys) {
 const d = assertCorridorAllowed(cc, flow)
 assertEqual(d.allowed, false, `${cc}/${flow} refused while profile is provisional`)
 }
 }
})

test('conditional without condition refuses (condition-missing)', () => {
 const p = fixtureProfile({
 flows: {
 ...fixtureProfile().flows,
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion allowed via licensed partner',
 citation: 'Test Partner Act art. 10 (fixture)',
 // no condition — violates the contract, engine must refuse
 },
 },
 })
 const d = evaluateCorridor('ZZ', p, 'licensedPartnerConversion')
 assertEqual(d.allowed, false, 'conditional w/o condition → refused')
 assert(!d.allowed, 'discriminant narrows')
 assertEqual(d.reason, 'condition-missing', 'reason')
})

test('conditional with unsatisfied condition refuses (condition-unmet)', () => {
 const p = fixtureProfile({
 flows: {
 ...fixtureProfile().flows,
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion allowed via licensed partner',
 citation: 'Test Partner Act art. 10 (fixture)',
 condition: 'partner-licence-xyz',
 },
 },
 })
 const d = evaluateCorridor('ZZ', p, 'licensedPartnerConversion')
 assertEqual(d.allowed, false, 'unsatisfied condition → refused')
 assert(!d.allowed, 'discriminant narrows')
 assertEqual(d.reason, 'condition-unmet', 'reason')
 assert(d.detail.includes('partner-licence-xyz'), 'detail names the missing condition')
})

test('conditional with satisfied condition allows and carries the condition', () => {
 const p = fixtureProfile({
 flows: {
 ...fixtureProfile().flows,
 licensedPartnerConversion: {
 verdict: 'conditional',
 rule: 'Conversion allowed via licensed partner',
 citation: 'Test Partner Act art. 10 (fixture)',
 condition: 'partner-licence-xyz',
 },
 },
 })
 const d = evaluateCorridor('ZZ', p, 'licensedPartnerConversion', {
 satisfiedConditions: ['partner-licence-xyz'],
 })
 assert(d.allowed, 'satisfied condition → allowed')
 assertEqual(d.verdict, 'conditional', 'verdict')
 assertEqual(d.condition, 'partner-licence-xyz', 'condition echoed')
 assert(d.citation.includes('Test Partner Act'), 'citation carried')
 assertEqual(d.profileStatus, 'confirmed', 'profileStatus carried')
})

test('permitted flow allows', () => {
 const d = evaluateCorridor('ZZ', fixtureProfile(), BASE_FLOW)
 assert(d.allowed, 'permitted → allowed')
 assertEqual(d.verdict, 'permitted', 'verdict')
 assertEqual(d.flow, BASE_FLOW, 'flow echoed')
 assert(!('reason' in d), 'allowed branch has no reason field')
})

// ── Profile-level gates ─────────────────────────────────────────────────────

console.log('\n── Profile gates ────────────────────────────────')

test('unknown country refuses with no-profile', () => {
 const d = assertCorridorAllowed('BR', BASE_FLOW)
 assertEqual(d.allowed, false, 'unregistered → refused')
 assert(!d.allowed, 'discriminant narrows')
 assertEqual(d.reason, 'no-profile', 'reason')
 assertEqual(d.citation, null, 'no citation to cite')
})

test('stale profile refuses every flow (profile-stale)', () => {
 const p = fixtureProfile({ status: 'stale' })
 const d = evaluateCorridor('ZZ', p, BASE_FLOW)
 assertEqual(d.allowed, false, 'stale → refused')
 assert(!d.allowed, 'discriminant narrows')
 assertEqual(d.reason, 'profile-stale', 'reason')
})

test('stale outranks a permitted flow verdict', () => {
 const p = fixtureProfile({
 status: 'stale',
 flows: fixtureProfile().flows, // all permitted
 })
 const d = evaluateCorridor('ZZ', p, 'platformHoldsFunds')
 assertEqual(d.allowed, false, 'stale + permitted flow → still refused')
})

test('isOfferable false for provisional shipped profiles (AR, MX)', () => {
 assertEqual(isOfferable('AR'), false, 'AR not offerable while provisional')
 assertEqual(isOfferable('MX'), false, 'MX not offerable while provisional')
 assertEqual(isOfferable('BR'), false, 'unregistered country not offerable')
})

test('blockingGaps flags provisional status, unknown base flow, pending citations', () => {
 const ar = getProfile('AR')
 assert(ar !== null, 'AR profile')
 const gaps = blockingGaps(ar)
 const fields = gaps.map((g) => g.field)
 assert(fields.includes('status'), 'status gap flagged')
 assert(fields.includes(`flows.${BASE_FLOW}.verdict`), 'unknown base flow flagged')
 assert(fields.includes(`flows.${BASE_FLOW}.citation`), 'pending base citation flagged')
 assert(fields.includes('fxControl.citation'), 'pending fx citation flagged')
 assert(fields.includes('aml.obligedEntity'), 'empty obligedEntity flagged')
 assert(fields.includes('docs.invoiceCurrency'), 'empty invoiceCurrency flagged')
 assertEqual(isProfileOfferable(ar), false, 'profile with gaps is not offerable')
})

test('a fully-confirmed fixture profile IS offerable (engine not stuck closed)', () => {
 const p = fixtureProfile()
 assertEqual(blockingGaps(p).length, 0, 'no gaps in fixture')
 assertEqual(isProfileOfferable(p), true, 'confirmed + covered + permitted → offerable')
})

test('isResolvedCitation treats pending/empty as unresolved', () => {
 assertEqual(isResolvedCitation('pending L.D'), false, 'pending prefix unresolved')
 assertEqual(isResolvedCitation(''), false, 'empty unresolved')
 assertEqual(isResolvedCitation('Test Act art. 1'), true, 'real citation resolved')
})

// ── Invariant: no country codes in engine logic outside profiles/ ──────────

console.log('\n── Country-as-data invariant ────────────────────')

test('engine source (types/index) contains no country literals', () => {
 const srcDir = fileURLToPath(new URL('../src/modules/jurisdiction/', import.meta.url))
 for (const file of ['types.ts', 'index.ts']) {
 const src = readFileSync(join(srcDir, file), 'utf8')
 // Country-code literal in single quotes (data, not prose): 'AR' etc.
 const hits = src.match(/'(AR|MX|CO|CL|VE|US|CN)'/g)
 assertEqual(hits, null, `${file} must not contain country literals outside profiles/`)
 }
})

test('no new country branch appears in src/ outside profiles and known registries', () => {
 const srcRoot = fileURLToPath(new URL('../src/', import.meta.url))
 // Pre-existing display registries grandfathered (they map country → UI
 // metadata, not settlement rules). New files must not add country branches.
 // SettingsView.tsx: the VE fiscal-engine UI gate is protected by AGENTS.md
 // hard rule 1 (VenezuelaEngine untouched) — grandfathered legacy exception,
 // not a model to copy; the founder invariant covers AR|MX|CO and holds.
 const allowed = new Set([
 'lib/currency.ts',
 'modules/shared/types.ts',
 'modules/jurisdiction/profiles/ar.ts',
 'modules/jurisdiction/profiles/mx.ts',
 'components/dashboard/SettingsView.tsx',
 ])
 const offenders: string[] = []
 const walk = (dir: string): void => {
 for (const entry of readdirSync(dir)) {
 const full = join(dir, entry)
 if (statSync(full).isDirectory()) {
 walk(full)
 continue
 }
 if (!/\.(ts|tsx)$/.test(entry)) continue
 const rel = full.slice(srcRoot.length)
 if (allowed.has(rel)) continue
 const src = readFileSync(full, 'utf8')
 // A real branch on a country code, e.g. country === 'AR' or === 'MX'
 if (/===\s*'(AR|MX|CO|CL|VE)'/.test(src) || /'(AR|MX|CO|CL|VE)'\s*===/.test(src)) {
 offenders.push(rel)
 }
 }
 }
 walk(srcRoot)
 assertEqual(offenders.join(', '), '', 'no country-code branches outside profiles/')
})

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1: 0)
