import { test, expect } from '@playwright/test'
import { login, mockFx } from './helpers'

test.describe('Tramo C — Clientes en Sidebar y Selector con Buscador + Dropdown', () => {
  test('flujo completo: crear cliente desde Clientes y seleccionarlo con buscador + dropdown en Nueva orden', async ({ page }) => {
    await mockFx(page)
    await login(page)

    // 1. Sidebar incluye "Clientes" y navega a la vista
    const clientesNav = page.getByRole('button', { name: /Clientes/i })
    await expect(clientesNav).toBeVisible()
    await clientesNav.click()

    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible({ timeout: 10_000 })
    const nuevoClienteBtn = page.getByRole('button', { name: /nuevo cliente|agregar primer cliente/i }).first()
    await expect(nuevoClienteBtn).toBeVisible()

    // 2. Crear un nuevo cliente para que la tienda tenga al menos un contacto
    await nuevoClienteBtn.click()
    const nameInput = page.getByPlaceholder(/Distribuidora Central/i)
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill('Distribuidora Los Andes')

    const phoneInput = page.getByPlaceholder(/\+54|\+58/i).first()
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+54 11 5555 4444')
    }

    await page.getByRole('button', { name: /agregar cliente|guardar cambios/i }).click()

    // El cliente debe aparecer en la lista
    await expect(page.getByText('Distribuidora Los Andes')).toBeVisible({ timeout: 10_000 })

    // 3. Ir a Órdenes y abrir modal de Nueva orden
    const ordenesNav = page.getByRole('button', { name: 'Órdenes' })
    await ordenesNav.click()
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()

    await page.getByRole('button', { name: /new order/i }).click()
    await expect(page.getByRole('heading', { name: 'New order' })).toBeVisible({ timeout: 10_000 })

    // Ahora que hay clientes guardados, el modo 'Guardado' está activo
    // Si ya está seleccionado (por seed), hacemos clic en Change para abrir el buscador
    const cambiarBtn = page.getByRole('button', { name: 'Change' })
    if (await cambiarBtn.isVisible().catch(() => false)) {
      await cambiarBtn.click()
    }

    // El input del buscador debe estar visible
    const searchInput = page.getByPlaceholder(/search by name, whatsapp/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Hacer clic en el buscador para desplegar el dropdown
    await searchInput.click()

    // El dropdown desplegable debe mostrar al cliente
    await expect(page.getByRole('button', { name: /Distribuidora Los Andes/i })).toBeVisible({ timeout: 10_000 })

    // 4. Probar el filtro en tiempo real del buscador
    await searchInput.fill('Los Andes')
    await expect(page.getByRole('button', { name: /Distribuidora Los Andes/i })).toBeVisible()

    // Probar filtro sin coincidencias
    await searchInput.fill('Comercio Inexistente XYZ')
    await expect(page.getByText(/no matches for/i)).toBeVisible()

    // Limpiar búsqueda y seleccionar cliente
    await searchInput.fill('')
    const customerOption = page.getByRole('button', { name: /Distribuidora Los Andes/i })
    await customerOption.click()

    // El dropdown se cierra y muestra la tarjeta con Change
    await expect(page.getByRole('button', { name: 'Change' })).toBeVisible()

    // Los campos de comprador deben estar precompletados con los datos del cliente seleccionado
    const buyerNameInput = page.locator('input[value="Distribuidora Los Andes"]')
    await expect(buyerNameInput).toBeVisible()
  })

  test('Órdenes: estado vacío sin datos y buscador/filtros cuando hay órdenes', async ({ page }) => {
    await mockFx(page)
    await login(page)
    await expect(page.getByRole('heading', { name: 'Órdenes' })).toBeVisible()

    const searchOrders = page.getByPlaceholder(/search by #/i)
    const pendingTab = page.getByRole('button', { name: 'Pending' })

    // Con la tienda vacía se ve el estado "No orders yet" y NO el buscador
    // (los filtros no aportan sin datos que filtrar). Se detecta por la ausencia
    // del buscador, sin depender del estado previo de la base de datos.
    if ((await searchOrders.count()) === 0) {
      await expect(page.getByText(/no orders yet/i)).toBeVisible()
    } else {
      // Si ya hay órdenes, el buscador y las pestañas deben estar visibles
      await expect(searchOrders).toBeVisible()
      await expect(pendingTab).toBeVisible()

      // Buscar algo sin coincidencias muestra el estado "No results"
      await searchOrders.fill('ORDEN-QUE-NO-EXISTE-999')
      await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 10_000 })

      // "Clear filters" restablece la búsqueda
      await page.getByRole('button', { name: /clear filters/i }).click()
      await expect(searchOrders).toHaveValue('')

      // Filtrar por estado no rompe el layout
      await pendingTab.click()
      const section = page.getByText(/pending payment|no results|history/i)
      await expect(section.first()).toBeVisible({ timeout: 10_000 })
    }
  })
})
