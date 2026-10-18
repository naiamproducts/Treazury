/**
 * e2e/09-app-locale.spec.ts — app-shell EN sweep (import-export-pivot,
 * tasks 7.1/7.2 [PR 7a] + 7.3 [PR 7b]).
 *
 * Covers (I18N-R1, I18N-R4):
 *  - I18N-R1S2: the active locale is `en` after navigating the app shell.
 *  - I18N-R1S1: rendered views in the sweep scope contain no Spanish —
 *    AuthPage, AccessRequestForm, OrdersView, CatalogView (7a) plus Shell
 *    chrome/nav, CustomersView, ChargesView, SettingsView, SendFundsDialog
 *    and CountrySetupModal (7b). Landing copy is covered by e2e/04.
 *    PendingApproval is the one swept surface NOT parameterized here (see
 *    the exclusion note below).
 *  - I18N-R4: invalid submission in a swept form surfaces an ENGLISH error
 *    (CatalogView + OrdersView create-forms from 7a; CustomersView form +
 *    SendFundsDialog address validation from 7b).
 *
 * Structure: APP_VIEW_CASES is a parameterized list of route/view cases so
 * later phases can ADD views to the array without rewriting the spec.
 *
 * Scan scoping rules (documented deviations, not silent gaps):
 *  - dashboard cases scope to `main > div:last-child` — the Shell content
 *    wrapper (Shell.tsx renders mobile top bar + desktop header + content
 *    as main's children). The Shell case scans `body` to cover the sidebar
 *    chrome itself now that it is swept (task 7.3).
 *  - the access-request case excludes <select> nodes: country names come
 *    from SUPPORTED_COUNTRIES data (src/lib/currency.ts, e.g. "México"),
 *    which is app data, not app copy.
 *  - stored tenant data echoed by views (customer names/tax IDs, charge
 *    memos, payment URLs, country option lists) is DATA, not app copy: the
 *    exact text nodes carrying it are marked `data-purpose="stored-data"`
 *    and cases exclude that selector (the stored-data exemption documented
 *    in e2e/i18n-utils.ts). The orthography scan stays strict for
 *    everything the app itself renders.
 *
 * PendingApproval exclusion: PendingApproval renders only when
 * auth.status === 'pending_approval' (App.tsx) — a freshly registered tenant
 * that is not yet approved. Reaching that state e2e requires a new signup
 * plus email confirmation, which the harness cannot perform (no mailbox
 * access; the seeded e2e tenant is approved). Its copy IS swept in task
 * 7.3; coverage here is the grep spot-check owned by task 7.4, not a scan
 * case.
 *
 * Navigation/readiness selectors are dual-language (/es|en/) so this spec
 * fails on the Spanish COPY it targets, never on navigation chrome.
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
  /**
   * Selector list removed from the scope before scanning — per-node
   * stored-data marks and data <select>s.
   */
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
    // app data, excluded through the stored-data exemption.
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
    ready: page => page.getByRole('heading', { name: /órdenes|orders/i }).waitFor({ timeout: 15_000 }),
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
      await page.getByRole('button', { name: /catálogo|catalog/i }).click()
    },
    ready: page => page.getByRole('heading', { name: /catálogo|catalog/i }).waitFor({ timeout: 15_000 }),
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
  // ── Phase 7b cases (task 7.3) ────────────────────────────────────────────
  {
    // Shell chrome itself: sidebar nav, funds counter, sign-out, page header.
    name: 'Shell',
    scope: 'body',
    // A still-mounted CountrySetupModal (dismissal races the scan) can inject
    // SUPPORTED_COUNTRIES names like "México" — app data, exempted per-node.
    exclude: ['[data-purpose="country-options"]'],
    navigate: login,
    // Default view heading — dual-language readiness signal.
    ready: page => page.getByRole('heading', { name: /órdenes|orders/i }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Órdenes',
      'Catálogo',
      'Clientes',
      'Cobros',
      'Configuración',
      'Saldo',
      'Cerrar sesión',
      'Enviar / retirar fondos',
      'cerrar',
    ],
  },
  {
    name: 'CustomersView',
    scope: 'main > div:last-child',
    // Customer cards carry stored tenant data on exact nodes (names, tax
    // IDs, phones, addresses, notes) marked data-purpose="stored-data" —
    // the card chrome (badges, buttons, counts) stays scanned.
    exclude: ['[data-purpose="stored-data"]'],
    navigate: async page => {
      await login(page)
      await page.getByRole('button', { name: /clientes|customers/i }).click()
    },
    ready: page => page.getByRole('heading', { name: /clientes|customers/i }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Nuevo cliente',
      'Editar cliente',
      'Nombre o Razón Social',
      'Agregar cliente',
      'Guardar cambios',
      'Cancelar',
      'Habitual',
      'Nueva orden',
      'Sin clientes guardados todavía',
      'Agregar primer cliente',
      'Limpiar búsqueda',
      'Crear nuevo cliente',
      'No se encontraron clientes',
      'ID fiscal',
      'Documento fiscal',
      'Buscar por nombre',
      'cliente registrado',
    ],
  },
  {
    name: 'ChargesView',
    scope: 'main > div:last-child',
    // Charge memos and payment URLs are marked per-node
    // data-purpose="stored-data" — result/history chrome (headings, Copy,
    // Open, amounts) stays scanned.
    exclude: ['[data-purpose="stored-data"]'],
    navigate: async page => {
      await login(page)
      await page.getByRole('button', { name: /cobros|charges/i }).click()
    },
    ready: page => page.getByText(/cobro rápido|quick charge/i).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Cobro rápido',
      'Wallet destino',
      'Activa',
      'Generar link de pago',
      'Generando',
      'Historial de cobros',
      'Copiar',
      'Copiado',
      'Abrir',
      'cargando tasa',
      'Descripción (ej',
    ],
  },
  {
    name: 'SettingsView',
    scope: 'main > div:last-child',
    // countryMeta example labels/placeholders (bank names, alias formats)
    // are app data, e.g. AR "Banco de la Nación Argentina" — exempted
    // through the stored-data exclusion.
    exclude: ['[data-purpose="country-data-field"]'],
    navigate: async page => {
      await login(page)
      await page.getByRole('button', { name: /configuración|settings/i }).click()
    },
    ready: page =>
      page.getByText(/moneda para cargar precios|currency for prices/i).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Datos del negocio',
      'Nombre del negocio',
      'Teléfono',
      'Mi Negocio',
      'Moneda para cargar precios',
      'Catálogo y Cobros abren',
      'Datos para cobrar por transferencia',
      'Salen en tus links de pago',
      'Banco',
      'Guardar datos bancarios',
      'Facturación',
      'facturación local',
      'La facturación',
      'podés cobrar',
      'País fiscal',
      'Dirección fiscal',
      'módulo de facturación',
      'es requerido para emitir',
      'El formato no parece',
      'Prefijo de factura',
      'Aplicar IGTF',
      'Impuesto a pagos',
      'Wallet de cobro',
      'Dirección activa',
      'custodia tus fondos',
      'Cargando configuración',
      'Guardar configuración',
      'Configuración guardada',
      'Guardando',
      'Automática',
    ],
  },
  {
    name: 'SendFundsDialog',
    scope: 'body',
    navigate: async page => {
      await login(page)
      await page.getByRole('button', { name: /enviar \/ retirar fondos|send \/ withdraw funds/i }).click()
    },
    ready: page => page.getByRole('heading', { name: /enviar fondos|send funds/i }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'Enviar fondos',
      'Dirección de destino',
      'Monto (USDC)',
      'Dirección EVM inválida',
      'Monto inválido',
      'Saldo insuficiente',
      'Firma cancelada',
      'Transacción enviada',
      'Esperando firma',
      'Confirmando en red',
      'Enviar USDC',
      'custodia tus claves',
      'Saldo:',
    ],
  },
  {
    name: 'CountrySetupModal',
    scope: 'body',
    // Country option names (SUPPORTED_COUNTRIES data, e.g. "México") are
    // data, exempted through the stored-data exclusion.
    exclude: ['[data-purpose="country-options"]'],
    // Fresh context → the modal is up on first dashboard mount; keep it up
    // by skipping the helper's dismissal.
    navigate: async page => {
      await login(page, { dismissCountryModal: false })
    },
    ready: page =>
      page.getByRole('heading', { name: /dónde operás|where do you operate/i }).waitFor({ timeout: 15_000 }),
    oldPhrases: [
      'dónde operás',
      'Elegí tu país',
      'Continuar',
      'Guardando',
    ],
  },
  // PendingApproval intentionally has NO case here — see the exclusion
  // note in the file header (unreachable from the e2e harness).
]

test.describe('App-shell EN sweep (tasks 7.1/7.3) — locale + no-Spanish views', () => {
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

test.describe('App-shell EN sweep (tasks 7.1/7.3) — English form errors (I18N-R4)', () => {
  test('invalid CatalogView submit shows an English error', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /catálogo|catalog/i }).click()
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

  test('invalid CustomersView submit shows an English error', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /clientes|customers/i }).click()
    await page
      .getByRole('button', { name: /nuevo cliente|agregar primer cliente|new customer|add your first customer/i })
      .first()
      .click()
    await page.getByRole('button', { name: /agregar cliente|add customer/i }).click()
    await expect(page.getByText(/customer name is required/i)).toBeVisible()
  })

  test('invalid SendFundsDialog address shows an English error', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: /enviar \/ retirar fondos|send \/ withdraw funds/i }).click()
    await page.getByPlaceholder('0x…').fill('0x1234')
    await expect(page.getByText(/invalid evm address/i)).toBeVisible()
  })
})
