import type { Page, BrowserContext } from '@playwright/test'

export const EMAIL = 'e2e-country-test@paystyle.dev'
export const PASSWORD = 'E2eTest2026!'

/** Login through the UI and land on the dashboard. Handles the country modal. */
export async function login(page: Page, opts: { dismissCountryModal?: boolean } = {}) {
  const { dismissCountryModal = true } = opts
  await page.goto('/')
  // Landing is English since import-export-pivot: enter the auth stage via
  // the header "Sign in" CTA (stable data-purpose locator), then drive the
  // AuthPage — English copy since the Phase 7a sweep (PR7a).
  // Forced click: the blurred header occasionally fails Playwright's
  // hit-target check and hangs until the test timeout. The handler is a
  // plain setStage('auth') so forcing the dispatch is safe.
  await page.locator('[data-purpose="header-signin-button"]').click({ force: true })
  await page.getByPlaceholder('you@company.com').waitFor({ timeout: 15_000 })
  await page.getByPlaceholder('you@company.com').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /enter the dashboard/i }).click()
  // The sidebar renders the store's default tenant name ('Mi Negocio', see
  // src/store/index.ts) until the Supabase profile fetch lands — wait for the
  // real business name. Sandbox auth latency (and font-load layout shifts
  // around the submit button) can make the first submit miss or stall: retry
  // once if the auth stage is still up after the grace period.
  const dashboardReady = page.getByText('E2E Country Test')
  const submit = page.getByRole('button', { name: /enter the dashboard/i })
  try {
    await dashboardReady.waitFor({ timeout: 30_000 })
  } catch (firstError) {
    if (!(await submit.isVisible().catch(() => false))) throw firstError
    await submit.click()
    await dashboardReady.waitFor({ timeout: 30_000 })
  }
  // Dismiss country modal if it appears (fresh browser context). The modal
  // copy is swept in Phase 7b (task 7.3): accept BOTH the pre-sweep Spanish
  // and the post-sweep English so this helper stays green across the sweep.
  if (dismissCountryModal) {
    const modal = page.getByText(/¿dónde operás\?|where do you operate\?/i)
    if (await modal.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /argentina/i }).click()
      await page.getByRole('button', { name: /continuar|continue/i }).click()
      await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
    }
  }
}

/** Save authenticated session to reuse across tests. */
export async function saveSession(context: BrowserContext, page: Page) {
  await login(page)
  await context.storageState({ path: 'e2e/.auth/state.json' })
}

/** Mock FX APIs so ≈ always renders regardless of sandbox network. */
export async function mockFx(page: Page) {
  await page.route('**/open.er-api.com/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rates: { ARS: 1450, VES: 85, MXN: 18.5, COP: 4100, CLP: 950 } }) }))
  await page.route('**/dolarapi.com/v1/dolares/blue', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ compra: 1440, venta: 1450 }) }))
  await page.route('**/ve.dolarapi.com/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ fuente: 'paralelo', promedio: 85 }]) }))
}
