import hre from "hardhat";
import { CreditOracle, IUniversalCreditRegistry } from "../types";

/**
 * Mock Mainnet Keeper Script
 *
 * For Hackathon: Simulates the off-chain indexer that monitors Creditcoin mainnet
 * In production: Replace with real indexer that listens to mainnet events
 *
 * This script:
 * 1. Connects to deployed CreditOracle as a keeper
 * 2. Submits mock mainnet events for demo purposes
 * 3. Can be run manually or automated for continuous demo
 */

// Mock mainnet event data
const MOCK_MAINNET_EVENTS = [
  {
    user: "0x1234567890123456789012345678901234567890",
    actionType: 0, // SWAP
    amount: hre.ethers.parseEther("100"),
    timestamp: Math.floor(Date.now() / 1000),
    txHash: hre.ethers.id("mainnet-swap-001"),
    description: "DEX Swap: 100 CTC"
  },
  {
    user: "0x1234567890123456789012345678901234567890",
    actionType: 1, // LEND
    amount: hre.ethers.parseEther("500"),
    timestamp: Math.floor(Date.now() / 1000),
    txHash: hre.ethers.id("mainnet-lend-001"),
    description: "Lending Protocol: Supplied 500 CTC"
  },
  {
    user: "0x2345678901234567890123456789012345678901",
    actionType: 3, // STAKE
    amount: hre.ethers.parseEther("1000"),
    timestamp: Math.floor(Date.now() / 1000),
    txHash: hre.ethers.id("mainnet-stake-001"),
    description: "Staking: 1000 CTC"
  },
  {
    user: "0x1234567890123456789012345678901234567890",
    actionType: 2, // REPAY
    amount: hre.ethers.parseEther("250"),
    timestamp: Math.floor(Date.now() / 1000),
    txHash: hre.ethers.id("mainnet-repay-001"),
    description: "Loan Repayment: 250 CTC"
  },
];

async function main() {
  console.log("🤖 Mock Mainnet Keeper - Starting...\n");

  // Get keeper signer (should be added as keeper in CreditOracle)
  const [keeper] = await hre.ethers.getSigners();
  console.log("Keeper address:", keeper.address);

  // Get deployed CreditOracle address (update this after deployment)
  const CREDIT_ORACLE_ADDRESS = process.env.CREDIT_ORACLE_ADDRESS;

  if (!CREDIT_ORACLE_ADDRESS) {
    console.error("❌ Error: CREDIT_ORACLE_ADDRESS not set in .env");
    console.log("\nPlease deploy contracts and set CREDIT_ORACLE_ADDRESS in .env");
    process.exit(1);
  }

  // Connect to CreditOracle
  const creditOracle = await hre.ethers.getContractAt(
    "CreditOracle",
    CREDIT_ORACLE_ADDRESS
  ) as unknown as CreditOracle;

  console.log("Connected to CreditOracle:", await creditOracle.getAddress());

  // Check if keeper is authorized
  const isKeeper = await creditOracle.isKeeper(keeper.address);
  if (!isKeeper) {
    console.error("❌ Error: Keeper not authorized");
    console.log("\nRun: npx hardhat run scripts/addKeeper.ts");
    process.exit(1);
  }

  console.log("✅ Keeper authorized\n");

  // Submit events one by one
  console.log("📡 Submitting mock mainnet events...\n");

  for (const event of MOCK_MAINNET_EVENTS) {
    // Check if already processed
    const isProcessed = await creditOracle.isProcessed(event.txHash);

    if (isProcessed) {
      console.log(`⏭️  Skipping ${event.description} - already processed`);
      continue;
    }

    console.log(`🔄 Processing: ${event.description}`);
    console.log(`   User: ${event.user}`);
    console.log(`   Amount: ${hre.ethers.formatEther(event.amount)} CTC`);

    try {
      const tx = await creditOracle.submitMainnetEvent(
        event.user,
        event.actionType,
        event.amount,
        event.timestamp,
        event.txHash
      );

      console.log(`   Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Confirmed\n`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
      console.log("");
    }

    // Wait 2 seconds between events (for demo flow)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  const totalSubmitted = await creditOracle.totalEventsSubmitted();
  console.log("\n📊 Summary:");
  console.log(`   Total mainnet events submitted: ${totalSubmitted}`);
  console.log("\n✨ Mock keeper script completed!");
}

// For continuous mode (keep submitting random events)
async function continuousMode() {
  console.log("🔄 Running in continuous mode (Ctrl+C to stop)...\n");

  const [keeper] = await hre.ethers.getSigners();
  const CREDIT_ORACLE_ADDRESS = process.env.CREDIT_ORACLE_ADDRESS!;
  const creditOracle = await hre.ethers.getContractAt(
    "CreditOracle",
    CREDIT_ORACLE_ADDRESS
  ) as unknown as CreditOracle;

  let counter = 0;

  while (true) {
    counter++;

    // Generate random event
    const randomUser = hre.ethers.Wallet.createRandom().address;
    const actionTypes = [0, 1, 2, 3, 4, 5]; // SWAP, LEND, REPAY, STAKE, TRANSFER, PROVIDE_LIQUIDITY
    const randomAction = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const randomAmount = hre.ethers.parseEther((Math.random() * 1000).toFixed(2));
    const txHash = hre.ethers.id(`mainnet-random-${Date.now()}-${counter}`);

    console.log(`🔄 Submitting random event #${counter}...`);

    try {
      const tx = await creditOracle.submitMainnetEvent(
        randomUser,
        randomAction,
        randomAmount,
        Math.floor(Date.now() / 1000),
        txHash
      );

      await tx.wait();
      console.log(`   ✅ Event #${counter} confirmed\n`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }

    // Wait 10 seconds before next event
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
}

// Run script
if (require.main === module) {
  const mode = process.argv[2];

  if (mode === "continuous") {
    continuousMode().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  } else {
    main().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}

export { main, continuousMode };
