# Sendly NFT Gift Card dApp

A decentralized application for creating and managing NFT gift cards on the Base network.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Web3-enabled browser (MetaMask, RainbowKit compatible wallets, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sendly-nft-gift-card-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to: `http://localhost:5173`

## 🔧 Configuration

### For Production (Optional)

For full functionality with RainbowKit wallet connections, create a `.env` file in the project root:

```env
# WalletConnect Cloud Project ID
# Get a free projectId at https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### RainbowKit WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to the environment variable `VITE_WALLET_CONNECT_PROJECT_ID`

### Farcaster Mini App Setup

The app includes Farcaster Mini App SDK integration with configuration in `public/.well-known/farcaster.json`. This enables:

- Native Farcaster ecosystem integration
- Farcaster user authentication
- Mini app functionality within Farcaster clients

To deploy as a Farcaster Mini App:
1. Ensure your domain is verified in the Farcaster configuration
2. Update the URLs in `farcaster.json` to match your production domain
3. Deploy to a public domain (required for Farcaster Mini Apps)

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **Web3**: Wagmi, Viem, RainbowKit
- **Blockchain**: Base Network (Ethereum L2)
- **Database**: Supabase (authentication & data storage)
- **Social**: Farcaster Mini App SDK integration
- **Authentication**: Supabase Auth with Google OAuth support

## 📁 Project Structure

```
├── components/          # React components
│   ├── ui/             # UI components (Radix UI)
│   ├── figma/          # Figma-specific components
│   ├── AuthModal.tsx   # Authentication modal
│   ├── BaseLogo.tsx    # Base network logo
│   ├── CreateGiftCard.tsx
│   ├── MyCards.tsx
│   ├── SpendCard.tsx
│   ├── TransactionHistory.tsx
│   └── RainbowWalletConnect.tsx
├── supabase/           # Supabase functions and server code
│   └── functions/      # Edge functions
├── utils/              # Utilities
│   ├── web3/          # Web3 configuration
│   ├── supabase/      # Supabase client
│   ├── imageGenerator.ts
│   └── pinataService.ts
├── public/             # Static assets
│   └── .well-known/   # Farcaster configuration
├── styles/            # CSS styles
└── src/               # Source code
```

## 🔗 Supported Wallets

- MetaMask
- Injected wallets (Brave, Opera, etc.)
- RainbowKit compatible wallets (when projectId is configured)

## 🌐 Network

The application runs on the **Base** network.

## 🔐 Authentication

The app supports multiple authentication methods:

- **Web3 Wallet Connection**: Connect with MetaMask or other Web3 wallets
- **Supabase Auth**: Email/password authentication with optional Google OAuth
- **Farcaster Integration**: Native Farcaster Mini App support

## 🚀 Features

- **Create NFT Gift Cards**: Mint unique NFT gift cards on Base network
- **Manage Cards**: View and manage your created and received gift cards
- **Spend Cards**: Redeem gift cards for various services
- **Transaction History**: Complete history of all gift card transactions
- **Farcaster Mini App**: Native integration with Farcaster ecosystem
- **Multi-wallet Support**: Compatible with various Web3 wallets

## 📝 License

MIT License