# GhostLine Protocol

**Stripe for onchain credit — any institution deploys a full credit system on Creditcoin with one function call.**

GhostLine is a deployable credit infrastructure protocol on Creditcoin (EVM L1). Institutions, fintechs, and DeFi builders deploy isolated **Credit Appchains** — ZK-infused credit environments with scoring, lending, and privacy — through a single factory call. Users build a portable, universal credit identity aggregated from DeFi activity, institutional appchains, and real-world asset data.

Built for the **BUIDL CTC Hackathon** on DoraHacks — RWA Track.

---

## The Problem

- **1.4 billion people** worldwide lack access to formal credit systems
- Traditional credit scores are siloed, opaque, and centralized — they leak sensitive financial data
- DeFi lending remains overcollateralized (150%+), excluding the underbanked
- No interoperable credit layer exists across onchain protocols

## The Solution

GhostLine introduces three novel primitives:

| Primitive | What It Does |
|-----------|-------------|
| **Credit Interceptor** | Middleware that turns any DeFi action (swap, lend, stake, repay) into a scored credit event |
| **GhostScore** | Zero-knowledge proofs (Noir) that prove creditworthiness without revealing the actual score |
| **CreditVault** | Undercollateralized lending vault that accepts GhostScore proofs — higher score = less collateral |

All three are deployed per-institution via the **CreditChainFactory** — a master factory using EIP-1167 minimal proxies for gas-efficient appchain creation (~300k gas).

---

## Architecture

```
CreditChainFactory (singleton on Creditcoin)
|
+-- AppChain #1: "Acme Bank"
|   +-- CreditRegistry       (proxy clone)
|   +-- CreditInterceptor    (proxy clone)
|   +-- CreditVault          (proxy clone)
|   +-- GhostScoreVerifier   (proxy clone)
|   +-- CreditNFT            (soulbound badges)
|
+-- AppChain #2: "LatAm Fintech"
|   +-- ... (same stack, different scoring weights)
|
+-- AppChain #3: "DeFi Protocol X"
|   +-- ... (crypto-native config)
|
+-- CrossChainBridge (ZK score portability between appchains)
|
+-- UniversalCreditRegistry (global aggregated score)
    +-- CreditOracle      (mainnet DeFi indexer)
    +-- RWAOracle          (off-chain institutional data)
```

### Universal Credit Layer

Users have ONE universal credit score aggregated from:
- **Factory-deployed appchains** (institutional credit systems)
- **Creditcoin mainnet DeFi** (real DEX swaps, lending, staking via CreditOracle)
- **Off-chain RWA data** (bank transactions, loan repayments via RWAOracle)

Scores are stored as **Pedersen hash commitments** onchain — never in plaintext. Verification happens through ZK proofs, making GhostScore cryptographically meaningful, not security theater.

---

## How It Works

```
1. USER DOES DEFI           2. CREDIT IS SCORED          3. PROOF IS GENERATED
+------------------+        +------------------+        +------------------+
| Swap on DEX      | -----> | Interceptor      | -----> | Noir ZK Circuit  |
| Stake tokens     |        | scores action    |        | proves score >=  |
| Repay loan       |        | updates registry |        | threshold        |
| Provide LP       |        | hashes commitment|        | without revealing|
+------------------+        +------------------+        +------------------+
                                                                  |
                                                                  v
                                                        +------------------+
                                                        | CreditVault      |
                                                        | accepts proof    |
                                                        | issues loan with |
                                                        | reduced collat.  |
                                                        +------------------+
```

---

## ZK Circuit (Noir)

The GhostScore circuit proves `actual_score >= threshold` without revealing the score:

```noir
fn main(
    actual_score: u32,          // PRIVATE - hidden from verifier
    salt: Field,                // PRIVATE - randomness
    user_address_hash: Field,   // PRIVATE - identity binding
    score_threshold: pub u32,   // PUBLIC  - minimum being proven
    commitment: pub Field,      // PUBLIC  - hash(score, address, salt)
) {
    assert(actual_score >= score_threshold);
    assert(actual_score <= 1000);
    let computed = pedersen_hash([actual_score as Field, user_address_hash, salt]);
    assert(commitment == computed);
}
```

---

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `CreditRegistry.sol` | Stores credit events and scores (private via commitments) |
| `CreditInterceptor.sol` | Wraps DeFi actions into scored credit events |
| `GhostScoreVerifier.sol` | Verifies Noir ZK proofs onchain, stores attestations |
| `CreditVault.sol` | Undercollateralized lending using GhostScore proofs |
| `CreditNFT.sol` | Soulbound achievement badges (Newcomer/Builder/Trusted/Elite) |
| `CreditChainFactory.sol` | Deploys full isolated appchains via EIP-1167 clones |
| `CrossChainBridge.sol` | Ports credit scores between appchains (70% weight discount) |
| `UniversalCreditRegistry.sol` | Global credit ledger aggregating all sources |
| `CreditOracle.sol` | Keeper for mainnet DeFi event ingestion |
| `RWAOracle.sol` | Institution-signed off-chain credit data submission |

---

## Deployed Contracts (Creditcoin Testnet)

| Contract | Address |
|----------|---------|
| CreditChainFactory | `0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6` |
| CrossChainBridge | `0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6` |
| MockCTC Token | `0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708` |

**Network:** Creditcoin Testnet (Chain ID: 102031) | [Block Explorer](https://creditcoin-testnet.blockscout.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.28, Hardhat, OpenZeppelin (Clones, ERC721, ReentrancyGuard) |
| ZK Proofs | Noir (Aztec), Pedersen hash commitments, UltraPlonk verifier |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Wallet | RainbowKit, wagmi v2, viem, ethers.js v6 |
| Chain | Creditcoin Testnet (EVM L1) |

---

## Project Structure

```
ghostline/
+-- web3/                    # Smart contracts (Hardhat)
|   +-- contracts/           # 10 Solidity contracts + interfaces + mocks
|   +-- test/                # Contract test suite
|   +-- scripts/             # Deploy & seed scripts
+-- circuits/                # ZK circuits (Noir)
|   +-- ghost_score/         # GhostScore proof circuit
+-- frontend/                # Next.js 15 app
    +-- src/
        +-- app/             # Pages: dashboard, actions, vault, zkproof, bridge, factory, universal
        +-- components/      # UI components with dark theme, animated score gauge
        +-- hooks/           # wagmi hooks for contract interaction
        +-- config/          # ABIs, addresses, wagmi config
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- tCTC from [Creditcoin Testnet Faucet](https://creditcoin-testnet.blockscout.com)

### Run Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy Contracts
```bash
cd web3
cp .env.example .env
# Add your private key to .env
npm install
npx hardhat run scripts/deploy.ts --network creditcoin
```

### Run ZK Circuit Tests
```bash
cd circuits/ghost_score
nargo test
```

---

## Credit Scoring Model

| Action | Weight | Example |
|--------|--------|---------|
| Repay Loan | Highest | Repaying $100 loan = maximum credit signal |
| Provide Liquidity | High | Adding LP to pools |
| Stake | Medium-High | Staking CTC tokens |
| Lend | Medium | Supplying assets to lending |
| Swap | Medium | Trading on DEX |
| Transfer | Low | Token transfers |

### Tiers
| Tier | Score Range | Loan Terms |
|------|------------|------------|
| Newcomer | 0-99 | No loan access |
| Builder | 100-299 | Small loans, high collateral |
| Trusted | 300-599 | Medium loans, reduced collateral |
| Elite | 600-1000 | Large loans, minimal collateral |

---

## Why GhostLine Wins

1. **Narrative alignment** — Creditcoin is the credit chain. GhostLine is credit infrastructure. Perfect fit.
2. **Infrastructure, not an app** — Factory model makes this a platform for Creditcoin's entire ecosystem, not just a lending dApp.
3. **ZK is justified** — Scores stored as commitments, not plaintext. GhostScore proofs have real cryptographic meaning.
4. **RWA Track fit** — Credit IS a real-world asset. Universal registry bridges onchain DeFi with offchain bank data.
5. **Undercollateralized lending** — The 0xCollateral pattern (ETHGlobal winner) applied to Creditcoin with institutional infrastructure.

---

## Team

Built by Arko Roy for the BUIDL CTC Hackathon 2026.

---

## License

MIT
