// Get credit events from registry
// Run with: node scripts/getEvents.cjs

require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const REGISTRY_ADDRESS = "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC";

const REGISTRY_ABI = [
    "event CreditEventRecorded(address indexed user, uint8 indexed actionType, uint256 amount, uint256 pointsEarned, uint256 timestamp)",
];

const ACTION_NAMES = ["SWAP", "LEND", "STAKE", "TRANSFER", "REPAY", "PROVIDE_LIQUIDITY"];

async function main() {
    console.log("📋 Fetching Credit Events...\n");
    console.log("Registry:", REGISTRY_ADDRESS);
    console.log("");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, provider);

    try {
        // Get events from the last 10000 blocks
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000);

        console.log(`Searching blocks ${fromBlock} to ${currentBlock}...`);
        console.log("");

        const filter = registry.filters.CreditEventRecorded();
        const events = await registry.queryFilter(filter, fromBlock, currentBlock);

        if (events.length === 0) {
            console.log("⚠️  No events found in the last 10000 blocks.");
            console.log("   Try deploying an action or checking earlier blocks.");
            return;
        }

        console.log(`✅ Found ${events.length} event(s):\n`);

        for (const event of events) {
            const user = event.args.user;
            const actionType = Number(event.args.actionType);
            const amount = ethers.formatEther(event.args.amount);
            const pointsEarned = event.args.pointsEarned.toString();
            const timestamp = new Date(Number(event.args.timestamp) * 1000);
            const blockNumber = event.blockNumber;

            console.log(`Block ${blockNumber}:`);
            console.log(`  User: ${user}`);
            console.log(`  Action: ${ACTION_NAMES[actionType] || "UNKNOWN"} (type ${actionType})`);
            console.log(`  Amount: ${amount} CTC`);
            console.log(`  Points Earned: ${pointsEarned}`);
            console.log(`  Time: ${timestamp.toLocaleString()}`);
            console.log(`  Tx Hash: ${event.transactionHash}`);
            console.log("");
        }

        // Check if points are being calculated
        const zeroPoints = events.filter(e => e.args.pointsEarned === 0n);
        if (zeroPoints.length > 0) {
            console.log("⚠️  WARNING: Some events have 0 points!");
            console.log(`   ${zeroPoints.length} out of ${events.length} events earned 0 points.`);
            console.log("   This explains why the score is 0 despite having events.");
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
