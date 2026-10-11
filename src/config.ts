/**
 * wagmi + ConnectKit configuration
 * Built with Arc Studio — https://studio.arc.io
 */

import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { getDefaultConfig } from 'connectkit'
import { createConfig, http } from 'wagmi'
import { registerChain } from './tracing'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

export const config = createConfig(
  getDefaultConfig({
    // Required by ConnectKit — use env var or a placeholder for dev
    walletConnectProjectId:
      (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? 'dev-placeholder',
    appName: 'PayStyle — USDC Payments via WhatsApp',
    chains: [arcTestnet, mainnet],
    transports: {
      [arcTestnet.id]: http(),
      [mainnet.id]: http(),
    },
  })
)
