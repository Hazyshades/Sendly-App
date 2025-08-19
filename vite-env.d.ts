/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_API_KEY: string
  readonly VITE_PINATA_JWT: string
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_USDC_ADDRESS: string
  readonly VITE_USDT_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
