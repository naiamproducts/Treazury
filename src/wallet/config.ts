/**
 * PayStyle — Privy client configuration.
 *
 * Only the public App ID may reach the browser. The App Secret (APP_SECRET)
 * must never enter browser code, Vite env, logs, or git: it lives only in
 * the external credential file and, later, in the backend route that mints
 * custom-auth JWTs for Privy.
 */

function readPrivyAppId(): string | undefined {
  const raw = (import.meta.env.VITE_PRIVY_APP_ID as string | undefined)?.trim()
  return raw ? raw : undefined
}

/** Public Privy App ID, or undefined when the app runs without Privy. */
export const PRIVY_APP_ID = readPrivyAppId()

/** True when the browser can talk to Privy at all. */
export const isPrivyConfigured = PRIVY_APP_ID !== undefined
