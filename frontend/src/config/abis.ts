export const CreditRegistryABI = [
  "function getMyScore() view returns (uint256)",
  "function getMyCreditHistory() view returns (tuple(address user, uint8 actionType, uint256 amount, uint256 timestamp, uint256 pointsEarned)[])",
  "function getMySalt() view returns (bytes32)",
  "function getScoreCommitment(address user) view returns (bytes32)",
  "function getCreditEventCount(address user) view returns (uint256)",
  "function getTotalCreditEvents() view returns (uint256)",
  "function getRegistryMerkleRoot() view returns (bytes32)",
  "function getActionWeight(uint8 actionType) view returns (uint256)",
  "function MAX_SCORE() view returns (uint256)",
  "function totalCreditEvents() view returns (uint256)",
  "function interceptor() view returns (address)",
  "event CreditEventRecorded(address indexed user, uint8 indexed actionType, uint256 amount, uint256 pointsEarned, uint256 timestamp)",
] as const;

export const CreditInterceptorABI = [
  "function interceptSwap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) payable returns (uint256 amountOut)",
  "function interceptLend(address token, uint256 amount)",
  "function interceptStake(uint256 amount) payable",
  "function interceptTransfer(address to, address token, uint256 amount)",
  "function interceptRepay(uint256 loanId, uint256 amount)",
  "function interceptProvideLiquidity(address token0, address token1, uint256 amount0, uint256 amount1)",
  "function registry() view returns (address)",
  "function getRegistry() view returns (address)",
  "event SwapIntercepted(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)",
  "event LendIntercepted(address indexed user, address indexed token, uint256 amount)",
  "event StakeIntercepted(address indexed user, uint256 amount)",
  "event TransferIntercepted(address indexed user, address indexed to, address indexed token, uint256 amount)",
  "event RepayIntercepted(address indexed user, uint256 indexed loanId, uint256 amount)",
  "event LiquidityProvided(address indexed user, address indexed token0, address indexed token1, uint256 amount0, uint256 amount1)",
] as const;

export const CreditVaultABI = [
  "function depositLiquidity(uint256 amount)",
  "function withdrawLiquidity(uint256 amount)",
  "function requestLoanSimple(uint256 amount) payable returns (uint256 loanId)",
  "function requestLoan(bytes ghostProof, bytes32[] publicInputs, uint256 amount) payable returns (uint256 loanId)",
  "function repayLoan(uint256 loanId, uint256 amount)",
  "function liquidate(uint256 loanId)",
  "function getLoan(uint256 loanId) view returns (tuple(address borrower, uint256 amount, uint256 interestRate, uint256 startTime, uint256 duration, uint256 repaid, uint256 collateral, uint8 status))",
  "function getLoanTierForScore(uint256 score) view returns (tuple(uint256 scoreThreshold, uint256 maxAmount, uint256 interestBps, uint256 durationDays, uint256 collateralBps))",
  "function getAvailableLiquidity() view returns (uint256)",
  "function getBorrowerLoans(address borrower) view returns (uint256[])",
  "function getLenderDeposit(address lender) view returns (uint256)",
  "function getTotalBorrowed() view returns (uint256)",
  "function getTotalDeposited() view returns (uint256)",
  "function totalLoans() view returns (uint256)",
  "function lendingToken() view returns (address)",
  "function paused() view returns (bool)",
  "event LoanIssued(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 interestRate, uint256 collateralRequired, uint256 duration)",
  "event LoanRepaid(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 remaining)",
  "event LiquidityDeposited(address indexed lender, uint256 amount)",
] as const;

export const CreditNFTABI = [
  "function getBadge(uint256 tokenId) view returns (tuple(uint256 scoreAtMint, string tier, uint256 timestamp))",
  "function getHighestBadge(address user) view returns (string tier, uint256 score)",
  "function hasTierBadge(address user, string tier) view returns (bool)",
  "function getTierForScore(uint256 score) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalMinted() view returns (uint256)",
  "event BadgeMinted(address indexed to, uint256 indexed tokenId, string tier, uint256 score)",
] as const;

export const GhostScoreVerifierABI = [
  "function verifyAndAttest(bytes proof, bytes32[] publicInputs) returns (bool)",
  "function hasValidAttestation(address user, uint256 minThreshold) view returns (bool)",
  "function getLatestAttestation(address user) view returns (tuple(uint256 scoreThreshold, uint256 timestamp, bool valid), bool exists)",
  "function getAttestationCount(address user) view returns (uint256)",
  "function mockMode() view returns (bool)",
] as const;

export const CreditChainFactoryABI = [
  "function deployAppChainSimple(string name) returns (uint256 chainId)",
  "function getAppChain(uint256 chainId) view returns (tuple(uint256 id, address admin, string name, address registry, address interceptor, address vault, address verifier, address nft, bool allowCrossChainScores, uint256 minScoreForLoan, uint256 createdAt, bool active))",
  "function getAppChainsByAdmin(address admin) view returns (uint256[])",
  "function getAppChainCount() view returns (uint256)",
  "function isActiveAppChain(uint256 chainId) view returns (bool)",
  "function getImplementations() view returns (address, address, address, address, address)",
  "function totalChains() view returns (uint256)",
  "event AppChainDeployed(uint256 indexed chainId, address indexed admin, string name, address registry, address interceptor, address vault, address verifier, address nft)",
] as const;

export const CrossChainBridgeABI = [
  "function exportScore(uint256 fromChainId) returns (tuple(uint256 fromChainId, address user, uint256 scoreThreshold, bytes proof, uint256 timestamp, bytes32 exportHash))",
  "function importScore(uint256 toChainId, tuple(uint256 fromChainId, address user, uint256 scoreThreshold, bytes proof, uint256 timestamp, bytes32 exportHash) exportData) returns (bool)",
  "function getBridgeWeight(uint256 fromChainId, uint256 toChainId) view returns (uint256)",
  "function getUserExports(address user) view returns (tuple(uint256 fromChainId, address user, uint256 scoreThreshold, bytes proof, uint256 timestamp, bytes32 exportHash)[])",
  "function DEFAULT_BRIDGE_WEIGHT() view returns (uint256)",
  "event ScoreExported(uint256 indexed fromChainId, address indexed user, uint256 scoreThreshold, bytes32 exportHash)",
  "event ScoreImported(uint256 indexed fromChainId, uint256 indexed toChainId, address indexed user, uint256 adjustedScore)",
] as const;

export const MockERC20ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function totalSupply() view returns (uint256)",
] as const;
