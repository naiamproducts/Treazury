/**
 * e2e/09-app-locale.spec.ts — app-shell EN sweep part 1 (import-export-pivot,
 * tasks 7.1/7.2, PR slice 7a).
 *
 * Covers (I18N-R1, I18N-R4):
 *  - I18N-R1S2: the active locale is `en` after navigating the app shell.
 *  - I18N-R1S1: rendered views in the 7a sweep scope contain no Spanish —
 *    OrdersView, CatalogView, AuthPage, AccessRequestForm (landing copy is
 *    covered by e2e/04). Views NOT in the 7a sweep (Shell chrome, Charges,
 *    Customers, Settings, modals, PaymentPage) stay Spanish until Phase 7b
 *    and are therefore scoped OUT of the scans below.
 *  - I18N-R4: invalid submission in a swept form surfaces an ENGLISH error
 *    (CatalogView + OrdersView create-forms).
 *
 * Structure: APP_VIEW_CASES is a parameterized list of route/view cases so
 * Phase 7 7b can ADD its views to the array without rewriting the spec.
 *
 * Scan scoping rules (documented deviations, not silent gaps):
 *  - dashboard cases scope to `main > div:last-child` — the Shell content
 *    wrapper (Shell.tsx renders mobile top bar + desktop header + content
 *    as main's children); the still-Spanish sidebar/page header stay out.
 *  - the access-request case excludes <select> nodes: country names come
 *    from SUPPORTED_COUNTRIES data (src/lib/currency.ts, e.g. "México"),
 *    which is outside the 7a sweep scope.
 *  - stored data echoed by views (product/unit values, customer names) is
 *    data, not app copy — the orthography + old-phrase scan treats it as
 *    such (e.g. a pre-existing product with unit 'unidad' still renders).
 *
 * Navigation selectors are dual-language (/es|en/) so this spec fails on the
 * Spanish COPY it targets, never on navigation chrome that Phase 7b sweeps.
 */

import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './helpers'
import { collectVisibleCopy, copyHaystack, expectNoSpanishCopy } from './i18n-utils'

/** One scannable view in the app-shell sweep scope. */
interface AppViewCase {
  name: string
  /** CSS selector of the subtree scanned for Spanish copy. */
  scope: string
  /** Selector list removed from the scope before scanning (data / deferred). */
  exclude?: string[]
  navigate: (page: Page) => Promise<void>
  /** Language-neutral readiness signal (must work pre- and post-sweep). */
  ready: (page: Page) => Promise<void>
  /** Representative pre-sweep Spanish phrases for this view (lowercased match). */
  oldPhrases: string[]
}

const APP_VIEW_CASES: AppViewCase[] = [
  {
    name: 'AuthPage',
    scope: 'body',
    navigate: async page => {
      await page.goto('/')
      await page.locator('[data-purpose="header-signin-button"]').click({ force: true })
    },
    ready: page => page.locator('input[type="password"]').waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Ingresar',
      'Crear cuenta',
      'Correo electrónico',
      'Contraseña',
      'Ingresar al panel',
      'Ingresando',
      'Creando cuenta',
      'Nombre del negocio',
      'Cobros B2B por WhatsApp',
      'Volver al inicio',
      'Credenciales inválidas',
      'El acceso a Treazury',
    ],
  },
  {
    name: 'AccessRequestForm',
    scope: '[data-purpose="access-request-form"]',
    // Country <option> names are SUPPORTED_COUNTRIES data (currency.ts) —
    // out of the 7a sweep scope (Phase 7b owns the residual decision).
    exclude: ['select'],
    navigate: async page => {
      await page.goto('/')
    },
    ready: page =>
      page.locator('[data-purpose="access-request-form"]').waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Solicitá acceso',
      'Acceso anticipado',
      'Tu nombre',
      'Negocio',
      'País',
      'Facturación mensual',
      'Elegí',
      'Contanos',
      'Solicitud recibida',
      'Crear mi cuenta',
      'Sin compromiso',
      'Enviando',
      'vendés',
      'Revisalo',
    ],
  },
  {
    name: 'OrdersView',
    // Shell content wrapper (Shell.tsx: mobile bar + page header + content).
    scope: 'main > div:last-child',
    navigate: login,
    // The page heading comes from Shell's NAV label, which stays Spanish
    // until 7b — a stable, sweep-independent readiness signal.
    ready: page => page.getByRole('heading', { name: 'Órdenes' }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Nueva orden',
      'Cliente *',
      'Nombre del comprador',
      'Guardado',
      'Habitual',
      'Cambiar',
      'Buscar por nombre',
      'Sin coincidencias',
      'Registrar nuevo cliente',
      'Agregar productos',
      'Líneas del pedido',
      'Notas',
      'Crear orden',
      'Borrador',
      'Pago pendiente',
      'Pago parcial',
      'Pagado',
      'Cancelado',
      'Pendientes de pago',
      'Sin órdenes todavía',
      'Cargando órdenes',
      'Cargando clientes',
      'Generar link de pago',
      'Marcar como pagado',
      'Detalle',
      'Historial',
      'Limpiar filtros',
      'Sin resultados',
      'Todas',
      'Borradores',
      'Copiar',
      'Copiado',
      'ID fiscal',
      'opcional',
      'Se cobra en',
      'impuestos automáticos',
      'Documento fiscal',
      'Enviar WA',
    ],
  },
  {
    name: 'CatalogView',
    scope: 'main > div:last-child',
    navigate: async page => {
      await login(page)
      // Shell nav label — stays Spanish until 7b (stable across 7a).
      await page.getByRole('button', { name: 'Catálogo' }).click()
    },
    ready: page => page.getByRole('heading', { name: 'Catálogo' }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Nuevo producto',
      'Editar producto',
      'Nombre *',
      'SKU (opcional)',
      'Precio base',
      'cargando tasa',
      'calculando equivalente',
      'Descripción',
      'Variantes',
      'Campos personalizados',
      'Agregar variante',
      'Agregar campo',
      'Agregar producto',
      'Guardar cambios',
      'Eliminar',
      'Stock total',
      'variante',
      'Sin productos',
      'Cargando catálogo',
      'Número',
      'Opciones',
      'Valor',
      'Texto',
    ],
  },
  // Phase 7b: append { name, scope, navigate, ready, oldPhrases } cases for
  // ChargesView / CustomersView / SettingsView / Shell here — no rewrite.
]

test.describe('App-shell EN sweep (task 7.1) — locale + no-Spanish views', () => {
  test('I18N-R1S2: active locale is en after navigating the app shell', async ({ page }) => {
    await login(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  for (const viewCase of APP_VIEW_CASES) {
    test(`I18N-R1S1: ${viewCase.name} renders no Spanish copy`, async ({ page }) => {
      await viewCase.navigate(page)
      await viewCase.ready(page)
      const copy = await collectVisibleCopy(page, {
        scope: viewCase.scope,
        exclude: viewCase.exclude,
      })
      // Non-vacuous: the view must have rendered visible copy to scan.
      expect(copy.text.trim().length).toBeGreaterThan(0)
      expectNoSpanishCopy(copyHaystack(copy), viewCase.oldPhrases)
    })
  }
})

test.describe('App-shell EN sweep (task 7.1) — English form errors (I18N-R4)', () => {
  test('invalid CatalogView submit shows an English error', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Catálogo' }).click()
    await page.getByRole('button', { name: /nuevo producto|new product/i }).click()
    await page.getByRole('button', { name: /agregar producto|add product/i }).click()
    await expect(page.getByText(/the product name is required/i)).toBeVisible()
  })

  test('invalid OrdersView submit shows an English error', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /nueva orden|new order/i }).click()
    await page.getByRole('button', { name: /crear orden|create order/i }).click()
    await expect(page.getByText(/the buyer name is required/i)).toBeVisible()
  })
})
