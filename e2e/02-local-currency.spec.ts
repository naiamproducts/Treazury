import { test, expect } from '@playwright/test'
import { login, mockFx } from './helpers'

test.describe('Tramo B — Moneda local visible', () => {
  test('Cobros muestra equivalente ARS al escribir monto', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await page.getByRole('button', { name: 'Cobros' }).click()
    await expect(page.getByText('Cobro rápido')).toBeVisible()
    const amountInput = page.locator('input[inputmode="decimal"]')
    await amountInput.fill('10')
    await expect(page.getByText(/≈/)).toBeVisible({ timeout: 10_000 })
  })

  test('Catálogo muestra precio con equivalente ARS', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await page.getByRole('button', { name: 'Catálogo' }).click()
    await page.getByRole('button', { name: /new product/i }).click()
    await page.getByPlaceholder(/product name/i).fill('Producto Test E2E')
    const priceInput = page.locator('input[inputmode="decimal"]').first()
    await priceInput.fill('100')
    await expect(page.getByText(/≈/)).toBeVisible({ timeout: 10_000 })
  })

  test('Órdenes abre el form de nueva orden', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()
    await page.getByRole('button', { name: /new order/i }).click()
    // The form opens with customer selection fields
    await expect(page.getByText(/customer|buyer name/i).first()).toBeVisible({ timeout: 10_000 })
    // The ≈ Equivalente logic is shared with Cobros/Catálogo (already tested above)
  })

  test('Nueva orden usa datos del país (AR), no de Venezuela', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()
    await page.getByRole('button', { name: /new order/i }).click()
    await expect(page.getByText(/buyer name|customer/i).first()).toBeVisible({ timeout: 10_000 })
    // AR account: generic fiscal ID label, no RIF; AR phone/address examples
    await expect(page.getByText('Tax ID')).toBeVisible()
    await expect(page.getByPlaceholder('+54 11 1234 5678')).toBeVisible()
    await expect(page.getByPlaceholder(/Buenos Aires/)).toBeVisible()
    await expect(page.getByText('RIF')).toHaveCount(0)
    await expect(page.getByPlaceholder(/Caracas/)).toHaveCount(0)
    await expect(page.getByPlaceholder(/\+58/)).toHaveCount(0)
  })

  test('Preferencia de moneda: se elige una vez y queda en Cobros', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await page.getByRole('button', { name: 'Configuración' }).click()
    await expect(page.getByText('Moneda para cargar precios')).toBeVisible({ timeout: 10_000 })
    // Pick ARS explicitly (mock rate: venta 1450)
    await page.getByRole('button', { name: 'ARS', exact: true }).click()
    await page.getByRole('button', { name: 'Cobros' }).click()
    await expect(page.getByText('Cobro rápido')).toBeVisible()
    const amountInput = page.locator('input[inputmode="decimal"]')
    await amountInput.fill('1450')
    // Local mode shows the USDC equivalent: 1450 ARS / 1450 = $1.00 USDC
    await expect(page.getByText('≈ $1.00 USDC')).toBeVisible({ timeout: 10_000 })
  })

  test('Link estilo Linktree: alias, métodos y sin jerga cripto', async ({ page }) => {
    await mockFx(page)
    // Public payment link with merchant + bank data (no login needed)
    await page.goto('/?to=0x0000000000000000000000000000000000000000&amount=56&memo=ORD-0001&display=ARS&mname=Cornelius&bname=Banco%20Naci%C3%B3n&balias=CORNE.TEST.MP&bacct=0000003100000000000000')
    // Hero in display currency, merchant-first (56 × 1450 mock = $ 81.200)
    await expect(page.getByText('Cornelius')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/81\.200/).first()).toBeVisible()
    // Transfer method open by default with alias + copy
    await expect(page.getByText('Transferencia bancaria')).toBeVisible()
    await expect(page.getByText('CORNE.TEST.MP').first()).toBeVisible()
    // USDC + coming-soon methods listed, no crypto jargon upfront
    await expect(page.getByText('Pagar con USDC')).toBeVisible()
    await expect(page.getByText('Próximamente')).toBeVisible()
    await expect(page.getByText('Arc Testnet')).toHaveCount(0)
    await expect(page.getByText(/onramp|beta privada/i)).toHaveCount(0)
    // Opening the USDC method shows the wallet flow with the USDC amount
    await page.getByText('Pagar con USDC').click()
    await expect(page.getByText(/Conecta tu wallet/i)).toBeVisible({ timeout: 10_000 })
  })

  test('Link de pago para México muestra CLABE y no CBU', async ({ page }) => {
    await mockFx(page)
    await page.goto('/?to=0x0000000000000000000000000000000000000000&amount=50&memo=ORD-MX&display=MXN&mname=Taqueria&bname=BBVA%20M%C3%A9xico&bacct=012180000000000000')
    await expect(page.getByText('Taqueria')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('BBVA México')).toBeVisible()
    await expect(page.getByText('CLABE')).toBeVisible()
    await expect(page.getByText('CBU')).toHaveCount(0)
  })
})
