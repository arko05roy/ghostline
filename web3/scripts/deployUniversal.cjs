// Deploy Universal Credit Layer
// Run with: node scripts/deployUniversal.cjs

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Contract artifacts
const UniversalCreditRegistry = require("../artifacts/contracts/UniversalCreditRegistry.sol/UniversalCreditRegistry.json");
const CreditOracle = require("../artifacts/contracts/CreditOracle.sol/CreditOracle.json");
const RWAOracle = require("../artifacts/contracts/RWAOracle.sol/RWAOracle.json");

const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PRIVATE_KEY = process.env.CREDITCOIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Error: CREDITCOIN_PRIVATE_KEY not found in .env file");
    process.exit(1);
}

async function main() {
    console.log("🚀 Deploying Universal Credit Layer...\n");

    // Setup provider and wallets
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);

    // For hackathon demo, use same wallet for keeper and institution (in production, these would be different)
    const keeper = deployer;
    const institutionSigner = deployer;

    console.log("Deploying with account:", deployer.address);
    const balance = await provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "CTC\n");

    // ============ 1. Deploy UniversalCreditRegistry ============
    console.log("📝 Deploying UniversalCreditRegistry...");
    const UniversalRegistryFactory = new ethers.ContractFactory(
        UniversalCreditRegistry.abi,
        UniversalCreditRegistry.bytecode,
        deployer
    );
    const universalRegistry = await UniversalRegistryFactory.deploy(deployer.address);
    await universalRegistry.waitForDeployment();
    const universalRegistryAddress = await universalRegistry.getAddress();
    console.log("✅ UniversalCreditRegistry deployed to:", universalRegistryAddress, "\n");

    // ============ 2. Register Sources ============
    console.log("📝 Registering credit sources...");

    // Source 0: Creditcoin Mainnet (for CreditOracle)
    console.log("   Registering: Creditcoin Mainnet");
    const mainnetTx = await universalRegistry.registerSource(
        "Creditcoin Mainnet",
        1, // SourceType.MAINNET_PROTOCOL
        200 // 2x weight
    );
    await mainnetTx.wait();
    const mainnetSourceId = 0;
    console.log("   ✅ Mainnet source registered (ID: 0, weight: 2x)");

    // Source 1: Demo Appchain
    console.log("   Registering: Demo Appchain");
    const appchainTx = await universalRegistry.registerSource(
        "Demo Appchain",
        0, // SourceType.APPCHAIN
        100 // 1x weight
    );
    await appchainTx.wait();
    console.log("   ✅ Demo Appchain registered (ID: 1, weight: 1x)\n");

    // ============ 3. Deploy CreditOracle ============
    console.log("📝 Deploying CreditOracle...");
    const CreditOracleFactory = new ethers.ContractFactory(
        CreditOracle.abi,
        CreditOracle.bytecode,
        deployer
    );
    const creditOracle = await CreditOracleFactory.deploy(
        deployer.address,
        universalRegistryAddress,
        mainnetSourceId
    );
    await creditOracle.waitForDeployment();
    const creditOracleAddress = await creditOracle.getAddress();
    console.log("✅ CreditOracle deployed to:", creditOracleAddress);

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
    const RWAOracleFactory = new ethers.ContractFactory(
        RWAOracle.abi,
        RWAOracle.bytecode,
        deployer
    );
    const rwaOracle = await RWAOracleFactory.deploy(deployer.address, universalRegistryAddress);
    await rwaOracle.waitForDeployment();
    const rwaOracleAddress = await rwaOracle.getAddress();
    console.log("✅ RWAOracle deployed to:", rwaOracleAddress);

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
        150 // 1.5x weight
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
    console.log("   1. Run mock keeper: node scripts/mockMainnetKeeper.cjs");
    console.log("   2. Submit RWA events: node scripts/submitRWAEvent.cjs");
    console.log("   3. Update frontend with new contract addresses");
    console.log("   4. Test universal score aggregation\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
