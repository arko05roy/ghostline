// Sync appchain events to Universal Credit Registry
// Run with: node scripts/syncToUniversal.cjs <userAddress>

require("dotenv").config();
const { ethers } = require("ethers");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PRIVATE_KEY = process.env.CREDITCOIN_PRIVATE_KEY;

// Contracts
const UNIVERSAL_REGISTRY = "0xeA16dB49cC9A86Ed04155b956e780E1C8e149Fae";
const APPCHAIN_REGISTRY = "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC"; // Chain ID 2

const UNIVERSAL_ABI = [
    "function registerEvent(address user, uint256 sourceId, uint8 actionType, uint256 amount, uint256 pointsEarned) external",
    "function getMyUniversalScore() view returns (tuple(uint256 totalScore, uint256 lastUpdated, uint256 eventCount))",
    "function authorizedWriters(address) view returns (bool)",
    "function owner() view returns (address)",
];

const REGISTRY_ABI = [
    "function getCreditEventCount(address user) view returns (uint256)",
    "event CreditEventRecorded(address indexed user, uint8 indexed actionType, uint256 amount, uint256 pointsEarned, uint256 timestamp)",
];

async function main() {
    const userAddress = process.argv[2] || "0xABaF59180e0209bdB8b3048bFbe64e855074C0c4";

    console.log("🔄 Syncing Appchain Events to Universal Registry...\n");
    console.log("User:", userAddress);
    console.log("Appchain Registry:", APPCHAIN_REGISTRY);
    console.log("Universal Registry:", UNIVERSAL_REGISTRY);
    console.log("");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const universalRegistry = new ethers.Contract(UNIVERSAL_REGISTRY, UNIVERSAL_ABI, wallet);
    const appchainRegistry = new ethers.Contract(APPCHAIN_REGISTRY, REGISTRY_ABI, provider);

    // Check if wallet is authorized
    const isAuthorized = await universalRegistry.authorizedWriters(wallet.address);
    const owner = await universalRegistry.owner();
    console.log("Wallet:", wallet.address);
    console.log("Is authorized writer:", isAuthorized);
    console.log("Owner:", owner);
    console.log("");

    if (!isAuthorized && wallet.address.toLowerCase() !== owner.toLowerCase()) {
        console.log("⚠️  Wallet is not authorized to write. Authorizing...");
        // If we're the owner, authorize ourselves
        if (wallet.address.toLowerCase() === owner.toLowerCase()) {
            const authTx = await universalRegistry.authorizeWriter(wallet.address);
            await authTx.wait();
            console.log("✅ Wallet authorized!");
        } else {
            console.log("❌ Cannot authorize - not the owner");
            return;
        }
    }

    // Get appchain events
    console.log("📋 Fetching appchain events...");
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 50000);

    const filter = appchainRegistry.filters.CreditEventRecorded(userAddress);
    const events = await appchainRegistry.queryFilter(filter, fromBlock, currentBlock);

    console.log(`Found ${events.length} events for user\n`);

    if (events.length === 0) {
        console.log("No events to sync.");
        return;
    }

    // Sync each event to Universal Registry
    const SOURCE_ID = 1; // Demo Appchain source ID

    for (const event of events) {
        const actionType = Number(event.args.actionType);
        const amount = event.args.amount;
        const pointsEarned = event.args.pointsEarned;

        console.log(`Syncing: Action ${actionType}, Amount ${ethers.formatEther(amount)}, Points ${pointsEarned}`);

        try {
            const tx = await universalRegistry.registerEvent(
                userAddress,
                SOURCE_ID,
                actionType,
                amount,
                pointsEarned
            );
            await tx.wait();
            console.log("  ✅ Synced!");
        } catch (err) {
            console.log("  ❌ Error:", err.reason || err.message);
        }
    }

    console.log("\n✨ Sync complete!");

    // Check new universal score
    try {
        const score = await universalRegistry.getMyUniversalScore({ from: userAddress });
        console.log("\n📊 Universal Score:");
        console.log("  Total Score:", score[0].toString());
        console.log("  Event Count:", score[2].toString());
    } catch (e) {
        console.log("Could not read score (msg.sender issue)");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
