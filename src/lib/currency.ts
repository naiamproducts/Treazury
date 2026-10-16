/**
 * Currency module — local currency defaults per country + live FX rates.
 *
 * Country → currency mapping drives:
 *  - Default display currency in order forms
 *  - Currency symbol and number formatting
 *  - Which FX source to query for USD conversion
 *
 * FX sources (all free, no API key):
 *  - VE: dolarapi.com (parallel rate — what merchants actually charge)
 *  - AR: dolarapi.com (blue rate — what merchants actually charge)
 *  - Others: open.er-api.com (official mid-market rates)
 *
 * USDC ≈ 1 USD, so USD→local rate is sufficient for USDC conversion.
 */

export type LocalCurrency = 'USD' | 'VES' | 'ARS' | 'MXN' | 'COP' | 'CLP'

export interface CurrencyInfo {
  code: LocalCurrency
  symbol: string
  /** Symbol placement: 'before' ($100) or 'after' (100€) */
  symbolSide: 'before' | 'after'
  /** Decimal places for display */
  decimals: number
  /** Thousand separator character */
  thousandSep: string
  /** Decimal separator character */
  decimalSep: string
}

export const CURRENCIES: Record<LocalCurrency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$',    symbolSide: 'before', decimals: 2, thousandSep: ',', decimalSep: '.' },
  VES: { code: 'VES', symbol: 'Bs.',  symbolSide: 'before', decimals: 2, thousandSep: '.', decimalSep: ',' },
  ARS: { code: 'ARS', symbol: '$',    symbolSide: 'before', decimals: 0, thousandSep: '.', decimalSep: ',' },
  MXN: { code: 'MXN', symbol: '$',    symbolSide: 'before', decimals: 2, thousandSep: ',', decimalSep: '.' },
  COP: { code: 'COP', symbol: '$',    symbolSide: 'before', decimals: 0, thousandSep: '.', decimalSep: ',' },
  CLP: { code: 'CLP', symbol: '$',    symbolSide: 'before', decimals: 0, thousandSep: '.', decimalSep: ',' },
}

/** Country code → default local currency. */
export const COUNTRY_CURRENCY: Record<string, LocalCurrency> = {
  VE: 'VES',
  AR: 'ARS',
  MX: 'MXN',
  CO: 'COP',
  CL: 'CLP',
}

/** Supported countries with display names for the selector. */
export const SUPPORTED_COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: 'VE', name: 'Venezuela',      flag: '🇻🇪' },
  { code: 'AR', name: 'Argentina',      flag: '🇦🇷' },
  { code: 'MX', name: 'México',         flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia',       flag: '🇨🇴' },
  { code: 'CL', name: 'Chile',          flag: '🇨🇱' },
]

/**
 * Per-country contact examples so placeholders never leak another country's
 * data (no +58/Caracas for an AR account). Used by order forms, settings,
 * and anywhere a phone/address example is shown.
 */
export interface CountryMeta {
  /** International dial prefix, e.g. '+54'. */
  dialCode: string
  /** Example mobile number in local format, e.g. '11 1234 5678'. */
  phoneExample: string
  /** Example city for address placeholders, e.g. 'Buenos Aires'. */
  cityExample: string
  /** Example bank name, e.g. 'BBVA México' or 'Banco de la Nación Argentina'. */
  bankExample: string
  /** Field label for transfer alias / key / mobile payment, e.g. 'Beneficiario / Celular (SPEI)'. */
  aliasLabel: string
  /** Example value for transfer alias, e.g. 'Mi Negocio SA' or 'MI.NEGOCIO.MP'. */
  aliasExample: string
  /** Field label for bank account, e.g. 'CLABE Interbancaria (18 dígitos)'. */
  accountLabel: string
  /** Example value for bank account, e.g. '012180000000000000'. */
  accountExample: string
}

export const COUNTRY_META: Record<string, CountryMeta> = {
  VE: {
    dialCode: '+58',
    phoneExample: '412 000 0000',
    cityExample: 'Caracas',
    bankExample: 'Banesco',
    aliasLabel: 'Pago Móvil (Teléfono · C.I.)',
    aliasExample: '0412 0000000 · V-12345678',
    accountLabel: 'Nº de Cuenta (20 dígitos)',
    accountExample: '0134 0000 00 0000000000',
  },
  AR: {
    dialCode: '+54',
    phoneExample: '11 1234 5678',
    cityExample: 'Buenos Aires',
    bankExample: 'Banco de la Nación Argentina',
    aliasLabel: 'Alias CBU / CVU',
    aliasExample: 'MI.NEGOCIO.MP',
    accountLabel: 'CBU / CVU',
    accountExample: '0000003100000000000000',
  },
  MX: {
    dialCode: '+52',
    phoneExample: '55 1234 5678',
    cityExample: 'Ciudad de México',
    bankExample: 'BBVA México',
    aliasLabel: 'Beneficiario / Celular (SPEI)',
    aliasExample: 'Mi Negocio SA',
    accountLabel: 'CLABE Interbancaria (18 dígitos)',
    accountExample: '012180000000000000',
  },
  CO: {
    dialCode: '+57',
    phoneExample: '300 123 4567',
    cityExample: 'Bogotá',
    bankExample: 'Bancolombia',
    aliasLabel: 'Nequi / Daviplata / Celular',
    aliasExample: '300 123 4567',
    accountLabel: 'Nº de Cuenta (Ahorros / Corriente)',
    accountExample: '123-456789-01',
  },
  CL: {
    dialCode: '+56',
    phoneExample: '9 1234 5678',
    cityExample: 'Santiago',
    bankExample: 'Banco Estado',
    aliasLabel: 'RUT del titular',
    aliasExample: '12.345.678-9',
    accountLabel: 'Cuenta RUT / Corriente',
    accountExample: '12345678',
  },
}

/** Get contact examples for a country code. Falls back to VE (first market). */
export function countryMeta(country: string): CountryMeta {
  return COUNTRY_META[country.toUpperCase()] ?? COUNTRY_META.VE
}

/** Get the default local currency for a country code. */
export function currencyForCountry(country: string): LocalCurrency {
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? 'USD'
}

/** Bank account field label when rendered on the payment link. */
export function accountLabelForCurrency(currency: LocalCurrency | null, accountValue?: string): string {
  if (currency === 'MXN') return 'CLABE'
  if (currency === 'ARS') return 'CBU / CVU'
  if (currency === 'VES') return 'Cuenta / Pago Móvil'
  if (currency === 'CLP') return 'Cuenta'
  if (currency === 'COP') return 'Nº de Cuenta'
  if (accountValue) {
    if (/cbu/i.test(accountValue)) return 'CBU'
    if (accountValue.replace(/\D/g, '').length === 18) return 'CLABE'
    if (accountValue.replace(/\D/g, '').length === 22) return 'CBU'
    if (accountValue.replace(/\D/g, '').length === 20) return 'Cuenta Bancaria'
  }
  return 'Cuenta'
}

// ── Merchant pricing preference ─────────────────────────────────────────────
// The merchant picks ONE entry currency for prices (auto = follow their
// country). Stored per tenant in localStorage — same no-schema-change
// pattern as the last-used customer: works offline, zero RLS risk. If
// multi-device sync is ever needed, move this to tenants.pricing_currency.
export type PricingPref = 'auto' | 'usd' | 'local'

const PRICING_KEY_PREFIX = 'paystyle:pricing-currency:'

export function readPricingPref(tenantId: string): PricingPref {
  try {
    const v = window.localStorage.getItem(PRICING_KEY_PREFIX + tenantId)
    return v === 'usd' || v === 'local' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

export function writePricingPref(tenantId: string, pref: PricingPref): void {
  try {
    window.localStorage.setItem(PRICING_KEY_PREFIX + tenantId, pref)
  } catch {
    // Sin almacenamiento local la preferencia no persiste; los forms igual abren.
  }
}

/** Resolve the entry mode ('usd' | 'local') a price form should open in. */
export function resolveEntryCurrency(pref: PricingPref, country: string): 'usd' | 'local' {
  if (pref === 'usd') return 'usd'
  if (pref === 'local') return 'local'
  return currencyForCountry(country) === 'USD' ? 'usd' : 'local'
}

// ── Merchant bank details (for payment links) ───────────────────────────────
// Alias / bank / account the buyer can transfer to. Stored per tenant in
// localStorage — same no-schema-change pattern as the pricing preference.
// They travel inside each payment link (?balias=&bname=&bacct=), so the
// buyer sees them on any device even though the merchant typed them once
// on theirs. Empty = the transfer option stays hidden from links.
export interface BankDetails {
  bankName: string
  alias: string
  account: string
}

const BANK_KEY_PREFIX = 'paystyle:bank:'

export function readBankDetails(tenantId: string): BankDetails {
  try {
    const raw = window.localStorage.getItem(BANK_KEY_PREFIX + tenantId)
    if (!raw) return { bankName: '', alias: '', account: '' }
    const data = JSON.parse(raw) as Partial<BankDetails>
    return {
      bankName: typeof data.bankName === 'string' ? data.bankName : '',
      alias: typeof data.alias === 'string' ? data.alias : '',
      account: typeof data.account === 'string' ? data.account : '',
    }
  } catch {
    return { bankName: '', alias: '', account: '' }
  }
}

export function writeBankDetails(tenantId: string, details: BankDetails): void {
  try {
    window.localStorage.setItem(BANK_KEY_PREFIX + tenantId, JSON.stringify(details))
  } catch {
    // Sin almacenamiento local los datos no persisten; el link igual se genera.
  }
}

/** True when at least an alias or account exists — enough to offer transfer. */
export function hasBankDetails(details: BankDetails): boolean {
  return details.alias.trim() !== '' || details.account.trim() !== ''
}

/** Get currency info (symbol, decimals, etc.) for a currency code. */
export function currencyInfo(code: string): CurrencyInfo {
  return CURRENCIES[code as LocalCurrency] ?? CURRENCIES.USD
}

// ── FX rate fetching ──────────────────────────────────────────────────────

export interface FxRate {
  /** How many local currency units per 1 USD. */
  usdToLocal: number
  /** Source label for display/debug. */
  source: string
  /** When the rate was fetched. */
  fetchedAt: string
}

/** In-memory cache: currency code → { rate, expiresAt }. */
const rateCache = new Map<string, { rate: FxRate; expiresAt: number }>()
const RATE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch the current USD → local currency rate.
 * Each source runs in its own try/catch: a DNS failure on dolarapi must NOT
 * skip the er-api fallback (that bug left the currency toggle stuck on
 * "cargando tasa…" forever). Returns null only when every source fails
 * (caller falls back to manual entry or USD).
 */
export async function fetchUsdRate(currency: LocalCurrency): Promise<FxRate | null> {
  if (currency === 'USD') {
    return { usdToLocal: 1, source: 'fixed', fetchedAt: new Date().toISOString() }
  }

  // Check cache
  const cached = rateCache.get(currency)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.rate
  }

  let rate: FxRate | null = null

  if (currency === 'VES') {
    const r = await fetchDolarApiVe().catch(() => null)
    if (r) rate = { usdToLocal: r, source: 'dolarapi (paralelo)', fetchedAt: new Date().toISOString() }
  } else if (currency === 'ARS') {
    const r = await fetchDolarApiAr().catch(() => null)
    if (r) rate = { usdToLocal: r, source: 'dolarapi (blue)', fetchedAt: new Date().toISOString() }
  }

  // Fallback: open.er-api.com (free, no key, covers MXN/COP/CLP and others)
  if (!rate) {
    const r = await fetchErApi(currency).catch(() => null)
    if (r) rate = { usdToLocal: r, source: 'er-api', fetchedAt: new Date().toISOString() }
  }

  if (rate) {
    rateCache.set(currency, { rate, expiresAt: Date.now() + RATE_TTL_MS })
  }
  return rate
}

/** Argentina blue rate (venta). Host api.dolarapi.com is dead (NXDOMAIN) — use dolarapi.com. */
async function fetchDolarApiAr(): Promise<number | null> {
  const res = await fetch('https://dolarapi.com/v1/dolares/blue', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json() as { venta?: unknown; compra?: unknown; price?: unknown }
  const r = data.venta ?? data.compra ?? data.price
  return typeof r === 'number' && r > 0 ? r : null
}

/** Venezuela parallel rate (promedio of fuente=paralelo). */
async function fetchDolarApiVe(): Promise<number | null> {
  const res = await fetch('https://ve.dolarapi.com/v1/dolares', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json() as
    | { fuente?: unknown; promedio?: unknown; venta?: unknown }[]
    | { rate?: unknown; price?: unknown }
  if (Array.isArray(data)) {
    const paralelo = data.find(d => d.fuente === 'paralelo') ?? data[0]
    const r = paralelo?.promedio ?? paralelo?.venta
    return typeof r === 'number' && r > 0 ? r : null
  }
  const r = data.rate ?? data.price
  return typeof r === 'number' && r > 0 ? r : null
}

/** Official mid-market rates, covers every supported currency. */
async function fetchErApi(currency: LocalCurrency): Promise<number | null> {
  // NOTE: path version is v6 — /v1/latest/USD returns 404.
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json() as { rates?: Record<string, unknown> }
  const r = data.rates?.[currency]
  return typeof r === 'number' && r > 0 ? r : null
}

/** Convert a local-currency amount to USDC (≈ USD). */
export function localToUsdc(localAmount: number, rate: number): number {
  if (rate <= 0) return 0
  return localAmount / rate
}

/** Convert a USDC amount to local currency. */
export function usdcToLocal(usdcAmount: number, rate: number): number {
  return usdcAmount * rate
}

/** Format a number in local currency style. */
export function formatLocal(amount: number, currency: LocalCurrency): string {
  const info = CURRENCIES[currency]
  const fixed = amount.toFixed(info.decimals)
  const [intPart, decPart] = fixed.split('.')

  // Add thousand separators
  const withSeps = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, info.thousandSep)

  const num = decPart ? `${withSeps}${info.decimalSep}${decPart}` : withSeps
  return info.symbolSide === 'before'
    ? `${info.symbol} ${num}`
    : `${num} ${info.symbol}`
}
