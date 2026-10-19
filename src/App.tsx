/**
 * PayStyle — App root
 *
 * Routing logic:
 *  - URL has ?vault= / ?to= + amount  →  PaymentPage (buyer opens payment link)
 *  - auth.status === 'loading'        →  full-screen spinner
 *  - auth.status === 'unauthenticated'→  LandingPage → AuthPage
 *  - auth.status === 'pending_approval'→  PendingApproval screen
 *  - auth.status === 'authenticated'  →  Dashboard (Shell + views)
 */

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useMerchantWallet } from './wallet/MerchantWalletContext'
import PaymentPage from './components/PaymentPage'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import PendingApproval from './components/PendingApproval'
import Shell, { type View } from './components/dashboard/Shell'
import CountrySetupModal from './components/CountrySetupModal'
import CatalogView from './components/dashboard/CatalogView'
import OrdersView from './components/dashboard/OrdersView'
import CustomersView from './components/dashboard/CustomersView'
import ChargesView from './components/dashboard/ChargesView'
import SettingsView from './components/dashboard/SettingsView'
import { useDashboardStore } from './store'
import { supabase } from './lib/supabase'
import { t } from './i18n/t'
import { toast } from 'sonner'

type Stage = 'landing' | 'auth'

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const isPaymentLink = params.has('amount') && (params.has('vault') || params.has('to'))

  const auth = useAuth()
  // The store reads and writes the signed-in tenant's rows. With no tenant
  // (signed out, or awaiting approval) it stays empty and issues no queries —
  // RLS would reject them anyway.
  const store = useDashboardStore(auth.status === 'authenticated' ? auth.tenant.id : undefined)
  // Linked embedded EVM wallet (null while Privy is unconfigured or the
  // wallet is still being created). Never a user id, never a secret.
  const merchantWallet = useMerchantWallet()
  const { isConnected: storeConnected, connect: storeConnect, updateConfig: storeUpdateConfig } = store
  const [stage, setStage] = useState<Stage>('landing')
  // Tenant payout address already persisted, so the first link below runs once.
  // Keyed by tenant + address so a user/tenant switch without remount never
  // suppresses the new tenant's persist or writes against the wrong tenant.
  const persistedWalletRef = useRef<{ tenantId: string; address: string } | null>(null)
  // Payout-alert registration already completed, keyed the same way so a
  // failure retries on a later session instead of being forgotten.
  const registeredPayoutRef = useRef<{ tenantId: string; address: string } | null>(null)

  // ── Local payout address ─────────────────────────────────────────────
  // The tenant's stored wallet wins; otherwise the linked embedded EVM
  // wallet. A Supabase user id is NOT a wallet address and is never used
  // as one (it is not 0x… and would route payment links nowhere).
  useEffect(() => {
    if (auth.status !== 'authenticated' || storeConnected) return
    const tenantAddress = (auth.tenant.merchant_wallet_address ?? '').trim()
    const resolved = tenantAddress || merchantWallet.evmAddress || ''
    if (resolved) {
      storeConnect(resolved)
      return
    }
    // Only lock an empty address when no wallet is coming: Privy
    // unconfigured, or creation failed visibly. While Privy is still
    // creating/retrying (ready but evmAddress null, no error yet) we stay
    // unconnected so the late address can still connect on arrival.
    if (!merchantWallet.configured || merchantWallet.walletError) {
      storeConnect('')
    }
  }, [auth, merchantWallet, storeConnected, storeConnect])

  // ── Persist the linked EVM payout address ────────────────────────────
  // First link only, through the existing tenant wallet field
  // (tenants.merchant_wallet_address via updateConfig — RLS-granted,
  // client-side; writes never go through an Edge Function). A
  // merchant-configured address is never overwritten, so the merchant keeps
  // the ability to override it manually (BYOW) from settings. EVM is the
  // default settlement address; the linked Solana address is exposed
  // through MerchantWalletContext for future per-chain selection and is
  // never auto-persisted here. A refused write stays local-only and may
  // retry on a later session; only addresses are stored, never keys, seeds,
  // or secrets.
  useEffect(() => {
    if (auth.status !== 'authenticated') return
    if (!merchantWallet.configured || !merchantWallet.ready) return
    if ((auth.tenant.merchant_wallet_address ?? '').trim()) return
    const tenantId = auth.tenant.id
    const evm = merchantWallet.evmAddress
    if (!evm) return
    const seen = persistedWalletRef.current
    if (seen && seen.tenantId === tenantId && seen.address === evm) return
    persistedWalletRef.current = { tenantId, address: evm }
    void storeUpdateConfig({ merchantWallet: evm })
      .then(() => {
        // Refresh the auth-layer tenant so the stored payout address is
        // visible without waiting for the next login.
        void auth.refreshTenant().catch((refreshErr: unknown) => {
          console.warn('[PayStyle] tenant refresh after wallet persist failed', refreshErr)
        })
      })
      .catch((err: unknown) => {
        persistedWalletRef.current = null
        console.error('[PayStyle] could not persist the payout wallet on the tenant', err)
      })
  }, [auth, merchantWallet, storeUpdateConfig])

  // ── Register the payout address for payment alerts (best-effort) ─────────
  // Runs as its own effect so a failed registration retries on a later
  // session instead of being forgotten after the persist above runs once.
  // check-payment reconciles on its own and never depends on this webhook,
  // so a failure only shows a notice and never blocks the link or dashboard.
  useEffect(() => {
    if (auth.status !== 'authenticated') return
    if (!merchantWallet.configured || !merchantWallet.ready) return
    const tenantId = auth.tenant.id
    const address = (auth.tenant.merchant_wallet_address ?? '').trim() || merchantWallet.evmAddress || ''
    if (!address) return
    const seen = registeredPayoutRef.current
    if (seen && seen.tenantId === tenantId && seen.address === address) return
    // functions.invoke attaches the user JWT automatically.
    void supabase.functions
      .invoke('register-payout-address', { body: { address } })
      .then(({ error }) => {
        if (error) {
          console.warn('[PayStyle] payout alert registration failed; charges still work', error)
          toast.warning(t('charges.error.activateAlerts'))
          return
        }
        registeredPayoutRef.current = { tenantId, address }
      })
      .catch((invokeErr: unknown) => {
        console.warn('[PayStyle] payout alert registration failed; charges still work', invokeErr)
        toast.warning(t('charges.error.activateAlerts'))
      })
  }, [auth, merchantWallet])

  // ── Payment link (public, no auth needed) ──────────────────────────────
  if (isPaymentLink) {
    return <PaymentPage searchParams={params} />
  }

  // ── Auth loading ────────────────────────────────────────────────────────
  if (auth.status === 'loading') {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <Loader2 className="size-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  // ── Not authenticated ───────────────────────────────────────────────────
  if (auth.status === 'unauthenticated') {
    if (stage === 'auth') {
      return (
        <AuthPage
          onBack={() => setStage('landing')}
          authActions={{ signIn: auth.signIn, signUp: auth.signUp }}
        />
      )
    }
    return <LandingPage onEnterApp={() => setStage('auth')} showRegister={import.meta.env.VITE_SHOW_REGISTER === 'true'} />
  }

  // ── Pending approval (whitelist) ────────────────────────────────────────
  if (auth.status === 'pending_approval') {
    return (
      <PendingApproval
        email={auth.user.email ?? ''}
        businessName={auth.tenant.business_name}
        tenantId={auth.tenant.id}
        currentCountry={auth.tenant.country}
onSignOut={() => { void auth.signOut() }}
        walletError={merchantWallet.walletError}
        walletRetrying={merchantWallet.ensuring}
        onRetryWallet={merchantWallet.retryWallet}
      />
    )
  }

  // ── Authenticated — connect the wallet view and show the dashboard ─────
  // Local wallet state only: isConnected/merchantAddress are the payout
  // view, not the tenant's. config comes from tenants, not from connect().
  if (!store.isConnected) {
    // ensuring/walletError aggregate BOTH chains (EVM + Solana): the gating
    // below also requires no usable EVM address, so a Solana-only retry or
    // failure never blocks the dashboard while the EVM payout path works.
    const waitingForWallet =
      auth.status === 'authenticated' &&
      merchantWallet.configured &&
      !(auth.tenant.merchant_wallet_address ?? '').trim() &&
      !merchantWallet.evmAddress &&
      (!merchantWallet.ready || merchantWallet.ensuring)
    // Stuck without any payout wallet: the capped automatic retries are
    // exhausted and no tenant address exists to fall back to. Surface the
    // failure with a manual retry instead of spinning forever. When the
    // tenant already has a stored address the effect above connects the
    // dashboard, so this branch never blocks it.
    const walletFailed =
      auth.status === 'authenticated' &&
      merchantWallet.configured &&
      !(auth.tenant.merchant_wallet_address ?? '').trim() &&
      !merchantWallet.evmAddress &&
      merchantWallet.walletError !== null
    if (walletFailed) {
      return (
        <div
          className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4"
          style={{ background: 'var(--bg-gradient)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center"
            style={{
              background: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 32px rgba(18,45,69,0.08)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {merchantWallet.walletError}
            </p>
            <button
              type="button"
              onClick={merchantWallet.retryWallet}
              disabled={merchantWallet.ensuring}
              className="mt-4 w-full rounded-xl py-3 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              {merchantWallet.ensuring ? t('approval.retrying') : t('approval.retry')}
            </button>
          </div>
        </div>
      )
    }
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <Loader2 className="size-6 animate-spin" style={{ color: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {waitingForWallet ? t('shell.loading.payoutWallet') : t('shell.loading.dashboard')}
        </p>
      </div>
    )
  }

  return (
    <>
      <CountrySetupModal store={store} tenantId={auth.tenant.id} />
      <Shell store={store} tenant={auth.tenant} onSignOut={() => { store.disconnect(); void auth.signOut() }}>
        {(view: View, onNav: (v: View) => void) => {
          if (view === 'catalog')   return <CatalogView store={store} tenantId={auth.tenant.id} />
          if (view === 'orders')    return <OrdersView store={store} tenantId={auth.tenant.id} />
          if (view === 'customers') return <CustomersView store={store} tenantId={auth.tenant.id} onNavigateToOrders={() => onNav('orders')} />
          if (view === 'charges')   return <ChargesView store={store} tenantId={auth.tenant.id} />
          if (view === 'settings')  return <SettingsView store={store} tenant={auth.tenant} tenantId={auth.tenant.id} onTenantUpdate={auth.refreshTenant} />
          return null
        }}
      </Shell>
    </>
  )
}
