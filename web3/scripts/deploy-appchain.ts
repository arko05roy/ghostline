import hre from "hardhat";

async function main() {
    console.log("🚀 Deploying Demo AppChain on Creditcoin Testnet...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // Factory address from deployment
    const factoryAddress = "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6";

    const CreditChainFactory = await hre.ethers.getContractFactory("CreditChainFactory");
    const factory = CreditChainFactory.attach(factoryAddress);

    console.log("Factory:", factoryAddress);
    console.log("\nDeploying 'Ghostline Demo' appchain...\n");

    const tx = await factory.deployAppChainSimple("Ghostline Demo");
    const receipt = await tx.wait();

    console.log("Transaction hash:", receipt?.hash);

    // Get the appchain ID (first chain deployed = ID 0)
    const chainId = 0;
    const appChain = await factory.getAppChain(chainId);

    console.log("\n✅ Demo AppChain Deployed!\n");
    console.log("AppChain ID:", chainId);
    console.log("Admin:", appChain.admin);
    console.log("Registry:", appChain.registry);
    console.log("Interceptor:", appChain.interceptor);
    console.log("Vault:", appChain.vault);
    console.log("Verifier:", appChain.verifier);
    console.log("NFT:", appChain.nft);
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
