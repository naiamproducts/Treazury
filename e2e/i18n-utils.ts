/**
 * i18n-utils — shared no-Spanish scan helpers for the import-export-pivot
 * e2e specs (extracted in task 7.1 from the task-2.5.4 landing hardening).
 *
 * The scan collects rendered copy from a scoped subtree: innerText plus the
 * user-facing attributes (aria-label, placeholder, title, alt, value) and the
 * live value of controlled inputs — an empty-looking React input carries its
 * current value as a property, not an attribute, so both must be scanned.
 * Matching is case-insensitive: normalize both sides before comparing.
 *
 * Stored-data exemption (task 7.3): views echo TENANT DATA (customer names,
 * charge memos, country option lists, …) that is neither app chrome nor app
 * copy — it may legitimately contain Spanish. The exact text nodes that
 * carry stored data are marked `data-purpose="stored-data"` in the markup;
 * cases exempt them by passing `exclude: ['[data-purpose="stored-data"]']`
 * (or a data-specific selector like `country-options`) to
 * `collectVisibleCopy`, which removes the matching nodes before the
 * haystack is built. Exemptions are per-node, never per-region: surrounding
 * chrome (buttons, headings, badges) stays in the scan. The orthography
 * scan itself (`SPANISH_ORTHOGRAPHY`) stays strict for everything else.
 */

import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Spanish orthography / punctuation that must not survive in EN-copy views. */
export const SPANISH_ORTHOGRAPHY = /[áéíóúñü¿¡]/

/** Visible-element attributes scanned for Spanish copy. */
export const SCANNED_ATTRIBUTES = ['aria-label', 'placeholder', 'title', 'alt', 'value']

export interface VisibleCopy {
  /** innerText of the (post-exclusion) scope subtree. */
  text: string
  /** Joined scanned-attribute values + controlled-input live values. */
  attrText: string
  /** How many excluded nodes were removed from the scope before scanning. */
  excludedCount: number
}

/**
 * Collect visible copy inside `scope` (CSS selector, default `body`),
 * removing any node matching `exclude` first — the stored-data exemption:
 * exact nodes that render tenant data (marked `data-purpose="stored-data"`
 * in the markup, plus country-option selects), or data outside the current
 * sweep scope. Per-node, so surrounding app chrome stays in the scan.
 *
 * Throws when the scope selector matches nothing so an unrendered view can
 * never masquerade as a clean scan.
 */
export async function collectVisibleCopy(
  page: Page,
  opts: { scope?: string; exclude?: string[] } = {},
): Promise<VisibleCopy> {
  const { scope = 'body', exclude = [] } = opts
  return page.evaluate(
    ({ scopeSel, excludeSels, attrs }) => {
      const root = document.querySelector(scopeSel)
      if (!root) throw new Error(`i18n scan scope not found: ${scopeSel}`)
      let excludedCount = 0
      if (excludeSels.length > 0) {
        const doomed = Array.from(root.querySelectorAll(excludeSels.join(', ')))
        excludedCount = doomed.length
        doomed.forEach(el => el.remove())
      }
      const attrText: string[] = []
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.getClientRects().length === 0) continue // visible elements only
        for (const name of attrs) {
          const value = el.getAttribute(name)
          if (value) attrText.push(value)
        }
        const candidate = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        if (
          (candidate instanceof HTMLInputElement ||
            candidate instanceof HTMLTextAreaElement ||
            candidate instanceof HTMLSelectElement) &&
          candidate.value
        ) {
          attrText.push(candidate.value)
        }
      }
      return { text: root.innerText, attrText: attrText.join('\n'), excludedCount }
    },
    { scopeSel: scope, excludeSels: exclude, attrs: SCANNED_ATTRIBUTES },
  )
}

/** Lowercased haystack (text + attributes) for case-insensitive matching. */
export function copyHaystack(copy: VisibleCopy): string {
  return `${copy.text}\n${copy.attrText}`.toLowerCase()
}

/**
 * Assert the scanned copy carries no Spanish orthography and none of the
 * pre-sweep phrases survive (both sides lowercased). Stored-tenant-data
 * regions are exempted upstream, through `collectVisibleCopy`'s `exclude`.
 */
export function expectNoSpanishCopy(haystack: string, oldPhrases: string[]): void {
  expect(haystack).not.toMatch(SPANISH_ORTHOGRAPHY)
  for (const phrase of oldPhrases) {
    expect(haystack, `unexpected Spanish phrase survived the sweep: "${phrase}"`).not.toContain(
      phrase.toLowerCase(),
    )
  }
}
