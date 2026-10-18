/**
 * t — pure single-locale message resolver (import-export-pivot,
 * openspec/changes/import-export-pivot/design.md, Architecture Decisions #12).
 *
 * No provider/context/re-render machinery: a plain function over the flat
 * `en` catalog. `{placeholder}` vars are interpolated; an unknown key falls
 * back to the key string so a missing message is visible instead of crashing.
 * The key parameter is typed as `keyof typeof en` (compile-time exhaustiveness
 * for call sites); a `hasOwnProperty` guard keeps prototype-chain names
 * (`toString`, `constructor`, …) on the fallback path at runtime.
 */

import { en } from './en'

/** Union of every catalog key, derived from the `en` literal (no circular import). */
export type MessageKey = keyof typeof en

export type MessageVars = Record<string, string | number>

export function t(key: MessageKey, vars?: MessageVars): string {
  // Own-property guard: a bare `en[key]` would surface Object.prototype
  // members (e.g. t('toString')) as truthy non-string templates.
  const template: string | undefined = Object.prototype.hasOwnProperty.call(en, key)
    ? en[key]
    : undefined
  const base = template ?? key
  if (!vars) return base
  return base.replace(/\{(\w+)\}/g, (whole: string, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  )
}
