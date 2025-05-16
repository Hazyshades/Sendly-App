# Sendly-App

A dApp for creating and sending NFT gift cards tied to USDC/USDT on the Base network.  
Users can customize cards with stablecoin amounts and messages, redeemable via smart wallets without KYC.

---

## Prerequisites

- **Node.js** (LTS, e.g., 20.x.x)  
- **npm** (10.x.x+)  
- **CoinBase Wallet**  
---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Sendly-App.git
cd Sendly-App
```

> Replace `your-username` with your GitHub username.

---

### 2. Install Dependencies

```bash
npm install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv
```

---

### 3. Configure Environment

Create `.env` in the project root:

```bash
touch .env
```

Add the following:

```env
PRIVATE_KEY=your_64_character_private_key
BASE_RPC_URL=https://mainnet.base.org
```

- `PRIVATE_KEY`: MetaMask private key (64 characters, **without** `0x`)
- `BASE_RPC_URL`: Use `https://sepolia.base.org` for testnet

> **Important**: Keep `.env` private and add it to `.gitignore`

---

### 4. Configure Hardhat

Verify `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: process.env.BASE_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84531
    }
  }
};
```

Ensure Solidity version matches `contracts/GiftCard.sol`.

---

### 5. Compile Contract

```bash
npx hardhat compile
```

> This creates `artifacts/` with ABI and bytecode.

---

### 6. Deploy Contract

Create `scripts/` if it doesn’t exist:

```bash
mkdir scripts
```

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
  const usdtAddress = "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2"; // Replace with Base USDT address

  const GiftCard = await hre.ethers.getContractFactory("GiftCard");
  const giftCard = await GiftCard.deploy(usdcAddress, usdtAddress);
  await giftCard.deployed();

  console.log("GiftCard deployed to:", giftCard.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

> Replace `usdtAddress` with actual address from Base Explorer.

Deploy to Base Sepolia:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

Or deploy to Base mainnet:

```bash
npx hardhat run scripts/deploy.js --network base
```

> Requires ETH for gas on mainnet.

---

### 7. Verify Deployment

Note the contract address:

```bash
GiftCard deployed to: 0x...
```

Verify it on:
- [Base Explorer](https://basescan.org)
---

## Troubleshooting

**Solidity mismatch**  
Ensure `pragma solidity` in `GiftCard.sol` matches `hardhat.config.js`.

Or use multiple versions:

```javascript
solidity: {
  compilers: [{ version: "0.8.20" }, { version: "0.8.28" }]
}
```

---

**Config errors**  
Check `.env`:

```env
PRIVATE_KEY=...
BASE_RPC_URL=...
```

If missing:

```bash
npm install dotenv
```

---

**Deployment issues**  
Ensure MetaMask has ETH. Run with full logs:

```bash
npx hardhat run scripts/deploy.js --network baseSepolia --show-stack-traces
```

---

## License

MIT License. See `LICENSE`.

---

## Final Setup

Ensure `.env` is added to `.gitignore`:

```bash
echo .env >> .gitignore
```

Push to GitHub:

```bash
git add README.md .gitignore
git commit -m "Add README and .gitignore"
git push origin main
```
