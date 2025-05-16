require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: {
      url: 'https://mainnet.base.org',
      accounts: [process.env.REACT_APP_PK],
      chainId: 8453
    }
  }
};