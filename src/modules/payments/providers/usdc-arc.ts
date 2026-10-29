/**
 * USDCArcProvider
 *
 * Implements PaymentProvider for USDC payments on Arc (testnet and mainnet).
 *
 * createCharge flow:
 * 1. Call PaymentRouter.computeVaultAddress() to predict the CREATE2 vault address
 * 2. Call PaymentRouter.createOrder() on-chain (requires owner signature from backend)
 * In the PoC the owner private key is held client-side via VITE_ROUTER_OWNER_KEY.
 * In production this call goes through a backend route.
 * 3. Build the payment URL with ?vault=<address>&amount=&memo=&chargeId=
 *
 * checkStatus flow:
 * - Read USDC balanceOf(vault) — if >= expectedAmount the vault will sweep on settle()
 * - Optionally accept a tx hash and verify the receipt
 *
 * STUB for future providers (SantanderPay etc.) lives at the bottom of this file.
 */

import { v4 as uuidv4 } from 'uuid'
import {
 createPublicClient, createWalletClient, http,
 encodeAbiParameters, keccak256, toBytes,
 type Address, type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getUsdc } from '@/onchain-facts'
import { arc, ARC_MAINNET_CHAIN_ID } from '@/lib/arc-chain'
import { parseAmount } from '@/onchain-money'
import type {
 PaymentProvider,
 PaymentCharge,
 PaymentReceipt,
 CreateChargeParams,
 CheckStatusParams,
} from '../interface'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ARC_CHAIN_ID = ARC_MAINNET_CHAIN_ID
const ARC_RPC = 'https://rpc.mainnet.arc.io'
const DEFAULT_TTL_SECONDS = 86_400 // 24 h

// PaymentRouter address — Arc TESTNET deployment only (redeployed Oct-2026:
// adds deposit/depositWithPermit on OrderVault; also fixes usdcToken). There
// is NO PaymentRouter on Arc mainnet; with the default VITE_PAYMENT_PATH=direct
// this constant is only referenced by the reversible legacy vault branches.
const PAYMENT_ROUTER_ADDRESS = '0x83DF8E097F2f8A5e19a291eb45FEff3A69bBF802' as Address

// Basis points for the legacy testnet deployment: 1% platform, 0.5% dev.
// Dead under the default direct path; removed for real by S1 (de-custodize).
const PLATFORM_FEE_BPS = 100
const DEV_FEE_BPS = 50

// Minimal ABIs — only what we call
const ROUTER_ABI = [
 {
 name: 'createOrder',
 type: 'function',
 stateMutability: 'nonpayable',
 inputs: [
 {
 name: 'p',
 type: 'tuple',
 components: [
 { name: 'chargeId', type: 'bytes32' },
 { name: 'merchant', type: 'address' },
 { name: 'devWallet', type: 'address' },
 { name: 'expectedAmount', type: 'uint256' },
 { name: 'platformFeeBps', type: 'uint16' },
 { name: 'devFeeBps', type: 'uint16' },
 { name: 'platformTreasury', type: 'address' },
 { name: 'deadline', type: 'uint256' },
 ],
 },
 { name: 'signature', type: 'bytes' },
 ],
 outputs: [{ name: 'vault', type: 'address' }],
 },
 {
 name: 'computeVaultAddress',
 type: 'function',
 stateMutability: 'view',
 inputs: [
 {
 name: 'p',
 type: 'tuple',
 components: [
 { name: 'chargeId', type: 'bytes32' },
 { name: 'merchant', type: 'address' },
 { name: 'devWallet', type: 'address' },
 { name: 'expectedAmount', type: 'uint256' },
 { name: 'platformFeeBps', type: 'uint16' },
 { name: 'devFeeBps', type: 'uint16' },
 { name: 'platformTreasury', type: 'address' },
 { name: 'deadline', type: 'uint256' },
 ],
 },
 ],
 outputs: [{ name: '', type: 'address' }],
 },
] as const

const VAULT_ABI = [
 {
 name: 'settle',
 type: 'function',
 stateMutability: 'nonpayable',
 inputs: [],
 outputs: [],
 },
 {
 name: 'received',
 type: 'function',
 stateMutability: 'view',
 inputs: [],
 outputs: [{ name: '', type: 'uint256' }],
 },
 {
 name: 'swept',
 type: 'function',
 stateMutability: 'view',
 inputs: [],
 outputs: [{ name: '', type: 'bool' }],
 },
 {
 name: 'expectedAmount',
 type: 'function',
 stateMutability: 'view',
 inputs: [],
 outputs: [{ name: '', type: 'uint256' }],
 },
] as const

const ERC20_BALANCE_ABI = [
 {
 name: 'balanceOf',
 type: 'function',
 stateMutability: 'view',
 inputs: [{ name: 'account', type: 'address' }],
 outputs: [{ name: '', type: 'uint256' }],
 },
] as const

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

export interface USDCArcProviderConfig {
 /** Base URL for payment pages (e.g. window.location.origin) */
 paymentPageBaseUrl: string
 /** Arc RPC URL. Falls back to the public Arc mainnet RPC. */
 rpcUrl?: string
 /** Chain ID: 5042 (Arc mainnet). Defaults to mainnet. */
 chainId?: number
 /**
 * Owner private key for signing createOrder params.
 * PoC only — in production this lives in a backend route.
 * Read from VITE_ROUTER_OWNER_KEY env var.
 */
 ownerPrivateKey?: Hex
 /** Platform treasury address (receives platformFee). Defaults to deployer. */
 platformTreasury?: Address
 /** Dev wallet address (receives devFee). Optional. */
 devWallet?: Address
 /** TTL for generated charges in seconds. Default 24h. */
 defaultTtlSeconds?: number
 /**
 * Payment link path: 'direct' (DEFAULT — buyer
 * transfers ?to= straight to the merchant wallet; honest non-custodial
 * demo) or 'vault' (legacy PaymentRouter/OrderVault path, testnet only —
 * no mainnet router exists). Env override: VITE_PAYMENT_PATH=vault.
 */
 paymentPath?: 'direct' | 'vault'
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export class USDCArcProvider implements PaymentProvider {
 readonly key = 'usdc_arc'
 readonly displayName = 'USDC on Arc'
 readonly supportedCurrencies = ['USDC'] as const

 private readonly cfg: Required<USDCArcProviderConfig>

 constructor(config: USDCArcProviderConfig) {
 // Deployer wallet is the platform treasury by default
 const defaultTreasury = '0x5B12Ce46C7194aD57d143bC22847224047b1Ef42' as Address

 this.cfg = {
 paymentPageBaseUrl: config.paymentPageBaseUrl,
 rpcUrl: config.rpcUrl ?? ARC_RPC,
 chainId: config.chainId ?? ARC_CHAIN_ID,
 ownerPrivateKey: config.ownerPrivateKey ??
 ((import.meta.env.VITE_ROUTER_OWNER_KEY as string | undefined) ?? '') as Hex,
 platformTreasury: config.platformTreasury ?? defaultTreasury,
 devWallet: config.devWallet ?? '0x0000000000000000000000000000000000000000',
 defaultTtlSeconds: config.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS,
 // Default 'direct': the demo/public path is the buyer→merchant transfer.
 paymentPath: config.paymentPath ?? ((import.meta.env.VITE_PAYMENT_PATH as string | undefined) === 'vault' ? 'vault': 'direct'),
 }
 }

 get isAvailable(): boolean {
 return Boolean(this.cfg.paymentPageBaseUrl)
 }

 // ── createCharge ──────────────────────────────────────────────────────────

 async createCharge(params: CreateChargeParams): Promise<PaymentCharge> {
 if (!this.supportedCurrencies.includes(params.currency as 'USDC')) {
 throw new Error(
 `USDCArcProvider: unsupported currency '${params.currency}'. ` +
 `Supported: ${this.supportedCurrencies.join(', ')}`,
 )
 }

 const chargeId = uuidv4()
 const now = new Date()
 const ttl = params.ttlSeconds ?? this.cfg.defaultTtlSeconds
 const deadline = BigInt(Math.floor(now.getTime() / 1000) + ttl)

 // Parse amount to USDC raw units (6 decimals on Arc)
 const usdcFact = getUsdc(this.cfg.chainId)
 if (!usdcFact) throw new Error(`No USDC info for chainId ${this.cfg.chainId}`)
 const usdcAddress = usdcFact.address as Address
 const expectedAmount = parseAmount(this.cfg.chainId, params.amount).raw

 // Convert chargeId (uuid string) to bytes32
 const chargeIdBytes32 = this.#uuidToBytes32(chargeId)

 // Build the OrderParams tuple
 const orderParams = {
 chargeId: chargeIdBytes32,
 merchant: params.recipientRef as Address,
 devWallet: this.cfg.devWallet,
 expectedAmount,
 platformFeeBps: PLATFORM_FEE_BPS,
 devFeeBps: DEV_FEE_BPS,
 platformTreasury: this.cfg.platformTreasury,
 deadline,
 }

 // Public client for view calls
 const publicClient = createPublicClient({
 chain: arc,
 transport: http(this.cfg.rpcUrl),
 })

 let vaultAddress: Address | undefined

 // demo posture: with the default paymentPath 'direct' BOTH vault
 // branches are skipped and the link falls through to ?to= (direct
 // merchant transfer). The vault code below stays as reversible dead code
 // until S1 strips it; set VITE_PAYMENT_PATH=vault (testnet only — no
 // mainnet router) to restore the legacy behavior.
 const vaultPathEnabled = this.cfg.paymentPath === 'vault'

 // If owner key is available, deploy the vault on-chain
 if (vaultPathEnabled && this.cfg.ownerPrivateKey && this.cfg.ownerPrivateKey.length > 2) {
 try {
 vaultAddress = await this.#deployVault(publicClient, orderParams)
 } catch (err) {
 // Log but don't fail — fall back to URL-only mode
 console.warn('[USDCArcProvider] createOrder failed, falling back to URL mode:', err)
 }
 } else if (vaultPathEnabled) {
 // No owner key: predict the address without deploying
 try {
 vaultAddress = await publicClient.readContract({
 address: PAYMENT_ROUTER_ADDRESS,
 abi: ROUTER_ABI,
 functionName: 'computeVaultAddress',
 args: [orderParams],
 })
 } catch {
 // RPC not available or contract not reachable — proceed without vault
 }
 }

 // Build payment URL
 const url = new URL(this.cfg.paymentPageBaseUrl)
 if (vaultAddress) {
 url.searchParams.set('vault', vaultAddress)
 } else {
 // Fallback: direct transfer to merchant (no contract routing)
 url.searchParams.set('to', params.recipientRef)
 }
 url.searchParams.set('amount', params.amount)
 url.searchParams.set('memo', params.description)
 url.searchParams.set('chargeId', chargeId)
 url.searchParams.set('chainId', String(this.cfg.chainId))
 // Buyer display currency (settlement stays USDC — see interface docs).
 if (params.displayCurrency) url.searchParams.set('display', params.displayCurrency)
 // Merchant identity + bank details for the Linktree-style payment page.
 // Display-only: reconciliation keys off chargeId/tx_hash, never these.
 if (params.merchantName) url.searchParams.set('mname', params.merchantName)
 if (params.bankName) url.searchParams.set('bname', params.bankName)
 if (params.bankAlias) url.searchParams.set('balias', params.bankAlias)
 if (params.bankAccount) url.searchParams.set('bacct', params.bankAccount)
 if (vaultAddress) url.searchParams.set('merchant', params.recipientRef)

 return {
 id: chargeId,
 providerKey: this.key,
 amount: params.amount,
 currency: params.currency,
 paymentUrl: url.toString(),
 status: 'pending',
 createdAt: now.toISOString(),
 expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
 metadata: {
 chainId: String(this.cfg.chainId),
 recipientAddress: params.recipientRef,
 usdcAddress,
 vaultAddress: vaultAddress ?? '',
 ...(params.order ? { orderId: params.order.id }: {}),
 },
 }
 }

 // ── checkStatus ───────────────────────────────────────────────────────────

 async checkStatus(params: CheckStatusParams): Promise<PaymentReceipt | null> {
 if (!params.transactionRef) return null

 // tx hash path
 if (/^0x[0-9a-fA-F]{64}$/.test(params.transactionRef)) {
 return this.#receiptFromTxHash(params.chargeId, params.transactionRef)
 }

 // vault address path — read balanceOf
 if (/^0x[0-9a-fA-F]{40}$/.test(params.transactionRef)) {
 return this.#statusFromVault(params.chargeId, params.transactionRef as Address)
 }

 return null
 }

 // ── private: deploy vault ─────────────────────────────────────────────────

 async #deployVault(
 publicClient: ReturnType<typeof createPublicClient>,
 orderParams: {
 chargeId: Hex
 merchant: Address
 devWallet: Address
 expectedAmount: bigint
 platformFeeBps: number
 devFeeBps: number
 platformTreasury: Address
 deadline: bigint
 },
 ): Promise<Address> {
 const account = privateKeyToAccount(this.cfg.ownerPrivateKey)
 const chainId = BigInt(this.cfg.chainId)

 // Build the EIP-191 digest the contract expects:
 // toEthSignedMessageHash(keccak256(abi.encode(chargeId, merchant, devWallet,
 // expectedAmount, platformFeeBps, devFeeBps, platformTreasury, deadline, chainId, router)))
 const innerHash = keccak256(
 encodeAbiParameters(
 [
 { type: 'bytes32' }, // chargeId
 { type: 'address' }, // merchant
 { type: 'address' }, // devWallet
 { type: 'uint256' }, // expectedAmount
 { type: 'uint16' }, // platformFeeBps
 { type: 'uint16' }, // devFeeBps
 { type: 'address' }, // platformTreasury
 { type: 'uint256' }, // deadline
 { type: 'uint256' }, // chainId
 { type: 'address' }, // router
 ],
 [
 orderParams.chargeId,
 orderParams.merchant,
 orderParams.devWallet,
 orderParams.expectedAmount,
 orderParams.platformFeeBps,
 orderParams.devFeeBps,
 orderParams.platformTreasury,
 orderParams.deadline,
 chainId,
 PAYMENT_ROUTER_ADDRESS,
 ],
 ),
 )

 // EIP-191 prefix: "\x19Ethereum Signed Message:\n32"
 const prefixedHash = keccak256(
 new Uint8Array([
 ...toBytes('\x19Ethereum Signed Message:\n32'),
 ...toBytes(innerHash),
 ]),
 )

 // account.sign returns a hex signature string (65 bytes, EIP-191 compact form)
 const signature = await account.sign({ hash: prefixedHash })

 const walletClient = createWalletClient({
 account,
 chain: arc,
 transport: http(this.cfg.rpcUrl),
 })

 const hash = await walletClient.writeContract({
 address: PAYMENT_ROUTER_ADDRESS,
 abi: ROUTER_ABI,
 functionName: 'createOrder',
 args: [orderParams, signature],
 })

 // Wait for receipt
 await publicClient.waitForTransactionReceipt({ hash })

 // Read the deployed vault address from the mapping
 const vault = await publicClient.readContract({
 address: PAYMENT_ROUTER_ADDRESS,
 abi: ROUTER_ABI,
 functionName: 'computeVaultAddress',
 args: [orderParams],
 })

 return vault
 }

 // ── private: receipt from tx hash ─────────────────────────────────────────

 async #receiptFromTxHash(chargeId: string, txHash: string): Promise<PaymentReceipt | null> {
 try {
 const res = await fetch(this.cfg.rpcUrl, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 jsonrpc: '2.0', id: 1,
 method: 'eth_getTransactionReceipt',
 params: [txHash],
 }),
 })
 if (!res.ok) return null
 const json = await res.json() as { result?: { status?: string; blockNumber?: string } | null }
 const receipt = json.result
 if (!receipt) return null
 return {
 chargeId,
 providerKey: this.key,
 status: receipt.status === '0x1' ? 'paid': 'failed',
 amountReceived: '',
 currency: 'USDC',
 transactionRef: txHash,
 confirmedAt: new Date().toISOString(),
 metadata: { blockNumber: receipt.blockNumber ?? '', chainId: String(this.cfg.chainId) },
 }
 } catch {
 return null
 }
 }

 // ── private: status from vault balance ────────────────────────────────────

 async #statusFromVault(chargeId: string, vault: Address): Promise<PaymentReceipt | null> {
 try {
 const usdcFact = getUsdc(this.cfg.chainId)
 if (!usdcFact) return null
 const usdcAddress = usdcFact.address as Address

 const publicClient = createPublicClient({
 chain: arc,
 transport: http(this.cfg.rpcUrl),
 })

 const [balance, expected, swept] = await Promise.all([
 publicClient.readContract({
 address: usdcAddress,
 abi: ERC20_BALANCE_ABI,
 functionName: 'balanceOf',
 args: [vault],
 }),
 publicClient.readContract({
 address: vault,
 abi: VAULT_ABI,
 functionName: 'expectedAmount',
 }),
 publicClient.readContract({
 address: vault,
 abi: VAULT_ABI,
 functionName: 'swept',
 }),
 ])

 if (swept) {
 return {
 chargeId,
 providerKey: this.key,
 status: 'paid',
 amountReceived: balance.toString(),
 currency: 'USDC',
 transactionRef: vault,
 confirmedAt: new Date().toISOString(),
 metadata: { vault, chainId: String(this.cfg.chainId) },
 }
 }
 if (balance >= expected && expected > 0n) {
 return {
 chargeId,
 providerKey: this.key,
 status: 'paid',
 amountReceived: balance.toString(),
 currency: 'USDC',
 transactionRef: vault,
 confirmedAt: new Date().toISOString(),
 metadata: { vault, chainId: String(this.cfg.chainId) },
 }
 }
 if (balance > 0n) {
 return {
 chargeId,
 providerKey: this.key,
 status: 'partial',
 amountReceived: balance.toString(),
 currency: 'USDC',
 transactionRef: vault,
 confirmedAt: new Date().toISOString(),
 metadata: { vault, chainId: String(this.cfg.chainId), expected: expected.toString() },
 }
 }
 return {
 chargeId,
 providerKey: this.key,
 status: 'pending',
 amountReceived: '0',
 currency: 'USDC',
 transactionRef: vault,
 confirmedAt: new Date().toISOString(),
 metadata: { vault, chainId: String(this.cfg.chainId) },
 }
 } catch {
 return null
 }
 }

 // ── private: uuid → bytes32 ───────────────────────────────────────────────

 #uuidToBytes32(uuid: string): Hex {
 // Remove hyphens and zero-pad to 32 bytes
 const hex = uuid.replace(/-/g, '')
 return `0x${hex.padEnd(64, '0')}`
 }
}

// ─────────────────────────────────────────────
// Stub: SantanderPayProvider
// ─────────────────────────────────────────────

/**
 * STUB: SantanderPayProvider
 *
 * Implement createCharge to call Santander Pay's link generation API:
 * POST https://api.santander.com/payments/links
 * { amount, currency, reference, redirectUrl }
 * → { linkUrl, linkId }
 *
 * Then return a PaymentCharge with:
 * paymentUrl: linkUrl
 * metadata: { linkId }
 *
 * Implement checkStatus to call:
 * GET https://api.santander.com/payments/links/{linkId}
 * → { status: 'PAID' | 'PENDING' | 'EXPIRED' }
 *
 * Register: paymentFactory.register(new SantanderPayProvider(config))
 * Use: sdk.createCharge({ ..., providerKey: 'santander_pay' })
 */
