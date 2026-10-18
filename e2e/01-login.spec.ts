import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Tramo A — Login + Dashboard', () => {
  test('login shows dashboard with sidebar', async ({ page }) => {
    await login(page)
    // Sidebar nav labels: dual-language selectors so this test tracks the
    // Phase 7b Shell sweep (task 7.3) without blocking on it.
    await expect(page.getByRole('button', { name: /órdenes|orders/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /catálogo|catalog/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /clientes|customers/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cobros|charges/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /configuración|settings/i })).toBeVisible()
  })

  test('dashboard default view is Órdenes/Orders', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: /órdenes|orders/i })).toBeVisible()
    await expect(page.getByText('No orders yet')).toBeVisible()
  })

  test('wallet address is visible in sidebar', async ({ page }) => {
    await login(page)
    await expect(page.getByText(/^0x[0-9a-fA-F]{4}/).first()).toBeVisible()
  })
})
