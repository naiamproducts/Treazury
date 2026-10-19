/**
 * PayStyle — store errors.
 *
 * Every mutation rejects with a StoreError instead of returning a silently
 * ignored failure: RLS rejects writes from a non-approved tenant with
 * 42501, and swallowing that would leave the UI claiming a save that never
 * happened.
 */

import type { PostgrestError } from '@supabase/supabase-js'

export type StoreErrorCode =
  /** 42501 — RLS / column grant refused the statement. */
  | 'rls_denied'
  /** PGRST116 — the .single() matched no row (or more than one). */
  | 'not_found'
  /** 23505 — unique violation (order_number, active charge per order, …). */
  | 'unique_violation'
  /** 23503 / 23514 — foreign key or CHECK violation. */
  | 'conflict'
  /** Not enough stock, or a CAS that lost three times in a row. */
  | 'insufficient_stock'
  /** Transport failure: offline, DNS, connection reset. */
  | 'network'
  /** The requested operation is not wired up yet — never silent. */
  | 'unsupported'
  | 'unknown'

const MESSAGES: Record<StoreErrorCode, string> = {
  rls_denied: 'Permission denied: your tenant is not yet approved to write to this table.',
  not_found: 'This record no longer exists.',
  unique_violation: 'That value is already in use.',
  conflict: 'The database rejected the change.',
  insufficient_stock: 'Not enough stock.',
  network: 'Could not reach the server.',
  unsupported: 'Operation not supported yet.',
  unknown: 'Unexpected error.',
}

export class StoreError extends Error {
  readonly code: StoreErrorCode
  /** Raw PostgREST error, kept for the console / bug reports. */
  readonly detail?: PostgrestError

  constructor(code: StoreErrorCode, message?: string, detail?: PostgrestError) {
    super(message ? `${MESSAGES[code]} ${message}` : MESSAGES[code])
    this.name = 'StoreError'
    this.code = code
    this.detail = detail
  }
}

/** Narrow anything thrown by a mutation into a StoreError the UI can show. */
export function asStoreError(thrown: unknown): StoreError {
  if (thrown instanceof StoreError) return thrown
  const message = thrown instanceof Error ? thrown.message : String(thrown)
  return new StoreError('unknown', message)
}

/**
 * Translate a PostgREST/Postgres error into a StoreError. `context` names the
 * table or operation so the message points somewhere useful.
 *
 * A PostgREST error with an empty code is a transport failure (the request
 * never reached the database), not a rejected statement.
 */
export function toStoreError(error: PostgrestError, context: string): StoreError {
  const code = error.code ?? ''
  if (code === '42501') return new StoreError('rls_denied', `(${context}) ${error.message}`, error)
  if (code === 'PGRST116') return new StoreError('not_found', `(${context})`, error)
  if (code === '23505') return new StoreError('unique_violation', `(${context}) ${error.message}`, error)
  if (code === '23503') return new StoreError('conflict', `(${context}) ${error.message}`, error)
  if (code === '23514') return new StoreError('conflict', `(${context}) ${error.message}`, error)
  if (code === '') return new StoreError('network', `(${context}) ${error.message}`, error)
  return new StoreError('unknown', `(${context}) [${code}] ${error.message}`, error)
}

/** True when a mutation failed because two writers raced on the same row. */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof StoreError && error.code === 'unique_violation'
}