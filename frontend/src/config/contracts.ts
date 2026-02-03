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
  // AppChain contracts (Chain ID 2)
  CreditChainFactory: "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6",
  CreditRegistry: "0xe4bF5668db24d96C71Ecf7Ad3C22F26402B7B0AC",
  CreditInterceptor: "0x13b1Fc0e06D81F3b4cEeF672093B18aE1BaE77b3",
  CreditVault: "0xd5E448d3260D5E7Bc5CA9f23D5f2Fbc6054d7E6c",
  GhostScoreVerifier: "0x3E8B74F426725673738c1Ff9F19680fa1Ac49c7B",
  CreditNFT: "0x5b859EcC94c4318e0342D5CB641Fa4A1525FFF62",
  CrossChainBridge: "0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6",
  MockCTC: "0x7b5544cC4B980B7996BbE607fef0DE803D0096c6",

  // Universal Credit Layer contracts
  UniversalCreditRegistry: "0xeA16dB49cC9A86Ed04155b956e780E1C8e149Fae",
  CreditOracle: "0x1FdA694D40A4136Fb47989E0F9bB4Ef50dFd7F48",
} as const;
