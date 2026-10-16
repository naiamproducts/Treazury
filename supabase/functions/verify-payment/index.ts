// PayStyle — verify-payment Edge Function.
//
// Verifies Alchemy ADDRESS_ACTIVITY webhooks (Arc Testnet USDC) and marks the
// matching PENDING charge as paid. Idempotent: redeliveries hit the
// payments_provider_ref_uidx unique index and are treated as already-done.
//
// ── HUMAN SETUP (dashboards only; never put secrets in code) ─────────────
// (a) Supabase dashboard → Edge Functions → Secrets, set:
//       ALCHEMY_API_KEY             — Alchemy API key (used for the finality
//                                     receipt/confirmations check via RPC).
//       ALCHEMY_WEBHOOK_SIGNING_KEY — the signing key shown on the Alchemy
//                                     webhook page (used for the HMAC check).
//     Optional: ALCHEMY_RPC_URL to override the RPC endpoint below.
//     SUPABASE_URL is auto-provided; the service-role key comes from env.
// (b) Alchemy dashboard → create an Address Activity webhook on Arc Testnet:
//       URL: https://qurpqhvsnytuhquudako.supabase.co/functions/v1/verify-payment
//       Add merchant payout addresses (today: direct-mode merchant addresses;
//       vault-per-order mode later via the Notify API update-webhook-addresses).
//     Deploy this function with verify_jwt=false (Alchemy calls it without a
//     Supabase JWT).
//
// ── FINALITY NOTE ─────────────────────────────────────────────────────────
// Alchemy does not retry a 200 response, so when a transfer is seen but not
// yet final (no success receipt or < 12 confirmations) this function returns
// 200 {"status":"wait_finality"} WITHOUT writing anything. The check-payment
// function (client-driven RPC verification — the primary path since Oct-2026,
// when the Alchemy transfer pipeline proved unreliable on Arc Testnet)
// re-evaluates such charges until they finalize.
//
// ── MATCHING LIMITS ──────────────────────────────────────────────────────
// In direct mode several pending charges can share one merchant address. When
// more than one pending charge matches (address, exact amount), the newest one
// wins and the rest stay pending for the poll fallback / manual review. Vault
// mode (one address per charge) removes this ambiguity.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

// ── Constants ────────────────────────────────────────────────────────────

const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";
const USDC_DECIMALS = 6;
const MIN_CONFIRMATIONS = 12;
const SIGNATURE_HEADER = "x-alchemy-signature";

// ── Small helpers (English identifiers by convention) ────────────────────

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length === 0 || clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

/** Constant-time comparison so signature checks do not leak via timing. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
): Promise<boolean> {
  if (header === null || header.trim() === "") return false;
  const presented = header.trim().toLowerCase().replace(/^sha256=/, "");
  const presentedBytes = hexToBytes(presented);
  if (presentedBytes === null) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  return constantTimeEqual(new Uint8Array(mac), presentedBytes);
}

/** Decimal money string ("10.50") → base units (10000000n for 6 decimals). */
function toBaseUnits(amount: string, decimals: number): bigint | null {
  const match = /^(-?\d+)(?:\.(\d+))?$/.exec(amount.trim());
  if (match === null) return null;
  const [, whole, frac = ""] = match;
  if (frac.length > decimals) return null;
  const base = 10n ** BigInt(decimals);
  const sign = whole.startsWith("-") ? -1n : 1n;
  const digits = whole.replace("-", "");
  return sign * (BigInt(digits) * base + BigInt((frac + "0".repeat(decimals)).slice(0, decimals) || "0"));
}

/** Hex ("0x5f5e100") or decimal base-unit string → bigint. */
function parseRawValue(raw: unknown): bigint | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const text = raw.trim();
  try {
    if (/^0x[0-9a-fA-F]+$/.test(text)) return BigInt(text);
    if (/^\d+$/.test(text)) return BigInt(text);
    return null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// ── Alchemy RPC (finality guard) ─────────────────────────────────────────

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed with HTTP ${res.status}`);
  const payload: unknown = await res.json();
  if (!isRecord(payload) || !isRecord(payload["result"] as unknown) && payload["result"] === undefined) {
    // result may legitimately be null (e.g. receipt not found) — only reject
    // on transport-level error shapes.
    if (isRecord(payload) && payload["error"] !== undefined) {
      throw new Error(`RPC ${method} returned an error`);
    }
  }
  return isRecord(payload) ? payload["result"] : null;
}

function parseHexBlock(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/** Success receipt + at least MIN_CONFIRMATIONS. Never throws: false on any doubt. */
async function isFinal(rpcUrl: string, txHash: string): Promise<boolean> {
  try {
    const receipt: unknown = await rpcCall(rpcUrl, "eth_getTransactionReceipt", [txHash]);
    if (!isRecord(receipt)) return false;
    if (receipt["status"] !== "0x1") return false;
    const txBlock = parseHexBlock(receipt["blockNumber"]);
    if (txBlock === null) return false;
    const head: unknown = await rpcCall(rpcUrl, "eth_blockNumber", []);
    const headBlock = parseHexBlock(head);
    if (headBlock === null) return false;
    return headBlock - txBlock >= BigInt(MIN_CONFIRMATIONS);
  } catch {
    return false;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return json(405, { status: "error", reason: "method_not_allowed" });
  }

  const signingKey = Deno.env.get("ALCHEMY_WEBHOOK_SIGNING_KEY");
  const apiKey = Deno.env.get("ALCHEMY_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!signingKey || !apiKey || !supabaseUrl || !serviceKey) {
    // Never echo which variable is missing: that tells a prober what to guess.
    return json(500, { status: "error", reason: "misconfigured" });
  }

  const rawBody = await req.text();
  const ok = await verifySignature(rawBody, req.headers.get(SIGNATURE_HEADER), signingKey);
  if (!ok) {
    return json(401, { status: "error", reason: "bad_signature" });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return json(400, { status: "error", reason: "malformed_json" });
  }
  if (!isRecord(body)) {
    return json(400, { status: "error", reason: "malformed_payload" });
  }

  const event = body["event"];
  const activity = isRecord(event) && Array.isArray(event["activity"])
    ? event["activity"]
    : null;
  if (activity === null) {
    return json(400, { status: "error", reason: "malformed_payload" });
  }

  const rpcUrl = Deno.env.get("ALCHEMY_RPC_URL") ?? `https://arc-testnet.g.alchemy.com/v2/${apiKey}`;
  const db = createClient(supabaseUrl, serviceKey);

  let applied = 0;
  let waiting = 0;
  let ignored = 0;

  for (const entry of activity) {
    if (!isRecord(entry)) {
      ignored++;
      continue;
    }

    // Reorg-awareness (mandatory): a log flagged removed was reorged out and
    // must never mark a charge as paid.
    const log = entry["log"];
    if (isRecord(log) && log["removed"] === true) {
      ignored++;
      continue;
    }

    // Only plain USDC token transfers on the expected contract.
    const category = asString(entry["category"])?.toLowerCase();
    if (category !== "token" && category !== "erc20") {
      ignored++;
      continue;
    }
    const asset = asString(entry["asset"]) ?? "";
    if (!asset.toLowerCase().includes("usdc")) {
      ignored++;
      continue;
    }
    const rawContract = isRecord(entry["rawContract"]) ? entry["rawContract"] : null;
    const contractAddress =
      (isRecord(log) ? asString(log["address"]) : null) ??
      (rawContract !== null ? asString(rawContract["address"]) : null) ??
      "";
    if (contractAddress.toLowerCase() !== USDC_CONTRACT) {
      ignored++;
      continue;
    }

    const toAddress = asString(entry["toAddress"]) ?? "";
    if (!/^0x[0-9a-fA-F]{40}$/.test(toAddress)) {
      ignored++;
      continue;
    }
    const txHash = asString(entry["hash"]) ?? "";
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      ignored++;
      continue;
    }
    const decimalsRaw = rawContract !== null ? rawContract["decimals"] : null;
    const decimals = typeof decimalsRaw === "number" ? decimalsRaw : USDC_DECIMALS;
    const receivedBase = parseRawValue(rawContract !== null ? rawContract["rawValue"] : null);
    if (receivedBase === null) {
      ignored++;
      continue;
    }

    // Candidate charges: vault address match OR merchant-direct address match,
    // pending only. Tenant scoping comes from the charge→order→tenant join
    // below; nothing about the tenant is trusted from the webhook payload.
    const { data: byVault, error: vaultError } = await db
      .from("charges")
      .select("id, tenant_id, order_id, amount, payment_provider, status, created_at")
      .eq("status", "pending")
      .ilike("vault_address", toAddress);
    if (vaultError) {
      return json(500, { status: "error", reason: "db_error" });
    }

    const { data: tenants, error: tenantError } = await db
      .from("tenants")
      .select("id")
      .ilike("merchant_wallet_address", toAddress);
    if (tenantError) {
      return json(500, { status: "error", reason: "db_error" });
    }
    const tenantIds = (tenants ?? []).map((t) => (t as { id: string }).id);
    let byMerchant: Array<{
      id: string; tenant_id: string; order_id: string | null; amount: string;
      payment_provider: string; status: string; created_at: string;
    }> = [];
    if (tenantIds.length > 0) {
      const { data, error } = await db
        .from("charges")
        .select("id, tenant_id, order_id, amount, payment_provider, status, created_at")
        .eq("status", "pending")
        .in("tenant_id", tenantIds);
      if (error) {
        return json(500, { status: "error", reason: "db_error" });
      }
      byMerchant = (data ?? []) as typeof byMerchant;
    }

    const seen = new Set<string>();
    const candidates = [...(byVault ?? []), ...byMerchant].filter((c) => {
      const row = c as { id: string };
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    }) as Array<{
      id: string; tenant_id: string; order_id: string | null; amount: string;
      payment_provider: string; status: string; created_at: string;
    }>;

    // Exact amount match in base units — no float math anywhere.
    const matches = candidates.filter((c) => {
      const expected = toBaseUnits(String(c.amount), decimals);
      return expected !== null && expected === receivedBase;
    });
    if (matches.length === 0) {
      ignored++;
      continue;
    }
    // Newest first: deterministic when direct-mode duplicates collide.
    matches.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const charge = matches[0];

    // Tenant scoping: the charge's tenant must equal its order's tenant.
    // (charges without an order are direct-mode rows keyed by the merchant
    // address lookup above, which is already tenant-derived server-side.)
    if (charge.order_id !== null) {
      const { data: order, error: orderError } = await db
        .from("orders")
        .select("id, tenant_id")
        .eq("id", charge.order_id)
        .single();
      if (orderError || order === null) {
        ignored++;
        continue;
      }
      if ((order as { tenant_id: string }).tenant_id !== charge.tenant_id) {
        ignored++;
        continue;
      }
    }

    // Finality guard: success receipt + 12 confirmations, else leave the
    // charge untouched for the poll fallback.
    const final = await isFinal(rpcUrl, txHash);
    if (!final) {
      waiting++;
      continue;
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await db
      .from("charges")
      .update({
        status: "paid",
        tx_hash: txHash.toLowerCase(),
        amount_received: String(charge.amount),
        paid_at: now,
      })
      .eq("id", charge.id)
      .eq("status", "pending")
      .select("id");
    if (updateError) {
      return json(500, { status: "error", reason: "db_error" });
    }
    if ((updated ?? []).length === 0) {
      // Lost the race (already paid by a redelivery): idempotent, not an error.
      applied++;
      continue;
    }

    const { error: paymentError } = await db.from("payments").insert({
      tenant_id: charge.tenant_id,
      charge_id: charge.id,
      amount: String(charge.amount),
      currency: "USD",
      payment_provider: charge.payment_provider,
      provider_ref: txHash.toLowerCase(),
      paid_at: now,
      tx_hash: txHash.toLowerCase(),
      from_address: asString(entry["fromAddress"]),
      raw_event: entry as Record<string, never>,
    });
    if (paymentError) {
      // 23505 = redelivery of an already-recorded payment: already done.
      if (paymentError.code !== "23505") {
        return json(500, { status: "error", reason: "db_error" });
      }
    }

    // Advance the order so the dashboard (which reads orders.status) goes
    // live. Best-effort: the money is already recorded above.
    if (charge.order_id !== null) {
      await db.from("orders").update({ status: "paid" }).eq("id", charge.order_id);
    }
    applied++;
  }

  if (waiting > 0 && applied === 0) {
    return json(200, { status: "wait_finality", applied, waiting, ignored });
  }
  return json(200, { status: "ok", applied, waiting, ignored });
});
