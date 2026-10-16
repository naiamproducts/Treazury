// PayStyle — circle-wallet Edge Function (LEGACY path, server-side).
//
// Resolves or creates the merchant's Circle *developer-controlled* wallet
// WITHOUT ever exposing the Circle API key or entity secret to the browser.
// The old browser-direct flow (VITE_CIRCLE_API_KEY in the bundle) is retired:
// secrets in frontend code let anyone with devtools operate every wallet.
//
// Non-custodial is the default for new merchants (Privy embedded wallet or a
// merchant-supplied address; direct transfers; check-payment reconciliation).
// This function exists only so tenants created under the legacy flow keep
// resolving their payout address. New code must NOT route through here.
//
// Auth: caller passes its Supabase user JWT (functions.invoke attaches it
// automatically). The tenant is scoped by tenants.owner_id = auth user id,
// so a merchant can only ever resolve its OWN wallet.
//
// This function NEVER moves funds and NEVER returns secrets — only an
// address. Writes to tenants.merchant_wallet_address stay client-side under
// RLS (store.updateConfig), never here.
//
// Deploy + secrets (run by the operator, never in code):
//   supabase functions deploy circle-wallet
//   supabase secrets set CIRCLE_API_KEY=... CIRCLE_ENTITY_SECRET=... PUBLIC_API_KEY=...
// (Dashboard: Edge Functions → Secrets. NOTE: custom names may NOT start
// with SUPABASE_ — that prefix is reserved — so the public key goes in
// PUBLIC_API_KEY, not SUPABASE_PUBLISHABLE_KEY.)
// (Dashboard-only alternative: Edge Functions → New Function, paste this
// file; Project Settings → Edge Functions → Secrets for the three values.)
//
// CIRCLE_ENTITY_SECRET must be the ENCRYPTED ciphertext (entity secret
// encrypted with Circle's entity public key), NOT the raw hex — Circle
// rejects raw values. Generate once with Circle's SDK helper
// (encryptEntitySecret) and store the ciphertext.
//
// Env (dashboard → Edge Functions → Secrets; never in code):
//   CIRCLE_API_KEY / CIRCLE_ENTITY_SECRET — Circle Console credentials.
//   SUPABASE_URL — auto-provided.
//   PUBLIC_API_KEY — the project's publishable key from Settings → API
//   (runtime-injected SUPABASE_* names are used as fallback when present).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

const CIRCLE_API_BASE = "https://api.circle.com/v1/w3s";
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

// ── Small helpers (mirrored from check-payment; functions deploy self-contained) ──

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function circleFetch(
  apiKey: string,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: boolean; status: number; json: unknown }> {
  let res: Response;
  try {
    res = await fetch(`${CIRCLE_API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, json: null };
  }
  let data: unknown = null;
  try {
    data = (await res.json()) as unknown;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, json: data };
}

/**
 * Map a failed Circle call to a safe reason. Only the HTTP class is
 * exposed (never Circle's body, which can carry account details):
 * 401/403 = the API key is wrong, revoked, or lacks scope;
 * anything else = request/payload problem (usually the ciphertext).
 */
function circleFailure(status: number, fallback: string): string {
  if (status === 401 || status === 403) return "circle_unauthorized";
  return fallback;
}

function pickWalletSetId(data: unknown): string | null {
  if (!isRecord(data) || !isRecord(data["data"])) return null;
  const set = data["data"]["walletSet"];
  if (!isRecord(set)) return null;
  return asString(set["id"]);
}

function pickArcAddress(data: unknown): string | null {
  if (!isRecord(data) || !isRecord(data["data"])) return null;
  const wallets = data["data"]["wallets"];
  if (!Array.isArray(wallets)) return null;
  for (const w of wallets) {
    if (!isRecord(w)) continue;
    const address = asString(w["address"]);
    if (
      w["blockchain"] === "ARC-TESTNET" &&
      w["state"] === "LIVE" &&
      address !== null &&
      ADDR_RE.test(address)
    ) {
      return address;
    }
  }
  return null;
}

// ── Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json(405, { status: "error", reason: "method_not_allowed" });
  }

  const apiKey = Deno.env.get("CIRCLE_API_KEY");
  const entitySecret = Deno.env.get("CIRCLE_ENTITY_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // Public API key: the dashboard RESERVES the SUPABASE_ prefix (custom
  // secrets may not use it), so read the operator-set PUBLIC_API_KEY first
  // and fall back to the runtime-injected names. Value is the publishable
  // key from Settings → API (legacy anon key also works).
  const anonKey = Deno.env.get("PUBLIC_API_KEY")
    ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!apiKey || !entitySecret || !supabaseUrl || !anonKey) {
    return json(500, { status: "error", reason: "misconfigured" });
  }

  // Caller identity: the user's own JWT, never a shared secret.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json(401, { status: "error", reason: "missing_auth" });
  }
  const authDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await authDb.auth.getUser();
  const userId = userData?.user?.id;
  if (userError || !userId) {
    return json(401, { status: "error", reason: "bad_auth" });
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return json(400, { status: "error", reason: "malformed_json" });
  }
  if (!isRecord(body)) {
    return json(400, { status: "error", reason: "malformed_payload" });
  }
  const action = asString(body["action"]) ?? "get-or-create";
  if (action !== "resolve" && action !== "create" && action !== "get-or-create") {
    return json(400, { status: "error", reason: "bad_action" });
  }

  // Scope: the caller's own tenant only. Anyone can invoke, but only their
  // owner's wallet set is reachable — keyed off-chain by Circle account, and
  // the address returned only ever lands in their own tenant row via RLS.
  const { data: tenant } = await authDb
    .from("tenants")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (tenant === null) {
    return json(404, { status: "error", reason: "tenant_not_found" });
  }

  if (action === "resolve" || action === "get-or-create") {
    const existing = await circleFetch(apiKey, "/wallets?pageSize=10");
    if (!existing.ok && (existing.status === 401 || existing.status === 403)) {
      return json(502, { status: "error", reason: "circle_unauthorized" });
    }
    const address = existing.ok ? pickArcAddress(existing.json) : null;
    if (address !== null) {
      return json(200, { status: "ok", address });
    }
    if (action === "resolve") {
      return json(404, { status: "error", reason: "wallet_not_found" });
    }
  }

  // Create: wallet set + one ARC-TESTNET wallet (mirrors the retired browser flow).
  const idempotencyKey = crypto.randomUUID();
  const setRes = await circleFetch(apiKey, "/developer/walletSets", {
    method: "POST",
    body: {
      idempotencyKey,
      entitySecretCiphertext: entitySecret,
      name: "PayStyle Merchant Wallet Set",
    },
  });
  const setId = setRes.ok ? pickWalletSetId(setRes.json) : null;
  if (setId === null) {
    return json(502, { status: "error", reason: circleFailure(setRes.status, "wallet_set_failed") });
  }
  const walletRes = await circleFetch(apiKey, "/developer/wallets", {
    method: "POST",
    body: {
      idempotencyKey: crypto.randomUUID(),
      entitySecretCiphertext: entitySecret,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      walletSetId: setId,
    },
  });
  const address = walletRes.ok ? pickArcAddress(walletRes.json) : null;
  if (address === null) {
    return json(502, { status: "error", reason: circleFailure(walletRes.status, "wallet_create_failed") });
  }
  return json(200, { status: "ok", address, created: true });
});
