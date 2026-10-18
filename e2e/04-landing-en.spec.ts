/**
 * e2e/04-landing-en.spec.ts — English agency landing (import-export-pivot, slice 2).
 *
 * Covers:
 *  - Task 2.1 (i18n foundation): catalog shape (~150 keys, 11 namespaces) + pure t().
 *  - L-R1: English hero addressed to import/export agencies.
 *  - L-R2: SWIFT vs USDC contrasted on speed, cost, visibility.
 *  - L-R3: USDC payment → commercial document release is stated.
 *  - L-R4 + I18N-R1: locale is `en`, no Spanish copy on landing-owned surfaces.
 *  - I18N-R3: English <title> and OpenGraph meta.
 *
 * Known gap (documented deviation): AccessRequestForm renders inside the hero
 * card but its Spanish strings are scheduled for Phase 7 (tasks.md 7.2 —
 * "sweep heaviest files into t() ... AccessRequestForm.tsx (~14)"). The
 * no-Spanish scan therefore scopes to landing-owned copy and removes the
 * access-request subtree; full-page L-R4 is verified after 7.2.
 */

import { test, expect } from '@playwright/test'
import { t } from '../src/i18n/t'
import { en } from '../src/i18n/en'

/** Access-request form subtree (Spanish copy deferred to Phase 7, task 7.2). */
const DEFERRED_FORM_SELECTOR =
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

test.describe('i18n foundation (task 2.1) — catalog + t()', () => {
  test('en catalog holds ~150 keys across the 11 design namespaces', () => {
    const keys = Object.keys(en)
    // design.md #12: flat dotted catalog, ~150 keys, 11 namespaces.
    expect(keys.length).toBeGreaterThanOrEqual(140)
    expect(keys.length).toBeLessThanOrEqual(200)
    const namespaces = [...new Set(keys.map(k => k.split('.')[0]))].sort()
    expect(namespaces).toEqual([
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
    ])
  })

  test('t() resolves a catalog entry', () => {
    expect(t('landing.hero.badge')).toBe('For import/export agencies')
  })

  test('t() interpolates vars into the message', () => {
    expect(t('errors.requiredField', { field: 'Email' })).toBe('Email is required.')
  })

  test('t() falls back to the key for unknown messages', () => {
    expect(t('nope.unknown.message')).toBe('nope.unknown.message')
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
    // The release statement paragraph (flow step 2 says "the order", not
    // "an order", so this regex selects only the statement)
    const statement = page.locator('p', { hasText: /settles an order in USDC/i })
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
    // Scan landing-owned copy (access-request subtree excluded — Phase 7 / task 7.2)
    const landingText = await page.evaluate(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove())
      return document.body.innerText
    }, DEFERRED_FORM_SELECTOR)
    // No Spanish orthography anywhere in the rendered landing copy
    expect(landingText).not.toMatch(/[áéíóúñü¿¡]/)
    // None of the pre-pivot Spanish landing phrases survive
    for (const phrase of OLD_LANDING_SPANISH) {
      expect(landingText).not.toContain(phrase)
    }
    // English terms banner renders (landing-owned surface)
    await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible()
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
})
