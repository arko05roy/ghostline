import hre from "hardhat";

const UNIVERSAL_REGISTRY = "0xeA16dB49cC9A86Ed04155b956e780E1C8e149Fae";

async function main() {
    const [signer] = await hre.ethers.getSigners();
    console.log("Signer:", signer.address);

    const registry = await hre.ethers.getContractAt("UniversalCreditRegistry", UNIVERSAL_REGISTRY);

    console.log("Owner:", await registry.owner());
    console.log("Authorizing writer...");

    const tx = await registry.authorizeWriter(signer.address);
    console.log("Tx:", tx.hash);
    await tx.wait();

    console.log("Is authorized:", await registry.authorizedWriters(signer.address));
}

main().catch(console.error);
