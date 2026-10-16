// PayStyle — register-payout-address Edge Function.
//
// Adds the merchant's linked EVM payout address to the shared Alchemy
// Address Activity webhook (Notify API update-webhook-addresses) so
// verify-payment sees incoming USDC transfers without manual dashboard edits.
// Already-registered addresses count as success. Registration is best-effort:
// Notify failures return 200 {registered:false, reason} and must never break
// linking or payments.
//
// ── HUMAN SETUP (dashboards only; never put secrets in code) ─────────────
// (a) Supabase dashboard → Edge Functions → Secrets, set:
//       ALCHEMY_AUTH_TOKEN — Notify account auth token, from the top of the
//                            Alchemy webhooks dashboard (account-level,
//                            server-side only; the RPC API key cannot manage
//                            webhooks).
//       ALCHEMY_WEBHOOK_ID — the shared Address Activity webhook id, from the
//                            webhook page/URL in the Alchemy dashboard.
// (b) Alchemy dashboard → nothing else changes: the shared webhook already
//     exists (created manually); this function only appends addresses to it.
//     Deploy this function with verify_jwt=true (only the signed-in merchant
//     calls it; Alchemy never calls it).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

// ── Constants ────────────────────────────────────────────────────────────

const NOTIFY_UPDATE_URL = "https://dashboard.alchemy.com/api/update-webhook-addresses";
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Small helpers (English identifiers by convention) ────────────────────

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type OwnedTenant = { id: string; merchant_wallet_address: string | null };

// ── Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
  }
  if (req.method !== "POST") {
    return json(405, { registered: false, reason: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    // Never echo which variable is missing: that tells a prober what to guess.
    return json(500, { registered: false, reason: "misconfigured" });
  }

  // Authenticate the caller via their Supabase user JWT (standard Edge
  // Function pattern: forward the request Authorization header, then
  // auth.getUser()). No service-role key here: tenant ownership is checked
  // under the caller's own identity.
  const authHeader = req.headers.get("Authorization");
  if (authHeader === null || authHeader.trim() === "") {
    return json(401, { registered: false, reason: "unauthenticated" });
  }
  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await db.auth.getUser();
  const userId = userError ? null : (userData?.user?.id ?? null);
  if (userId === null) {
    return json(401, { registered: false, reason: "unauthenticated" });
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return json(400, { registered: false, reason: "malformed_json" });
  }
  if (!isRecord(body)) {
    return json(400, { registered: false, reason: "malformed_payload" });
  }

  const address = typeof body["address"] === "string" ? body["address"].trim() : "";
  if (!EVM_ADDRESS_RE.test(address)) {
    return json(400, { registered: false, reason: "invalid_address" });
  }
  const tenantIdRaw = body["tenant_id"];
  const requestedTenantId = typeof tenantIdRaw === "string" && tenantIdRaw.trim() !== ""
    ? tenantIdRaw.trim()
    : null;
  if (tenantIdRaw !== undefined && requestedTenantId === null && typeof tenantIdRaw !== "string") {
    return json(400, { registered: false, reason: "malformed_payload" });
  }

  // Resolve the target tenant server-side: only tenants owned by the caller
  // are ever considered, so tenant identity is never trusted from the body
  // alone. Preferred match is the owned tenant whose stored payout address
  // equals the address being registered (case-insensitive); otherwise the
  // caller's single tenant when they own exactly one.
  const { data: owned, error: tenantsError } = await db
    .from("tenants")
    .select("id, merchant_wallet_address")
    .eq("owner_id", userId);
  if (tenantsError) {
    return json(500, { registered: false, reason: "db_error" });
  }
  const ownedTenants = ((owned ?? []) as OwnedTenant[]).filter((t) => typeof t.id === "string");

  if (requestedTenantId !== null) {
    const match = ownedTenants.find((t) => t.id === requestedTenantId);
    if (!match) {
      return json(403, { registered: false, reason: "forbidden" });
    }
  } else {
    const normalized = address.toLowerCase();
    const byAddress = ownedTenants.filter(
      (t) => (t.merchant_wallet_address ?? "").toLowerCase() === normalized,
    );
    if (byAddress.length === 1) {
      // Exact owned match: the tenant this address belongs to.
    } else if (byAddress.length > 1) {
      return json(404, { registered: false, reason: "ambiguous_tenant" });
    } else if (ownedTenants.length === 1) {
      // Single-tenant caller: unambiguous without an address match yet
      // (first link persists the address, then registers it).
    } else if (ownedTenants.length === 0) {
      return json(404, { registered: false, reason: "no_tenant" });
    } else {
      return json(404, { registered: false, reason: "ambiguous_tenant" });
    }
  }

  const authToken = Deno.env.get("ALCHEMY_AUTH_TOKEN");
  const webhookId = Deno.env.get("ALCHEMY_WEBHOOK_ID");
  if (!authToken || !webhookId) {
    // Never echo which variable is missing: that tells a prober what to guess.
    return json(500, { registered: false, reason: "misconfigured" });
  }

  // Best-effort Notify call: transport/upstream failures return 200
  // {registered:false, reason} so the order/payment flow never breaks because
  // of webhook registration. Only auth/config problems are real errors.
  let notifyRes: Response;
  try {
    notifyRes = await fetch(NOTIFY_UPDATE_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Alchemy-Token": authToken,
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        addresses_to_add: [address],
        addresses_to_remove: [],
      }),
    });
  } catch {
    return json(200, { registered: false, reason: "notify_unreachable" });
  }

  if (notifyRes.ok) {
    return json(200, { registered: true, address });
  }

  // Idempotency: some Notify error shapes report duplicates with a non-2xx
  // status but an "already" message — that is still success.
  let notifyText = "";
  try {
    notifyText = await notifyRes.text();
  } catch {
    notifyText = "";
  }
  if (/already/i.test(notifyText)) {
    return json(200, { registered: true, address });
  }
  if (notifyRes.status === 401 || notifyRes.status === 403) {
    return json(502, { registered: false, reason: "notify_auth_failed" });
  }
  if (notifyRes.status === 404) {
    return json(500, { registered: false, reason: "webhook_not_found" });
  }
  return json(200, { registered: false, reason: "notify_error" });
});
