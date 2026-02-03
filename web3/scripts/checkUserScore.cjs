// Check user's credit score
// Run with: node scripts/checkUserScore.cjs <userAddress>

require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const REGISTRY_ADDRESS = "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC";

const REGISTRY_ABI = [
    "function getMyScore() view returns (uint256)",
    "function getCreditEventCount(address user) view returns (uint256)",
    "function getMyCreditHistory() view returns (tuple(address user, uint8 actionType, uint256 amount, uint256 timestamp, uint256 pointsEarned)[])",
    "function totalCreditEvents() view returns (uint256)",
    "function getActionWeight(uint8 actionType) view returns (uint256)",
];

const ACTION_NAMES = ["SWAP", "LEND", "STAKE", "TRANSFER", "REPAY", "PROVIDE_LIQUIDITY"];

async function main() {
    const userAddress = process.argv[2];

    if (!userAddress || !ethers.isAddress(userAddress)) {
        console.error("❌ Please provide a valid user address");
        console.log("Usage: node scripts/checkUserScore.cjs <userAddress>");
        process.exit(1);
    }

    console.log("🔍 Checking Score for:", userAddress);
    console.log("Registry:", REGISTRY_ADDRESS);
    console.log("");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    try {
        // Get user's score (must call from user's address context)
        const eventCount = await registry.getCreditEventCount(userAddress);
        const totalEvents = await registry.totalCreditEvents();

        console.log("📊 Credit Stats:");
        console.log("  Total Events (all users):", totalEvents.toString());
        console.log("  User's Events:", eventCount.toString());
        console.log("");

        // Get action weights
        console.log("⚖️  Action Weights:");
        for (let i = 0; i < 6; i++) {
            const weight = await registry.getActionWeight(i);
            console.log(`  ${ACTION_NAMES[i]}: ${weight.toString()} points`);
        }
        console.log("");

        // Note: getMyScore and getMyCreditHistory use msg.sender
        // So we can't call them directly for another user
        console.log("ℹ️  To see your score:");
        console.log("  1. Go to the Dashboard in the frontend");
        console.log("  2. Or use the browser console: await contracts.registry.getMyScore()");
        console.log("");

        if (eventCount > 0n) {
            console.log("✅ User has credit events! Score should be visible in dashboard.");
            console.log("   If dashboard shows 0, try:");
            console.log("   - Refresh the page");
            console.log("   - Disconnect and reconnect wallet");
            console.log("   - Check browser console for errors");
        } else {
            console.log("⚠️  No events found for this user.");
            console.log("   Make sure you're checking the correct wallet address.");
        }

    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.message.includes("Caller is not the user")) {
            console.log("\nℹ️  This is expected - score functions use msg.sender for privacy.");
            console.log("   Check the score in the frontend dashboard instead.");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
