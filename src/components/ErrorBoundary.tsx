/**
 * PayStyle — ErrorBoundary
 *
 * Global error boundary. Catches any React render error and shows
 * a recovery screen instead of a blank page.
 */

import { Component, type ReactNode } from 'react'
import { TriangleAlert, RefreshCw } from 'lucide-react'
import { t } from '../i18n/t'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production: send to error tracking (Sentry, LogRocket, etc.)
    console.error('[PayStyle] Uncaught render error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{
            background: 'var(--surface-strong)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(186,43,76,0.08)' }}
          >
            <TriangleAlert className="size-7" style={{ color: 'var(--danger)' }} />
          </div>

          <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>
            {t('errors.crash.title')}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {t('errors.crash.body')}
          </p>

          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs" style={{ color: 'var(--subtle)' }}>
              {t('errors.crash.details')}
            </summary>
            <pre
              className="mono mt-2 overflow-auto rounded-xl p-3 text-xs"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)' }}
            >
              {this.state.error.message}
            </pre>
          </details>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <RefreshCw className="size-4" />
            {t('errors.crash.reload')}
          </button>
        </div>
      </div>
    )
  }
}
