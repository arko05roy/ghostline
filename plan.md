# CreditNet Protocol — Technical Build Plan

## Project Overview

**CreditNet Protocol** is a deployable credit infrastructure protocol on Creditcoin (EVM L1). Any institution, business, or builder can deploy their own **CreditNet Appchain** — an isolated, ZK-infused credit environment — with a single function call.

### Core Components (per Appchain)
1. **Credit Interceptor** — middleware that turns any DeFi action into a credit event
2. **GhostScore** — ZK credit proofs (Noir) that prove creditworthiness without revealing data
3. **CreditVault** — undercollateralized lending vault that accepts GhostScore proofs
4. **CreditChainFactory** — master factory that deploys & manages isolated appchains for any institution

### The Pitch
"Stripe for onchain credit — any institution deploys a full credit system on Creditcoin with one function call."

**Stack:** Hardhat (Solidity) + Noir (ZK) + Next.js + Tailwind (frontend)
**Target:** BUIDL CTC Hackathon on DoraHacks — RWA Track
**Deadline:** Feb 22, 2026

### Why This Wins (Pattern Analysis — 60 hackathon winners studied)
- **Narrative alignment:** Creditcoin = credit chain. CreditNet = credit infrastructure. Same pattern as Avalanche P1 win (privacy project on privacy chain).
- **0xCollateral precedent:** Similar concept (anonymous onchain credit → undercollateralized lending) already won at ETH Global.
- **Infrastructure > App:** Factory model makes this "infra for Creditcoin's ecosystem" not just "a lending dApp." Judges see platform, not product.
- **RWA Track fit:** Credit IS a real-world asset. Not a stretch.
- **ZK justified:** Registry stores commitments (not plaintext scores), so GhostScore proofs are cryptographically meaningful — not security theater.

---

## Smart Contract Architecture

### Contract 1: `CreditRegistry.sol`

Central registry — the brain of CreditNet. Stores credit events and computes scores.

**IMPORTANT (ZK Privacy Fix):** Scores are stored privately — only the user can read their own score via a view function that checks `msg.sender`. The public-facing data is limited to event commitments and a merkle root. This makes GhostScore ZK proofs meaningful: the score is genuinely hidden onchain, so proving "my score >= X" without revealing the actual score has real privacy value.

```
State:
- mapping(address => CreditEvent[]) internal creditHistory  // INTERNAL, not public
- mapping(address => uint256) internal creditScores          // INTERNAL, not public
- mapping(address => bytes32) public scoreCommitments        // hash(score, salt) — public commitment
- bytes32 public registryMerkleRoot                          // merkle root of all credit events
- mapping(uint256 => uint256) public actionWeights           // action type => weight
- uint256 public totalCreditEvents

Structs:
- CreditEvent { address user, uint256 actionType, uint256 amount, uint256 timestamp, uint256 pointsEarned }

Enums:
- ActionType { SWAP, LEND, REPAY, STAKE, TRANSFER, PROVIDE_LIQUIDITY }

Functions:
- registerCreditEvent(address user, ActionType action, uint256 amount) → onlyInterceptor
  - Computes points based on actionWeights[action] * amount normalization
  - Pushes to creditHistory[user]
  - Updates creditScores[user]
  - Updates scoreCommitments[user] = keccak256(abi.encodePacked(creditScores[user], salt))
  - Updates registryMerkleRoot
  - Emits CreditEventRecorded(user, action, amount, pointsEarned) // NOTE: no score in event
  - Increments totalCreditEvents

- getMyScore() → uint256                          // msg.sender only — private read
- getMyCreditHistory() → CreditEvent[]             // msg.sender only — private read
- getScoreCommitment(address user) → bytes32       // anyone can read commitment (not score)
- getCreditEventCount(address user) → uint256
- getRegistryMerkleRoot() → bytes32
- setActionWeight(ActionType action, uint256 weight) → onlyOwner
- setInterceptor(address interceptor) → onlyOwner
```

### Contract 2: `CreditInterceptor.sol`

Middleware layer — wraps DeFi actions and auto-generates credit events.

```
State:
- ICreditRegistry public registry
- mapping(address => bool) public whitelistedProtocols

Functions:
- interceptSwap(address tokenIn, address tokenOut, uint256 amountIn) → payable
  - Executes swap via whitelisted DEX
  - Calls registry.registerCreditEvent(msg.sender, SWAP, amountIn)
  - Returns swap output
  - Emits SwapIntercepted(user, tokenIn, tokenOut, amountIn)

- interceptLend(address token, uint256 amount)
  - Transfers token from user
  - Calls registry.registerCreditEvent(msg.sender, LEND, amount)
  - Emits LendIntercepted(user, token, amount)

- interceptStake(uint256 amount) → payable
  - Stakes CTC
  - Calls registry.registerCreditEvent(msg.sender, STAKE, amount)
  - Emits StakeIntercepted(user, amount)

- interceptTransfer(address to, address token, uint256 amount)
  - Executes transfer
  - Calls registry.registerCreditEvent(msg.sender, TRANSFER, amount)
  - Emits TransferIntercepted(user, to, token, amount)

- interceptRepay(uint256 loanId, uint256 amount)
  - Repays loan on CreditVault
  - Calls registry.registerCreditEvent(msg.sender, REPAY, amount)
  - REPAY has HIGHEST weight (repayment = best credit signal)
  - Emits RepayIntercepted(user, loanId, amount)

- whitelistProtocol(address protocol) → onlyOwner
- removeProtocol(address protocol) → onlyOwner
```

### Contract 3: `GhostScoreVerifier.sol`

Auto-generated from Noir circuit + custom wrapper for onchain verification.

```
State:
- UltraVerifier public verifier  // Noir-generated verifier contract
- mapping(address => GhostScoreAttestation[]) public attestations
- mapping(bytes32 => bool) public usedProofs  // prevent replay

Structs:
- GhostScoreAttestation { uint256 scoreThreshold, uint256 timestamp, bool valid }

Functions:
- verifyAndAttest(bytes calldata proof, bytes32[] calldata publicInputs) → bool
  - publicInputs[0] = scoreThreshold
  - publicInputs[1] = userCommitment (hash of address + nonce)
  - Calls verifier.verify(proof, publicInputs)
  - Stores attestation
  - Prevents proof replay via usedProofs[proofHash]
  - Emits GhostScoreVerified(userCommitment, scoreThreshold, timestamp)

- getAttestation(address user, uint256 index) → GhostScoreAttestation
- hasValidAttestation(address user, uint256 minThreshold) → bool
```

### Contract 4: `CreditVault.sol`

Undercollateralized lending vault — the killer demo.

```
State:
- IERC20 public lendingToken  // stablecoin or CTC
- IGhostScoreVerifier public ghostScore
- ICreditRegistry public registry
- mapping(uint256 => Loan) public loans
- mapping(uint256 => LoanTier) public tiers  // score threshold => terms
- uint256 public totalLoans
- uint256 public totalDeposited
- uint256 public totalBorrowed

Structs:
- Loan { address borrower, uint256 amount, uint256 interestRate, uint256 startTime, uint256 duration, uint256 repaid, LoanStatus status }
- LoanTier { uint256 maxAmount, uint256 interestBps, uint256 durationDays, uint256 collateralBps }
- LoanStatus { ACTIVE, REPAID, DEFAULTED }

Functions:
- depositLiquidity(uint256 amount)
  - Lenders deposit tokens into vault
  - Emits LiquidityDeposited(lender, amount)

- requestLoan(bytes calldata ghostProof, bytes32[] calldata publicInputs, uint256 amount)
  - Verifies GhostScore proof via ghostScore.verifyAndAttest()
  - Looks up LoanTier for the proven score threshold
  - Validates amount <= tier.maxAmount
  - Calculates required collateral (lower score = more collateral, higher score = LESS)
  - Transfers collateral from borrower
  - Transfers loan amount to borrower
  - Creates Loan record
  - Calls registry (via interceptor) for BORROW credit event
  - Emits LoanIssued(loanId, borrower, amount, interestRate, collateralRequired)

- repayLoan(uint256 loanId, uint256 amount)
  - Partial or full repayment
  - On full repay: return collateral, mark REPAID
  - Triggers REPAY credit event (highest weight — builds score fast)
  - Emits LoanRepaid(loanId, amount, remaining)

- liquidate(uint256 loanId)
  - If past duration + grace period and not repaid
  - Seize collateral, mark DEFAULTED
  - Negative credit event
  - Emits LoanDefaulted(loanId, borrower)

- setTier(uint256 scoreThreshold, LoanTier tier) → onlyOwner
- getAvailableLiquidity() → uint256
- getLoanTermsForScore(uint256 score) → LoanTier
```

### Contract 5: `CreditNFT.sol` (Soulbound Achievement NFTs)

Optional but great for demo — visual credit milestones.

```
State:
- Extends ERC721 (with transfer disabled — soulbound)
- mapping(uint256 => CreditBadge) public badges

Structs:
- CreditBadge { uint256 scoreAtMint, string tier, uint256 timestamp }
  - Tiers: "Newcomer" (0-100), "Builder" (100-300), "Trusted" (300-600), "Elite" (600+)

Functions:
- mint(address to, uint256 score) → onlyCreditRegistry
  - Auto-mints when user crosses tier thresholds
  - Dynamic SVG metadata (badge changes appearance based on tier)
- tokenURI(uint256 tokenId) → string (onchain SVG generation)
- transferFrom() → DISABLED (soulbound)
```

### Contract 6: `CreditChainFactory.sol` (Appchain Deployer)

**The core infrastructure primitive.** Any institution, business, or builder calls `deployAppChain()` and gets a fully isolated CreditNet stack — their own registry, interceptor, vault, verifier, and NFTs. One function call = full credit system.

Uses OpenZeppelin `Clones` (minimal proxy / EIP-1167) so deploying an appchain is cheap (~300k gas vs ~5M for full deploys).

```
State:
- mapping(uint256 => AppChain) public appChains
- uint256 public totalChains
- address public registryImpl       // implementation contracts for cloning
- address public interceptorImpl
- address public vaultImpl
- address public verifierImpl
- address public nftImpl

Structs:
- AppChain {
    uint256 id,
    address admin,              // institution wallet
    string name,
    address registry,           // deployed CreditRegistry instance (proxy)
    address interceptor,        // deployed CreditInterceptor instance (proxy)
    address vault,              // deployed CreditVault instance (proxy)
    address verifier,           // deployed GhostScoreVerifier instance (proxy)
    address nft,                // deployed CreditNFT instance (proxy)
    AppChainConfig config,
    uint256 createdAt,
    bool active
  }

- AppChainConfig {
    uint256[] actionWeights,        // institution sets its own credit scoring weights
    LoanTier[] loanTiers,           // institution sets its own loan terms
    bool allowCrossChainScores,     // accept scores imported from other appchains
    uint256 minScoreForLoan,
    address[] whitelistedTokens
  }

Functions:
- deployAppChain(string name, AppChainConfig config) → uint256 chainId
  - Clones all 5 implementation contracts via Clones.clone()
  - Calls initialize() on each clone (proxy pattern — no constructors)
  - Wires them together: interceptor → registry, vault → verifier → registry
  - Sets msg.sender as admin/owner of all deployed contracts
  - Stores AppChain record
  - Emits AppChainDeployed(chainId, admin, name, registry, interceptor, vault, verifier, nft)

- getAppChain(uint256 chainId) → AppChain
- getAppChainsByAdmin(address admin) → uint256[]
- getAppChainCount() → uint256
- deactivateAppChain(uint256 chainId) → onlyChainAdmin
- upgradeImplementation(string contractName, address newImpl) → onlyOwner
```

**Why this matters for the pitch:**
- "CreditNet has deployed X appchains" — visible metric for judges
- Each institution gets isolated credit environments — no data leakage between appchains
- Institutions control their own scoring weights, loan terms, token whitelists
- Demo: deploy an appchain live during the pitch in one transaction

### Contract 7: `CrossChainBridge.sol` (Score Portability)

Optional — lets users port credit scores between appchains. A user who built credit on "Acme Bank's appchain" can prove that score on "LatAm Fintech's appchain."

```
State:
- mapping(uint256 => mapping(uint256 => uint256)) public bridgeWeights
  // fromChainId => toChainId => weight multiplier (in bps, e.g. 7000 = 70%)
- mapping(bytes32 => bool) public processedExports

Structs:
- ScoreExport { uint256 fromChainId, address user, uint256 scoreThreshold, bytes proof, uint256 timestamp }

Functions:
- exportScore(uint256 fromChainId) → ScoreExport
  - User generates GhostScore proof on source appchain
  - Creates signed export attestation
  - Emits ScoreExported(fromChainId, user, scoreThreshold)

- importScore(uint256 toChainId, ScoreExport export) → bool
  - Validates both appchains have allowCrossChainScores = true
  - Verifies the GhostScore proof from source chain
  - Applies bridge weight (e.g. imported score worth 70% of original)
  - Creates credit event on destination appchain
  - Prevents replay via processedExports
  - Emits ScoreImported(fromChainId, toChainId, user, adjustedScore)

- setBridgeWeight(uint256 fromId, uint256 toId, uint256 weightBps) → onlyOwner
```

**Architecture overview:**
```
CreditChainFactory (singleton, deployed once on Creditcoin)
│
├── AppChain #1: "Acme Bank"
│   ├── CreditRegistry   (proxy clone)
│   ├── CreditInterceptor (proxy clone)
│   ├── CreditVault       (proxy clone)
│   ├── GhostScoreVerifier(proxy clone)
│   └── CreditNFT         (proxy clone)
│
├── AppChain #2: "LatAm Fintech"
│   ├── CreditRegistry   (proxy clone)
│   ├── ... (same stack, different config/weights)
│
├── AppChain #3: "DeFi Protocol X"
│   └── ... (same stack, crypto-native config)
│
└── CrossChainBridge (connects appchains, ZK score portability)
```

---

## Noir ZK Circuit: `ghost_score`

```
Circuit: ghost_score/src/main.nr

Private inputs:
- credit_events: [CreditEventData; MAX_EVENTS]  // user's full history (HIDDEN)
- event_count: u32
- salt: Field  // randomness for commitment

Public inputs:
- score_threshold: Field        // "I prove my score >= this"
- user_commitment: Field        // hash(address, salt) — ties proof to user without revealing address
- registry_root: Field          // merkle root of credit registry (proves events are real)

Constraints:
1. Compute weighted_score = sum(credit_events[i].weight * credit_events[i].amount) for i in 0..event_count
2. Assert weighted_score >= score_threshold
3. Assert user_commitment == hash(address, salt)
4. Assert each credit_event exists in merkle tree with root == registry_root

Output: proof that score >= threshold, tied to user_commitment, against registry_root
```

**Simplified v1 for hackathon** (skip merkle proof, trust registry):

```
Private: credit_score (actual score), salt
Public: score_threshold, user_commitment
Constraints:
1. credit_score >= score_threshold
2. user_commitment == hash(user_address, salt)
```

This is enough for demo. Merkle proof version is "nice to have."

---

## Day-by-Day Build Plan (Feb 1 — Feb 22)

### WEEK 1: Smart Contracts Core (Feb 1-7)

**Day 1 (Feb 1) — Project Setup + CreditRegistry**
- [ ] Init Hardhat project with TypeScript config
- [ ] Init Noir project (nargo new ghost_score)
- [ ] Init Next.js frontend with Tailwind + wagmi + viem
- [ ] Monorepo structure: `/contracts`, `/circuits`, `/frontend`
- [ ] Write `CreditRegistry.sol` — full implementation
- [ ] Write `CreditRegistry.test.ts` — test registerCreditEvent, getCreditScore, getCreditHistory, actionWeights
- [ ] Deploy to Creditcoin testnet, verify contract works

**Day 2 (Feb 2) — CreditInterceptor**
- [ ] Write `CreditInterceptor.sol` — all intercept functions
- [ ] Write mock DeFi contracts for testing (MockDEX, MockStaking)
- [ ] Write `CreditInterceptor.test.ts` — test each intercept function generates correct credit events
- [ ] Integration test: Interceptor → Registry → score updates correctly
- [ ] Deploy to testnet

**Day 3 (Feb 3) — CreditVault**
- [ ] Write `CreditVault.sol` — deposit, requestLoan (without ZK for now, use plain score), repay, liquidate
- [ ] Write loan tier configuration
- [ ] Write `CreditVault.test.ts` — full loan lifecycle: deposit → borrow → repay → score improves
- [ ] Test edge cases: over-borrow, late repayment, liquidation
- [ ] Deploy to testnet

**Day 4 (Feb 4) — CreditNFT + CreditChainFactory**
- [ ] Write `CreditNFT.sol` — soulbound NFT with onchain SVG
- [ ] Write dynamic SVG generation for badge tiers (Newcomer → Builder → Trusted → Elite)
- [ ] Write `CreditNFT.test.ts`
- [ ] Refactor ALL contracts to use `initialize()` instead of constructors (proxy pattern for factory)
- [ ] Write `CreditChainFactory.sol` — full appchain deployer using OpenZeppelin Clones
- [ ] Write `CreditChainFactory.test.ts` — test deployAppChain creates isolated instances
- [ ] Test: deploy 2 appchains, verify they're fully isolated (events on chain A don't affect chain B)

**Day 5 (Feb 5) — Noir ZK Circuit + CrossChainBridge**
- [ ] Write simplified ghost_score circuit in Noir
- [ ] Private: actual_score, salt | Public: threshold, commitment
- [ ] Test circuit locally with nargo test
- [ ] Generate proof locally with nargo prove
- [ ] Generate Solidity verifier with nargo codegen-verifier
- [ ] Test verifier contract in Hardhat
- [ ] Write `CrossChainBridge.sol` — score portability between appchains
- [ ] Write `CrossChainBridge.test.ts` — test export/import with weight discount

**Day 6 (Feb 6) — GhostScoreVerifier + Full Integration**
- [ ] Deploy Noir-generated UltraVerifier.sol
- [ ] Write `GhostScoreVerifier.sol` wrapper (attestations, replay protection)
- [ ] Write `GhostScoreVerifier.test.ts`
- [ ] Integrate with CreditVault — requestLoan now requires ZK proof
- [ ] Full flow test: deploy appchain → build credit → generate ZK proof → submit to vault → get loan
- [ ] Test cross-chain flow: build credit on appchain A → export score → import to appchain B → borrow
- [ ] Deploy updated contracts to testnet

**Day 7 (Feb 7) — Contract Polish + Security**
- [ ] Review all contracts for reentrancy, overflow, access control
- [ ] Add OpenZeppelin ReentrancyGuard, Ownable, Pausable where needed
- [ ] Add events to every state change (critical for frontend)
- [ ] Write deployment scripts (deploy.ts) — deploy factory + implementation contracts
- [ ] Write seed script that deploys 3 demo appchains ("Acme Bank", "LatAm Fintech", "DeFi Protocol X")
- [ ] Write README for contracts
- [ ] Final testnet deployment of complete contract suite
- [ ] **MILESTONE: Factory + 3 demo appchains deployed and tested on Creditcoin testnet**

---

### WEEK 2: Frontend Core (Feb 8-14)

**Day 8 (Feb 8) — Frontend Setup + Wallet Connection**
- [ ] Next.js app with app router
- [ ] Tailwind + shadcn/ui components
- [ ] wagmi + viem config for Creditcoin testnet
- [ ] Wallet connect (MetaMask, WalletConnect)
- [ ] Layout: sidebar nav, header with wallet, main content area
- [ ] Contract ABIs imported, hooks generated

**Day 9 (Feb 9) — Dashboard Page**
- [ ] Credit Score display — large animated circular gauge (0-1000)
- [ ] Score history chart (line chart using recharts) — score over time
- [ ] Recent credit events feed — live updating list
- [ ] Stats cards: total events, current tier, next tier progress
- [ ] CreditNFT badge display (render onchain SVG)
- [ ] Real-time updates via event listeners (credit events fire → UI updates)

**Day 10 (Feb 10) — Actions Page (Credit Building)**
- [ ] "Build Credit" page with action cards:
  - Swap tokens (via interceptor)
  - Provide liquidity (via interceptor)
  - Stake CTC (via interceptor)
  - Transfer tokens (via interceptor)
- [ ] Each action shows: estimated credit points, current weight
- [ ] Transaction flow: user approves → interceptor executes → credit event fires → score updates live
- [ ] Success animation when score increases
- [ ] Running counter: "You've generated X credit events"

**Day 11 (Feb 11) — GhostScore Page**
- [ ] "Generate GhostScore" page
- [ ] Display current credit score (private — only user sees)
- [ ] Threshold selector: "Prove your score is above: [slider]"
- [ ] "Generate Proof" button → calls Noir prover (via WASM or backend API)
- [ ] Proof generation loading animation
- [ ] Proof display: proof hash, threshold proven, timestamp
- [ ] "Submit to Chain" button → calls GhostScoreVerifier.verifyAndAttest()
- [ ] Attestation history list
- [ ] Visual: shield/lock icon animations for "privacy" feel

**Day 12 (Feb 12) — CreditVault Page (Lending)**
- [ ] Vault overview: total liquidity, total borrowed, APY
- [ ] Loan tiers display: score threshold → max loan → interest rate → collateral %
- [ ] "Deposit" tab for lenders
- [ ] "Borrow" tab for borrowers:
  - Select loan tier (based on your GhostScore attestation)
  - Enter amount
  - See required collateral (lower for higher scores)
  - Submit with GhostScore proof
  - Loan created → funds received
- [ ] "My Loans" tab: active loans, repayment progress, repay button
- [ ] Repayment triggers credit event → score goes up (visible feedback loop)

**Day 13 (Feb 13) — Live Activity Feed + Leaderboard**
- [ ] Global activity feed: all credit events across all users (real-time)
- [ ] Event counter: "CreditNet has processed X credit events"
- [ ] Leaderboard: top credit scores (anonymized or by address)
- [ ] Network stats: total users, total loans, total repaid, default rate
- [ ] This page is KEY for demo — shows the protocol is alive

**Day 14 (Feb 14) — Integration Testing + Mobile Responsive**
- [ ] Full flow test on testnet via frontend:
  - Connect wallet → do actions → build score → generate GhostScore → borrow → repay
- [ ] Fix all bugs from flow test
- [ ] Mobile responsive pass (judges might view on phone)
- [ ] Loading states, error handling, toast notifications
- [ ] **MILESTONE: Complete working frontend on Creditcoin testnet**

---

### WEEK 3: Polish + Video + Submit (Feb 15-22)

**Day 15 (Feb 15) — UI Polish Pass**
- [ ] Dark theme with credit/finance aesthetic (navy, gold accents, clean)
- [ ] Animations: score gauge animating up, credit events sliding in, proof generation spinner
- [ ] Micro-interactions: button hover states, card transitions
- [ ] Empty states for new users ("Start building your credit →")
- [ ] Onboarding flow: first-time user guided through first credit action

**Day 16 (Feb 16) — Demo Data + Seed Script**
- [ ] Write seed script that populates testnet with realistic demo data
- [ ] Multiple user personas: "new user" (low score), "active user" (mid), "trusted user" (high)
- [ ] Pre-populated credit events, loans, repayments
- [ ] This makes demo day smooth — don't rely on building credit from scratch live

**Day 17 (Feb 17) — DoraHacks README + Project Page**
- [ ] Write killer README:
  - Problem: 1.4B unbanked, credit trapped in siloes, privacy violations
  - Solution: CreditNet Protocol — one-sentence pitch
  - Architecture diagram (clean, not cluttered)
  - How it works (3 steps, visual)
  - Novel primitives: Credit Interceptor, GhostScore, CreditVault
  - Tech stack
  - Screenshots (4-5 key screens)
  - Team info
  - CEIP pitch: why this is a business, not just a hack project
- [ ] DoraHacks project page: title, one-liner, tags, screenshots, links

**Day 18 (Feb 18) — Video Scripting**
- [ ] Script the 3-minute DoraHacks video:
  - 0:00-0:30 — Hook: "1.4 billion people can't prove they're creditworthy. CreditNet fixes this."
  - 0:30-1:00 — Problem: Credit is siloed, public, and excludes billions
  - 1:00-1:30 — Solution: CreditNet's 3 primitives (Interceptor, GhostScore, Vault)
  - 1:30-2:30 — Live demo: build credit → generate ZK proof → get loan → repay → score grows
  - 2:30-3:00 — CEIP pitch: "This is infrastructure for Creditcoin's entire ecosystem. Every dApp gets credit for free."
- [ ] Record voiceover draft
- [ ] Screen record demo walkthrough

**Day 19 (Feb 19) — Video Production**
- [ ] Record final screen captures (clean, no errors, smooth flow)
- [ ] Record voiceover (clear, confident, practiced)
- [ ] Edit: combine VO + screen recording + text overlays
- [ ] Add: architecture diagram animation, before/after comparison
- [ ] Background music (subtle, professional)
- [ ] Export 1080p

**Day 20 (Feb 20) — Video Review + Fix**
- [ ] Watch video 5 times. Fix any awkward cuts, unclear sections
- [ ] Get 1-2 people to watch. Ask: "Did you understand it? What confused you?"
- [ ] Re-record any weak sections
- [ ] Final export

**Day 21 (Feb 21) — Final Testing + Bug Fixes**
- [ ] Full end-to-end test on Creditcoin testnet
- [ ] Test every frontend page and flow
- [ ] Fix any remaining bugs
- [ ] Final contract verification on block explorer
- [ ] GitHub repo clean: no console.logs, no hardcoded keys, clean commit history
- [ ] Verify all links work (demo URL, repo, video)

**Day 22 (Feb 22) — SUBMIT**
- [ ] Final README review
- [ ] Upload video to DoraHacks
- [ ] Fill out all DoraHacks submission fields
- [ ] Double-check: video plays, demo link works, repo is public, contracts verified
- [ ] Submit before 23:59 EST
- [ ] DONE

---

## Frontend Design Direction

### Overall Aesthetic
- **Theme:** Dark mode, navy/slate base (#0F172A), with gold/amber accents (#F59E0B) for credit score elements
- **Vibe:** Fintech meets crypto — clean like Stripe, credible like a bank dashboard, but with crypto energy
- **Typography:** Inter or DM Sans — clean, modern, professional
- **Cards:** Subtle glass-morphism with border gradients for key metrics

### Key Visual Elements

**Credit Score Gauge (centerpiece of dashboard):**
- Large circular gauge (like a speedometer), 0-1000
- Color gradient: red (0-200) → orange (200-400) → yellow (400-600) → green (600-800) → gold (800-1000)
- Animated fill on load and on score change
- Current tier badge displayed below gauge
- "+X points" floating animation when credit event happens

**Credit Event Feed:**
- Vertical timeline with icons per action type (swap icon, lend icon, stake icon, etc.)
- Each event shows: action type, amount, points earned, timestamp
- New events slide in from top with subtle animation
- Green glow pulse on new events

**GhostScore Section:**
- Shield/lock visual motif — privacy-focused design
- Proof generation: animated shield assembling (conveying "building your proof")
- Once generated: green checkmark shield with "Score > X verified"
- Dark/mysterious aesthetic — contrasts with bright dashboard to convey "private"

**CreditVault:**
- Clean lending interface similar to Aave/Compound
- Tier cards showing: score requirement, max loan, interest, collateral %
- Visual: higher tiers are gold/premium looking, lower tiers are basic
- Loan progress bars showing repayment %
- "Credit Building" indicator showing how repayment improves score

**Live Counter (always visible in header):**
- "CreditNet: X credit events processed" — number ticking up
- Shows protocol is alive and generating activity

### Page Structure

```
/                    → Landing page (for DoraHacks judges — pitch + screenshots)
/app                 → Appchain selector (pick or deploy an appchain)
/app/[chainId]       → Dashboard for specific appchain (credit score, events, NFTs)
/app/[chainId]/build → Actions page (do DeFi → build credit on this appchain)
/app/[chainId]/ghostscore → ZK proof generation and management
/app/[chainId]/vault → Lending vault (deposit, borrow, repay)
/app/deploy          → Deploy new appchain (institution onboarding flow)
/app/bridge          → Cross-chain score portability
/app/network         → Global feed: all appchains, total events, leaderboard
```

---

## Repository Structure

```
creditnet-protocol/
├── contracts/
│   ├── src/
│   │   ├── CreditChainFactory.sol       // NEW — master appchain deployer
│   │   ├── CrossChainBridge.sol         // NEW — score portability
│   │   ├── CreditRegistry.sol           // refactored: initialize() + private scores
│   │   ├── CreditInterceptor.sol        // refactored: initialize() for proxy
│   │   ├── GhostScoreVerifier.sol
│   │   ├── CreditVault.sol              // refactored: initialize() for proxy
│   │   ├── CreditNFT.sol
│   │   ├── interfaces/
│   │   │   ├── ICreditChainFactory.sol
│   │   │   ├── ICrossChainBridge.sol
│   │   │   ├── ICreditRegistry.sol
│   │   │   ├── ICreditInterceptor.sol
│   │   │   ├── IGhostScoreVerifier.sol
│   │   │   └── ICreditVault.sol
│   │   └── mocks/
│   │       ├── MockERC20.sol
│   │       ├── MockDEX.sol
│   │       └── MockStaking.sol
│   ├── test/
│   │   ├── CreditChainFactory.test.ts   // NEW
│   │   ├── CrossChainBridge.test.ts     // NEW
│   │   ├── CreditRegistry.test.ts
│   │   ├── CreditInterceptor.test.ts
│   │   ├── CreditVault.test.ts
│   │   ├── GhostScoreVerifier.test.ts
│   │   ├── CreditNFT.test.ts
│   │   └── Integration.test.ts          // full multi-appchain lifecycle
│   ├── scripts/
│   │   ├── deploy.ts                    // deploys factory + implementations
│   │   └── seed.ts                      // deploys 3 demo appchains with data
│   └── hardhat.config.ts
├── circuits/
│   └── ghost_score/
│       ├── src/
│       │   └── main.nr
│       ├── Prover.toml
│       ├── Verifier.toml
│       └── Nargo.toml
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                     (landing)
│   │   └── app/
│   │       ├── layout.tsx               (app shell with sidebar)
│   │       ├── page.tsx                 (appchain selector)
│   │       ├── deploy/page.tsx          (NEW — deploy appchain flow)
│   │       ├── bridge/page.tsx          (NEW — cross-chain score portability)
│   │       ├── [chainId]/
│   │       │   ├── page.tsx             (dashboard for specific appchain)
│   │       │   ├── build/page.tsx       (actions)
│   │       │   ├── ghostscore/page.tsx
│   │       │   └── vault/page.tsx
│   │       └── network/page.tsx         (global stats across all appchains)
│   ├── components/
│   │   ├── AppChainCard.tsx             // NEW — appchain selector card
│   │   ├── DeployAppChainForm.tsx       // NEW — institution onboarding
│   │   ├── CrossChainBridge.tsx         // NEW — score import/export UI
│   │   ├── CreditGauge.tsx
│   │   ├── EventFeed.tsx
│   │   ├── GhostScoreGenerator.tsx
│   │   ├── VaultInterface.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── LiveCounter.tsx
│   │   └── NFTBadge.tsx
│   ├── hooks/
│   │   ├── useAppChain.ts              // NEW — appchain context
│   │   ├── useFactory.ts               // NEW — factory interactions
│   │   ├── useCreditScore.ts
│   │   ├── useCreditEvents.ts
│   │   ├── useGhostScore.ts
│   │   └── useVault.ts
│   ├── lib/
│   │   ├── contracts.ts                 (ABIs + addresses)
│   │   ├── noir.ts                      (proof generation helpers)
│   │   └── config.ts
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
├── README.md
└── package.json
```

---

## Testing Strategy

### Smart Contract Tests (Hardhat + Chai)
- Unit tests per contract (all functions + edge cases)
- **Factory test:** Deploy factory → deployAppChain() → verify all 5 proxy contracts created and wired correctly
- **Isolation test:** Deploy 2 appchains → credit events on chain A don't affect chain B
- **Single-appchain integration test:**
  1. Deploy appchain via factory
  2. User does 5 DeFi actions via Interceptor
  3. Verify credit score computed correctly (via getMyScore, not public mapping)
  4. Verify score commitment updated (public commitment, not raw score)
  5. Generate GhostScore proof offchain
  6. Submit proof to GhostScoreVerifier
  7. Request loan from CreditVault using attestation
  8. Repay loan
  9. Verify score increased from repayment
  10. Verify NFT minted at tier thresholds
- **Cross-chain integration test:**
  1. Deploy appchain A and B via factory (both with allowCrossChainScores = true)
  2. User builds credit on appchain A
  3. User exports score via CrossChainBridge
  4. User imports score on appchain B (at 70% weight)
  5. User borrows on appchain B using imported score

### Noir Circuit Tests
- `nargo test` — verify circuit constraints
- Test cases: score above threshold (pass), score below threshold (fail), invalid commitment (fail)

### Frontend Tests
- Manual E2E flow test on Creditcoin testnet
- Verify all contract interactions via UI
- Mobile responsive check

### Pre-Submission Checklist
- [ ] All contracts deployed and verified on Creditcoin testnet
- [ ] Frontend hosted (Vercel) and accessible
- [ ] Demo flow works end-to-end without errors
- [ ] Video uploaded and plays correctly
- [ ] README complete with architecture diagram + screenshots
- [ ] GitHub repo public with clean commit history
- [ ] DoraHacks submission fields all filled
