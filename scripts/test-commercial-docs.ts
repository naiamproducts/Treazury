#!/usr/bin/env bun
/**
 * test-commercial-docs.ts — slice-1 foundation checks (import-export-pivot)
 *
 * Companion to test-modules.ts: same no-framework bun harness. Verifies
 * migration 006 invariants statically (the operator applies the SQL; live DB
 * execution is out of scope for this repo) plus the commercial-docs module
 * skeleton. Part of the slice-1 unit — keep it with the code it proves.
 *
 * Run: bun scripts/test-commercial-docs.ts
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// ── minimal harness (mirrors test-modules.ts) ───────────────────────────────

let passed = 0
let failed = 0

function test(name: string, fn: () => void): void {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}`)
    console.error(`    ${err instanceof Error ? err.message : String(err)}`)
    failed++
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

function assertEqual<T>(a: T, b: T, label: string): void {
  if (a !== b) throw new Error(`${label}: expected ${String(b)}, got ${String(a)}`)
}

// ── artifacts under test ────────────────────────────────────────────────────

let migration = ''
try {
  migration = readFileSync(fileURLToPath(new URL('../docs/migrations/006_commercial_docs.sql', import.meta.url)), 'utf8')
} catch {
  migration = ''
}

// Executable SQL (line comments stripped) so negative guards ignore prose.
const sql = migration.replace(/^\s*--.*$/gm, '')
const sqlNorm = sql.replace(/\s+/g, ' ')
const typesSrc = readFileSync(
  fileURLToPath(new URL('../src/lib/database.types.ts', import.meta.url)),
  'utf8',
)

/** Body of `FUNCTION public.<name>(...)` up to its closing `$$;`. */
function fnBody(name: string): string {
  const start = sql.indexOf(`FUNCTION public.${name}`)
  if (start < 0) return ''
  const end = sql.indexOf('$$;', start)
  return end < 0 ? sql.slice(start) : sql.slice(start, end)
}

// Module imports are dynamic so the SQL checks below still run when the
// module files do not exist yet (RED phase of task 1.4). tsc still enforces
// resolution through the type queries, so `bun run check` fails until GREEN.
type FactoryMod = typeof import('../src/modules/commercial-docs/factory')
type InterfaceMod = typeof import('../src/modules/commercial-docs/interface')
let factoryMod: FactoryMod | null = null
let ifaceMod: InterfaceMod | null = null
try {
  factoryMod = await import('../src/modules/commercial-docs/factory')
  ifaceMod = await import('../src/modules/commercial-docs/interface')
} catch {
  factoryMod = null
  ifaceMod = null
}

function requireModules(): { factory: FactoryMod; iface: InterfaceMod } {
  assert(factoryMod !== null, 'commercial-docs factory module must resolve')
  assert(ifaceMod !== null, 'commercial-docs interface module must resolve')
  return { factory: factoryMod, iface: ifaceMod }
}

// ── Task 1.1: table, enums, constraints, columns, RLS ───────────────────────

console.log('\n── Task 1.1 — commercial_docs schema ──────────')

test('1.1 migration 006 file exists', () => {
  assert(migration.length > 0, 'docs/migrations/006_commercial_docs.sql must exist and be non-empty')
})

test('1.1 enums match design D2 exactly', () => {
  assert(
    sqlNorm.includes("CREATE TYPE commercial_doc_status AS ENUM ('draft', 'released', 'voided')"),
    'commercial_doc_status enum values',
  )
  assert(
    sqlNorm.includes("CREATE TYPE commercial_doc_type AS ENUM ('commercial_invoice', 'packing_list')"),
    'commercial_doc_type enum values',
  )
})

test('1.1 commercial_docs core columns', () => {
  for (const needle of [
    'CREATE TABLE public.commercial_docs',
    'doc_type commercial_doc_type NOT NULL',
    'doc_number integer NOT NULL',
    "status commercial_doc_status NOT NULL DEFAULT 'draft'",
    'lines jsonb NOT NULL',
    'weight_net_kg numeric(12,3)',
    'weight_gross numeric(12,3)',
    'packages_total integer',
    'pdf_path text',
  ]) {
    assert(sqlNorm.includes(needle), `missing: ${needle}`)
  }
})

test('1.1 UNIQUE(tenant_id, doc_number) constraint', () => {
  assert(
    sqlNorm.includes('ADD CONSTRAINT commercial_docs_tenant_number_key UNIQUE (tenant_id, doc_number)'),
    'tenant-scoped doc number uniqueness',
  )
})

test('1.1 partial unique (tenant_id, order_id, doc_type) WHERE status <> voided (mirrors 004)', () => {
  assert(
    sqlNorm.includes(
      'CREATE UNIQUE INDEX commercial_docs_one_active_per_type_uidx ON public.commercial_docs (tenant_id, order_id, doc_type) WHERE status',
    ),
    'partial unique index on (tenant_id, order_id, doc_type)',
  )
  assert(sqlNorm.includes("status <> 'voided'"), 'partial index must exclude voided rows')
})

test('1.1 product customs columns (design D8)', () => {
  for (const needle of [
    'ADD COLUMN IF NOT EXISTS hs_code text',
    'ADD COLUMN IF NOT EXISTS country_of_origin text',
    'ADD COLUMN IF NOT EXISTS weight_net_kg numeric(12,3)',
    'ADD COLUMN IF NOT EXISTS weight_gross numeric(12,3)',
    'ADD COLUMN IF NOT EXISTS packages integer',
  ]) {
    assert(sqlNorm.includes(needle), `missing: ${needle}`)
  }
  assert(
    sqlNorm.includes('ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hs_code text'),
    'product columns must be added to public.products',
  )
})

test('1.1 partner columns on tenant_members + tenants', () => {
  assert(
    sqlNorm.includes('ADD COLUMN IF NOT EXISTS attributed_partner_tenant_id uuid'),
    'tenant_members.attributed_partner_tenant_id',
  )
  assert(sqlNorm.includes('ADD COLUMN IF NOT EXISTS partner_fee_bps integer'), 'tenants.partner_fee_bps')
})

test('1.1 RLS enabled, member_tenant_isolation scope via tenants.owner_id (CD-R7)', () => {
  assert(
    sqlNorm.includes('ALTER TABLE public.commercial_docs ENABLE ROW LEVEL SECURITY'),
    'RLS enabled on commercial_docs',
  )
  assert(
    sqlNorm.includes('tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())'),
    'policies scope through tenants.owner_id = auth.uid()',
  )
})

test('1.1 database.types.ts: commercial_docs table, enums, new columns', () => {
  for (const needle of [
    'commercial_docs: { Row: CommercialDoc',
    'commercial_doc_status: CommercialDocStatus',
    'commercial_doc_type: CommercialDocType',
    'attributed_partner_tenant_id',
    'partner_fee_bps',
    'hs_code',
  ]) {
    assert(typesSrc.includes(needle), `database.types.ts missing: ${needle}`)
  }
})

// ── Task 1.2: next_commercial_doc_number() (CD-R6) ──────────────────────────

console.log('\n── Task 1.2 — commercial doc numbering ────────')

test('1.2 sequence column with DEFAULT 0', () => {
  assert(
    sqlNorm.includes('ADD COLUMN IF NOT EXISTS next_commercial_doc_number integer NOT NULL DEFAULT 0'),
    'tenants.next_commercial_doc_number column',
  )
})

test('1.2 next_commercial_doc_number(): SECURITY DEFINER + auth.uid() tenant + approved gate', () => {
  const body = fnBody('next_commercial_doc_number')
  assert(body.length > 0, 'function public.next_commercial_doc_number() must exist')
  assert(body.includes('SECURITY DEFINER'), 'SECURITY DEFINER')
  assert(body.includes('SET search_path'), 'hardened search_path')
  assert(body.includes('auth.uid()'), 'tenant derived from auth.uid()')
  assert(body.includes('is_approved'), 'approved-tenant gate (mirror 002)')
})

test('1.2 REVOKE PUBLIC + GRANT authenticated (mirror 002)', () => {
  assert(
    sql.includes('REVOKE ALL ON FUNCTION public.next_commercial_doc_number() FROM PUBLIC'),
    'REVOKE PUBLIC',
  )
  assert(
    sql.includes('GRANT EXECUTE ON FUNCTION public.next_commercial_doc_number() TO authenticated'),
    'GRANT authenticated',
  )
})

test('1.2 fiscal sequence untouched: no next_invoice_number reference in SQL (CD-R6)', () => {
  assert(
    !sql.includes('next_invoice_number'),
    '006 must never reference next_invoice_number (fiscal sequence isolation)',
  )
})

test('1.2 database.types.ts registers the RPC', () => {
  assert(
    typesSrc.includes('next_commercial_doc_number: { Args: Record<string, never>; Returns: number }'),
    'next_commercial_doc_number function type',
  )
})

// ── Task 1.3: partner RPCs (PA-R1..R3, no RLS relaxation) ───────────────────

console.log('\n── Task 1.3 — partner attribution RPCs ────────')

test('1.3 attribute_signup(): SECURITY DEFINER, partner != own tenant, approved, once-only', () => {
  const body = fnBody('attribute_signup')
  assert(body.length > 0, 'function public.attribute_signup(p_partner uuid) must exist')
  assert(body.includes('SECURITY DEFINER'), 'SECURITY DEFINER')
  assert(body.includes('p_partner = v_own_tenant'), 'partner must differ from own tenant')
  assert(body.includes('is_approved'), 'partner must be approved')
  assert(body.includes('attributed_partner_tenant_id IS NULL'), 'once-only: never overwrite existing attribution')
})

test('1.3 partner_panel_stats(): SECURITY DEFINER, aggregates with zero defaults', () => {
  const body = fnBody('partner_panel_stats')
  assert(body.length > 0, 'function public.partner_panel_stats() must exist')
  assert(body.includes('RETURNS TABLE'), 'tabular stats result')
  assert(body.includes('SECURITY DEFINER'), 'SECURITY DEFINER')
  assert(body.includes('COALESCE(sum(p.amount), 0)'), 'settled volume defaults to zero (PA-R3S2)')
})

test('1.3 RPCs locked down: REVOKE PUBLIC + GRANT authenticated', () => {
  for (const fn of ['attribute_signup', 'partner_panel_stats']) {
    assert(sql.includes(`REVOKE ALL ON FUNCTION public.${fn}`), `REVOKE PUBLIC on ${fn}`)
    assert(
      sql.includes(`GRANT EXECUTE ON FUNCTION public.${fn}(`) || sql.includes(`GRANT EXECUTE ON FUNCTION public.${fn}()`),
      `GRANT authenticated on ${fn}`,
    )
  }
})

test('1.3 no RLS relaxation anywhere in the migration', () => {
  assert(!sql.includes('DROP POLICY'), 'must not drop existing policies')
  assert(!sql.includes('DISABLE ROW LEVEL SECURITY'), 'must not disable RLS')
})

test('1.3 no fund-passthrough / custody structures (PA-R5 static guard)', () => {
  assert(!/wallet|custody|passthrough/i.test(sql), 'migration must not introduce wallet/custody structures')
})

test('1.3 database.types.ts registers both RPCs', () => {
  assert(typesSrc.includes('attribute_signup:'), 'attribute_signup function type')
  assert(typesSrc.includes('partner_panel_stats:'), 'partner_panel_stats function type')
})

// ── Task 1.4: module skeleton (interface, factory, csv, renderer stubs) ─────

console.log('\n── Task 1.4 — commercial-docs module ──────────')

test('1.4 factory + interface modules resolve', () => {
  requireModules()
})

test('1.4 disclaimer constant is the exact CD-R5 spec text', () => {
  const { iface } = requireModules()
  assertEqual(
    iface.COMMERCIAL_DOC_DISCLAIMER,
    'Commercial document. Not a customs declaration or transport document. Customs clearance requires a licensed broker.',
    'COMMERCIAL_DOC_DISCLAIMER',
  )
})

test('1.4 factory registers both built-in doc-type renderers', () => {
  const { factory } = requireModules()
  const registered = factory.commercialDocFactory.list().map((r) => r.docType).sort()
  assertEqual(registered.join(','), 'commercial_invoice,packing_list', 'registered doc types')
})

test('1.4 renderHTML dispatches by doc.docType — commercial_invoice', () => {
  const { factory } = requireModules()
  factory.commercialDocFactory.register('commercial_invoice', {
    docType: 'commercial_invoice',
    renderHTML: (d) => `mock:${d.number}`,
  })
  assertEqual(factory.commercialDocFactory.renderHTML(makeDoc({ number: 'CD-00007' })), 'mock:CD-00007', 'invoice dispatch')
})

test('1.4 renderHTML dispatches by doc.docType — packing_list', () => {
  const { factory } = requireModules()
  factory.commercialDocFactory.register('packing_list', {
    docType: 'packing_list',
    renderHTML: (d) => `mock-pl:${d.docType}`,
  })
  assertEqual(
    factory.commercialDocFactory.renderHTML(makeDoc({ docType: 'packing_list' })),
    'mock-pl:packing_list',
    'packing list dispatch',
  )
})

test('1.4 CSV: header + one row per line item + quoted fields + disclaimer row (CD-R4/R5)', () => {
  const { factory } = requireModules()
  const doc = makeDoc({
    lines: [
      { description: 'Wire harness, 12V', quantity: 10, unitPrice: '4.50', subtotal: '45.00' },
      { description: 'Hub "X" bracket', quantity: 2, unitPrice: '5.25', subtotal: '10.50', hsCode: '8536.90', origin: 'VE' },
    ],
    totals: { subtotal: '55.50' },
  })
  const rows = factory.commercialDocFactory.toCSV(doc).split('\n')
  assertEqual(rows.length, 4, 'header + 2 item rows + disclaimer row')
  assert(rows[0].startsWith('doc_number,doc_type,line,description'), 'header shape')
  assert(rows[1].includes('"Wire harness, 12V"'), 'comma field must be quoted')
  assert(rows[2].includes('"Hub ""X"" bracket"'), 'quotes must be doubled')
  assertEqual(rows[3], `"${DISCLAIMER_TEXT()}"`, 'disclaimer row')
})

test('1.4 generate(): draft doc with computed totals, disclaimer, uuid', () => {
  const { factory } = requireModules()
  const doc = factory.commercialDocFactory.generate('commercial_invoice', {
    tenantId: 't-1',
    orderId: 'o-1',
    number: 'CD-00042',
    currency: 'USD',
    seller: { name: 'ACME SL' },
    buyer: { name: 'Globex LLC' },
    incoterm: 'FOB',
    lines: [
      { description: 'A', quantity: 1, unitPrice: '45.00', subtotal: '45.00', weightNetKg: '12.350', weightGrossKg: '13.000', packages: 3 },
      { description: 'B', quantity: 2, unitPrice: '5.25', subtotal: '10.50', weightNetKg: '0.650', weightGrossKg: '1.000', packages: 5 },
    ],
  })
  assertEqual(doc.status, 'draft', 'status')
  assertEqual(doc.number, 'CD-00042', 'number passthrough')
  assertEqual(doc.disclaimer, DISCLAIMER_TEXT(), 'disclaimer set by generate')
  assertEqual(doc.totals.subtotal, '55.50', 'subtotal sum')
  assertEqual(doc.totals.weightNetKg, '13.000', 'weight_net_kg sum (3dp)')
  assertEqual(doc.totals.weightGrossKg, '14.000', 'weight_gross sum (3dp)')
  assertEqual(doc.totals.packagesTotal, 8, 'packages sum')
  assertEqual(doc.incoterm, 'FOB', 'incoterm header')
  assert(doc.id.length > 0, 'client-generated id')
})

test('1.4 generate(): safe decimal sums + optional totals stay absent (edge)', () => {
  const { factory } = requireModules()
  const doc = factory.commercialDocFactory.generate('packing_list', {
    tenantId: 't-1',
    orderId: 'o-1',
    number: 'CD-00043',
    currency: 'USD',
    seller: { name: 'S' },
    buyer: { name: 'B' },
    lines: [
      { description: 'C', quantity: 1, unitPrice: '0.10', subtotal: '0.10' },
      { description: 'D', quantity: 1, unitPrice: '0.20', subtotal: '0.20' },
    ],
  })
  assertEqual(doc.totals.subtotal, '0.30', '0.10 + 0.20 must be 0.30, not float drift')
  assertEqual(doc.totals.weightNetKg, undefined, 'no weight total when lines carry none')
  assertEqual(doc.totals.packagesTotal, undefined, 'no packages total when lines carry none')
  assertEqual(doc.docType, 'packing_list', 'docType passthrough')
})

// ── helpers ─────────────────────────────────────────────────────────────────

type Doc = import('../src/modules/commercial-docs/interface').CommercialDoc

function DISCLAIMER_TEXT(): string {
  const { iface } = requireModules()
  return iface.COMMERCIAL_DOC_DISCLAIMER
}

function makeDoc(overrides: Partial<Doc> = {}): Doc {
  return {
    id: 'doc-1',
    tenantId: 't-1',
    orderId: 'o-1',
    docType: 'commercial_invoice',
    number: 'CD-00001',
    status: 'draft',
    currency: 'USD',
    seller: { name: 'ACME SL' },
    buyer: { name: 'Globex LLC' },
    lines: [],
    totals: { subtotal: '0.00' },
    disclaimer: DISCLAIMER_TEXT(),
    ...overrides,
  }
}

// ── summary ─────────────────────────────────────────────────────────────────

setTimeout(() => {
  console.log('\n─────────────────────────────────────────────')
  console.log(`  ${passed} passed · ${failed} failed`)
  if (failed > 0) process.exit(1)
}, 200)
