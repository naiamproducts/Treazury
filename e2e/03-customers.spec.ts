import { test, expect } from '@playwright/test'
import { login, mockFx } from './helpers'

test.describe('Track C — Customers in the sidebar and selector with search + dropdown', () => {
  test('full flow: create a customer from Customers and select it with search + dropdown in New order', async ({ page }) => {
    await mockFx(page)
    await login(page)

    // 1. Sidebar shows "Clientes"/"Customers" and navigates to the view
    // (dual-language selectors across the Phase 7b sweep, task 7.3)
    const clientesNav = page.getByRole('button', { name: /clientes|customers/i })
    await expect(clientesNav).toBeVisible()
    await clientesNav.click()

    await expect(page.getByRole('heading', { name: /clientes|customers/i })).toBeVisible({ timeout: 10_000 })
    const nuevoClienteBtn = page
      .getByRole('button', { name: /nuevo cliente|agregar primer cliente|new customer|add your first customer/i })
      .first()
    await expect(nuevoClienteBtn).toBeVisible()

    // 2. Create a new customer so the store has at least one contact
    await nuevoClienteBtn.click()
    // Name placeholder: dual-language across the 7b sweep (pre: "Ej:
    // Distribuidora Central C.A.", post: "e.g. Central Trading Co").
    const nameInput = page.getByPlaceholder(/Distribuidora Central|Central Trading Co/i)
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill('Distribuidora Los Andes')

    const phoneInput = page.getByPlaceholder(/\+54|\+58/i).first()
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+54 11 5555 4444')
    }

    await page.getByRole('button', { name: /agregar cliente|guardar cambios|add customer|save changes/i }).click()

    // The customer must appear in the list
    await expect(page.getByText('Distribuidora Los Andes')).toBeVisible({ timeout: 10_000 })

    // 3. Go to Orders and open the New order modal
    const ordenesNav = page.getByRole('button', { name: /órdenes|orders/i })
    await ordenesNav.click()
    await expect(page.getByRole('heading', { name: /órdenes|orders/i })).toBeVisible()

    await page.getByRole('button', { name: /new order/i }).click()
    await expect(page.getByRole('heading', { name: 'New order' })).toBeVisible({ timeout: 10_000 })

    // With saved customers, the 'Saved' mode is active. If it is already
    // selected (by seed), click Change to open the search
    const cambiarBtn = page.getByRole('button', { name: 'Change' })
    if (await cambiarBtn.isVisible().catch(() => false)) {
      await cambiarBtn.click()
    }

    // The search input must be visible
    const searchInput = page.getByPlaceholder(/search by name, whatsapp/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Click the search input to open the dropdown
    await searchInput.click()

    // The dropdown must show the customer
    await expect(page.getByRole('button', { name: /Distribuidora Los Andes/i })).toBeVisible({ timeout: 10_000 })

    // 4. Test the search's real-time filter
    await searchInput.fill('Los Andes')
    await expect(page.getByRole('button', { name: /Distribuidora Los Andes/i })).toBeVisible()

    // Test the no-matches filter
    await searchInput.fill('Comercio Inexistente XYZ')
    await expect(page.getByText(/no matches for/i)).toBeVisible()

    // Clear the search and select the customer
    await searchInput.fill('')
    const customerOption = page.getByRole('button', { name: /Distribuidora Los Andes/i })
    await customerOption.click()

    // The dropdown closes and the card with Change is shown
    await expect(page.getByRole('button', { name: 'Change' })).toBeVisible()

    // The buyer fields must be prefilled with the selected customer's data
    const buyerNameInput = page.locator('input[value="Distribuidora Los Andes"]')
    await expect(buyerNameInput).toBeVisible()
  })

  test('Orders: empty state with no data and search/filters when there are orders', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await expect(page.getByRole('heading', { name: /órdenes|orders/i })).toBeVisible()

    const searchOrders = page.getByPlaceholder(/search by #/i)
    const pendingTab = page.getByRole('button', { name: 'Pending' })

    // With an empty store the "No orders yet" state shows and NOT the search
    // (filters add nothing with no data to filter). Detected by the absence of
    // the search input, independent of the previous database state.
    if ((await searchOrders.count()) === 0) {
      await expect(page.getByText(/no orders yet/i)).toBeVisible()
    } else {
      // If there are already orders, the search and the tabs must be visible
      await expect(searchOrders).toBeVisible()
      await expect(pendingTab).toBeVisible()

      // Searching something with no matches shows the "No results" state
      await searchOrders.fill('ORDEN-QUE-NO-EXISTE-999')
      await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 10_000 })

      // "Clear filters" resets the search
      await page.getByRole('button', { name: /clear filters/i }).click()
      await expect(searchOrders).toHaveValue('')

      // Filtering by status does not break the layout
      await pendingTab.click()
      const section = page.getByText(/pending payment|no results|history/i)
      await expect(section.first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
