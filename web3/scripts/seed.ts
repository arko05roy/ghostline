import hre from "hardhat";

/**
 * Seed Script for CreditNet Protocol
 * 
 * After deployment, this script:
 * 1. Deploys an example appchain via CreditChainFactory
 * 2. Simulates credit-building activities
 * 3. Demonstrates the full credit lifecycle
 */
async function main() {
    const [deployer, user1, user2] = await hre.ethers.getSigners();

    console.log("🚀 Seeding CreditNet Protocol...");
    console.log("   Deployer:", deployer.address);
    console.log("   User1:", user1.address);
    console.log("   User2:", user2.address);
    console.log("");

    // ============ Get Deployed Contracts ============

    // Get the deployed contract addresses from ignition
    // In production, these would come from the deployment artifacts
    const CreditChainFactory = await hre.ethers.getContractFactory("CreditChainFactory");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const CreditRegistry = await hre.ethers.getContractFactory("CreditRegistry");
    const CreditInterceptor = await hre.ethers.getContractFactory("CreditInterceptor");
    const CreditVault = await hre.ethers.getContractFactory("CreditVault");

    // For local testing, deploy fresh contracts
    console.log("📦 Deploying fresh contracts for seeding...\n");

    // Deploy implementation contracts
    const registryImpl = await CreditRegistry.deploy();
    const interceptorImpl = await CreditInterceptor.deploy();
    const CreditVaultContract = await hre.ethers.getContractFactory("CreditVault");
    const vaultImpl = await CreditVaultContract.deploy();
    const GhostScoreVerifier = await hre.ethers.getContractFactory("GhostScoreVerifier");
    const verifierImpl = await GhostScoreVerifier.deploy();
    const CreditNFT = await hre.ethers.getContractFactory("CreditNFT");
    const nftImpl = await CreditNFT.deploy();

    // Deploy mock token
    const mockCTC = await MockERC20.deploy("CreditCoin", "CTC", 18);

    console.log("   Registry Impl:", await registryImpl.getAddress());
    console.log("   Interceptor Impl:", await interceptorImpl.getAddress());
    console.log("   Vault Impl:", await vaultImpl.getAddress());
    console.log("   Verifier Impl:", await verifierImpl.getAddress());
    console.log("   NFT Impl:", await nftImpl.getAddress());
    console.log("   Mock CTC:", await mockCTC.getAddress());
    console.log("");

    // Deploy factory
    const factory = await CreditChainFactory.deploy(
        await registryImpl.getAddress(),
        await interceptorImpl.getAddress(),
        await vaultImpl.getAddress(),
        await verifierImpl.getAddress(),
        await nftImpl.getAddress(),
        await mockCTC.getAddress()
    );

    console.log("🏭 CreditChainFactory deployed:", await factory.getAddress());
    console.log("");

    // ============ Deploy Example AppChain ============

    console.log("📱 Deploying 'Acme Finance' appchain...\n");

    const tx = await factory.deployAppChainSimple("Acme Finance");
    const receipt = await tx.wait();

    // Get the appchain ID from the event
    const appChainDeployedEvent = receipt?.logs.find(
        (log: any) => log.fragment?.name === "AppChainDeployed"
    );

    const chainId = 0; // First chain deployed
    const appChain = await factory.getAppChain(chainId);

    console.log("   AppChain ID:", chainId);
    console.log("   Admin:", appChain.admin);
    console.log("   Registry:", appChain.registry);
    console.log("   Interceptor:", appChain.interceptor);
    console.log("   Vault:", appChain.vault);
    console.log("   Verifier:", appChain.verifier);
    console.log("   NFT:", appChain.nft);
    console.log("");

    // Connect to the cloned contracts
    const registry = CreditRegistry.attach(appChain.registry);
    const interceptor = CreditInterceptor.attach(appChain.interceptor);
    const vault = CreditVault.attach(appChain.vault);

    // ============ Simulate Credit Building Activities ============

    console.log("💳 Simulating credit-building activities...\n");

    // Note: In production, users would interact through the interceptor
    // which automatically records credit events

    // For demo, we'll directly trigger some credit events via the interceptor
    // First, let's mint some tokens to users
    const mintAmount = hre.ethers.parseEther("10000");
    await mockCTC.mint(user1.address, mintAmount);
    await mockCTC.mint(user2.address, mintAmount);

    console.log("   Minted 10,000 CTC to User1 and User2");

    // User1: Performs various DeFi activities
    console.log("\n   User1 activities:");

    // Approve tokens for interceptor
    await mockCTC.connect(user1).approve(await interceptor.getAddress(), mintAmount);

    // Simulate providing liquidity (this triggers credit event)
    await interceptor.connect(user1).interceptProvideLiquidity(
        await mockCTC.getAddress(),
        hre.ethers.parseEther("1000")
    );
    console.log("   - Provided 1,000 CTC liquidity (+30 base points)");

    // Simulate lending
    await interceptor.connect(user1).interceptLend(
        await mockCTC.getAddress(),
        hre.ethers.parseEther("500")
    );
    console.log("   - Lent 500 CTC (+25 base points)");

    // Check User1's credit score
    const user1Score = await registry.connect(user1).getMyScore();
    console.log(`\n   📊 User1 Credit Score: ${user1Score}`);
    const user1History = await registry.connect(user1).getMyCreditHistory();
    console.log(`   📜 User1 Credit Events: ${user1History.length}`);

    // User2: Different activities
    console.log("\n   User2 activities:");
    await mockCTC.connect(user2).approve(await interceptor.getAddress(), mintAmount);

    // Simulate staking
    await interceptor.connect(user2).interceptStake(
        hre.ethers.parseEther("2000"),
        { value: hre.ethers.parseEther("2000") }
    );
    console.log("   - Staked 2,000 CTC (+20 base points)");

    const user2Score = await registry.connect(user2).getMyScore();
    console.log(`\n   📊 User2 Credit Score: ${user2Score}`);

    // ============ Demonstrate Loan Eligibility ============

    console.log("\n💰 Checking loan eligibility...\n");

    const tier1 = await vault.getLoanTierForScore(user1Score);
    console.log(`   User1 Tier: ${tier1.scoreThreshold >= 600 ? "Elite" : tier1.scoreThreshold >= 300 ? "Trusted" : tier1.scoreThreshold >= 100 ? "Builder" : "Newcomer"}`);
    console.log(`   - Max Loan: ${hre.ethers.formatEther(tier1.maxAmount)} CTC`);
    console.log(`   - Interest: ${Number(tier1.interestBps) / 100}%`);
    console.log(`   - Collateral Required: ${Number(tier1.collateralBps) / 100}%`);

    // ============ Summary ============

    console.log("\n✅ Seeding complete!\n");
    console.log("Summary:");
    console.log("- 1 AppChain deployed (Acme Finance)");
    console.log("- 2 users with credit history");
    console.log("- Credit events recorded on-chain");
    console.log("- Score commitments generated for ZK proofs");
    console.log("");
    console.log("Next steps:");
    console.log("- Run `npx hardhat test` to verify contract functionality");
    console.log("- Deploy to Creditcoin testnet with `npx hardhat ignition deploy ignition/modules/CreditNet.ts --network <network>`");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
