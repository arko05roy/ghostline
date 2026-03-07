# DoraHacks Submission Fields

---

## Project Name
GhostLine Protocol

## One-Liner (max 140 chars)
Stripe for onchain credit — deploy a full ZK-powered credit system on Creditcoin with one function call.

## Tagline
Privacy-preserving credit infrastructure for Creditcoin. Build credit from DeFi. Prove it with ZK. Borrow without overcollateral.

---

## Short Description (DoraHacks project page — ~300 words)

GhostLine is a deployable credit infrastructure protocol on Creditcoin. Any institution — bank, fintech, or DeFi protocol — calls one factory function and receives a fully isolated credit system: scoring registry, DeFi interceptor, ZK proof verifier, undercollateralized lending vault, and soulbound achievement NFTs.

**The core innovation is the Credit Interceptor** — middleware that wraps any DeFi action (swap, stake, lend, repay) and automatically generates a weighted credit event. Users build credit scores simply by using DeFi. Scores are stored as Pedersen hash commitments, never in plaintext.

**GhostScore** lets users prove "my credit score is above X" using Noir zero-knowledge proofs — without revealing the actual score. This isn't bolt-on ZK theater: because scores are genuinely hidden onchain, the proofs have real cryptographic meaning.

**CreditVault** accepts GhostScore proofs for undercollateralized lending. Higher credit = less collateral. An Elite user (score 600+) borrows with minimal collateral, while a Newcomer needs traditional amounts. Loan repayment carries the highest credit weight, creating a virtuous cycle.

The **CreditChainFactory** deploys all of this per-institution using EIP-1167 minimal proxies (~300k gas). Each appchain is fully isolated — different institutions can set their own scoring weights, loan terms, and token whitelists.

The **Universal Credit Registry** aggregates credit from all sources — institutional appchains, Creditcoin mainnet DeFi (via CreditOracle indexer), and off-chain real-world asset data (via RWAOracle). Users get one portable, privacy-preserving credit identity across all of Creditcoin.

10 smart contracts deployed on Creditcoin Testnet. Noir ZK circuit with Pedersen commitments. Next.js 15 frontend with real-time credit tracking, animated score gauges, and full DeFi interaction flows.

GhostLine is credit infrastructure for Creditcoin's entire ecosystem — not just a lending dApp.

---

## Tags
`RWA` `DeFi` `ZK Proofs` `Credit` `Lending` `Infrastructure` `Privacy` `Noir` `Creditcoin` `Undercollateralized Lending`

---

## Track
RWA Track

---

## Long Description / Pitch (for DoraHacks BUIDL page — ~800 words)

### The Problem

1.4 billion people worldwide cannot access formal credit. Traditional credit scoring is centralized, opaque, and leaks sensitive financial data. In DeFi, the situation is worse: lending protocols demand 150%+ collateral, making credit-based lending impossible. There is no interoperable, privacy-preserving credit layer across onchain protocols.

Creditcoin was built to be the credit chain. But until now, there has been no programmable credit infrastructure that any institution can deploy and that any user can benefit from — with real privacy guarantees.

### GhostLine: Credit Infrastructure for Creditcoin

GhostLine solves this with three novel primitives:

**Credit Interceptor** is middleware that sits between users and DeFi protocols. Every swap, stake, lend, and repayment is automatically intercepted and converted into a weighted credit event. Users build credit simply by using DeFi — no separate actions required. Repayments carry the highest weight, incentivizing responsible borrowing.

**GhostScore** is a zero-knowledge proof system built with Noir (Aztec). Credit scores are stored onchain as Pedersen hash commitments — the actual score is never public. Users generate proofs that demonstrate "my score is at least 300" without revealing whether their actual score is 301 or 900. This is cryptographically meaningful privacy: the score is genuinely hidden, making the ZK proof non-trivial. This follows the same pattern as 0xCollateral, which won at ETHGlobal for anonymous onchain credit.

**CreditVault** is an undercollateralized lending vault that accepts GhostScore proofs. Four tiers — Newcomer, Builder, Trusted, Elite — determine loan terms. An Elite user (score 600+) borrows up to $10,000 with only 20% collateral, while a Builder (score 100-299) is limited to $1,000 at 80% collateral. Loan repayment is the highest-weighted credit action, creating a virtuous cycle: borrow, repay, build credit, unlock better terms.

### The Factory: Infrastructure, Not an App

The **CreditChainFactory** is what makes GhostLine infrastructure rather than just another lending dApp. Any institution calls `deployAppChain()` and receives a fully isolated credit environment in one transaction (~300k gas via EIP-1167 minimal proxies):

- CreditRegistry (scoring engine)
- CreditInterceptor (DeFi middleware)
- CreditVault (lending)
- GhostScoreVerifier (ZK verification)
- CreditNFT (soulbound achievement badges)

Each appchain is fully configurable: institutions set their own scoring weights, loan tiers, and token whitelists. A bank might weight repayments at 5x, while a DeFi protocol weights LP provision at 3x. Complete isolation means one institution's credit data never leaks to another.

The **CrossChainBridge** enables portability: a user who built credit on "Acme Bank's appchain" can prove that score on "LatAm Fintech's appchain" — at a configurable discount (default 70%).

### Universal Credit: The Aggregation Layer

The **UniversalCreditRegistry** creates a single, global credit identity per user, aggregating credit from three sources:

1. **Institutional appchains** — credit events from factory-deployed environments
2. **Creditcoin mainnet DeFi** — real swaps, lending, and staking detected by the CreditOracle indexer
3. **Off-chain RWA data** — bank loans, repayments, and credit bureau data submitted by institutions through the RWAOracle

Each source has configurable weights (mainnet repayments might count 2x vs testnet swaps). The universal score is the foundation for a portable credit identity across all of Creditcoin's ecosystem.

### Technical Implementation

- **10 Solidity smart contracts** deployed on Creditcoin Testnet (Chain ID: 102031)
- **Noir ZK circuit** with Pedersen hash commitments, UltraPlonk verification, tested with 6 test cases
- **Next.js 15 frontend** with real-time credit tracking, animated score gauges, DeFi action forms, vault lending interface, ZK proof generation, factory deployment, bridge portability, and universal dashboard
- **Full dark theme** with electric green accents, designed for fintech credibility meets crypto energy
- **OpenZeppelin security**: ReentrancyGuard, Ownable, Pausable, EIP-1167 Clones

### Why This Fits the RWA Track

Credit IS a real-world asset — arguably the most fundamental one. GhostLine doesn't tokenize real-world assets; it creates the infrastructure for real-world creditworthiness to exist onchain. The RWAOracle bridges traditional finance (bank loans, repayment history) directly into the universal credit layer. This is the purest expression of RWA on Creditcoin.

### Why This Wins

This project follows proven hackathon-winning patterns:
- **Narrative alignment**: Creditcoin = credit chain, GhostLine = credit infrastructure (same pattern as Avalanche P1 winner)
- **0xCollateral precedent**: Anonymous onchain credit with undercollateralized lending already won at ETHGlobal
- **Infrastructure > App**: Judges see a platform for Creditcoin's ecosystem, not just a product
- **ZK justified**: Commitments make proofs cryptographically meaningful

GhostLine is not a lending dApp. It's the credit layer that every dApp on Creditcoin needs.

---

## Bounty Tracks to Apply For
- RWA Track (primary)
- CEIP Track (if available — GhostLine as a Creditcoin Ecosystem Improvement Proposal for universal credit infrastructure)
