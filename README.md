# Sendly NFT Gift Card dApp

A decentralized application for creating and managing NFT gift cards on the Base network.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Web3-enabled browser (MetaMask, WalletConnect, etc.)

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

For full functionality with WalletConnect, create a `.env` file in the project root:

```env
# WalletConnect Cloud Project ID
# Get a free projectId at https://cloud.walletconnect.com/
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### WalletConnect Setup

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to the environment variable `VITE_WALLET_CONNECT_PROJECT_ID`

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide React
- **Web3**: Wagmi, Viem
- **Blockchain**: Base Network (Ethereum L2)
- **Database**: Supabase (optional)

## 📁 Project Structure

```
├── components/          # React components
│   ├── ui/             # UI components (Radix UI)
│   ├── CreateGiftCard.tsx
│   ├── MyCards.tsx
│   ├── SpendCard.tsx
│   └── WalletConnect.tsx
├── contracts/          # Smart contracts
├── utils/             # Utilities
│   ├── web3/          # Web3 configuration
│   └── supabase/      # Supabase client
├── styles/            # CSS styles
└── src/               # Source code
```

## 🔗 Supported Wallets

- MetaMask
- Injected wallets (Brave, Opera, etc.)
- WalletConnect (when projectId is configured)

## 🌐 Network

The application runs on the **Base** network.

## 📝 License

MIT License


