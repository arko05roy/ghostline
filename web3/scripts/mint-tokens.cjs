// Simple script to mint Mock CTC tokens
// Run with: node scripts/mint-tokens.cjs

require("dotenv").config();
const { ethers } = require("ethers");

const MOCK_CTC_ADDRESS = "0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708";
const RPC_URL = process.env.CREDITCOIN_RPC_URL || "https://rpc.cc3-testnet.creditcoin.network";
const PRIVATE_KEY = process.env.CREDITCOIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Error: CREDITCOIN_PRIVATE_KEY not found in .env file");
    process.exit(1);
}

const ERC20_ABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) public view returns (uint256)",
    "function symbol() public view returns (string)",
    "function decimals() public view returns (uint8)"
];

async function main() {
    console.log("💰 Minting Mock CTC Tokens...\n");

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Recipient:", wallet.address);

    // Connect to token
    const token = new ethers.Contract(MOCK_CTC_ADDRESS, ERC20_ABI, wallet);

    const symbol = await token.symbol();
    const decimals = await token.decimals();

    console.log("Token:", symbol);
    console.log("Address:", MOCK_CTC_ADDRESS);

    // Check current balance
    const balanceBefore = await token.balanceOf(wallet.address);
    console.log("\nBalance before:", ethers.formatUnits(balanceBefore, decimals), symbol);

    // Mint 10,000 tokens
    const amount = ethers.parseUnits("10000", decimals);
    console.log("\nMinting 10,000", symbol, "...");

    const tx = await token.mint(wallet.address, amount);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("Transaction confirmed!");

    // Check new balance
    const balanceAfter = await token.balanceOf(wallet.address);
    console.log("\nBalance after:", ethers.formatUnits(balanceAfter, decimals), symbol);
    console.log("\n✅ Tokens minted successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
