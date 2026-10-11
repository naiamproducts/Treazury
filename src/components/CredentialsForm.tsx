/**
 * CredentialsForm — login screen for the PayStyle merchant dashboard.
 *
 * Two modes:
 *  A) Real credentials: Circle API Key + Entity Secret → resolves/creates merchant wallet
 *  B) Demo mode: skips Circle API, uses a fixed testnet address for UI exploration
 */

import { useState } from 'react'
import { Loader2, Key, AlertCircle, MessageCircle } from 'lucide-react'
import { createPayStyleSDK, type PayStyleSDK } from '@/sdk'

const glass = {
  card: {
    background: 'var(--surface)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  strip: {
    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981)',
    height: '3px',
    borderRadius: '3px 3px 0 0',
  } as React.CSSProperties,
}

export interface CredentialsFormProps {
  onInit: (sdk: PayStyleSDK, address: string) => void
}

export function CredentialsForm({ onInit }: CredentialsFormProps) {
  const [apiKey, setApiKey] = useState<string>(
    (import.meta.env.VITE_CIRCLE_API_KEY as string | undefined) ?? '',
  )
  const [entitySecret, setEntitySecret] = useState<string>(
    (import.meta.env.VITE_CIRCLE_ENTITY_SECRET as string | undefined) ?? '',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useDemoMode, setUseDemoMode] = useState(false)

  // Deployer wallet — used as demo merchant address
  const DEMO_ADDRESS = '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42'

  const handleConnect = async () => {
    setError('')
    if (useDemoMode) {
      const fakeSdk = createPayStyleSDK({ apiKey: 'demo', entitySecret: 'demo' })
      ;(fakeSdk as unknown as { merchantAddress: string }).merchantAddress = DEMO_ADDRESS
      onInit(fakeSdk, DEMO_ADDRESS)
      return
    }
    if (!apiKey.trim() || !entitySecret.trim()) {
      setError('Ambos campos son requeridos.')
      return
    }
    setLoading(true)
    try {
      const sdk = createPayStyleSDK({ apiKey: apiKey.trim(), entitySecret: entitySecret.trim() })
      const address = await sdk.init()
      onInit(sdk, address)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar. Verifica tus credenciales.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-gradient)' }}
    >
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex size-14 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: 'var(--accent)' }}
        >
          <MessageCircle className="size-7 text-white" />
        </div>
        <div className="text-center">
          <h1
            className="display text-2xl font-bold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}
          >
            PayStyle
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Cobros B2B por WhatsApp
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm overflow-hidden rounded-3xl" style={glass.card}>
        <div style={glass.strip} />
        <div className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Key className="size-4" style={{ color: 'var(--accent)' }} />
            <h2
              className="display text-base font-bold"
              style={{ color: 'var(--ink)' }}
            >
              Conectar cuenta Circle
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                API Key
              </label>
              <input
                type="password"
                placeholder="TEST_API_KEY:…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={useDemoMode}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-mono outline-none transition-all focus:ring-2 disabled:opacity-40"
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-xs font-semibold"
                style={{ color: 'var(--muted)' }}
              >
                Entity Secret{' '}
                <span className="font-normal opacity-60">
                  (PoC — mantener server-side en producción)
                </span>
              </label>
              <input
                type="password"
                placeholder="64-char hex…"
                value={entitySecret}
                onChange={(e) => setEntitySecret(e.target.value)}
                disabled={useDemoMode}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-mono outline-none transition-all focus:ring-2 disabled:opacity-40"
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                }}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={useDemoMode}
                onChange={(e) => setUseDemoMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Modo demo — explorar sin cuenta Circle
              </span>
            </label>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
                style={{
                  background: 'rgba(186,43,76,0.08)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(186,43,76,0.2)',
                }}
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={() => { void handleConnect() }}
              disabled={loading}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Conectando…
                </span>
              ) : (
                'Ingresar al dashboard'
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs" style={{ color: 'var(--subtle)' }}>
        ¿No tienes cuenta?{' '}
        <a
          href="https://console.circle.com"
          target="_blank"
          rel="noreferrer"
          className="underline"
          style={{ color: 'var(--muted)' }}
        >
          Crear en Circle Console
        </a>
      </p>
    </div>
  )
}
