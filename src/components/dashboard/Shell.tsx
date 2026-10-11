/**
 * Dashboard shell — sidebar colapsable + router de vistas.
 * Mobile: hamburger abre sidebar como drawer.
 * Desktop: sidebar fija de 220px.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, ShoppingCart, Wallet, Settings,
  Menu, X, MessageCircle, LogOut,
} from 'lucide-react'
import type { DashboardStore } from '@/store'

export type View = 'orders' | 'catalog' | 'charges' | 'settings'

interface NavItem {
  id: View
  label: string
  icon: React.ReactNode
}

const NAV: NavItem[] = [
  { id: 'orders',   label: 'Órdenes',       icon: <ShoppingCart className="size-4" /> },
  { id: 'catalog',  label: 'Catálogo',      icon: <Package className="size-4" /> },
  { id: 'charges',  label: 'Cobros',        icon: <Wallet className="size-4" /> },
  { id: 'settings', label: 'Configuración', icon: <Settings className="size-4" /> },
]

// ── Sidebar — extracted as top-level component to avoid "component in render" lint ──

interface SidebarProps {
  store: DashboardStore
  view: View
  onNav: (v: View) => void
}

function Sidebar({ store, view, onNav }: SidebarProps) {
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
            {store.config.name || 'PayStyle'}
          </p>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>Dashboard</p>
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
              {item.label}
              {item.id === 'orders' && pendingCount > 0 && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Wallet footer */}
      <div className="p-4">
        <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--subtle)' }}>Wallet</p>
          <p className="mono mt-0.5 truncate text-xs" style={{ color: 'var(--ink-2)' }}>
            {store.merchantAddress.slice(0, 8)}…{store.merchantAddress.slice(-6)}
          </p>
        </div>
        <button
          onClick={store.disconnect}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--subtle)' }}
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ── Shell ───────────────────────────────────────────────────────────────────

interface ShellProps {
  store: DashboardStore
  children: (view: View) => React.ReactNode
  tenant?: { business_name: string; merchant_wallet_address?: string | null }
  onSignOut?: () => void
}

export default function Shell({ store, children }: ShellProps) {
  const [view, setView] = useState<View>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNav = (v: View) => {
    setView(v)
    setSidebarOpen(false)
  }

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 md:block" style={{ minHeight: '100dvh' }}>
        <div className="sticky top-0 h-dvh">
          <Sidebar store={store} view={view} onNav={handleNav} />
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
              <Sidebar store={store} view={view} onNav={handleNav} />
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
            {NAV.find(n => n.id === view)?.label}
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
            {NAV.find(n => n.id === view)?.icon}
          </span>
          <h1
            className="display text-base font-bold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            {NAV.find(n => n.id === view)?.label}
          </h1>
        </div>

        <div className="p-4 md:p-6">
          {children(view)}
        </div>
      </main>
    </div>
  )
}
