// PayStyle — check-payment Edge Function.
//
// PRIMARY reconciliation path: client-driven verification of a buyer's payment
// via direct RPC receipt inspection. The buyer (public payment link) or the
// merchant dashboard submits the payment tx hash; this function verifies it
// against on-chain truth and marks the matching PENDING charge as paid.
// Webhooks (verify-payment) remain as a best-effort fast path — both write
// through the same idempotent rows (conditional charge update + the
// payments_provider_ref_uidx unique index).
//
// Why receipts instead of webhooks: Alchemy's Address Activity pipeline (the
// Transfers API that feeds webhooks) silently drops transfers on Arc Testnet —
// observed Oct-2026: the same tx hash served at different block heights per
// backend, and confirmed transfers missing from the transfer index while
// eth_getTransactionReceipt kept serving them. So the primary path reads
// receipts directly and never waits for a webhook.
//
// Reorg resistance (three gates; Oct-2026 Arc split lessons):
// (1) Shared head — Alchemy and the public RPC must report the SAME latest
//     block hash; different heads = active split, refuse outright.
// (2) Dual-backend receipt + canonical anchor — both backends return the same
//     blockHash for the tx, and eth_getBlockByNumber reports that hash as the
//     canonical occupant on both.
// (3) State proof — receipts and block hashes are views, balances are ground
//     truth: the destination's USDC balance must have risen by at least the
//     expected amount across the tx's own block (txBlock-1 → txBlock), on
//     both backends. (Two backends once agreed on a success receipt AND a
//     canonical block hash for a transfer that state proved never happened —
//     gate 3 exists because of that day.) The historical window (not →latest)
//     makes the proof immune to later spends, vault sweeps, or fee claims,
//     so it works identically for vault and merchant-direct charges.
// Any gate failing → honestly pending, never paid.
//
// Abuse note: anyone can submit any tx hash (public link, no JWT — deploy with
// verify_jwt=false), but only a real on-chain USDC transfer of the exact
// amount to this charge's destination can mark it paid. This function never
// moves funds; a bogus submission only costs a handful of RPC calls.
//
// Env (dashboard → Edge Functions → Secrets; never in code):
//   ALCHEMY_API_KEY              — fallback for building the primary RPC URL.
//   ALCHEMY_ARC_TESTNET_RPC_URL  — preferred primary RPC URL (takes precedence).
//   ALCHEMY_RPC_URL              — alternate override (same as verify-payment).
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — auto-provided / dashboard secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

// ── Constants ────────────────────────────────────────────────────────────

const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";
const USDC_DECIMALS = 6;
const ARC_TESTNET_CHAIN_ID = 5042002;
const MIN_CONFIRMATIONS = 12;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
// Public fallback backend: no secret, safe to hardcode (same value the
// frontend's viem public client uses).
const PUBLIC_RPC_URL = "https://rpc.testnet.arc.io";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH_RE = /^0x[0-9a-fA-F]{64}$/;
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Small helpers (English identifiers by convention; mirrored from ───────
// ── verify-payment so this function deploys self-contained) ──────────────

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
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

function parseHexBigint(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

// ── RPC ──────────────────────────────────────────────────────────────────

async function rpcResult(rpcUrl: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) return null;
  try {
    const payload: unknown = await res.json();
    return isRecord(payload) ? (payload["result"] ?? null) : null;
  } catch {
    return null;
  }
}

interface CheckedReceipt {
  blockNumber: bigint;
  blockHash: string;
  from: string;
  to: string;
  value: bigint;
}

function tailAddress(word: unknown): string | null {
  if (typeof word !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(word)) return null;
  return ("0x" + word.slice(-40)).toLowerCase();
}

/**
 * Extract the USDC Transfer-to-destination from a receipt's logs. Returns the
 * matched transfer or null. Never throws. Reads logs directly (not the
 * Transfers API) so a lagging/gapped transfer index cannot hide a payment —
 * and an indexed-but-reorged transfer cannot fake one.
 */
function matchTransfer(
  receipt: unknown,
  destination: string,
  expectedBase: bigint,
): CheckedReceipt | null {
  if (!isRecord(receipt)) return null;
  if (receipt["status"] !== "0x1") return null;
  const blockNumber = parseHexBigint(receipt["blockNumber"]);
  const blockHash = asString(receipt["blockHash"])?.toLowerCase() ?? null;
  if (blockNumber === null || blockHash === null || !/^0x[0-9a-f]{64}$/.test(blockHash)) {
    return null;
  }
  const logs = receipt["logs"];
  if (!Array.isArray(logs)) return null;
  const dest = destination.toLowerCase();
  for (const entry of logs) {
    if (!isRecord(entry)) continue;
    if (asString(entry["address"])?.toLowerCase() !== USDC_CONTRACT) continue;
    const topics = entry["topics"];
    if (!Array.isArray(topics) || topics.length < 3) continue;
    if (asString(topics[0])?.toLowerCase() !== TRANSFER_TOPIC) continue;
    const from = tailAddress(topics[1]);
    const to = tailAddress(topics[2]);
    if (from === null || to === null || to !== dest) continue;
    let value: bigint;
    try {
      const data = asString(entry["data"]);
      if (data === null || !/^0x[0-9a-fA-F]*$/.test(data)) continue;
      value = BigInt(data === "0x" ? "0x0" : data);
    } catch {
      continue;
    }
    if (value < expectedBase) continue;
    return { blockNumber, blockHash, from, to, value };
  }
  return null;
}

// ── Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
  }
  if (req.method !== "POST") {
    return json(405, { status: "error", reason: "method_not_allowed" });
  }

  const apiKey = Deno.env.get("ALCHEMY_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const primaryRpc =
    Deno.env.get("ALCHEMY_ARC_TESTNET_RPC_URL") ??
    Deno.env.get("ALCHEMY_RPC_URL") ??
    (apiKey ? `https://arc-testnet.g.alchemy.com/v2/${apiKey}` : null);
  if (!supabaseUrl || !serviceKey || (!apiKey && !primaryRpc)) {
    return json(500, { status: "error", reason: "misconfigured" });
  }
  const rpcA = primaryRpc as string;
  const rpcB = PUBLIC_RPC_URL;

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return json(400, { status: "error", reason: "malformed_json" });
  }
  if (!isRecord(body)) {
    return json(400, { status: "error", reason: "malformed_payload" });
  }
  const chargeId = asString(body["charge_id"]);
  if (chargeId === null || !UUID_RE.test(chargeId)) {
    return json(400, { status: "error", reason: "bad_charge_id" });
  }
  const submittedTx = asString(body["tx_hash"]);
  if (submittedTx !== null && !HASH_RE.test(submittedTx)) {
    return json(400, { status: "error", reason: "bad_tx_hash" });
  }

  const db = createClient(supabaseUrl, serviceKey);

  const { data: charge, error: chargeError } = await db
    .from("charges")
    .select("id, tenant_id, order_id, amount, payment_provider, status, tx_hash, vault_address")
    .eq("id", chargeId)
    .single();
  if (chargeError || charge === null) {
    return json(404, { status: "error", reason: "charge_not_found" });
  }
  const row = charge as {
    id: string; tenant_id: string; order_id: string | null; amount: string;
    payment_provider: string; status: string; tx_hash: string | null;
    vault_address: string | null;
  };
  if (row.status === "paid") {
    return json(200, { status: "already_paid", charge_id: row.id });
  }
  if (row.status !== "pending") {
    return json(422, { status: "error", reason: "charge_not_payable" });
  }

  const txHash = (submittedTx ?? row.tx_hash ?? "").toLowerCase();
  if (!HASH_RE.test(txHash)) {
    return json(200, { status: "no_tx", charge_id: row.id });
  }

  // Remember a newly submitted hash so later polls (and a future server-side
  // sweeper) can re-check without the client.
  if (submittedTx !== null && submittedTx.toLowerCase() !== (row.tx_hash ?? "").toLowerCase()) {
    const { error: hashError } = await db
      .from("charges")
      .update({ tx_hash: txHash })
      .eq("id", row.id)
      .eq("status", "pending");
    if (hashError) {
      return json(500, { status: "error", reason: "db_error" });
    }
  }

  // Expected destination: vault charge first, merchant-direct second. Both
  // resolved server-side — nothing about the destination is trusted from the
  // caller.
  let destination = (row.vault_address ?? "").trim();
  if (!ADDR_RE.test(destination)) {
    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("merchant_wallet_address")
      .eq("id", row.tenant_id)
      .single();
    if (tenantError || tenant === null) {
      return json(500, { status: "error", reason: "db_error" });
    }
    destination = ((tenant as { merchant_wallet_address: string | null }).merchant_wallet_address ?? "").trim();
  }
  if (!ADDR_RE.test(destination)) {
    return json(422, { status: "error", reason: "no_destination" });
  }
  const expectedBase = toBaseUnits(String(row.amount), USDC_DECIMALS);
  if (expectedBase === null) {
    return json(500, { status: "error", reason: "db_error" });
  }

  // ── Gate 1: shared history ─────────────────────────────────────────
  // Both backends must agree on the canonical chain at their shared height.
  // Comparing "latest" hashes for exact equality is too strict: a backend
  // that merely lags a few blocks (Alchemy behind the public RPC) is not a
  // fork. Real forks show different hashes AT THE SAME HEIGHT, so we fetch
  // the block at min(headA, headB) from both and compare there. A lagging
  // backend on the same chain passes; a true split fails. Confirmations are
  // counted from the shared height (the conservative anchor).
  const [headBlockA, headBlockB] = await Promise.all([
    rpcResult(rpcA, "eth_getBlockByNumber", ["latest", false]),
    rpcResult(rpcB, "eth_getBlockByNumber", ["latest", false]),
  ]);
  const headNumA = isRecord(headBlockA) ? parseHexBigint(headBlockA["number"]) : null;
  const headNumB = isRecord(headBlockB) ? parseHexBigint(headBlockB["number"]) : null;
  if (headNumA === null || headNumB === null) {
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }
  const sharedHeight = headNumA < headNumB ? headNumA : headNumB;
  let sharedHashA: string | null;
  let sharedHashB: string | null;
  if (headNumA === headNumB) {
    // Same height: compare the latest blocks directly (one fewer RPC call).
    sharedHashA = isRecord(headBlockA) ? asString(headBlockA["hash"])?.toLowerCase() ?? null : null;
    sharedHashB = isRecord(headBlockB) ? asString(headBlockB["hash"])?.toLowerCase() ?? null : null;
  } else {
    // Heights differ (lag): compare at the shared height.
    const sharedHex = "0x" + sharedHeight.toString(16);
    const [sharedA, sharedB] = await Promise.all([
      rpcResult(rpcA, "eth_getBlockByNumber", [sharedHex, false]),
      rpcResult(rpcB, "eth_getBlockByNumber", [sharedHex, false]),
    ]);
    sharedHashA = isRecord(sharedA) ? asString(sharedA["hash"])?.toLowerCase() ?? null : null;
    sharedHashB = isRecord(sharedB) ? asString(sharedB["hash"])?.toLowerCase() ?? null : null;
  }
  if (sharedHashA === null || sharedHashA !== sharedHashB) {
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }

  // ── Gate 2: dual-backend receipt + canonical anchor ────────────────────
  const [receiptA, receiptB] = await Promise.all([
    rpcResult(rpcA, "eth_getTransactionReceipt", [txHash]),
    rpcResult(rpcB, "eth_getTransactionReceipt", [txHash]),
  ]);
  const matchA = matchTransfer(receiptA, destination, expectedBase);
  const matchB = matchTransfer(receiptB, destination, expectedBase);

  if (matchA === null && matchB === null) {
    // Either the tx is unknown everywhere (typo, mempool, or an orphaned fork
    // no backend serves anymore) or it exists but does not pay this charge.
    const seenAnywhere = isRecord(receiptA) || isRecord(receiptB);
    return json(200, {
      status: seenAnywhere ? "mismatch" : "not_found",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }
  if (matchA === null || matchB === null || matchA.blockHash !== matchB.blockHash) {
    // Backends disagree: one serves a fork the other does not follow. Honest
    // answer is pending — never mark paid on a single backend's word during a
    // split (Oct-2026 lesson).
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }

  // ── Canonical anchoring ──────────────────────────────────────────────
  // Receipt lookups do not prove canonicality (see header). The receipt's
  // block counts only if the canonical block at that height hashes the same.
  const blockNumHex = "0x" + matchA.blockNumber.toString(16);
  const [canonA, canonB] = await Promise.all([
    rpcResult(rpcA, "eth_getBlockByNumber", [blockNumHex, false]),
    rpcResult(rpcB, "eth_getBlockByNumber", [blockNumHex, false]),
  ]);
  const canonHashA = isRecord(canonA) ? asString(canonA["hash"])?.toLowerCase() ?? null : null;
  const canonHashB = isRecord(canonB) ? asString(canonB["hash"])?.toLowerCase() ?? null : null;
  if (canonHashA !== matchA.blockHash || canonHashB !== matchA.blockHash) {
    // The tx sits on an orphaned fork (or backends serve stale heads).
    // Balances prove it: canonical state does not contain this transfer.
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }

  const confirmations = sharedHeight - matchA.blockNumber;
  if (confirmations < BigInt(MIN_CONFIRMATIONS)) {
    return json(200, {
      status: "wait_finality",
      charge_id: row.id,
      tx_hash: txHash,
      confirmations: Number(confirmations),
    });
  }

  // ── Gate 3: money actually moved (dual-backend state proof) ────────────
  // Receipts and block hashes are views; balances are ground truth. The
  // destination's USDC balance must have risen by at least the expected
  // amount across the tx's own block window (txBlock-1 → txBlock), on both
  // backends. The historical window (not →latest) keeps the proof valid for
  // vault charges too: sweeps and fee claims move balance AFTER the tx and
  // cannot corrupt a rise measured inside the tx's own block.
  const prevHex = "0x" + (matchA.blockNumber - 1n).toString(16);
  const balCall = {
    to: USDC_CONTRACT,
    data: "0x70a08231" + "000000000000000000000000" + destination.slice(2).toLowerCase(),
  };
  const [dPrevA, dPrevB, dCurA, dCurB] = await Promise.all([
    rpcResult(rpcA, "eth_call", [balCall, prevHex]),
    rpcResult(rpcB, "eth_call", [balCall, prevHex]),
    rpcResult(rpcA, "eth_call", [balCall, blockNumHex]),
    rpcResult(rpcB, "eth_call", [balCall, blockNumHex]),
  ]);
  const prevA = parseHexBigint(dPrevA);
  const prevB = parseHexBigint(dPrevB);
  const curA = parseHexBigint(dCurA);
  const curB = parseHexBigint(dCurB);
  if (prevA === null || prevB === null || curA === null || curB === null) {
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }
  const riseA = curA - prevA;
  const riseB = curB - prevB;
  if (riseA < expectedBase || riseB < expectedBase) {
    // State proves the transfer never landed in the canonical chain.
    return json(200, {
      status: "unconfirmed_fork",
      charge_id: row.id,
      tx_hash: txHash,
    });
  }

  // ── Mark paid (same idempotent write path as verify-payment) ──────────
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from("charges")
    .update({
      status: "paid",
      tx_hash: txHash,
      block_number: Number(matchA.blockNumber),
      amount_received: String(row.amount),
      paid_at: now,
    })
    .eq("id", row.id)
    .eq("status", "pending")
    .select("id");
  if (updateError) {
    return json(500, { status: "error", reason: "db_error" });
  }
  if ((updated ?? []).length === 0) {
    return json(200, { status: "already_paid", charge_id: row.id });
  }

  const { error: paymentError } = await db.from("payments").insert({
    tenant_id: row.tenant_id,
    charge_id: row.id,
    amount: String(row.amount),
    currency: "USD",
    payment_provider: row.payment_provider,
    provider_ref: txHash,
    paid_at: now,
    tx_hash: txHash,
    from_address: matchA.from,
    block_number: Number(matchA.blockNumber),
    chain_id: ARC_TESTNET_CHAIN_ID,
    raw_event: {
      source: "check-payment",
      txHash,
      blockNumber: Number(matchA.blockNumber),
      blockHash: matchA.blockHash,
      confirmations: Number(confirmations),
      backends_agree: ["alchemy", "public"],
      canonical_block: true,
      state_rise: { alchemy: riseA.toString(), public: riseB.toString() },
      matchedTransfer: { from: matchA.from, to: matchA.to, value: matchA.value.toString() },
    },
  });
  if (paymentError) {
    if (paymentError.code !== "23505") {
      return json(500, { status: "error", reason: "db_error" });
    }
  }

  if (row.order_id !== null) {
    await db.from("orders").update({ status: "paid" }).eq("id", row.order_id);
  }
  return json(200, {
    status: "paid",
    charge_id: row.id,
    tx_hash: txHash,
    confirmations: Number(confirmations),
  });
});
