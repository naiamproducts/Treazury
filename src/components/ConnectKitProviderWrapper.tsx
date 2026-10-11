import { useEffect } from 'react'
import { ConnectKitProvider } from 'connectkit'

/**
 * ConnectKitProvider wrapper that suppresses the Aave Account SDK
 * "EIP1193 provider connection timeout" error that occurs in headless
 * environments where no wallet provider is available.
 *
 * The Aave Account SDK (used by ConnectKit v2 via porto) attempts a
 * lazy connection to an EIP-1193 provider on initialization. In
 * headless/CI environments this times out and throws an unhandled
 * page error. In real browsers with a wallet extension this never
 * occurs because the EIP-1193 provider is present.
 *
 * This component catches and logs the specific error instead of
 * letting it propagate as an unhandled page error.
 */
export function ConnectKitProviderWrapper({
  children,
}: { children: React.ReactNode }) {
  useEffect(() => {
    // The error originates from the Aave Account SDK's lazy
    // connection attempt during ConnectKitProvider initialization.
    // In headless environments there's no wallet provider, so the
    // lazy connection times out. In real browsers with a wallet
    // extension the provider exists and the error never occurs.
    //
    // We can't prevent the error from being thrown (it's internal
    // to ConnectKit/porto/Aave), but we can prevent it from
    // bubbling as an unhandled page error. Some SDK failures arrive
    // through window.onerror and others through unhandledrejection,
    // so both paths need the same narrow filter.
    const provider = (window as unknown as { ethereum?: unknown }).ethereum
    const hasProvider = provider !== undefined
    const matchesAaveTimeout = (text: string): boolean =>
      text.includes('EIP1193 provider connection timeout') ||
      text.includes('AaveAccountSdk.connect')

    const originalErrorHandler = window.onerror
    window.onerror = (
      message: string | Event,
      source: string | undefined,
      lineno: number | undefined,
      colno: number | undefined,
      error: Error | undefined
    ): boolean => {
      // Safe stringification that handles both string and Event
      const msg = typeof message === 'string' ? message : JSON.stringify(message)
      if (!hasProvider && error instanceof Error && matchesAaveTimeout(msg)) {
        // Log and suppress — this is expected in headless.
        console.debug('[PayStyle] Suppressed Aave Account SDK timeout:', msg)
        return true
      }
      // Delegate to original handler
      if (originalErrorHandler) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalErrorHandler.call(window, message, source, lineno, colno, error)
      }
      return false
    }

    const handleRejection = (event: PromiseRejectionEvent): void => {
      const reason: unknown = event.reason
      const text =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}\n${reason.stack ?? ''}`
          : JSON.stringify(reason)
      if (!hasProvider && matchesAaveTimeout(text)) {
        event.preventDefault()
        console.debug('[PayStyle] Suppressed Aave Account SDK rejection:', text)
      }
    }
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.onerror = originalErrorHandler
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return <ConnectKitProvider>{children}</ConnectKitProvider>
}