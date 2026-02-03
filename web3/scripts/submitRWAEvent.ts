import hre from "hardhat";

/**
 * Submit RWA Event Script
 *
 * For Hackathon: Manually submit signed RWA credit events
 * Simulates banks/institutions submitting off-chain credit data
 *
 * This script:
 * 1. Creates an RWA event (loan repayment, bank transaction, etc.)
 * 2. Signs it with the institution's signer key
 * 3. Submits to RWAOracle
 */

async function main() {
  console.log("🏦 Submitting RWA Credit Event...\n");

  // Get signers
  const [deployer, keeper, institutionSigner] = await hre.ethers.getSigners();

  // Get deployed RWAOracle address
  const RWA_ORACLE_ADDRESS = process.env.RWA_ORACLE_ADDRESS;

  if (!RWA_ORACLE_ADDRESS) {
    console.error("❌ Error: RWA_ORACLE_ADDRESS not set in .env");
    console.log("\nPlease run: npx hardhat run scripts/deployUniversal.ts");
    process.exit(1);
  }

  // Connect to RWAOracle
  const rwaOracle = await hre.ethers.getContractAt("RWAOracle", RWA_ORACLE_ADDRESS);
  console.log("Connected to RWAOracle:", await rwaOracle.getAddress());

  // Event data
  const institutionId = 0; // Acme Bank
  const user = "0x1234567890123456789012345678901234567890"; // Demo user
  const actionType = 2; // REPAY (loan repayment)
  const amount = hre.ethers.parseEther("1000"); // 1000 CTC loan repayment
  const timestamp = Math.floor(Date.now() / 1000);
  const eventId = hre.ethers.id(`rwa-acme-loan-repay-${Date.now()}`);

  console.log("📝 Event Details:");
  console.log("   Institution: Acme Bank (ID: 0)");
  console.log("   User:", user);
  console.log("   Action: REPAY (Loan Repayment)");
  console.log("   Amount:", hre.ethers.formatEther(amount), "CTC");
  console.log("   Event ID:", eventId);
  console.log("");

  // Check if already processed
  const isProcessed = await rwaOracle.isProcessed(eventId);
  if (isProcessed) {
    console.log("⏭️  Event already processed. Skipping.");
    return;
  }

  // Compute event hash
  console.log("🔐 Signing event...");
  const eventHash = await rwaOracle.getEventHash(
    institutionId,
    user,
    actionType,
    amount,
    timestamp,
    eventId
  );

  console.log("   Event hash:", eventHash);

  // Sign with institution signer
  const messageHashBytes = hre.ethers.getBytes(eventHash);
  const signature = await institutionSigner.signMessage(messageHashBytes);

  console.log("   Signature:", signature);
  console.log("   ✅ Signed by:", institutionSigner.address);
  console.log("");

  // Submit to RWAOracle
  console.log("📡 Submitting to RWAOracle...");

  try {
    const tx = await rwaOracle.submitRWAEvent(
      institutionId,
      user,
      actionType,
      amount,
      timestamp,
      eventId,
      signature
    );

    console.log("   Tx hash:", tx.hash);
    await tx.wait();
    console.log("   ✅ Event submitted successfully!");
    console.log("");

    // Print summary
    const totalRWAEvents = await rwaOracle.totalRWAEventsSubmitted();
    console.log("📊 Summary:");
    console.log("   Total RWA events submitted:", totalRWAEvents.toString());
    console.log("");
    console.log("✨ User's universal score has been updated!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// For batch submission
async function submitBatch() {
  console.log("🏦 Submitting Batch RWA Events...\n");

  const [deployer, keeper, institutionSigner] = await hre.ethers.getSigners();
  const RWA_ORACLE_ADDRESS = process.env.RWA_ORACLE_ADDRESS!;
  const rwaOracle = await hre.ethers.getContractAt("RWAOracle", RWA_ORACLE_ADDRESS);

  // Mock RWA events
  const events = [
    {
      institutionId: 0,
      user: "0x1234567890123456789012345678901234567890",
      actionType: 1, // LEND
      amount: hre.ethers.parseEther("5000"),
      description: "Business loan: 5000 CTC",
    },
    {
      institutionId: 0,
      user: "0x1234567890123456789012345678901234567890",
      actionType: 2, // REPAY
      amount: hre.ethers.parseEther("1000"),
      description: "Loan repayment: 1000 CTC",
    },
    {
      institutionId: 0,
      user: "0x2345678901234567890123456789012345678901",
      actionType: 1, // LEND
      amount: hre.ethers.parseEther("2000"),
      description: "Personal loan: 2000 CTC",
    },
  ];

  for (const event of events) {
    const timestamp = Math.floor(Date.now() / 1000);
    const eventId = hre.ethers.id(`rwa-batch-${Date.now()}-${Math.random()}`);

    console.log(`📝 ${event.description}`);

    // Check if processed
    const isProcessed = await rwaOracle.isProcessed(eventId);
    if (isProcessed) {
      console.log("   ⏭️  Already processed\n");
      continue;
    }

    // Sign
    const eventHash = await rwaOracle.getEventHash(
      event.institutionId,
      event.user,
      event.actionType,
      event.amount,
      timestamp,
      eventId
    );

    const messageHashBytes = hre.ethers.getBytes(eventHash);
    const signature = await institutionSigner.signMessage(messageHashBytes);

    // Submit
    try {
      const tx = await rwaOracle.submitRWAEvent(
        event.institutionId,
        event.user,
        event.actionType,
        event.amount,
        timestamp,
        eventId,
        signature
      );

      await tx.wait();
      console.log("   ✅ Submitted\n");
    } catch (error: any) {
      console.error("   ❌ Error:", error.message, "\n");
    }

    // Wait 1 second between submissions
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const totalRWAEvents = await rwaOracle.totalRWAEventsSubmitted();
  console.log("✨ Batch complete! Total RWA events:", totalRWAEvents.toString());
}

// Run script
if (require.main === module) {
  const mode = process.argv[2];

  if (mode === "batch") {
    submitBatch().catch((error) => {
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

export { main, submitBatch };
