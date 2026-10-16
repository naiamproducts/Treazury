/**
 * PayStyle — Auth hook
 *
 * Wraps Supabase Auth with tenant resolution.
 * Returns: user, tenant, loading, and auth actions.
 *
 * Flow:
 *  1. signUp(email, password, businessName) → creates auth.users row
 *     → trigger handle_new_user() creates tenants row (is_approved=false)
 *  2. signIn(email, password) → session
 *  3. After sign-in, we load the tenant for this user
 *  4. If tenant.is_approved = false → show "pending approval" screen
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Tenant } from '../lib/database.types'
import type { User, Session } from '@supabase/supabase-js'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'pending_approval'; user: User; tenant: Tenant }
  | { status: 'authenticated'; user: User; tenant: Tenant; session: Session }

export interface AuthActions {
  signUp: (email: string, password: string, businessName: string, country?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshTenant: () => Promise<void>
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const loadTenant = useCallback(async (user: User, session: Session) => {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (error || !tenant) {
      // Tenant not found — could be a race condition with the trigger
      // Retry once after a short delay
      await new Promise(r => setTimeout(r, 800))
      const { data: retryTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!retryTenant) {
        setState({ status: 'unauthenticated' })
        return
      }

      if (!retryTenant.is_approved) {
        setState({ status: 'pending_approval', user, tenant: retryTenant })
        return
      }

      setState({ status: 'authenticated', user, tenant: retryTenant, session })
      return
    }

    if (!tenant.is_approved) {
      setState({ status: 'pending_approval', user, tenant })
      return
    }

    setState({ status: 'authenticated', user, tenant, session })
  }, [])

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          void loadTenant(session.user, session)
        } else {
          setState({ status: 'unauthenticated' })
        }
      })
      .catch((err: unknown) => {
        // Never leave the app stuck on 'loading' — fail closed to unauthenticated.
        console.error('[PayStyle] session check failed', err)
        setState({ status: 'unauthenticated' })
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadTenant(session.user, session)
      } else {
        setState({ status: 'unauthenticated' })
      }
    })

    return () => subscription.unsubscribe()
  }, [loadTenant])

  const signUp = useCallback(async (email: string, password: string, businessName: string, country?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { business_name: businessName, country: country ?? 'VE' },
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ status: 'unauthenticated' })
  }, [])

  const refreshTenant = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await loadTenant(session.user, session)
    }
  }, [loadTenant])

  return { ...state, signUp, signIn, signOut, refreshTenant }
}
