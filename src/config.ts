/**
 * wagmi + ConnectKit configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { mainnet } from 'wagmi/chains'
import { getDefaultConfig } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { registerChain } from './tracing'
import { arc } from './lib/arc-chain'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arc.id, arc.rpcUrls.default.http[0])

export const config = createConfig(
  getDefaultConfig({
    // Required by ConnectKit — use env var or a placeholder for dev
    walletConnectProjectId:
      (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? 'dev-placeholder',
    appName: 'PayStyle — USDC Payments via WhatsApp',
    chains: [arc, mainnet],
    transports: {
      [arc.id]: http(),
      [mainnet.id]: http(),
    },
  })
)
