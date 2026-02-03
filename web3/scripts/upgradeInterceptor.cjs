// Upgrade CreditInterceptor to support native CTC for all actions
// Run with: node scripts/upgradeInterceptor.cjs

require("dotenv").config();
const { ethers, upgrades } = require("hardhat");

const INTERCEPTOR_PROXY = "0xF694b3FB6AB97b08539DCA1F446B1eC6541064B8";

async function main() {
    console.log("🚀 Upgrading CreditInterceptor to support native CTC...\n");

    const [deployer] = await ethers.getSigners();
    console.log("Upgrading with account:", deployer.address);

    // Get the new implementation
    console.log("📝 Deploying new CreditInterceptor implementation...");
    const CreditInterceptorV2 = await ethers.getContractFactory("CreditInterceptor");

    // Upgrade the proxy
    console.log("📝 Upgrading proxy at:", INTERCEPTOR_PROXY);
    const upgraded = await upgrades.upgradeProxy(INTERCEPTOR_PROXY, CreditInterceptorV2);
    await upgraded.waitForDeployment();

    const implAddress = await upgrades.erc1967.getImplementationAddress(INTERCEPTOR_PROXY);

    console.log("\n✅ Upgrade Complete!\n");
    console.log("Proxy Address:", INTERCEPTOR_PROXY);
    console.log("New Implementation:", implAddress);
    console.log("\n✨ All actions now support native CTC!");
    console.log("   - interceptLend: use address(0) for native CTC");
    console.log("   - interceptTransfer: use address(0) for native CTC");
    console.log("   - interceptRepay: accepts native CTC via msg.value");
    console.log("   - interceptProvideLiquidity: use address(0) for native CTC\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
