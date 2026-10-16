/**
 * PayStyle — Supabase-delegated Privy embedded-wallet onboarding.
 *
 * Authority split:
 *  - Supabase is the merchant identity, tenant source, approval gate, and
 *    RLS authority. Login UI stays Supabase-only; Privy login is never
 *    called.
 *  - Privy only custodies the embedded wallets (EVM + Solana). It receives
 *    the Supabase JWT through custom (JWT-based) authentication and syncs
 *    its session from it.
 *
 * Custody model: USER-MANAGED only. This repo configures NO
 * service-controlled or server wallets, NO delegated signers, and NO
 * APP_SECRET anywhere near the browser: only VITE_PRIVY_APP_ID (public) is
 * read here. Every wallet below is an embedded wallet owned by the merchant
 * and authorized through their own Supabase JWT session.
 *
 * Privy policies (guardrails, not custody) — WHERE they live:
 *  - Transfer limits, recipient allowlists, and contract denylists are NOT
 *    configured in this repo. They live in the Privy dashboard
 *    (https://dashboard.privy.io → your app → Policies) and/or are enforced
 *    through the Privy server API when a backend calls it with APP_SECRET.
 *  - This client intentionally creates no policy and holds no server
 *    credential: policy changes are an operator action in the dashboard,
 *    never a code change here. If a future Edge Function needs
 *    server-side enforcement, it must keep APP_SECRET server-side and must
 *    never move funds on its own — address-only reads, like circle-wallet.
 *
 * Installed-package API reconciliation (@privy-io/react-auth v3):
 *  - `config.customAuth.getCustomAccessToken` exists but is deprecated in
 *    favor of the `useSyncJwtBasedAuthState` hook family, so this file uses
 *    `useSubscribeToJwtAuthWithFlag({ isAuthenticated, isLoading,
 *    getExternalJwt })` — the supported path — and never the deprecated
 *    config. Stale guides showing only `customAuth` were not copied.
 *  - EVM wallets are provisioned with `useCreateWallet().createWallet()`
 *    from the main entry point; Solana wallets with `useCreateWallet()`
 *    from `@privy-io/react-auth/solana` (same bounded retry/guard pattern,
 *    one explicit creation path per chain — see `useEnsureChainWallet`).
 *  - `createOnLogin` is deliberately `off` for BOTH chains: automatic
 *    creation stays disabled because calling `createWallet()` alongside it
 *    produced duplicate wallets for the same login.
 *
 * Secrets: only VITE_PRIVY_APP_ID (public) is read here. APP_SECRET never
 * enters this file, the browser bundle, logs, or git.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PrivyProvider,
  useCreateWallet,
  useLogout,
  usePrivy,
  useSubscribeToJwtAuthWithFlag,
} from '@privy-io/react-auth'
import { useCreateWallet as useCreateSolanaWallet } from '@privy-io/react-auth/solana'
import type { LinkedAccountWithMetadata } from '@privy-io/react-auth'
import { supabase } from '../lib/supabase'
import { PRIVY_APP_ID, isPrivyConfigured } from './config'
import {
  DISABLED_MERCHANT_WALLET,
  MerchantWalletContext,
  type MerchantWalletState,
} from './MerchantWalletContext'
import { isEvmAddress, isSolanaAddress } from './chains'

const MAX_WALLET_ATTEMPTS = 4
const WALLET_RETRY_DELAYS_MS = [1000, 2000, 4000]
// Creation hang guard: an external createWallet() call that never settles
// must not block the dashboard forever — it falls into the normal error path
// below (bounded retry, then manual retry) instead.
const CREATE_WALLET_TIMEOUT_MS = 30_000

// ── Linked-account selection ─────────────────────────────────────────────

/** Structural shape of a linked wallet account; the SDK union is narrowed by hand. */
interface LinkedWalletShape {
  address: unknown
  chainType: unknown
  walletClientType: unknown
}

function asLinkedWallet(account: LinkedAccountWithMetadata): LinkedWalletShape | null {
  if (account.type !== 'wallet') return null
  return account as unknown as LinkedWalletShape
}

/**
 * Address of the linked embedded EVM wallet, or null. Only wallets Privy
 * itself custodies (`privy` / `privy-v2`) count — an externally linked
 * wallet is never mistaken for the managed payout wallet, and only 0x…
 * values are accepted so a user id can never pass as an address.
 */
function findEmbeddedEvmAddress(accounts: LinkedAccountWithMetadata[]): string | null {
  for (const account of accounts) {
    const wallet = asLinkedWallet(account)
    if (!wallet) continue
    if (wallet.chainType !== 'ethereum') continue
    if (wallet.walletClientType !== 'privy' && wallet.walletClientType !== 'privy-v2') continue
    if (typeof wallet.address !== 'string' || !isEvmAddress(wallet.address)) continue
    return wallet.address
  }
  return null
}

/**
 * Address of the linked embedded Solana wallet, or null. Same rules as the
 * EVM selector: only Privy-custodied wallets count, and only base58 public
 * keys are accepted so a user id can never pass as an address.
 */
function findEmbeddedSolanaAddress(accounts: LinkedAccountWithMetadata[]): string | null {
  for (const account of accounts) {
    const wallet = asLinkedWallet(account)
    if (!wallet) continue
    if (wallet.chainType !== 'solana') continue
    if (wallet.walletClientType !== 'privy' && wallet.walletClientType !== 'privy-v2') continue
    if (typeof wallet.address !== 'string' || !isSolanaAddress(wallet.address)) continue
    return wallet.address
  }
  return null
}

// ── Supabase → Privy JWT sync ──────────────────────────────────────────────

/**
 * Returns the current Supabase access token for Privy. Never throws and
 * never returns anything but the JWT (or undefined when signed out) — the
 * sync hook logs Privy out if this throws, so a storage hiccup must not
 * look like a sign-out… returning undefined on error keeps the failure
 * visible instead of destructive. No private keys, seeds, or secrets pass
 * through here: only the session JWT.
 */
async function getSupabaseAccessToken(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  } catch {
    return undefined
  }
}

/**
 * Mounted for the whole app lifetime inside PrivyProvider. Bridges Supabase
 * auth state into Privy via the supported JWT-sync hook and logs Privy out
 * explicitly when Supabase signs out.
 */
function PrivyJwtSync({ children, onAuthError }: { children: React.ReactNode; onAuthError: (message: string | null) => void }) {
  const { authenticated } = usePrivy()
  const { logout } = useLogout()
  const [flags, setFlags] = useState({ isAuthenticated: false, isLoading: true })

  const logoutPrivy = useCallback(async (): Promise<void> => {
    if (!authenticated) return
    try {
      await logout()
    } catch (err: unknown) {
      console.warn('[PayStyle] no se pudo cerrar la sesión de Privy', err)
    }
  }, [authenticated, logout])

  // Supabase is the source of truth: seed from the stored session, then
  // follow auth events. Writes land in settled callbacks, never in the
  // effect body.
  useEffect(() => {
    let cancelled = false
    void supabase.auth.getSession().then(
      ({ data }) => {
        if (!cancelled) setFlags({ isAuthenticated: !!data.session, isLoading: false })
      },
      () => {
        if (!cancelled) setFlags({ isAuthenticated: false, isLoading: false })
      },
    )
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setFlags({ isAuthenticated: !!session, isLoading: false })
      if (event === 'SIGNED_OUT') void logoutPrivy()
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [logoutPrivy])

  const getExternalJwt = useCallback((): Promise<string | undefined> => getSupabaseAccessToken(), [])

  const handleAuthError = useCallback((error: Error) => {
    const detail = error.message.trim() ? `: ${error.message}` : ''
    console.warn('[PayStyle] no se pudo autenticar la sesión de Privy', error)
    onAuthError(`No se pudo autenticar la sesión de Privy${detail}.`)
  }, [onAuthError])

  // Supported v3 path (config.customAuth is deprecated): Privy exchanges the
  // Supabase JWT for its own session and re-syncs whenever the flags change,
  // so no manual subscription is needed. Privy login is never called. The
  // hook reports its flow status, so real exchange failures surface instead
  // of leaving wallet creation waiting on a session that never arrives.
  const { state: jwtState } = useSubscribeToJwtAuthWithFlag({
    isAuthenticated: flags.isAuthenticated,
    isLoading: flags.isLoading,
    getExternalJwt,
    onError: handleAuthError,
  })

  // A later success (or sign-out) clears a stale exchange failure.
  useEffect(() => {
    if (!flags.isAuthenticated || jwtState.status === 'done') {
      onAuthError(null)
    }
  }, [flags.isAuthenticated, jwtState.status, onAuthError])

  return <>{children}</>
}

// ── Embedded wallet ensure (one instance per chain) ────────────────────────

/**
 * Ensures the merchant's linked embedded wallet for ONE chain: selects the
 * already-linked address, creating it when the merchant has none yet.
 * Failures only warn — the dashboard keeps working with the tenant's stored
 * payout address.
 *
 * Both chains share this single creation path (EVM via the main entry
 * point, Solana via `@privy-io/react-auth/solana`): automatic
 * `createOnLogin` stays off so the explicit `createAddress()` call below is
 * the only thing that can provision a wallet.
 */
function useEnsureChainWallet(args: {
  ready: boolean
  authenticated: boolean
  userId: string | undefined
  linkedAddress: string | null
  chainLabel: string
  createAddress: () => Promise<string>
}): {
  address: string | null
  ensuring: boolean
  walletError: string | null
  retryChain: () => void
} {
  const { ready, authenticated, userId, linkedAddress, chainLabel, createAddress } = args
  const [address, setAddress] = useState<string | null>(null)
  const [ensuring, setEnsuring] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const creatingForUserId = useRef<string | null>(null)
  const walletAttempts = useRef<{ userId: string; count: number } | null>(null)
  const retryTimeout = useRef<number | null>(null)

  // State writes happen in the settled callback below, never in the effect
  // body. The ref is keyed by Privy user id: it guards StrictMode's
  // double-invoked effect from creating twice without blocking the next
  // merchant from getting their own wallet after a user switch.
  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      if (!authenticated || !ready || !userId) {
        creatingForUserId.current = null
        walletAttempts.current = null
        if (retryTimeout.current !== null) {
          window.clearTimeout(retryTimeout.current)
          retryTimeout.current = null
        }
        setAddress(null)
        setEnsuring(false)
        setWalletError(null)
        return
      }
      if (linkedAddress) {
        creatingForUserId.current = null
        walletAttempts.current = null
        setAddress(linkedAddress)
        setEnsuring(false)
        setWalletError(null)
        return
      }
      if (creatingForUserId.current === userId) return
      const attempts = walletAttempts.current?.userId === userId
        ? walletAttempts.current.count
        : 0
      if (attempts >= MAX_WALLET_ATTEMPTS) return
      creatingForUserId.current = userId
      walletAttempts.current = { userId, count: attempts + 1 }
      setEnsuring(true)
      setWalletError(null)
      void Promise.race([
        createAddress(),
        new Promise<string>((_, reject) => {
          window.setTimeout(
            () => reject(new Error(`${chainLabel} wallet creation timed out.`)),
            CREATE_WALLET_TIMEOUT_MS,
          )
        }),
      ]).then(
        (created) => {
          if (!cancelled) setAddress(created)
        },
        (err: unknown) => {
          if (creatingForUserId.current === userId) creatingForUserId.current = null
          console.warn(`[PayStyle] no se pudo crear la wallet embebida ${chainLabel}`, err)
          if (cancelled) return
          const attemptsForUser = walletAttempts.current?.userId === userId
            ? walletAttempts.current.count
            : MAX_WALLET_ATTEMPTS
          if (attemptsForUser < MAX_WALLET_ATTEMPTS) {
            if (retryTimeout.current !== null) {
              window.clearTimeout(retryTimeout.current)
            }
            retryTimeout.current = window.setTimeout(() => {
              if (!cancelled) setRetryToken((token) => token + 1)
            }, WALLET_RETRY_DELAYS_MS[Math.min(Math.max(attemptsForUser - 1, 0), WALLET_RETRY_DELAYS_MS.length - 1)])
            return
          }
          const detail = err instanceof Error && err.message.trim() ? `: ${err.message}` : ''
          setWalletError(`No se pudo crear la wallet de cobros${detail}. Recargá la página para reintentar.`)
        },
      ).finally(() => {
        if (!cancelled) setEnsuring(false)
      })
    })
    return () => {
      cancelled = true
      if (retryTimeout.current !== null) {
        window.clearTimeout(retryTimeout.current)
        retryTimeout.current = null
      }
    }
  }, [authenticated, ready, userId, linkedAddress, chainLabel, createAddress, retryToken])

  // Manual retry for the visible failure branch. Resets only the attempt
  // counter, the scheduled automatic retry, and the error — never the linked
  // address — then bumps the token once so the effect above runs exactly one
  // more bounded sequence. A creation already in flight keeps the single
  // path: the per-user guard in the effect ignores the bump until it settles.
  const retryChain = useCallback(() => {
    if (creatingForUserId.current !== null) return
    if (retryTimeout.current !== null) {
      window.clearTimeout(retryTimeout.current)
      retryTimeout.current = null
    }
    walletAttempts.current = null
    setWalletError(null)
    setRetryToken((token) => token + 1)
  }, [])

  return { address, ensuring, walletError, retryChain }
}

/**
 * Provides the merchant wallet state: the linked embedded EVM and Solana
 * wallets once Privy is authenticated, creating each when the merchant has
 * none yet. The EVM address is the default settlement address; Solana is
 * exposed for future per-chain selection.
 */
function PrivyMerchantWalletProvider({ children, authError }: { children: React.ReactNode; authError: string | null }) {
  const { ready, authenticated, user } = usePrivy()
  const { createWallet } = useCreateWallet()
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet()

  const linkedEvmAddress = useMemo(
    () => (user ? findEmbeddedEvmAddress(user.linkedAccounts) : null),
    [user],
  )
  const linkedSolanaAddress = useMemo(
    () => (user ? findEmbeddedSolanaAddress(user.linkedAccounts) : null),
    [user],
  )

  // The EVM entry point resolves the created wallet directly; the Solana
  // entry point nests it under `{ wallet }`. Both are validated before they
  // can become an address — a user id or malformed value never passes.
  const createEvmAddress = useCallback((): Promise<string> => {
    return createWallet().then((created) => {
      if (!isEvmAddress(created.address)) {
        throw new Error('EVM wallet creation returned an invalid address.')
      }
      return created.address
    })
  }, [createWallet])
  const createSolanaAddress = useCallback((): Promise<string> => {
    return createSolanaWallet().then((created) => {
      const shape = created as unknown as { wallet?: { address?: unknown }; address?: unknown }
      const raw = shape.wallet?.address ?? shape.address
      const candidate: string | null | undefined = typeof raw === 'string' ? raw : null
      if (!isSolanaAddress(candidate)) {
        throw new Error('Solana wallet creation returned an invalid address.')
      }
      return candidate
    })
  }, [createSolanaWallet])

  const userId = user?.id
  const evm = useEnsureChainWallet({
    ready,
    authenticated,
    userId,
    linkedAddress: linkedEvmAddress,
    chainLabel: 'EVM',
    createAddress: createEvmAddress,
  })
  const solana = useEnsureChainWallet({
    ready,
    authenticated,
    userId,
    linkedAddress: linkedSolanaAddress,
    chainLabel: 'Solana',
    createAddress: createSolanaAddress,
  })

  // Manual retry for the visible failure branch. Exchange failures live
  // outside the bounded wallet-creation loop: the sync hook only re-runs
  // when Supabase flags change, so a clean reload is the reliable recovery
  // path for a stuck session exchange.
  const retryWallet = useCallback(() => {
    if (authError) {
      window.location.reload()
      return
    }
    evm.retryChain()
    solana.retryChain()
  }, [authError, evm, solana])

  const value = useMemo<MerchantWalletState>(() => ({
    configured: true,
    ready,
    evmAddress: evm.address,
    solanaAddress: solana.address,
    ensuring: evm.ensuring || solana.ensuring,
    walletError: evm.walletError ?? solana.walletError ?? authError,
    retryWallet,
  }), [ready, evm, solana, authError, retryWallet])

  return <MerchantWalletContext.Provider value={value}>{children}</MerchantWalletContext.Provider>
}

// ── Root ───────────────────────────────────────────────────────────────────

/**
 * Wraps the app. When Privy is unconfigured (no VITE_PRIVY_APP_ID) children
 * render untouched with the disabled wallet state — the dashboard then runs
 * on the tenant's stored payout address alone.
 */
export function PrivyWalletProvider({ children }: { children: React.ReactNode }) {
  const [authError, setAuthError] = useState<string | null>(null)
  const handleAuthError = useCallback((message: string | null) => {
    setAuthError(message)
  }, [])
  if (!isPrivyConfigured || !PRIVY_APP_ID) {
    return (
      <MerchantWalletContext.Provider value={DISABLED_MERCHANT_WALLET}>
        {children}
      </MerchantWalletContext.Provider>
    )
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: 'off' },
          solana: { createOnLogin: 'off' },
        },
      }}
    >
      <PrivyJwtSync onAuthError={handleAuthError}>
        <PrivyMerchantWalletProvider authError={authError}>{children}</PrivyMerchantWalletProvider>
      </PrivyJwtSync>
    </PrivyProvider>
  )
}
