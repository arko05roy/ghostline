# Quick Start Guide

## Contracts Deployed! 🎉

All contracts have been successfully deployed to **Creditcoin Testnet (Chain ID: 102031)**.

### What's Been Done

✅ Core contracts deployed (Factory, Bridge, Mock Token)
✅ Implementation contracts deployed (Registry, Interceptor, Vault, Verifier, NFT)
✅ Demo appchain deployed ("Ghostline Demo")
✅ Frontend updated with contract addresses
✅ Wagmi config ready for Creditcoin Testnet

### Frontend Setup

The frontend is ready to use! Just make sure you have:

1. **MetaMask or compatible wallet** installed
2. **Creditcoin Testnet** added to your wallet:
   - Network Name: Creditcoin Testnet
   - RPC URL: https://rpc.cc3-testnet.creditcoin.network
   - Chain ID: 102031
   - Currency Symbol: tCTC
   - Block Explorer: https://creditcoin-testnet.blockscout.com

3. **Test tokens** from the faucet (for gas):
   - Visit: https://creditcoin-testnet.blockscout.com
   - Get tCTC for transaction fees

### Key Contract Addresses

- **Factory**: `0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6`
- **Mock CTC Token**: `0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708`
- **Demo Registry**: `0x0000000000000000000000000000000000000180`
- **Demo Interceptor**: `0x425F17C99f87d70b3fC92c4C2FE1f3D4c946e58A`
- **Demo Vault**: `0x5928523cB07ac22572df28e8a6f9c62Fd7e7Cf4B`

### Running the Frontend

```bash
cd client
npm install
npm run dev
```

Then open http://localhost:3000 and connect your wallet!

### Getting Mock CTC Tokens

The Mock CTC token is used for testing DeFi operations. To mint tokens:

```javascript
// In your browser console or via contract interaction
const mockCTC = "0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708";
// Call the mint function with your address and amount
```

Or use the deployed script:
```bash
cd web3
npx hardhat run scripts/mint-tokens.js --network creditcoin
```

### Testing the Protocol

1. **Connect Wallet**: Connect your MetaMask to Creditcoin Testnet
2. **Get Test Tokens**: Get tCTC from faucet and mint Mock CTC
3. **Perform Actions**: Try staking, lending, or providing liquidity through the interceptor
4. **Check Score**: View your credit score in the dashboard
5. **Request Loan**: Use your credit score to get better loan terms

### View Contracts on Explorer

All contracts are viewable on the Creditcoin Testnet block explorer:
https://creditcoin-testnet.blockscout.com

### Deploying Additional AppChains

To deploy your own appchain:

```bash
cd web3
node scripts/deploy-appchain-simple.cjs
```

Then update the addresses in `client/lib/contracts.ts`.

### Need Help?

- Check `DEPLOYMENT.md` for full deployment details
- View contract ABIs in `client/lib/contracts.ts`
- See example interactions in `web3/scripts/seed.ts`

---

**Ready to build credit on-chain!** 🚀
