/**
 * Arc mainnet (chainId 5042) — the ONE place the app defines the chain.
 *
 * DERIVED from the generated onchain-facts registry (`src/onchain-facts.ts`,
 * never edit that file): chainId, RPC URLs and explorer all come from
 * `requireChain(5042)` so this module cannot drift from what Arc Studio
 * deploys against. viem 2.57 exports `arcTestnet` but no Arc mainnet chain,
 * so the viem `Chain` object is assembled here.
 *
 * Import from here (e.g. `import { arc } from '@/lib/arc-chain'`) instead of
 * `viem/chains`' arcTestnet; do not retype the id, RPC or explorer anywhere.
 */

import { defineChain, type Chain } from 'viem'
import { requireChain } from '@/onchain-facts'

const facts = requireChain(5042)

/** Arc mainnet chain id (5042). */
export const ARC_MAINNET_CHAIN_ID: number = facts.chainId

/** viem Chain for Arc mainnet — RPC from onchain-facts (rpc.mainnet.arc.io). */
export const arc: Chain = defineChain({
  id: facts.chainId,
  name: facts.name,
  nativeCurrency: {
    name: facts.nativeCurrency.symbol,
    symbol: facts.nativeCurrency.symbol,
    decimals: facts.nativeCurrency.decimals,
  },
  rpcUrls: {
    default: { http: [...facts.rpcUrls] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: facts.explorerBase },
  },
  testnet: facts.isTestnet,
})
