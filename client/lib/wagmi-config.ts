import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Define Creditcoin Testnet
export const creditcoinTestnet = {
    id: 102031,
    name: "Creditcoin Testnet",
    nativeCurrency: {
        decimals: 18,
        name: "CTC",
        symbol: "CTC",
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.cc3-testnet.creditcoin.network"],
        },
        public: {
            http: ["https://rpc.cc3-testnet.creditcoin.network"],
        },
    },
    blockExplorers: {
        default: {
            name: "Creditcoin Explorer",
            url: "https://explorer.cc3-testnet.creditcoin.network",
        },
    },
    testnet: true,
} as const;

// Create wagmi config with RainbowKit
export const config = getDefaultConfig({
    appName: "CreditNet Protocol",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
    chains: [creditcoinTestnet, sepolia, mainnet],
    transports: {
        [creditcoinTestnet.id]: http(),
        [sepolia.id]: http(),
        [mainnet.id]: http(),
    },
    ssr: true,
});

// Export chain for easy access
export { creditcoinTestnet as defaultChain };
