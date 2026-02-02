# Deployment Summary

## Network: Creditcoin Testnet

- **Chain ID**: 102031
- **RPC URL**: https://rpc.cc3-testnet.creditcoin.network
- **Block Explorer**: https://creditcoin-testnet.blockscout.com
- **Native Token**: tCTC

## Deployed Contracts

### Core Infrastructure

| Contract | Address | Description |
|----------|---------|-------------|
| CreditChainFactory | `0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6` | Factory for deploying appchains |
| CrossChainBridge | `0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6` | Bridge for cross-chain operations |
| MockCTC Token | `0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708` | Test token for development |

### Implementation Contracts

These are the master copies used by the factory for gas-efficient cloning:

| Contract | Address | Description |
|----------|---------|-------------|
| CreditRegistry | `0x12399B328754637f8b92EdfaE281B79eECC107d9` | Credit score registry implementation |
| CreditInterceptor | `0xF694b3FB6AB97b08539DCA1F446B1eC6541064B8` | DeFi activity interceptor implementation |
| CreditVault | `0x3605Ab0331b0810C362F3A42EC999F0bf8D7D980` | Lending vault implementation |
| GhostScoreVerifier | `0x8d96dbAdd6B4317EBC8Dbc79975f860d66fb8c8f` | ZK proof verifier implementation |
| CreditNFT | `0x3DaDa53ec4835B8a84470c05C75EE3059e016bF9` | Credit badge NFT implementation |

## Deployment Information

- **Deployer Address**: Check hardhat config
- **Deployment Date**: 2026-02-02
- **Compiler Version**: Solidity 0.8.28
- **Optimization**: Enabled (200 runs, via IR)

## Getting Test Tokens

To interact with the contracts, you'll need:

1. **tCTC** (native gas token): Get from [Creditcoin Testnet Faucet](https://creditcoin-testnet.blockscout.com)
2. **Mock CTC** (test lending token): Call `mint()` function on MockCTC contract at `0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708`

## Deploying an AppChain

To deploy your own appchain using the CreditChainFactory:

### Via Frontend

1. Connect your wallet to Creditcoin Testnet
2. Navigate to the Factory section
3. Call `deployAppChainSimple("Your App Name")`
4. The factory will return a `chainId` - use this to query your appchain addresses via `getAppChain(chainId)`

### Via Hardhat Script

Create a script in `web3/scripts/`:

```typescript
import { ethers } from "hardhat";

async function main() {
    const factory = await ethers.getContractAt(
        "CreditChainFactory",
        "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6"
    );

    const tx = await factory.deployAppChainSimple("Your App Name");
    const receipt = await tx.wait();

    const chainId = 0; // Or get from event logs
    const appChain = await factory.getAppChain(chainId);

    console.log("Registry:", appChain.registry);
    console.log("Interceptor:", appChain.interceptor);
    console.log("Vault:", appChain.vault);
    console.log("Verifier:", appChain.verifier);
    console.log("NFT:", appChain.nft);
}

main();
```

Run with:
```bash
cd web3
npx hardhat run scripts/your-script.ts --network creditcoin
```

## Frontend Integration

The frontend is already configured with these addresses in `client/lib/contracts.ts`.

To update the demo appchain addresses after deploying one:
1. Deploy an appchain using the factory
2. Update the `demoAppChain` section in `client/lib/contracts.ts` with your appchain addresses

## Verification (Optional)

To verify contracts on the block explorer:

```bash
cd web3
npx hardhat verify --network creditcoin <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

Example:
```bash
npx hardhat verify --network creditcoin 0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6 \
  "0x12399B328754637f8b92EdfaE281B79eECC107d9" \
  "0xF694b3FB6AB97b08539DCA1F446B1eC6541064B8" \
  "0x3605Ab0331b0810C362F3A42EC999F0bf8D7D980" \
  "0x8d96dbAdd6B4317EBC8Dbc79975f860d66fb8c8f" \
  "0x3DaDa53ec4835B8a84470c05C75EE3059e016bF9" \
  "0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708"
```

## Block Explorer Links

- [CreditChainFactory](https://creditcoin-testnet.blockscout.com/address/0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6)
- [CrossChainBridge](https://creditcoin-testnet.blockscout.com/address/0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6)
- [MockCTC Token](https://creditcoin-testnet.blockscout.com/address/0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708)

## Next Steps

1. Deploy a demo appchain using the CreditChainFactory
2. Update frontend with demo appchain addresses
3. Test the full credit building flow
4. Consider deploying to mainnet when ready
