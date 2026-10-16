/**
 * PayStyle SDK — Circle Developer-Controlled Wallet helpers (LEGACY path).
 *
 * New tenants must NEVER touch this module or the `circle-wallet` Edge
 * Function behind it: tenant creation and onboarding resolve the payout
 * address exclusively through Privy embedded wallets (or a
 * merchant-supplied BYOW address). This module stays ONLY so tenants
 * created under the legacy Circle flow keep resolving their payout
 * address. The Edge Function stays deployed for those legacy tenants and
 * for nothing else.
 *
 * Non-custodial is the default for new merchants: Privy embedded wallet or
 * a merchant-supplied address, direct transfers, check-payment
 * reconciliation. The platform never holds signing power there.
 *
 * This module NO LONGER touches Circle's REST API from the browser: the API
 * key and entity secret live only as Edge Function secrets, and the call
 * below goes through the authenticated `circle-wallet` function (the user's
 * own JWT scopes it to their tenant). Secrets in frontend code would let
 * anyone with devtools operate every wallet — that flow is retired, do not
 * reintroduce it.
 */

import { supabase } from '../lib/supabase'

type CircleAction = 'resolve' | 'create' | 'get-or-create'

interface CircleWalletResponse {
  status?: string
  address?: string
  reason?: string
}

async function invokeCircleWallet(action: CircleAction): Promise<string | null> {
  let res: { error: unknown; data: unknown }
  try {
    res = await supabase.functions.invoke('circle-wallet', {
      body: { action },
    })
  } catch (err: unknown) {
    console.warn('[PayStyle] circle-wallet function failed', err)
    return null
  }
  if (res.error) {
    console.warn('[PayStyle] circle-wallet function failed', res.error)
    return null
  }
  const data = (res.data ?? {}) as CircleWalletResponse
  if (data.status !== 'ok' || typeof data.address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(data.address)) {
    return null
  }
  return data.address
}

/**
 * Attempt to fetch an existing wallet set + wallet for this merchant.
 * Returns the first Arc wallet address found, or null if none exist yet.
 *
 * @deprecated LEGACY — legacy tenants only. New code must not call this;
 * use the merchant's Privy embedded address (or BYOW) instead.
 */
export async function resolveMerchantWallet(_config?: unknown): Promise<string | null> {
  return invokeCircleWallet('resolve')
}

/**
 * Create a new wallet set + wallet for this merchant on Arc Testnet.
 * Returns the wallet address.
 *
 * @deprecated LEGACY — legacy tenants only. New code must not call this;
 * use the merchant's Privy embedded address (or BYOW) instead.
 */
export async function createMerchantWallet(_config?: unknown): Promise<string> {
  const address = await invokeCircleWallet('create')
  if (!address) throw new Error('No se pudo crear la wallet (circle-wallet).')
  return address
}

/**
 * Resolve the merchant wallet: returns existing or creates a new one.
 *
 * @deprecated LEGACY — legacy tenants only. New code must not call this;
 * use the merchant's Privy embedded address (or BYOW) instead.
 */
export async function getOrCreateMerchantWallet(_config?: unknown): Promise<string> {
  const address = await invokeCircleWallet('get-or-create')
  if (!address) throw new Error('No se pudo resolver la wallet (circle-wallet).')
  return address
}
