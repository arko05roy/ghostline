// Simple JavaScript script to deploy an appchain
// Run with: node scripts/deploy-appchain-simple.js

require("dotenv").config();
const { ethers } = require("ethers");

const FACTORY_ADDRESS = "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6";
const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PRIVATE_KEY = process.env.CREDITCOIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Error: CREDITCOIN_PRIVATE_KEY not found in .env file");
    process.exit(1);
}

const FACTORY_ABI = [
    "function deployAppChainSimple(string memory appName) external returns (uint256)",
    "function getAppChain(uint256 chainId) external view returns (tuple(uint256 chainId, address admin, address registry, address interceptor, address vault, address verifier, address nft, address lendingToken, string name, bool active))",
    "function getAppChainCount() external view returns (uint256)"
];

async function main() {
    console.log("🚀 Deploying Demo AppChain on Creditcoin Testnet...\n");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Deployer:", wallet.address);

    // Connect to factory
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet);

    console.log("Factory:", FACTORY_ADDRESS);
    console.log("\nDeploying 'Ghostline Demo' appchain...\n");

    // Deploy appchain
    const tx = await factory.deployAppChainSimple("Ghostline Demo");
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed!");

    // Get appchain count to determine the chain ID
    const count = await factory.getAppChainCount();
    const chainId = Number(count) - 1; // Last deployed chain

    console.log("\nFetching appchain details for chainId:", chainId);

    // Get the appchain details
    const appChain = await factory.getAppChain(chainId);

    console.log("\n✅ Demo AppChain Deployed!\n");
    console.log("AppChain ID:", chainId);
    console.log("Admin:", appChain.admin);
    console.log("Registry:", appChain.registry);
    console.log("Interceptor:", appChain.interceptor);
    console.log("Vault:", appChain.vault);
    console.log("Verifier:", appChain.verifier);
    console.log("NFT:", appChain.nft);
    console.log("Lending Token:", appChain.lendingToken);
    console.log("\nUpdate these addresses in client/lib/contracts.ts under demoAppChain!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
