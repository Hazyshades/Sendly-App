import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Простая конфигурация без RainbowKit для разработки
export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [base.id]: http(),
  },
});

export const chains = [base];
