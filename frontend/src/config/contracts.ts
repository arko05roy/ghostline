export const CHAIN_ID = 102031;
export const RPC_URL = "https://rpc.cc3-testnet.creditcoin.network";
export const CHAIN_CONFIG = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: "Creditcoin Testnet",
  nativeCurrency: { name: "CTC", symbol: "CTC", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ["https://explorer.cc3-testnet.creditcoin.network"],
};

export const ADDRESSES = {
  // AppChain contracts (Chain ID 3 - FIXED SCORING!)
  CreditChainFactory: "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6",
  CreditRegistry: "0x96c765aF4e53eA22a0144028CCB1c50Be16219E9",
  CreditInterceptor: "0x86270E799392158e8fF0Aca82635B46aB6089c2C",
  CreditVault: "0x7f17d01Fc931167018DDbf16263FE38471036B90",
  GhostScoreVerifier: "0x1558EeA38Ddee8B3B7c01a2F5aBbcbB3096C3bee",
  CreditNFT: "0x9377f9e29AFd0E5429e0b21Ce4791836d5D6E18A",
  CrossChainBridge: "0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6",
  MockCTC: "0x7b5544cC4B980B7996BbE607fef0DE803D0096c6",

  // Universal Credit Layer contracts
  UniversalCreditRegistry: "0xeA16dB49cC9A86Ed04155b956e780E1C8e149Fae",
  CreditOracle: "0x1FdA694D40A4136Fb47989E0F9bB4Ef50dFd7F48",
} as const;
