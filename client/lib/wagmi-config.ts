import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { metaMask, walletConnect } from "wagmi/connectors";

// Creditcoin Testnet configuration
export const creditcoinChain = defineChain({
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: {
    name: "Creditcoin",
    symbol: "tCTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.cc3-testnet.creditcoin.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Creditcoin Testnet Explorer",
      url: "https://creditcoin-testnet.blockscout.com",
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [creditcoinChain],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id",
    }),
  ],
  transports: {
    [creditcoinChain.id]: http(),
  },
});
