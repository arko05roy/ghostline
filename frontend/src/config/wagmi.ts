import { getDefaultConfig, type Chain } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";

export const creditcoinTestnet = {
  id: 102031,
  name: "Creditcoin Testnet",
  nativeCurrency: { name: "CTC", symbol: "CTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.cc3-testnet.creditcoin.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "CC3 Explorer",
      url: "https://explorer.cc3-testnet.creditcoin.network",
    },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: "GhostLine",
  projectId: "ghostline_demo_project",
  chains: [creditcoinTestnet],
  transports: {
    [creditcoinTestnet.id]: http("https://rpc.cc3-testnet.creditcoin.network"),
  },
  ssr: true,
});
