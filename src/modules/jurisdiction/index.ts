/**
 * Jurisdiction engine — reads `CountryRegulatoryProfile` data and answers the
 * only three questions the settlement path is allowed to ask:
 *
 *   getProfile(cc)                     → the profile, or null
 *   assertCorridorAllowed(cc, flow)    → may this corridor use this flow?
 *   isOfferable(cc)                    → may this corridor be sold at all?
 *
 * Consumption rules (see docs/C.O/global/country-regulatory-profile.md):
 *   1. `blocked` refuses the flow. Never a dismissible warning.
 *   2. `unknown` is treated as `blocked` for money movement.
 *   3. `conditional` needs a named `condition` AND that condition satisfied by
 *      configuration; otherwise the flow is refused.
 *   4. `stale` blocks every flow (staleness means the law may have changed).
 *   5. Country is data. This file contains no country code and no branch on one.
 *
 * No framework, no viem, no Supabase: the same module must run in the browser
 * and in an edge function.
 */

import type { CountryRegulatoryProfile, FlowKey, ProfileStatus, Verdict } from './types'
import { arProfile } from './profiles/ar'
import { mxProfile } from './profiles/mx'

export type { CountryRegulatoryProfile, FlowKey, FlowRule, ProfileStatus, Verdict } from './types'

/** A citation that starts with this token is a placeholder, not evidence. */
export const UNRESOLVED_CITATION_PREFIX = 'pending'

/** The settlement pattern the product itself relies on (buyer pays seller). */
export const BASE_FLOW: FlowKey = 'buyerToSellerDirect'

// ─────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────

const SHIPPED_PROFILES: readonly CountryRegulatoryProfile[] = [arProfile, mxProfile]

/**
 * Load the shipped profiles once, keyed by uppercase ISO-3166 alpha-2.
 * Adding a country = adding a profile file here; no other file changes.
 */
const REGISTRY: ReadonlyMap<string, CountryRegulatoryProfile> = new Map(
  SHIPPED_PROFILES.map((profile) => [profile.country.trim().toUpperCase(), profile] as const),
)

function normalizeCountry(cc: string): string {
  return cc.trim().toUpperCase()
}

/** All registered profiles. Treat the objects as read-only. */
export function listProfiles(): CountryRegulatoryProfile[] {
  return [...REGISTRY.values()]
}

/** Look up a profile. Unknown country → `null` (never throws). */
export function getProfile(cc: string): CountryRegulatoryProfile | null {
  return REGISTRY.get(normalizeCountry(cc)) ?? null
}

export function isResolvedCitation(citation: string): boolean {
  const trimmed = citation.trim()
  if (trimmed === '') return false
  return !trimmed.toLowerCase().startsWith(UNRESOLVED_CITATION_PREFIX)
}

// ─────────────────────────────────────────────
// Corridor decision
// ─────────────────────────────────────────────

export type CorridorBlockReason =
  | 'no-profile'
  | 'profile-stale'
  | 'flow-blocked'
  | 'flow-unknown'
  | 'condition-missing'
  | 'condition-unmet'

export interface CorridorAllowed {
  allowed: true
  country: string
  flow: FlowKey
  verdict: 'permitted' | 'conditional'
  rule: string
  citation: string
  /** Present for conditional flows; already verified against configuration. */
  condition?: string
  profileStatus: Exclude<ProfileStatus, 'stale'>
}

export interface CorridorBlocked {
  allowed: false
  country: string
  flow: FlowKey
  reason: CorridorBlockReason
  /** Human-readable, safe to log and to render. */
  detail: string
  citation: string | null
  verdict: Verdict | null
  profileStatus: ProfileStatus | null
}

export type CorridorDecision = CorridorAllowed | CorridorBlocked

export interface CorridorOptions {
  /**
   * Conditions the caller has verified in configuration, verbatim (for example
   * a partner id that exists in `rails.licensedPartners`). A conditional flow
   * whose condition is absent here is refused. Default: none satisfied.
   */
  satisfiedConditions?: readonly string[]
}

/** Pure decision function — the whole gate is testable without the registry. */
export function evaluateCorridor(
  country: string,
  profile: CountryRegulatoryProfile | null,
  flow: FlowKey,
  options: CorridorOptions = {},
): CorridorDecision {
  if (!profile) {
    return {
      allowed: false,
      country,
      flow,
      reason: 'no-profile',
      detail: `No CountryRegulatoryProfile is registered for '${country}'. Add profiles/<cc>.ts before selling this corridor.`,
      citation: null,
      verdict: null,
      profileStatus: null,
    }
  }

  const rule = profile.flows[flow]

  const blocked = (reason: CorridorBlockReason, detail: string): CorridorBlocked => ({
    allowed: false,
    country,
    flow,
    reason,
    detail,
    citation: rule.citation.trim() === '' ? null : rule.citation,
    verdict: rule.verdict,
    profileStatus: profile.status,
  })

  if (profile.status === 'stale') {
    return blocked(
      'profile-stale',
      `Profile for ${country} is stale (asOf ${profile.asOf}); a stale profile blocks every flow until L.D re-verifies it.`,
    )
  }

  if (rule.verdict === 'blocked') {
    return blocked('flow-blocked', rule.rule)
  }

  if (rule.verdict === 'unknown') {
    return blocked('flow-unknown', rule.rule)
  }

  if (rule.verdict === 'conditional') {
    const condition = rule.condition?.trim() ?? ''
    if (condition === '') {
      return blocked(
        'condition-missing',
        'Conditional flow has no `condition` configured; the contract requires one, so the flow is refused.',
      )
    }
    const satisfied = options.satisfiedConditions ?? []
    if (!satisfied.includes(condition)) {
      return blocked('condition-unmet', `Condition not satisfied in configuration: ${condition}`)
    }
    return {
      allowed: true,
      country,
      flow,
      verdict: 'conditional',
      rule: rule.rule,
      citation: rule.citation,
      condition,
      profileStatus: profile.status,
    }
  }

  return {
    allowed: true,
    country,
    flow,
    verdict: 'permitted',
    rule: rule.rule,
    citation: rule.citation,
    profileStatus: profile.status,
  }
}

/**
 * Gate a corridor flow. Unknown country, stale profile, blocked/unknown flow,
 * or an unsatisfied condition all return `allowed: false` — callers must refuse
 * money movement, not warn.
 */
export function assertCorridorAllowed(
  cc: string,
  flow: FlowKey,
  options: CorridorOptions = {},
): CorridorDecision {
  const country = normalizeCountry(cc)
  return evaluateCorridor(country, REGISTRY.get(country) ?? null, flow, options)
}

// ─────────────────────────────────────────────
// Sellability (minimum coverage)
// ─────────────────────────────────────────────

export type CoverageGapReason =
  | 'unconfirmed-status'
  | 'unknown-verdict'
  | 'unresolved-citation'
  | 'missing-value'

export interface CoverageGap {
  /** Contract path, e.g. `flows.buyerToSellerDirect.verdict`. */
  field: string
  reason: CoverageGapReason
  detail: string
}

/**
 * Minimum coverage before a corridor can be sold (contract §"Minimum
 * coverage"). Also requires `status: 'confirmed'`: a `provisional` profile is
 * a draft, and drafts do not take money.
 */
export function blockingGaps(profile: CountryRegulatoryProfile): CoverageGap[] {
  const gaps: CoverageGap[] = []

  if (profile.status !== 'confirmed') {
    gaps.push({
      field: 'status',
      reason: 'unconfirmed-status',
      detail: `status is '${profile.status}' — only 'confirmed' profiles are sellable`,
    })
  }

  const base = profile.flows[BASE_FLOW]
  if (base.verdict === 'unknown') {
    gaps.push({ field: `flows.${BASE_FLOW}.verdict`, reason: 'unknown-verdict', detail: base.rule })
  }
  if (!isResolvedCitation(base.citation)) {
    gaps.push({
      field: `flows.${BASE_FLOW}.citation`,
      reason: 'unresolved-citation',
      detail: base.citation,
    })
  }

  if (!isResolvedCitation(profile.fxControl.citation)) {
    gaps.push({ field: 'fxControl.citation', reason: 'unresolved-citation', detail: profile.fxControl.citation })
  }
  if (profile.fxControl.required && (profile.fxControl.channel?.trim() ?? '') === '') {
    gaps.push({ field: 'fxControl.channel', reason: 'missing-value', detail: 'FX control is required but no channel is set' })
  }

  if (!isResolvedCitation(profile.licensing.platform.citation)) {
    gaps.push({
      field: 'licensing.platform.citation',
      reason: 'unresolved-citation',
      detail: profile.licensing.platform.citation,
    })
  }

  if (profile.aml.obligedEntity.trim() === '') {
    gaps.push({ field: 'aml.obligedEntity', reason: 'missing-value', detail: 'obliged entity is unanswered' })
  }
  if (!isResolvedCitation(profile.aml.citation)) {
    gaps.push({ field: 'aml.citation', reason: 'unresolved-citation', detail: profile.aml.citation })
  }

  if (profile.docs.invoiceCurrency.trim() === '') {
    gaps.push({ field: 'docs.invoiceCurrency', reason: 'missing-value', detail: 'invoice currency is unanswered' })
  }
  if (!isResolvedCitation(profile.docs.citation)) {
    gaps.push({ field: 'docs.citation', reason: 'unresolved-citation', detail: profile.docs.citation })
  }

  if (profile.sanctions.screening.trim() === '') {
    gaps.push({ field: 'sanctions.screening', reason: 'missing-value', detail: 'screening regime is unanswered' })
  }
  if (!isResolvedCitation(profile.sanctions.citation)) {
    gaps.push({ field: 'sanctions.citation', reason: 'unresolved-citation', detail: profile.sanctions.citation })
  }

  return gaps
}

/** True only when the profile is `confirmed`, covers the minimum, and its base flow is allowed. */
export function isProfileOfferable(profile: CountryRegulatoryProfile): boolean {
  if (blockingGaps(profile).length > 0) return false
  return evaluateCorridor(profile.country, profile, BASE_FLOW).allowed
}

/** True only when the corridor is registered and `isProfileOfferable`. */
export function isOfferable(cc: string): boolean {
  const profile = getProfile(cc)
  return profile ? isProfileOfferable(profile) : false
}
