# GhostLine Protocol — DoraHacks BUIDL CTC Submission

## One-Liner

**Stripe for onchain credit: any institution deploys a full ZK-powered credit system on Creditcoin with one function call.**

---

## Problem

1.4 billion people worldwide cannot prove they are creditworthy. Traditional credit systems are siloed, centralized, and leak sensitive data. DeFi lending demands 150%+ collateral, shutting out the underbanked. There is no interoperable credit layer across onchain protocols — and no way to prove creditworthiness without exposing your financial history.

---

## Solution

GhostLine is a deployable credit infrastructure protocol on Creditcoin. It introduces three novel primitives:

### 1. Credit Interceptor
Middleware that intercepts any DeFi action — swaps, lending, staking, repayments — and automatically converts it into a weighted credit event. Every onchain action builds your credit score.

### 2. GhostScore (ZK Credit Proofs)
Zero-knowledge proofs built with Noir that let users prove "my credit score is above X" without revealing the actual score. Scores are stored as Pedersen hash commitments onchain — never in plaintext. This is cryptographically meaningful privacy, not theater.

### 3. CreditVault (Undercollateralized Lending)
A lending vault that accepts GhostScore proofs instead of requiring overcollateralization. Higher credit score = less collateral required. Elite users (score 600+) can borrow with minimal collateral, while newcomers still need traditional amounts.

### The Infrastructure Layer
All three primitives are deployed per-institution via the **CreditChainFactory** — a master factory using EIP-1167 minimal proxies. Any bank, fintech, or DeFi protocol calls `deployAppChain()` and receives a fully isolated credit stack: registry, interceptor, vault, ZK verifier, and soulbound NFT badges. One transaction. ~300k gas.

### Universal Credit Identity
Users have ONE universal credit score aggregated from:
- Factory-deployed institutional appchains
- Creditcoin mainnet DeFi activity (via CreditOracle indexer)
- Off-chain real-world asset data (via RWAOracle — bank loans, repayments)

This creates a portable, privacy-preserving credit identity across all of Creditcoin.

---

## Architecture

```
CreditChainFactory (singleton on Creditcoin)
|
+-- AppChain #1: "Acme Bank"         (isolated credit environment)
+-- AppChain #2: "LatAm Fintech"     (custom scoring weights)
+-- AppChain #3: "DeFi Protocol X"   (crypto-native config)
|
+-- CrossChainBridge                  (ZK score portability)
+-- UniversalCreditRegistry           (global aggregated score)
    +-- CreditOracle                  (mainnet DeFi indexer)
    +-- RWAOracle                     (institutional off-chain data)
```

Each AppChain contains:
- **CreditRegistry** — private credit score storage with hash commitments
- **CreditInterceptor** — DeFi action middleware
- **CreditVault** — undercollateralized lending
- **GhostScoreVerifier** — onchain Noir ZK proof verification
- **CreditNFT** — soulbound tier badges (Newcomer / Builder / Trusted / Elite)

---

## How It Works

**Step 1: Build Credit**
User performs DeFi actions (swap, stake, lend, repay) through the Credit Interceptor. Each action is scored and recorded. Repayments carry the highest weight.

**Step 2: Generate ZK Proof**
User generates a GhostScore proof using the Noir circuit. The proof demonstrates "my score >= 300" without revealing the actual score (e.g., 450). The proof is tied to the user via a Pedersen hash commitment.

**Step 3: Borrow with Proof**
User submits the GhostScore proof to the CreditVault. The vault verifies the proof onchain and issues a loan with reduced collateral requirements based on the proven tier.

**Step 4: Repay and Grow**
Loan repayment triggers the highest-weight credit event, building the user's score faster. The virtuous cycle: borrow responsibly, build credit, unlock better terms.

---

## Smart Contracts (Deployed on Creditcoin Testnet)

| Contract | Address |
|----------|---------|
| CreditChainFactory | `0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6` |
| CrossChainBridge | `0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6` |
| MockCTC Token | `0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708` |

**10 Solidity contracts** total: CreditRegistry, CreditInterceptor, CreditVault, GhostScoreVerifier, CreditNFT, CreditChainFactory, CrossChainBridge, UniversalCreditRegistry, CreditOracle, RWAOracle + interfaces and mocks.

**Network:** Creditcoin Testnet | Chain ID: 102031 | [Explorer](https://creditcoin-testnet.blockscout.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.28, Hardhat, OpenZeppelin Clones (EIP-1167) |
| ZK Proofs | Noir (Aztec), Pedersen commitments, UltraPlonk verifier |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Framer Motion |
| Wallet Integration | RainbowKit, wagmi v2, viem, ethers.js v6 |
| Blockchain | Creditcoin Testnet (EVM L1) |

---

## Key Differentiators

### Infrastructure, Not an App
GhostLine is not a lending dApp — it's a **platform** for deploying credit systems. The CreditChainFactory means every institution on Creditcoin gets credit infrastructure for free. Judges see ecosystem-level impact.

### ZK Privacy That Matters
Most hackathon ZK projects bolt on proofs for show. GhostLine stores scores as Pedersen hash commitments — the score is genuinely hidden onchain. Proving "score >= X" without revealing the actual score has real cryptographic value. This follows the 0xCollateral pattern that won at ETHGlobal.

### RWA-Native Design
Credit IS a real-world asset. The UniversalCreditRegistry bridges onchain DeFi activity with off-chain institutional data (bank loans, repayments) through the RWAOracle. This isn't a stretch for the RWA track — it's the purest expression of it.

### Creditcoin Alignment
Creditcoin is the credit chain. GhostLine is credit infrastructure. Same narrative pattern as Avalanche P1 winner (privacy project on privacy chain). The protocol extends Creditcoin's core mission with privacy-preserving, institution-ready credit tooling.

---

## Credit Tiers

| Tier | Score | Loan Access |
|------|-------|-------------|
| Newcomer | 0-99 | No loans |
| Builder | 100-299 | Small loans, high collateral |
| Trusted | 300-599 | Medium loans, reduced collateral |
| Elite | 600+ | Large loans, minimal collateral |

---

## Demo Flow

1. Connect wallet on Creditcoin Testnet
2. Perform DeFi actions (swap, stake, lend) — watch credit score build in real-time
3. Generate GhostScore ZK proof (prove score >= threshold without revealing it)
4. Submit proof to CreditVault — receive undercollateralized loan
5. Repay loan — score increases (highest weight action)
6. Deploy your own appchain via CreditChainFactory — one transaction
7. View universal credit score aggregated from all sources

---

## Repository Structure

```
ghostline/
+-- web3/contracts/          # 10 Solidity contracts + interfaces + mocks
+-- circuits/ghost_score/    # Noir ZK circuit for GhostScore proofs
+-- frontend/src/            # Next.js 15 app (dashboard, actions, vault, zkproof, bridge, factory)
```

---

## Links

- **GitHub**: [this repository]
- **Deployed on**: Creditcoin Testnet (Chain ID: 102031)
- **Explorer**: https://creditcoin-testnet.blockscout.com

---

## Built By

Arko Roy | BUIDL CTC Hackathon 2026
