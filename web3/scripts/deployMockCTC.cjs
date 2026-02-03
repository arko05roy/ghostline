// Deploy MockCTC ERC20 token
// Run with: node scripts/deployMockCTC.cjs

require("dotenv").config();
const { ethers } = require("ethers");

// Contract artifact
const MockERC20 = require("../artifacts/contracts/mocks/MockERC20.sol/MockERC20.json");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PRIVATE_KEY = process.env.CREDITCOIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Error: CREDITCOIN_PRIVATE_KEY not found in .env file");
    process.exit(1);
}

async function main() {
    console.log("🚀 Deploying MockCTC token...\n");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Deploying with account:", deployer.address);
    const balance = await provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "CTC\n");

    // Deploy MockCTC token
    console.log("📝 Deploying MockCTC...");
    const MockCTCFactory = new ethers.ContractFactory(
        MockERC20.abi,
        MockERC20.bytecode,
        deployer
    );
    const mockCTC = await MockCTCFactory.deploy("Mock Creditcoin Token", "mCTC", 18);
    await mockCTC.waitForDeployment();

    const mockCTCAddress = await mockCTC.getAddress();
    console.log("✅ MockCTC deployed to:", mockCTCAddress, "\n");

    // Mint initial supply to deployer for testing
    console.log("📝 Minting initial supply...");
    const initialSupply = ethers.parseEther("1000000"); // 1M tokens
    const mintTx = await mockCTC.mint(deployer.address, initialSupply);
    await mintTx.wait();
    console.log("✅ Minted 1,000,000 mCTC to", deployer.address, "\n");

    console.log("✨ Deployment Complete!\n");
    console.log("📋 Summary:");
    console.log("   MockCTC Address:", mockCTCAddress);
    console.log("   Initial Supply: 1,000,000 mCTC");
    console.log("");
    console.log("🎯 Next Steps:");
    console.log("   1. Update frontend/src/config/contracts.ts with MockCTC address");
    console.log("   2. Users can mint tokens with: mockCTC.mint(userAddress, amount)");
    console.log("   3. Approve tokens for DeFi actions: mockCTC.approve(interceptorAddress, amount)\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
