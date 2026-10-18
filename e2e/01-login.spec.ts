import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Tramo A — Login + Dashboard', () => {
  test('login shows dashboard with sidebar', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('button', { name: 'Órdenes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Clientes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cobros' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Configuración' })).toBeVisible()
  })

  test('dashboard default view is Órdenes', async ({ page }) => {
    await login(page)
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()
    await expect(page.getByText('No orders yet')).toBeVisible()
  })

  test('wallet address is visible in sidebar', async ({ page }) => {
    await login(page)
    await expect(page.getByText(/^0x[0-9a-fA-F]{4}/).first()).toBeVisible()
  })
})
