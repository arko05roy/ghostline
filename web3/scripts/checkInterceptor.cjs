// Check if interceptor is properly configured
// Run with: node scripts/checkInterceptor.cjs

require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";

const INTERCEPTOR_ADDRESS = "0x13b1Fc0e06D81F3b4cEeF672093B18aE1BaE77b3";
const REGISTRY_ADDRESS = "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC";

const INTERCEPTOR_ABI = [
    "function registry() view returns (address)",
    "function getRegistry() view returns (address)",
];

const REGISTRY_ABI = [
    "function interceptor() view returns (address)",
    "function getMyScore() view returns (uint256)",
    "function getCreditEventCount(address user) view returns (uint256)",
    "function totalCreditEvents() view returns (uint256)",
];

async function main() {
    console.log("🔍 Checking Interceptor Configuration...\n");

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    const interceptor = new ethers.Contract(INTERCEPTOR_ADDRESS, INTERCEPTOR_ABI, provider);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    console.log("Interceptor:", INTERCEPTOR_ADDRESS);
    console.log("Expected Registry:", REGISTRY_ADDRESS);
    console.log("");

    try {
        // Check interceptor's registry
        const registryFromInterceptor = await interceptor.getRegistry();
        console.log("✅ Interceptor's Registry:", registryFromInterceptor);

        if (registryFromInterceptor.toLowerCase() === REGISTRY_ADDRESS.toLowerCase()) {
            console.log("✅ MATCH! Interceptor points to correct registry\n");
        } else {
            console.log("❌ MISMATCH! Interceptor points to wrong registry\n");
        }

        // Check registry's interceptor
        const interceptorFromRegistry = await registry.interceptor();
        console.log("Registry's Interceptor:", interceptorFromRegistry);

        if (interceptorFromRegistry.toLowerCase() === INTERCEPTOR_ADDRESS.toLowerCase()) {
            console.log("✅ MATCH! Registry points to correct interceptor\n");
        } else {
            console.log("❌ MISMATCH! Registry points to wrong interceptor\n");
        }

        // Check total events
        const totalEvents = await registry.totalCreditEvents();
        console.log("Total Credit Events:", totalEvents.toString());

        if (totalEvents > 0n) {
            console.log("✅ Registry has recorded events!\n");
        } else {
            console.log("⚠️  No events recorded yet\n");
        }

        // If user address provided, check their score
        const userAddress = process.argv[2];
        if (userAddress && ethers.isAddress(userAddress)) {
            console.log("Checking user:", userAddress);
            const userScore = await registry.getMyScore({ from: userAddress });
            const userEvents = await registry.getCreditEventCount(userAddress);
            console.log("  Score:", userScore.toString());
            console.log("  Events:", userEvents.toString());
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
