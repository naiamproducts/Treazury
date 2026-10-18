/**
 * Dashboard shell — sidebar colapsable + router de vistas.
 * Mobile: hamburger abre sidebar como drawer.
 * Desktop: sidebar fija de 220px.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, ShoppingCart, Users, Wallet, Settings,
  Menu, X, MessageCircle, LogOut, AlertCircle, Copy, Check, ArrowUpRight,
} from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import type { DashboardStore } from '@/store'
import { useUsdcBalance, formatUsdc } from '@/hooks/useUsdcBalance'
import { t, type MessageKey } from '@/i18n/t'
import { storeErrorMessage } from './CatalogView'
import SendFundsDialog from './SendFundsDialog'

export type View = 'orders' | 'catalog' | 'customers' | 'charges' | 'settings'
interface NavItem {
  id: View
  labelKey: MessageKey
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  { id: 'orders',    labelKey: 'shell.nav.orders',    icon: <ShoppingCart className="size-4" /> },
  { id: 'catalog',   labelKey: 'shell.nav.catalog',   icon: <Package className="size-4" /> },
  { id: 'customers', labelKey: 'shell.nav.customers', icon: <Users className="size-4" /> },
  { id: 'charges',   labelKey: 'shell.nav.charges',   icon: <Wallet className="size-4" /> },
  { id: 'settings',  labelKey: 'shell.nav.settings',  icon: <Settings className="size-4" /> },
]

// ── Sidebar — extracted as top-level component to avoid "component in render" lint ──

interface SidebarProps {
  store: DashboardStore
  view: View
  onNav: (v: View) => void
  onSignOut: () => void
}

function Sidebar({ store, view, onNav, onSignOut }: SidebarProps) {
  const pendingCount = store.orders.filter(o => o.status === 'pending_payment').length

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: 'var(--surface-strong)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-xl" style={{ background: 'var(--accent)' }}>
          <MessageCircle className="size-4 text-white" />
        </div>
        <div>
          <p className="display text-sm font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {store.config.name || 'Treazury'}
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>{t('shell.dashboard')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(18,45,69,0.08)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              <span style={{ color: active ? 'var(--accent)' : 'var(--subtle)' }}>{item.icon}</span>
              {t(item.labelKey)}
              {item.id === 'orders' && pendingCount > 0 && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {pendingCount}
                </span>
              )}
              {item.id === 'customers' && store.customers.length > 0 && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: 'var(--surface-muted)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  {store.customers.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Funds counter footer */}
      <div className="p-4">
        <FundsCounter address={store.merchantAddress} />
        <button
          onClick={onSignOut}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--subtle)' }}
        >
          <LogOut className="size-3.5" />
          {t('shell.logout')}
        </button>
      </div>
    </div>
  )
}

// ── FundsCounter — mostrador de fondos (saldo + tools, address colapsada) ──

function FundsCounter({ address }: { address: string | null }) {
  const { balance, loading } = useUsdcBalance(address)
  const [copied, setCopied] = useState(false)
  const [showAddress, setShowAddress] = useState(false)
  const [showSend, setShowSend] = useState(false)

  const handleCopy = () => {
    if (!address) return
    void navigator.clipboard.writeText(address).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-2xl px-3 py-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
      {/* Saldo */}
      <div className="flex items-center gap-2">
        <TokenUSDC variant="branded" size={20} />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold" style={{ color: 'var(--subtle)' }}>{t('shell.balance')}</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
            {balance !== null ? `${formatUsdc(balance)} USDC` : loading ? '…' : '—'}
          </p>
        </div>
      </div>

      {/* Address colapsada */}
      {address && (
        <button
          onClick={() => setShowAddress(v => !v)}
          className="mt-2 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:opacity-80"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="mono truncate" style={{ color: 'var(--muted)' }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
          <span style={{ color: 'var(--subtle)' }}>{showAddress ? '−' : '+'}</span>
        </button>
      )}
      {showAddress && address && (
        <div className="mt-1.5 flex items-center gap-1">
          <p className="mono min-w-0 flex-1 break-all text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
            {address}
          </p>
          <button onClick={handleCopy} className="shrink-0 rounded-md p-1 transition-colors hover:opacity-80" style={{ color: copied ? 'var(--success)' : 'var(--subtle)' }}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        </div>
      )}

      {/* Herramientas de retiro */}
      <div className="mt-2 space-y-1">
        <button
          onClick={() => setShowSend(true)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors hover:opacity-80"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <ArrowUpRight className="size-3" />
          {t('shell.sendWithdrawFunds')}
        </button>
      </div>
      <SendFundsDialog open={showSend} onClose={() => setShowSend(false)} senderAddress={address} />
    </div>
  )
}

// ── Shell ───────────────────────────────────────────────────────────────────

interface ShellProps {
  store: DashboardStore
  children: (view: View, onNav: (v: View) => void) => React.ReactNode
  tenant?: { business_name: string; merchant_wallet_address?: string | null }
  onSignOut?: () => void
}

export default function Shell({ store, children, onSignOut }: ShellProps) {
  const [view, setView] = useState<View>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeNav = NAV.find(n => n.id === view)

  const handleNav = (v: View) => {
    setView(v)
    setSidebarOpen(false)
  }
  // Supabase sign-out comes from the app; the local wallet disconnect alone
  // is only a fallback so the button never silently does nothing.
  const handleSignOut = onSignOut ?? store.disconnect

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block" style={{ minHeight: '100dvh' }}>
        <div className="sticky top-0 h-dvh">
          <Sidebar store={store} view={view} onNav={handleNav} onSignOut={handleSignOut} />
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(18,45,69,0.35)', backdropFilter: 'blur(2px)' }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="fixed left-0 top-0 z-50 w-56 md:hidden"
              style={{ height: '100dvh' }}
            >
              <Sidebar store={store} view={view} onNav={handleNav} onSignOut={handleSignOut} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 py-4 md:hidden"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-strong)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-xl transition-all hover:opacity-70"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
          >
            <Menu className="size-4" style={{ color: 'var(--ink)' }} />
          </button>
          <p className="display text-sm font-bold" style={{ color: 'var(--ink)' }}>
            {activeNav ? t(activeNav.labelKey) : null}
          </p>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <X className="size-4" style={{ color: 'var(--ink)' }} />
            </button>
          )}
        </div>

        {/* Desktop page header */}
        <div
          className="hidden items-center gap-2 border-b px-6 py-4 md:flex"
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ color: 'var(--accent)' }}>
            {activeNav?.icon}
          </span>
          <h1
            className="display text-base font-bold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            {activeNav ? t(activeNav.labelKey) : null}
          </h1>
        </div>

        <div className="p-4 md:p-6">
          {/* Failures that no call site awaited (the initial load, a stock
              reservation after an order was already created) land here. */}
          {store.error && (
            <div
              className="mb-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-xs"
              style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)', border: '1px solid rgba(186,43,76,0.2)' }}
            >
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {/* StoreError.message is Spanish (store/errors.ts MESSAGES) —
                  map through the errors.store.* keys so this unawaited-failure
                  banner stays English like every other swept surface. */}
              <span className="flex-1">{storeErrorMessage(store.error)}</span>
              <button onClick={store.dismissError} aria-label={t('shell.close')}>
                <X className="size-3.5" />
              </button>
            </div>
          )}
          {children(view, handleNav)}
        </div>
      </main>
    </div>
  )
}
