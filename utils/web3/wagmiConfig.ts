import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

// Get WalletConnect project ID from environment for RainbowKit
// Для разработки можно использовать тестовый ID, но для продакшена обязательно получите свой на https://cloud.walletconnect.com/
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'c4f79f821944d9680842e34466bfbd52';

// Debug: Log environment variables
console.log('Environment variables:', import.meta.env);
console.log('WalletConnect Project ID:', projectId);

// RainbowKit configuration - getDefaultConfig automatically includes Rainbow Wallet
export const config = getDefaultConfig({
  appName: 'Sendly NFT Gift Cards',
  projectId: projectId,
  chains: [base],
  ssr: false,
});

export const chains = [base];