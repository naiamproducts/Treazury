import type { Page, BrowserContext } from '@playwright/test'

export const EMAIL = 'e2e-country-test@paystyle.dev'
export const PASSWORD = 'E2eTest2026!'

/** Login through the UI and land on the dashboard. Handles the country modal. */
export async function login(page: Page) {
  await page.goto('/')
  const enterBtn = page.getByRole('button', { name: /iniciar sesión/i })
  if (await enterBtn.isVisible().catch(() => false)) {
    // Forced: the sticky blurred nav occasionally fails Playwright's
    // hit-target check and hangs until the test timeout. The handler is a
    // plain setStage('auth') so forcing the dispatch is safe.
    await enterBtn.click({ force: true })
  }
  await page.getByPlaceholder('tu@empresa.com').waitFor({ timeout: 15_000 })
  await page.getByPlaceholder('tu@empresa.com').fill(EMAIL)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByRole('button', { name: /ingresar al panel/i }).click()
  await page.getByText('E2E Country Test').waitFor({ timeout: 15_000 })
  // Dismiss country modal if it appears (fresh browser context)
  const modal = page.getByText('¿Dónde operás?')
  if (await modal.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /argentina/i }).click()
    await page.getByRole('button', { name: /continuar/i }).click()
    await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
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
