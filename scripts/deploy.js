const hre = require("hardhat");

async function main() {
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const usdtAddress = "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2"; 

  const GiftCard = await hre.ethers.getContractFactory("GiftCard");
  const giftCard = await GiftCard.deploy(usdcAddress, usdtAddress);
  await giftCard.waitForDeployment();

  console.log("GiftCard deployed to:", await giftCard.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});