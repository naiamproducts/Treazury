/**
 * t — pure single-locale message resolver (import-export-pivot, design.md #12).
 *
 * No provider/context/re-render machinery: a plain function over the flat
 * `en` catalog. `{placeholder}` vars are interpolated; an unknown key falls
 * back to the key string so a missing message is visible instead of crashing.
 */

import { en } from './en'

export type MessageVars = Record<string, string | number>

export function t(key: string, vars?: MessageVars): string {
  const template: string | undefined = en[key]
  const base = template ?? key
  if (!vars) return base
  return base.replace(/\{(\w+)\}/g, (whole: string, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  )
}
