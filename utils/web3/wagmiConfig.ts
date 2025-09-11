import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

// Get WalletConnect project ID from environment for RainbowKit
const projectId = (import.meta as any).env?.VITE_WALLET_CONNECT_PROJECT_ID || '';

// RainbowKit configuration - getDefaultConfig automatically includes Rainbow Wallet
export const config = getDefaultConfig({
  appName: 'Sendly NFT Gift Cards',
  projectId: projectId,
  chains: [base],
  ssr: false,
});

export const chains = [base];