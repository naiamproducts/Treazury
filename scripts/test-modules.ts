#!/usr/bin/env bun
/**
 * test-modules.ts — Local module test runner
 *
 * Runs entirely with Bun. No test framework needed: uses a minimal
 * assert utility, awaits every test before printing the summary, and
 * exits non-zero if any test failed.
 *
 * Run from /home/user/app/:
 *   bun scripts/test-modules.ts
 *
 * NOTE: This imports modules via relative paths, NOT @/ aliases,
 * because Bun resolves @/ only when vite or tsconfig paths are configured
 * for the runtime. In a real project: add "paths" to tsconfig.json or
 * use --tsconfig-override. For simplicity this script uses relative imports.
 */

import { USDCArcProvider } from '../src/modules/payments/providers/usdc-arc'
import { paymentFactory } from '../src/modules/payments/factory'
import { VenezuelaInvoiceEngine } from '../src/modules/invoicing/engines/venezuela'
import { invoiceFactory } from '../src/modules/invoicing/factory'
import type { Order, Tenant } from '../src/modules/shared/types'

// ─────────────────────────────────────────────
// Minimal test harness
// ─────────────────────────────────────────────

let passed = 0
let failed = 0

// Every test promise is collected here so the summary can await ALL tests
// before it runs — a test that rejects after the summary would otherwise be
// invisible to the pass/fail counters and to the exit code.
const pending: Promise<void>[] = []

function test(name: string, fn: () => void | Promise<void>): void {
  pending.push(
    Promise.resolve()
      .then(() => fn())
      .then(() => {
        console.log(`  ✓ ${name}`)
        passed++
      })
      .catch((err: unknown) => {
        console.error(`  ✗ ${name}`)
        console.error(`    ${err instanceof Error ? err.message : String(err)}`)
        failed++
      }),
  )
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertEqual<T>(a: T, b: T, label: string): void {
  if (a !== b) throw new Error(`${label}: expected ${String(b)}, got ${String(a)}`)
}

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const MERCHANT_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const BASE_URL = 'https://pay.example.com'

const sampleOrder: Order = {
  id: 'order-001',
  tenantId: 'tenant-abc',
  contactRef: '+58 412 555 0001',
  lines: [
    {
      productId: 'prod-tyre-195',
      productName: 'Caucho 195/65 R15 Bridgestone',
      unitPrice: '45.00',
      quantity: 4,
      subtotal: '180.00',
    },
    {
      productId: 'prod-tyre-205',
      productName: 'Caucho 205/55 R16 Michelin',
      unitPrice: '62.00',
      quantity: 2,
      subtotal: '124.00',
    },
  ],
  subtotal: '304.00',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const sampleTenant: Tenant = {
  id: 'tenant-abc',
  name: 'Cauchera Venezolana C.A.',
  walletAddress: MERCHANT_ADDRESS,
  country: 'VE',
  isApproved: true,
  createdAt: new Date().toISOString(),
}

// ─────────────────────────────────────────────
// Payment module tests
// ─────────────────────────────────────────────

console.log('\n── Payments ──────────────────────────────────')

test('USDCArcProvider registers and is available', () => {
  const provider = new USDCArcProvider({ paymentPageBaseUrl: BASE_URL })
  paymentFactory.register(provider)
  assert(paymentFactory.list().length > 0, 'Factory should have providers')
  assert(provider.isAvailable, 'Provider should be available')
})

test('USDCArcProvider creates a valid charge', async () => {
  const charge = await paymentFactory.createCharge('usdc_arc', {
    amount: '304.00',
    currency: 'USDC',
    description: 'Pedido #001 — Cauchera Venezolana',
    recipientRef: MERCHANT_ADDRESS,
    order: sampleOrder,
  })

  assert(charge.id.length > 0, 'Charge should have an id')
  assertEqual(charge.providerKey, 'usdc_arc', 'providerKey')
  assertEqual(charge.amount, '304.00', 'amount')
  assertEqual(charge.currency, 'USDC', 'currency')
  assertEqual(charge.status, 'pending', 'status should be pending')
  // Predict path (no owner key): the charge must resolve to the OrderVault.
  // A ?to= fallback means vault prediction failed (e.g. Arc RPC degraded) —
  // that is a real failure, not a pass.
  assert(charge.paymentUrl.includes('vault='), 'paymentUrl should contain vault=')
  assert(charge.paymentUrl.includes('amount=304.00'), 'paymentUrl should contain amount')
  assert(charge.paymentUrl.includes('chargeId='), 'paymentUrl should contain chargeId')
  assert(charge.metadata.chainId === '5042002', 'should default to Arc Testnet')
})

test('USDCArcProvider rejects unsupported currency', async () => {
  let threw = false
  try {
    await paymentFactory.createCharge('usdc_arc', {
      amount: '10.00',
      currency: 'EUR',
      description: 'Test',
      recipientRef: MERCHANT_ADDRESS,
    })
  } catch {
    threw = true
  }
  assert(threw, 'Should throw for unsupported currency')
})

test('Unregistered provider throws descriptive error', () => {
  let threw = false
  try {
    paymentFactory.get('santander_pay')
  } catch (e) {
    threw = true
    assert(
      e instanceof Error && e.message.includes('santander_pay'),
      'Error should mention the missing provider key',
    )
  }
  assert(threw, 'Should throw for unregistered provider')
})

// ─────────────────────────────────────────────
// Invoice module tests
// ─────────────────────────────────────────────

console.log('\n── Invoicing — Venezuela ─────────────────────')

test('VenezuelaInvoiceEngine registers', () => {
  const engine = new VenezuelaInvoiceEngine()
  invoiceFactory.register(engine)
  assert(Boolean(invoiceFactory.get('VE')), 'Engine should be registered')
})

test('Generates invoice with IVA only for local currency', () => {
  const doc = invoiceFactory.generate('VE', {
    order: sampleOrder,
    tenant: sampleTenant,
    buyer: { name: 'Distribuidora El Volante S.A.', taxId: 'J-30000001-2' },
    currency: 'VES',
    isForexPayment: false,
  })

  assert(doc.taxLines.length === 1, 'Should have only IVA for local currency payment')
  assertEqual(doc.taxLines[0].key, 'IVA', 'First tax should be IVA')
  assertEqual(doc.taxLines[0].ratePct, 16, 'IVA rate should be 16%')
  // subtotal 304.00 × 16% = 48.64 → total = 352.64
  assertEqual(doc.subtotal, '304.00', 'subtotal')
  assertEqual(doc.taxLines[0].amount, '48.64', 'IVA amount')
  assertEqual(doc.total, '352.64', 'total with IVA only')
})

test('Generates invoice with IVA + IGTF for USDC payment', () => {
  const doc = invoiceFactory.generate('VE', {
    order: sampleOrder,
    tenant: sampleTenant,
    buyer: { name: 'Ruedas & Más C.A.', taxId: 'J-40000002-3' },
    currency: 'USDC',
    isForexPayment: true,
  })

  assert(doc.taxLines.length === 2, 'Should have IVA + IGTF for USDC payment')
  const iva = doc.taxLines.find((t) => t.key === 'IVA')
  const igtf = doc.taxLines.find((t) => t.key === 'IGTF')
  assert(Boolean(iva), 'Should have IVA')
  assert(Boolean(igtf), 'Should have IGTF')
  // IGTF base = subtotal + IVA = 304.00 + 48.64 = 352.64
  // IGTF = 352.64 × 3% = 10.58 (rounded)
  assertEqual(igtf!.amount, '10.58', 'IGTF amount')
  // total = 304.00 + 48.64 + 10.58 = 363.22
  assertEqual(doc.total, '363.22', 'total with IVA + IGTF')
})

test('Validation passes with complete data', () => {
  const doc = invoiceFactory.generate('VE', {
    order: sampleOrder,
    tenant: { ...sampleTenant },
    buyer: { name: 'Cliente Completo S.A.', taxId: 'J-12345678-9' },
    currency: 'USDC',
    isForexPayment: true,
  })
  // Inject issuer RIF (normally from tenant profile)
  doc.issuer.taxId = 'J-30000000-1'

  const result = invoiceFactory.get('VE').validate(doc)
  assert(result.valid, `Should be valid. Errors: ${result.errors.map((e) => e.message).join(', ')}`)
})

test('Validation fails without issuer RIF', () => {
  const doc = invoiceFactory.generate('VE', {
    order: sampleOrder,
    tenant: sampleTenant,
    buyer: { name: 'Sin RIF' },
    currency: 'USDC',
    isForexPayment: true,
  })
  // issuer.taxId is empty by default in the engine (must come from tenant profile)

  const result = invoiceFactory.get('VE').validate(doc)
  assert(!result.valid, 'Should be invalid without issuer RIF')
  assert(result.errors.some((e) => e.field === 'issuer.taxId'), 'Error should reference issuer.taxId')
})

test('Renders HTML PDF (base64 roundtrip)', async () => {
  const engine = new VenezuelaInvoiceEngine()
  const doc = invoiceFactory.generate('VE', {
    order: sampleOrder,
    tenant: sampleTenant,
    buyer: { name: 'Test Buyer', taxId: 'J-99999999-9' },
    currency: 'USDC',
    isForexPayment: true,
  })
  doc.issuer.taxId = 'J-00000001-1'

  const b64 = await engine.renderPDF(doc)
  assert(b64.length > 100, 'Base64 output should not be empty')

  const decoded = decodeURIComponent(escape(atob(b64)))
  assert(decoded.includes('IGTF'), 'PDF should mention IGTF for forex payment')
  assert(decoded.includes(sampleTenant.name), 'PDF should contain tenant name')
  assert(decoded.includes('304'), 'PDF should contain subtotal')
})

// ─────────────────────────────────────────────
// Summary (only after every test has settled)
// ─────────────────────────────────────────────

// Watchdog: a test that never settles must fail loudly instead of hanging
// the script forever with no summary at all.
const WATCHDOG_MS = 120_000
let watchdogTimer: ReturnType<typeof setTimeout> | undefined
const watchdog = new Promise<boolean>((resolve) => {
  watchdogTimer = setTimeout(() => resolve(false), WATCHDOG_MS)
})
const allSettled = Promise.allSettled(pending).then(() => true)
const settled = await Promise.race([allSettled, watchdog])
clearTimeout(watchdogTimer)
if (!settled) {
  console.error(`\n  ✗ watchdog: tests did not settle within ${WATCHDOG_MS}ms`)
  failed++
}

console.log(`\n─────────────────────────────────────────────`)
console.log(`  ${passed} passed · ${failed} failed`)
if (failed > 0) process.exit(1)
