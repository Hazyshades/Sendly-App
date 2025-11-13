/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_SECRET_API_KEY: string
  readonly VITE_PINATA_JWT: string
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_USDC_ADDRESS: string
  readonly VITE_USDT_ADDRESS: string
  readonly VITE_ELEVENLABS_API_KEY: string
  readonly VITE_AIMLAPI_API_KEY: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string
  readonly VITE_BASE_CHAIN_ID?: string
  readonly VITE_BASE_NAME?: string
  readonly VITE_BASE_RPC_URL?: string
  readonly VITE_BASE_RPC_URLS?: string
  readonly VITE_BASE_SEPOLIA_RPC_URL?: string
  readonly VITE_BASE_BLOCK_EXPLORER_URL?: string
  readonly VITE_BASE_SYMBOL?: string
  readonly VITE_BASE_CURRENCY_NAME?: string
  readonly VITE_BASE_DECIMALS?: string
  readonly TWITTER_VAULT_CONTRACT_ADDRESS?: string
  readonly VITE_VAULT_CONTRACT_ADDRESS?: string
  readonly VITE_TWITCH_VAULT_ADDRESS?: string
  readonly VITE_TWITCH_VAULT_CONTRACT: string
  readonly VITE_TELEGRAM_VAULT_ADDRESS?: string
  readonly VITE_TELEGRAM_VAULT_CONTRACT?: string
  readonly VITE_TIKTOK_VAULT_ADDRESS?: string
  readonly VITE_TIKTOK_VAULT_CONTRACT?: string
  readonly VITE_INSTAGRAM_VAULT_ADDRESS?: string
  readonly VITE_INSTAGRAM_VAULT_CONTRACT?: string
  readonly VITE_SUPABASE_PROJECT_ID?: string
  readonly VITE_SUPABASE_PUBLIC_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
