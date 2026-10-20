/**
 * e2e/04-landing-en.spec.ts — English agency landing (import-export-pivot, slice 2).
 *
 * Covers:
 *  - Task 2.1 (i18n foundation): catalog shape (>=140 keys, design namespaces)
 *    + pure t() (incl. prototype-chain guard from task 2.5.3).
 *  - L-R1: English hero addressed to import/export agencies.
 *  - L-R2: SWIFT vs USDC contrasted on speed, cost, visibility.
 *  - L-R3: USDC payment → commercial document release is stated.
 *  - L-R4 + I18N-R1: locale is `en`, no Spanish copy on landing-owned surfaces
 *    (text AND attributes: aria-label, placeholder, title, alt, value).
 *  - I18N-R3: English <title> and OpenGraph meta.
 *
 * Design note: AccessRequestForm renders inside the hero card. Its copy was
 * swept to t() in Phase 7 (tasks.md 7.2); this file still scopes its scan to
 * landing-owned copy and removes the access-request subtree (asserting
 * removal count > 0 AND form visibility, so a skipped render can never
 * masquerade as a clean scan) — the form's own no-Spanish scan is owned by
 * e2e/09-app-locale.spec.ts (task 7.1).
 *
 * Review follow-ups implemented here (tasks.md Phase 2.5, tasks 2.5.3–2.5.7):
 * open-ended catalog growth (no upper bound — Phase 7 adds keys/namespaces),
 * attribute-level Spanish scan, case-insensitive OLD_LANDING_SPANISH matching,
 * stable `[data-purpose="doc-release-statement"]` locator, vocabulary
 * normalization (login/register stems, `<ns>.error.<verb>`), terms sentence
 * composed without the stopword `conjunction` key, and dead `landing.meta.*`
 * keys removed (index.html is the sole meta source).
 *
 * Task 7.1 refactor: the no-Spanish scan machinery (orthography regex,
 * scanned attributes, scoped collectVisibleCopy) is shared with
 * e2e/09-app-locale.spec.ts via e2e/i18n-utils.ts; behavior is unchanged.
 */

import { test, expect } from '@playwright/test'
import { t } from '../src/i18n/t'
import type { MessageKey } from '../src/i18n/t'
import { en } from '../src/i18n/en'
import {
  collectVisibleCopy,
  copyHaystack,
  expectNoSpanishCopy,
} from './i18n-utils'

/** Access-request subtrees — excluded from the landing scan by design; their
 *  own no-Spanish scan is owned by e2e/09-app-locale.spec.ts (task 7.1). */
const ACCESS_FORM_SELECTOR =
  '[data-purpose="access-request-form"], [data-purpose="access-request-success"]'

/** Spanish phrases rendered by the pre-pivot landing; must all be gone. */
const OLD_LANDING_SPANISH = [
  'Para proveedores mayoristas B2B',
  'pedidos mayoristas',
  'en USDC al instante',
  'Solicitar acceso',
  'Impulsado por los mejores',
  'Autocustodia',
  'Monedas locales',
  'en camino',
  'Al usar Treazury',
  'Términos',
  'Privacidad',
  'Entendido',
  'Crear cuenta',
  'Entrar al panel',
  'Ingresar',
]

/** Design namespaces that exist in en.ts today (Phase 7 may add more — never fail on extras). */
const EXPECTED_NAMESPACES = [
  'auth',
  'catalog',
  'charges',
  'customers',
  'docs',
  'errors',
  'landing',
  'orders',
  'partners',
  'settings',
  'shell',
]

test.describe('i18n foundation (task 2.1) — catalog + t()', () => {
  test('en catalog holds at least 140 keys across the design namespaces', () => {
    const keys = Object.keys(en)
    // openspec/changes/import-export-pivot/design.md (Architecture Decisions
    // #12): flat dotted catalog, ~150 keys. Floor only — the catalog grows in
    // Phase 7 (app-shell sweep), so there is deliberately no upper bound.
    expect(keys.length).toBeGreaterThanOrEqual(140)
    // Every namespace that exists today must exist; new namespaces never fail.
    const namespaces = [...new Set(keys.map(k => k.split('.')[0]))]
    expect(namespaces).toEqual(expect.arrayContaining(EXPECTED_NAMESPACES))
  })

  test('dead landing.meta.* keys are gone (index.html is the sole meta source)', () => {
    // Task 2.5.2: meta copy lives in index.html only; catalog keys removed.
    expect(Object.keys(en)).not.toContain('landing.meta.title')
    expect(Object.keys(en)).not.toContain('landing.meta.description')
  })

  test('key vocabulary: login/register stems and <ns>.error.<verb> error keys', () => {
    // Task 2.5.6: one stem per concept — login/register win over
    // signin/createAccount (matches the auth.* namespace).
    const keys = Object.keys(en)
    expect(keys).toContain('landing.header.login')
    expect(keys).not.toContain('landing.header.signin')
    expect(keys).toContain('landing.header.register')
    expect(keys).not.toContain('landing.header.createAccount')
    // One error-key convention in auth/catalog: <ns>.error.<verb> — no
    // legacy `<something>Error` suffix keys in those namespaces.
    expect(keys.filter(k => /^(auth|catalog)\./.test(k) && /Error$/.test(k))).toEqual([])
    expect(keys).not.toContain('auth.error.emailFormat')
    expect(keys).not.toContain('auth.error.emailRegistered')
    expect(keys).not.toContain('auth.error.tooManyAttempts')
    expect(keys).not.toContain('catalog.priceError')
    expect(keys).toContain('auth.error.validateEmail')
    expect(keys).toContain('auth.error.register')
    expect(keys).toContain('auth.error.rateLimit')
    expect(keys).toContain('catalog.error.save')
    expect(keys).toContain('catalog.error.delete')
    expect(keys).toContain('catalog.error.validatePrice')
  })

  test('terms sentence has no stopword conjunction key', () => {
    // Task 2.5.7: prefix + two links only; terminal conjunction and
    // punctuation live in the last key (landing.terms.privacy) so the
    // rendered sentence stays "… our Terms and Privacy."
    expect(Object.keys(en)).not.toContain('landing.terms.conjunction')
    expect(en['landing.terms.privacy']).toBe('and Privacy.')
  })

  test('t() resolves a catalog entry', () => {
    expect(t('landing.hero.badge')).toBe('For import/export agencies')
  })

  test('t() interpolates vars into the message', () => {
    expect(t('errors.requiredField', { field: 'Email' })).toBe('Email is required.')
  })

  test('t() falls back to the key for unknown messages', () => {
    expect(t('nope.unknown.message' as MessageKey)).toBe('nope.unknown.message')
  })

  test("t() returns the key for Object.prototype names (no prototype-chain reads)", () => {
    // Task 2.5.3: en has no hasOwnProperty of its own; a naive en[key] read
    // would surface Object.prototype members as truthy templates.
    expect(t('toString' as MessageKey)).toBe('toString')
    expect(t('constructor' as MessageKey)).toBe('constructor')
    expect(t('hasOwnProperty' as MessageKey)).toBe('hasOwnProperty')
  })
})

test.describe('Landing — English agency landing (L-R1..L-R4, I18N-R1/R3)', () => {
  test('L-R1: hero is English and addresses import/export agencies', async ({ page }) => {
    await page.goto('/')
    // Hero headline renders from the en catalog (agency settlement story)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Settle cross-border trade/i
    )
    // Audience badge names import/export agencies (exact: the hero subtitle
    // also mentions agencies as a substring)
    await expect(page.getByText('For import/export agencies', { exact: true })).toBeVisible()
    // Hero subtitle states the USDC agency value proposition
    await expect(page.getByText(/settlement layer for import\/export agencies/i)).toBeVisible()
    // CTA is English
    await expect(
      page.getByRole('button', { name: /create free account|enter the dashboard/i }).first()
    ).toBeVisible()
  })

  test('L-R2: SWIFT and USDC contrasted on speed, cost, visibility', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Why agencies move off SWIFT')).toBeVisible()
    // Column headers name both rails
    await expect(page.getByText('SWIFT', { exact: true })).toBeVisible()
    await expect(page.getByText('USDC on Treazury')).toBeVisible()
    // Speed
    await expect(page.getByText('Speed', { exact: true })).toBeVisible()
    await expect(page.getByText('2–5 business days per leg')).toBeVisible()
    await expect(page.getByText('Minutes, around the clock')).toBeVisible()
    // Cost
    await expect(page.getByText('Cost', { exact: true })).toBeVisible()
    await expect(page.getByText('Intermediary fees plus FX spreads')).toBeVisible()
    await expect(page.getByText('One flat network fee')).toBeVisible()
    // Visibility
    await expect(page.getByText('Visibility', { exact: true })).toBeVisible()
    await expect(page.getByText('Opaque correspondent chain')).toBeVisible()
    await expect(page.getByText('End-to-end traceable on-chain')).toBeVisible()
  })

  test('L-R3: USDC payment stated to release commercial documents', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Payment releases the paperwork')).toBeVisible()
    // Stable locator: the flow statement element carries
    // data-purpose="doc-release-statement" (LandingPage.tsx).
    const statement = page.locator('[data-purpose="doc-release-statement"]')
    await expect(statement).toBeVisible()
    const statementText = await statement.innerText()
    expect(statementText).toMatch(/settles an order in USDC/i)
    expect(statementText).toMatch(/commercial documents .* released/i)
    expect(statementText).toMatch(/commercial invoice and packing list/i)
    expect(statementText).toMatch(/PDF or CSV/i)
  })

  test('L-R4 + I18N-R1: locale en and no Spanish copy on landing', async ({ page }) => {
    await page.goto('/')
    // Active locale is `en`
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    // The access-request form MUST have rendered before we exclude it —
    // otherwise a skipped render would make the no-Spanish scan vacuously
    // green. The heading assertion is dual-language: it accepts the pre-7.2
    // Spanish heading and the swept English one, so this file stays green
    // across the sweep (e2e/09 owns the form's own no-Spanish scan).
    const accessForm = page.locator('[data-purpose="access-request-form"]')
    await expect(accessForm).toBeVisible()
    await expect(accessForm.getByRole('heading', { name: /solicit. acceso|request access/i })).toBeVisible()
    // Exclude the access-request subtree (its scan is owned by e2e/09) and
    // scan landing-owned copy: innerText AND visible-element attributes
    // (aria-label, placeholder, title, alt, value).
    const scan = await collectVisibleCopy(page, { exclude: [ACCESS_FORM_SELECTOR] })
    // The access subtree really was removed above (form was rendered, not
    // skipped) — excludedCount > 0 proves the exclusion matched a live node.
    expect(scan.excludedCount).toBeGreaterThan(0)
    // Case-insensitive scan: normalize both sides before matching.
    const haystack = copyHaystack(scan)
    // No Spanish orthography in landing copy/attributes; none of the
    // pre-pivot Spanish landing phrases survive (either casing).
    expectNoSpanishCopy(haystack, OLD_LANDING_SPANISH)
    // English terms banner renders (landing-owned surface)
    await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible()
    // Terms sentence is composed from the minimum key set (task 2.5.7):
    // prefix + Terms link + Privacy link, punctuation inside the last key.
    await expect(page.locator('[data-purpose="terms-cookie-banner"] p')).toContainText(
      /By using Treazury, you accept our Terms and Privacy\./
    )
  })

  test('I18N-R3: English title and OpenGraph meta', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/USDC settlement.*import\/export agencies/i)
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /USDC settlement/i)
    const ogDescription = page.locator('meta[property="og:description"]')
    await expect(ogDescription).toHaveAttribute('content', /crypto alternative to SWIFT/i)
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'en_US'
    )
  })

  test('L-R5: banner Terms and Privacy links open the legal dialog', async ({ page }) => {
    await page.goto('/')
    // The terms banner renders on load; its Terms/Privacy entries are now
    // buttons (exact full-string names, since the ✕ dismiss carries the
    // aria-label "Dismiss terms notice" which case-insensitively contains
    // "terms").
    const termsButton = page.getByRole('button', { name: 'Terms', exact: true })
    await expect(termsButton).toBeVisible()
    // Terms dialog: role=dialog, titled, names the operating entity.
    await termsButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Exponencial INC SAS')
    await expect(
      dialog.getByRole('heading', { name: 'Terms of Service (Alpha)' })
    ).toBeVisible()
    // Escape closes the dialog (keydown on the focused dialog container).
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    // Privacy dialog: opened independently (the banner was not dismissed by
    // opening the first dialog); closed via the ✕ button.
    await page.getByRole('button', { name: 'and Privacy.', exact: true }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('We do not sell personal data')
    await page.getByRole('button', { name: 'Close dialog' }).click()
    await expect(dialog).toBeHidden()
  })

  test('L-R6: card-to-backdrop drag keeps the dialog open; Escape closes from outside', async ({ page }) => {
    await page.goto('/')
    // Wait for the terms banner exactly like L-R5 does, then open Terms.
    const termsButton = page.getByRole('button', { name: 'Terms', exact: true })
    await expect(termsButton).toBeVisible()
    await termsButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('data-purpose', 'legal-dialog')

    // Raw-mouse drag from inside the card to outside it (deterministic):
    // pointer-down on a card descendant + pointer-up on the backdrop must
    // NOT dismiss — the press did not START on the backdrop.
    const box = await dialog.boundingBox()
    if (!box) throw new Error('legal dialog has no bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width + 80, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    // Still open after the out-of-card drag (this failed before the fix).
    await expect(dialog).toBeVisible()

    // Tab out of the dialog: container -> ✕ -> Close -> focus leaves the card.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(dialog).toBeVisible()

    // Escape still closes with focus OUTSIDE the container (document-level
    // listener; this failed when Escape was a container onKeyDown only).
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
