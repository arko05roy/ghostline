// Check registry configuration
// Run with: node scripts/checkRegistry.cjs

require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const REGISTRY_ADDRESS = "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC";

const REGISTRY_ABI = [
    "function getActionWeight(uint8 actionType) view returns (uint256)",
    "function totalCreditEvents() view returns (uint256)",
    "function interceptor() view returns (address)",
    "function owner() view returns (address)",
];

const ACTION_NAMES = ["SWAP", "LEND", "STAKE", "TRANSFER", "REPAY", "PROVIDE_LIQUIDITY"];

async function main() {
    console.log("🔍 Checking Registry Configuration...\n");
    console.log("Registry:", REGISTRY_ADDRESS);
    console.log("");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    try {
        const owner = await registry.owner();
        const interceptor = await registry.interceptor();
        const totalEvents = await registry.totalCreditEvents();

        console.log("Owner:", owner);
        console.log("Interceptor:", interceptor);
        console.log("Total Events:", totalEvents.toString());
        console.log("");

        console.log("⚖️  Action Weights:");
        let allZero = true;
        for (let i = 0; i < 6; i++) {
            const weight = await registry.getActionWeight(i);
            const points = weight.toString();
            console.log(`  ${i}. ${ACTION_NAMES[i].padEnd(20)} = ${points} points`);
            if (weight > 0n) allZero = false;
        }
        console.log("");

        if (allZero) {
            console.log("❌ PROBLEM: All action weights are 0!");
            console.log("   The registry needs to be initialized with action weights.");
            console.log("   This is why your score is 0 even though events were recorded.");
            console.log("");
            console.log("🔧 FIX: Run the initialization script to set action weights.");
        } else {
            console.log("✅ Action weights are configured correctly.");
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
