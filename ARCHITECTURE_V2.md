# CreditNet Protocol V2 — Universal Credit Layer Architecture

## Vision
**"All credit on Creditcoin, managed by everyone."**

Users have ONE universal credit score aggregated from:
- Factory-deployed appchains (institutional credit systems)
- Creditcoin mainnet DeFi protocols (real DEX swaps, lending, staking)
- Off-chain RWA data (bank transactions, loan repayments via oracles)

Institutions can deploy isolated appchains OR query the universal registry. End users benefit from a portable, universal credit identity.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│         UniversalCreditRegistry (Testnet)                   │
│         • One global credit score per user                  │
│         • Aggregates from multiple sources                  │
│         • Privacy-preserving (commitments + ZK)             │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ (credit events flow UP)
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Appchains    │  │ Mainnet      │  │ RWA Oracle   │
│ (Factory)    │  │ Indexer      │  │ (Off-chain)  │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ • Bank A     │  │ Monitors:    │  │ • Bank loans │
│ • Fintech B  │  │ - DEX swaps  │  │ • Repayments │
│ • DeFi App C │  │ - Lending    │  │ • Credit     │
│              │  │ - Staking    │  │   bureaus    │
│ Opt-in sync  │  │ Writes via   │  │ Signed data  │
│ to universal │  │ CreditOracle │  │ via API      │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## New Smart Contracts

### 1. UniversalCreditRegistry.sol

**Purpose:** Global credit ledger that aggregates events from all sources.

**Key Differences from CreditRegistry:**
- Multi-source tracking (appchain events, mainnet events, RWA events)
- Source-weighted scoring (mainnet repayments might count more than testnet swaps)
- Privacy-preserving: scores stored as commitments, institutions query via ZK
- Read-only for end users, write access via authorized sources

```solidity
State:
- mapping(address => UniversalScore) internal scores
- mapping(address => CreditEvent[]) internal eventHistory
- mapping(address => bytes32) public scoreCommitments
- mapping(uint256 => CreditSource) public sources  // appchain ID or mainnet protocol
- mapping(address => bool) public authorizedWriters  // keepers, oracles, appchains
- uint256 public totalUniversalEvents

Structs:
- UniversalScore { uint256 score, uint256 lastUpdated, uint256 eventCount }
- CreditEvent { address user, uint256 sourceId, ActionType action, uint256 amount, uint256 timestamp, uint256 points }
- CreditSource { string name, SourceType sourceType, uint256 weight }
- SourceType { APPCHAIN, MAINNET_PROTOCOL, RWA_ORACLE }

Functions:
- registerEvent(address user, uint256 sourceId, ActionType action, uint256 amount) → onlyAuthorized
  - Validates sourceId exists
  - Computes points = sources[sourceId].weight * action weight * amount normalization
  - Updates scores[user]
  - Updates scoreCommitments[user]
  - Emits UniversalCreditEventRecorded(user, sourceId, action, amount, points)

- getMyUniversalScore() → UniversalScore  // msg.sender only
- getMyEventHistory() → CreditEvent[]      // msg.sender only
- getEventsBySource(uint256 sourceId) → CreditEvent[]  // filter events by source
- getScoreBreakdown(address user) → mapping(uint256 => uint256)  // score per source (private)

- registerSource(string name, SourceType sourceType, uint256 weight) → onlyOwner
  - Returns sourceId
  - Used to register new appchains, mainnet protocols, RWA oracles

- authorizeWriter(address writer) → onlyOwner
  - Keepers, appchains, oracles must be authorized to write

- setSourceWeight(uint256 sourceId, uint256 weight) → onlyOwner
  - Adjust weights (e.g., mainnet repayments = 2x testnet swaps)
```

---

### 2. CreditOracle.sol

**Purpose:** Keeper contract for off-chain indexer to write mainnet events.

```solidity
State:
- IUniversalCreditRegistry public registry
- mapping(address => bool) public keepers
- mapping(bytes32 => bool) public processedEvents  // prevent replay
- uint256 public mainnetSourceId  // sourceId for "Creditcoin Mainnet"

Functions:
- submitMainnetEvent(
    address user,
    ActionType action,
    uint256 amount,
    uint256 timestamp,
    bytes32 txHash,
    bytes calldata signature
  ) → onlyKeeper
  - Validates signature (from trusted keeper)
  - Prevents replay via processedEvents[txHash]
  - Calls registry.registerEvent(user, mainnetSourceId, action, amount)
  - Emits MainnetEventSubmitted(user, action, amount, txHash)

- submitBatch(MainnetEvent[] calldata events) → onlyKeeper
  - Gas-efficient batch submission

- addKeeper(address keeper) → onlyOwner
- removeKeeper(address keeper) → onlyOwner
```

---

### 3. RWAOracle.sol

**Purpose:** Institutions submit signed off-chain credit data (bank loans, repayments, etc.)

```solidity
State:
- IUniversalCreditRegistry public registry
- mapping(address => Institution) public institutions
- mapping(bytes32 => bool) public processedRWAEvents
- mapping(uint256 => uint256) public rwaSourceIds  // institutionId => sourceId

Structs:
- Institution { string name, bool active, address signer }

Functions:
- submitRWAEvent(
    address user,
    ActionType action,
    uint256 amount,
    uint256 timestamp,
    bytes32 eventId,
    bytes calldata institutionSignature
  ) → public
  - Validates institution signature
  - Prevents replay via processedRWAEvents[eventId]
  - Calls registry.registerEvent(user, rwaSourceIds[institutionId], action, amount)
  - Emits RWAEventSubmitted(institution, user, action, amount, eventId)

- registerInstitution(string name, address signer) → onlyOwner
  - Creates sourceId via registry.registerSource()
  - Returns institutionId

- updateInstitutionSigner(uint256 institutionId, address newSigner) → onlyOwner
```

---

### 4. Modified: CreditChainFactory.sol

**Changes:**
- Add `syncToUniversal` flag in AppChainConfig
- On deployAppChain(), if syncToUniversal = true:
  - Register appchain as a source in UniversalCreditRegistry
  - Authorize the appchain's CreditInterceptor to write to UniversalCreditRegistry

```solidity
AppChainConfig (updated):
- bool syncToUniversal  // NEW — sync credit events to universal registry
- uint256 universalWeight  // NEW — weight for this appchain (default 100 = 1x)

deployAppChain() (updated):
- If config.syncToUniversal:
  - uint256 sourceId = universalRegistry.registerSource(name, SourceType.APPCHAIN, config.universalWeight)
  - universalRegistry.authorizeWriter(deployedInterceptor)
  - Store sourceId in AppChain struct
```

---

### 5. Modified: CreditInterceptor.sol

**Changes:**
- Add optional write to UniversalCreditRegistry
- If appchain is synced to universal, every credit event writes to BOTH:
  1. Appchain's local CreditRegistry (for isolated score)
  2. UniversalCreditRegistry (for global score)

```solidity
State (updated):
- IUniversalCreditRegistry public universalRegistry  // optional
- uint256 public universalSourceId  // this appchain's sourceId
- bool public syncToUniversal

interceptSwap() (updated):
- registry.registerCreditEvent(msg.sender, SWAP, amountIn)  // local
- if (syncToUniversal):
    universalRegistry.registerEvent(msg.sender, universalSourceId, SWAP, amountIn)  // global
```

---

## Off-Chain Components

### CreditIndexer (Node.js Service)

**Purpose:** Monitors Creditcoin mainnet, detects credit events, writes to UniversalCreditRegistry via CreditOracle.

**Tech Stack:**
- Node.js + ethers.js (or viem)
- Creditcoin mainnet RPC endpoint
- Event listener for known protocols (DEXs, lending, staking)

**Flow:**
1. Listen to mainnet blocks
2. Detect credit-relevant transactions:
   - DEX swaps (Uniswap V2/V3 clones)
   - Lending protocol events (Aave/Compound clones: Supply, Borrow, Repay)
   - Staking contracts (Deposit, Withdraw)
   - ERC20 transfers (large transfers = credit signal?)
3. Classify as ActionType (SWAP, LEND, REPAY, STAKE, TRANSFER)
4. Sign event data with keeper private key
5. Call `CreditOracle.submitMainnetEvent(user, action, amount, timestamp, txHash, signature)`
6. Store processed txHashes in local DB to prevent resubmission

**Example:**
```typescript
// Pseudocode
const provider = new ethers.JsonRpcProvider(CREDITCOIN_MAINNET_RPC)
const dexContract = new ethers.Contract(DEX_ADDRESS, DEX_ABI, provider)

dexContract.on('Swap', async (user, tokenIn, tokenOut, amountIn, amountOut, event) => {
  const creditEvent = {
    user,
    action: ActionType.SWAP,
    amount: amountIn,
    timestamp: (await event.getBlock()).timestamp,
    txHash: event.transactionHash
  }

  const signature = await keeper.signMessage(hashEvent(creditEvent))
  await creditOracle.submitMainnetEvent(...creditEvent, signature)
})
```

**Deployment:**
- Docker container
- Hosted on Railway / Render / AWS
- Keeper wallet funded with testnet gas

---

### RWA API (Optional, for institutions)

**Purpose:** Institutions POST off-chain credit data.

**Endpoints:**
```
POST /api/rwa/submit
Body: {
  institutionId: 1,
  user: "0x...",
  action: "REPAY",
  amount: "50000000000000000000",  // 50 tokens
  eventId: "loan-12345-repayment-1",
  signature: "0x..."
}

Response: {
  success: true,
  txHash: "0x..."  // testnet tx that wrote to RWAOracle
}
```

**Flow:**
1. Institution signs event data with their registered signer key
2. POSTs to API
3. API validates signature
4. API calls `RWAOracle.submitRWAEvent()`
5. Returns tx hash

---

## Frontend Changes

### New Pages

**1. Universal Dashboard (`/app/universal`)**
- Shows user's universal credit score (aggregated from all sources)
- Score breakdown:
  - Score from appchains: X points
  - Score from mainnet DeFi: Y points
  - Score from RWA: Z points
- Credit event feed (all sources, filterable by source)
- Visual: "Your Creditcoin Credit Identity"

**2. Institution Portal (`/app/institution`)**
- For institutions (banks, fintechs, RWA originators)
- Submit RWA credit data form
- Query universal scores (via ZK proofs)
- Deploy appchain (links to factory)
- View their appchain stats

**3. Mainnet Explorer (`/app/mainnet`)**
- Shows real-time mainnet events being indexed
- Live feed: "User 0x123 swapped $500 on DEX → +10 credit points"
- Demonstrates mainnet integration is live

### Modified Pages

**Dashboard (appchain-specific):**
- Now shows TWO scores:
  - Appchain Score (local, isolated)
  - Universal Score (global, aggregated)
- User can toggle between views

**Factory Page:**
- Add "Sync to Universal" toggle in AppChain deploy form
- Explain: "Sync credit events to universal registry for cross-chain portability"

---

## Why This Architecture Wins

1. **Preserves Factory Feature:** Institutions still get isolated appchains (your original pitch)
2. **Adds Universal Layer:** Users get one portable credit identity across all of Creditcoin
3. **Real Mainnet Data:** Not siloed testnet toy — aggregates REAL Creditcoin mainnet activity
4. **RWA-Ready:** Banks/institutions can submit real-world credit data via oracle
5. **Judges See:** "This isn't just a dApp, it's INFRASTRUCTURE for Creditcoin's entire ecosystem"

---

## Implementation Priority (Updated Timeline)

### Week 1 (Feb 1-7) — Smart Contracts V2
- [x] Day 1-4: Original contracts (done per plan)
- [ ] Day 5: UniversalCreditRegistry.sol + tests
- [ ] Day 6: CreditOracle.sol + RWAOracle.sol + tests
- [ ] Day 7: Modify Factory + Interceptor for universal sync + tests

### Week 2 (Feb 8-14) — Off-Chain Indexer + Frontend V2
- [ ] Day 8-9: Build CreditIndexer (Node.js mainnet monitor)
- [ ] Day 10-11: Deploy indexer, test mainnet event ingestion
- [ ] Day 12-13: Frontend V2 — Universal Dashboard, Institution Portal
- [ ] Day 14: Full integration test (appchain + mainnet + RWA → universal score)

### Week 3 (Feb 15-22) — Polish + Demo
- [ ] Day 15-17: UI polish, demo flow refinement
- [ ] Day 18-20: Video production (emphasize universal layer)
- [ ] Day 21-22: Final testing + submit

---

## Demo Flow (Updated)

**Pitch:** "Watch credit aggregate in real-time from multiple sources."

1. **Universal Dashboard:** User starts with 0 score
2. **Appchain:** User deploys appchain via factory (institutional use case)
3. **DeFi Actions:** User does swap/stake on appchain → score increases
4. **Mainnet Live:** Indexer detects real mainnet swap → score increases (live)
5. **RWA Submission:** Institution submits loan repayment via RWA API → score increases
6. **Universal Score:** All 3 sources aggregated into one universal score
7. **Proof Generation:** User generates ZK proof of universal score
8. **Vault:** User borrows from vault using universal score (higher score = better terms)

**Visual:** Split-screen showing events flowing from 3 sources into universal registry in real-time.

---

## Next Steps

1. Review this architecture — does it match your vision?
2. Start Week 1 Day 5: UniversalCreditRegistry.sol implementation
3. Define which Creditcoin mainnet protocols exist (for indexer targeting)
4. Set up indexer infrastructure (keeper wallet, hosting)

Ready to build?
