import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment Script for Universal Credit Layer
 *
 * Deploys:
 * 1. UniversalCreditRegistry - Global credit aggregator
 * 2. CreditOracle - Mainnet event oracle (with keeper)
 * 3. RWAOracle - Off-chain RWA data oracle
 * 4. Registers mock sources and institutions for demo
 */

async function main() {
  console.log("🚀 Deploying Universal Credit Layer...\n");
  console.log("hre:", typeof hre);
  console.log("hre.ethers:", typeof hre.ethers);

  const [deployer, keeper, institutionSigner] = await hre.ethers.getSigners();

  console.log("Deploying with account:", deployer.address);
  console.log("Keeper address:", keeper.address);
  console.log("Institution signer:", institutionSigner.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "CTC\n"
  );

  // ============ 1. Deploy UniversalCreditRegistry ============
  console.log("📝 Deploying UniversalCreditRegistry...");
  const UniversalCreditRegistry = await hre.ethers.getContractFactory("UniversalCreditRegistry");
  const universalRegistry = await UniversalCreditRegistry.deploy();
  await universalRegistry.waitForDeployment();
  const universalRegistryAddress = await universalRegistry.getAddress();
  console.log("✅ UniversalCreditRegistry deployed to:", universalRegistryAddress);

  // Initialize
  console.log("   Initializing...");
  const initTx = await universalRegistry.initialize(deployer.address);
  await initTx.wait();
  console.log("   ✅ Initialized\n");

  // ============ 2. Register Sources ============
  console.log("📝 Registering credit sources...");

  // Source 1: Creditcoin Mainnet (for CreditOracle)
  console.log("   Registering: Creditcoin Mainnet");
  const mainnetTx = await universalRegistry.registerSource(
    "Creditcoin Mainnet",
    0, // SourceType.MAINNET_PROTOCOL
    200 // 2x weight (mainnet events count more)
  );
  await mainnetTx.wait();
  const mainnetSourceId = 0; // First source ID
  console.log("   ✅ Mainnet source registered (ID: 0, weight: 2x)");

  // Source 2: Demo Appchain (for testing appchain sync)
  console.log("   Registering: Demo Appchain");
  const appchainTx = await universalRegistry.registerSource(
    "Demo Appchain",
    0, // SourceType.APPCHAIN (using mainnet protocol enum since it's 0)
    100 // 1x weight (standard)
  );
  await appchainTx.wait();
  console.log("   ✅ Demo Appchain registered (ID: 1, weight: 1x)\n");

  // ============ 3. Deploy CreditOracle ============
  console.log("📝 Deploying CreditOracle...");
  const CreditOracle = await hre.ethers.getContractFactory("CreditOracle");
  const creditOracle = await CreditOracle.deploy();
  await creditOracle.waitForDeployment();
  const creditOracleAddress = await creditOracle.getAddress();
  console.log("✅ CreditOracle deployed to:", creditOracleAddress);

  // Initialize
  console.log("   Initializing...");
  const oracleInitTx = await creditOracle.initialize(
    deployer.address,
    universalRegistryAddress,
    mainnetSourceId
  );
  await oracleInitTx.wait();
  console.log("   ✅ Initialized");

  // Authorize oracle as writer
  console.log("   Authorizing oracle as writer...");
  const authOracleTx = await universalRegistry.authorizeWriter(creditOracleAddress);
  await authOracleTx.wait();
  console.log("   ✅ CreditOracle authorized");

  // Add keeper
  console.log("   Adding keeper...");
  const addKeeperTx = await creditOracle.addKeeper(keeper.address);
  await addKeeperTx.wait();
  console.log("   ✅ Keeper added:", keeper.address);
  console.log("");

  // ============ 4. Deploy RWAOracle ============
  console.log("📝 Deploying RWAOracle...");
  const RWAOracle = await hre.ethers.getContractFactory("RWAOracle");
  const rwaOracle = await RWAOracle.deploy();
  await rwaOracle.waitForDeployment();
  const rwaOracleAddress = await rwaOracle.getAddress();
  console.log("✅ RWAOracle deployed to:", rwaOracleAddress);

  // Initialize
  console.log("   Initializing...");
  const rwaInitTx = await rwaOracle.initialize(deployer.address, universalRegistryAddress);
  await rwaInitTx.wait();
  console.log("   ✅ Initialized");

  // Authorize oracle as writer
  console.log("   Authorizing RWAOracle as writer...");
  const authRWATx = await universalRegistry.authorizeWriter(rwaOracleAddress);
  await authRWATx.wait();
  console.log("   ✅ RWAOracle authorized");

  // Register mock institution
  console.log("   Registering mock institution: Acme Bank...");
  const registerInstTx = await rwaOracle.registerInstitution(
    "Acme Bank",
    institutionSigner.address,
    150 // 1.5x weight (RWA data is valuable)
  );
  await registerInstTx.wait();
  console.log("   ✅ Acme Bank registered (ID: 0, signer:", institutionSigner.address, ")");
  console.log("");

  // ============ 5. Summary ============
  console.log("✨ Deployment Complete!\n");
  console.log("📋 Deployed Contracts:");
  console.log("   UniversalCreditRegistry:", universalRegistryAddress);
  console.log("   CreditOracle:", creditOracleAddress);
  console.log("   RWAOracle:", rwaOracleAddress);
  console.log("");
  console.log("📋 Registered Sources:");
  console.log("   [0] Creditcoin Mainnet (2x weight)");
  console.log("   [1] Demo Appchain (1x weight)");
  console.log("   [2] Acme Bank - RWA (1.5x weight)");
  console.log("");
  console.log("📋 Authorized Writers:");
  console.log("   - CreditOracle:", creditOracleAddress);
  console.log("   - RWAOracle:", rwaOracleAddress);
  console.log("");
  console.log("📋 Keepers:");
  console.log("   - Keeper:", keeper.address);
  console.log("");
  console.log("📋 Institutions:");
  console.log("   [0] Acme Bank");
  console.log("       Signer:", institutionSigner.address);
  console.log("");

  // Save addresses to .env file
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Update or append addresses
  const addressVars = {
    UNIVERSAL_REGISTRY_ADDRESS: universalRegistryAddress,
    CREDIT_ORACLE_ADDRESS: creditOracleAddress,
    RWA_ORACLE_ADDRESS: rwaOracleAddress,
    KEEPER_ADDRESS: keeper.address,
    INSTITUTION_SIGNER_ADDRESS: institutionSigner.address,
  };

  for (const [key, value] of Object.entries(addressVars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("💾 Addresses saved to .env\n");

  console.log("🎯 Next Steps:");
  console.log("   1. Run mock keeper: npx hardhat run scripts/mockMainnetKeeper.ts");
  console.log("   2. Submit RWA events: npx hardhat run scripts/submitRWAEvent.ts");
  console.log("   3. Update frontend with new contract addresses");
  console.log("   4. Test universal score aggregation\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
