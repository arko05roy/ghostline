// Get appchain details
// Run with: node scripts/getAppChain.cjs <chainId>

require("dotenv").config();
const { ethers } = require("ethers");

const FACTORY_ADDRESS = "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6";
const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";

const FACTORY_ABI = [
    "function getAppChain(uint256 chainId) external view returns (tuple(uint256 id, address admin, string name, address registry, address interceptor, address vault, address verifier, address nft, bool allowCrossChainScores, uint256 minScoreForLoan, uint256 createdAt, bool active))",
    "function getAppChainCount() external view returns (uint256)"
];

async function main() {
    const chainId = process.argv[2] || "2";
    console.log(`📋 Fetching AppChain ${chainId} details...\n`);

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    const appChain = await factory.getAppChain(chainId);

    console.log("✅ AppChain Details:\n");
    console.log("Chain ID:", appChain.id.toString());
    console.log("Name:", appChain.name);
    console.log("Admin:", appChain.admin);
    console.log("Registry:", appChain.registry);
    console.log("Interceptor:", appChain.interceptor);
    console.log("Vault:", appChain.vault);
    console.log("Verifier:", appChain.verifier);
    console.log("NFT:", appChain.nft);
    console.log("Active:", appChain.active);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
