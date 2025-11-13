import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// WalletConnect project ID for RainbowKit
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c4f79f821944d9680842e34466bfbd52';

// Base chain definition driven by env variables
const baseChainId = Number(import.meta.env.VITE_BASE_CHAIN_ID || 8453);
const baseName = import.meta.env.VITE_BASE_NAME || 'Base';
const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL || 'https://base-rpc.publicnode.com';
const baseExplorerUrl = import.meta.env.VITE_BASE_BLOCK_EXPLORER_URL || 'https://basescan.org';
const baseNativeSymbol = import.meta.env.VITE_BASE_SYMBOL || 'ETH';
const baseNativeName = import.meta.env.VITE_BASE_CURRENCY_NAME || 'Ether';
const baseNativeDecimals = Number(import.meta.env.VITE_BASE_DECIMALS || 18);

export const baseChain = defineChain({
  id: baseChainId,
  name: baseName,
  nativeCurrency: {
    name: baseNativeName,
    symbol: baseNativeSymbol,
    decimals: baseNativeDecimals,
  },
  rpcUrls: {
    default: { http: [baseRpcUrl] },
    public: { http: [baseRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: baseExplorerUrl },
  },
});

// RainbowKit configuration - getDefaultConfig automatically includes  Rainbow Wallet
export const config = getDefaultConfig({
  appName: 'Sendly NFT Gift Cards',
  projectId,
  chains: [baseChain],
  ssr: false,
});

export const chains = [baseChain];
