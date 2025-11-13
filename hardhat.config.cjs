require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
  networks: {
    base: {
      url: process.env.VITE_BASE_RPC_URL || "https://base-rpc.publicnode.com",
      chainId: Number(process.env.VITE_BASE_CHAIN_ID || 8453),
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: process.env.VITE_BASE_SEPOLIA_RPC_URL || "https://base-sepolia.blockpi.network/v1/rpc/public",
      chainId: 84532,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

module.exports = config;
