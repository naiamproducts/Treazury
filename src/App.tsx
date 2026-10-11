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

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import PaymentPage from './components/PaymentPage'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import PendingApproval from './components/PendingApproval'
import Shell, { type View } from './components/dashboard/Shell'
import CatalogView from './components/dashboard/CatalogView'
import OrdersView from './components/dashboard/OrdersView'
import ChargesView from './components/dashboard/ChargesView'
import SettingsView from './components/dashboard/SettingsView'
import { useDashboardStore } from './store'

type Stage = 'landing' | 'auth'

export default function App() {
  const params = new URLSearchParams(window.location.search)
  const isPaymentLink = params.has('amount') && (params.has('vault') || params.has('to'))

  const auth = useAuth()
  // The store reads and writes the signed-in tenant's rows. With no tenant
  // (signed out, or awaiting approval) it stays empty and issues no queries —
  // RLS would reject them anyway.
  const store = useDashboardStore(auth.status === 'authenticated' ? auth.tenant.id : undefined)
  const [stage, setStage] = useState<Stage>('landing')

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
onSignOut={() => { void auth.signOut() }}
      />
    )
  }

  // ── Authenticated — connect the wallet view and show the dashboard ─────
  // Local wallet state only: isConnected/merchantAddress are wagmi's, not the
  // tenant's. config comes from tenants, not from connect().
  if (!store.isConnected) {
    store.connect(auth.tenant.merchant_wallet_address ?? auth.user.id)
  }

  return (
    <Shell store={store} tenant={auth.tenant} onSignOut={() => { void auth.signOut() }}>
      {(view: View) => {
        if (view === 'catalog')  return <CatalogView store={store} />
        if (view === 'orders')   return <OrdersView store={store} />
        if (view === 'charges')  return <ChargesView store={store} />
        if (view === 'settings') return <SettingsView store={store} tenant={auth.tenant} onTenantUpdate={auth.refreshTenant} />
        return null
      }}
    </Shell>
  )
}
