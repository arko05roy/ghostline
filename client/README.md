# CreditNet Protocol Frontend

Dark, clean UI for the CreditNet Protocol - onchain credit infrastructure for Creditcoin.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (dark theme)
- **wagmi v2** + **viem** (Web3 interactions)
- **@tanstack/react-query** (data fetching)
- **recharts** (data visualization)
- **lucide-react** (icons)

## Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Set up environment variables (optional):
```bash
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

3. Run development server:
```bash
npm run dev
```

## Project Structure

```
client/
├── app/
│   ├── app/                    # Main app routes
│   │   ├── [chainId]/         # Appchain-specific pages
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── build/         # Build Credit page
│   │   │   ├── ghostscore/    # GhostScore ZK proofs
│   │   │   └── vault/          # Lending vault
│   │   ├── deploy/            # Deploy appchain
│   │   ├── network/           # Network stats
│   │   └── bridge/            # Cross-chain bridge
│   ├── layout.tsx             # Root layout
│   ├── globals.css            # Dark theme styles
│   └── providers.tsx          # Wagmi providers
├── components/
│   ├── dashboard/             # Dashboard components
│   ├── layout/                # Layout components
│   └── ui/                    # Reusable UI components
└── lib/
    ├── contracts.ts           # Contract addresses & ABIs
    ├── wagmi-config.ts        # Wagmi configuration
    └── hooks/                 # Custom hooks
```

## Features

- ✅ Dark theme with navy/gold color palette
- ✅ Wallet connection (MetaMask, WalletConnect)
- ✅ Credit score dashboard with animated gauge
- ✅ Score history charts
- ✅ Real-time event feed
- ✅ DeFi action tracking (swap, lend, stake, etc.)
- ✅ GhostScore ZK proof generation
- ✅ Credit vault (deposit, borrow, repay)
- ✅ Appchain management
- ✅ Cross-chain score portability
- ✅ Mobile responsive

## Network Configuration

The app is configured for **Creditcoin Testnet**:
- Chain ID: 102031
- RPC: https://rpc.cc3-testnet.creditcoin.network
- Block Explorer: https://creditcoin-testnet.blockscout.com

## Contract Addresses

All contract addresses are configured in `lib/contracts.ts`. Update the `demoAppChain` addresses after deploying an appchain via the factory.

## Development

- Run `npm run dev` to start the dev server
- Run `npm run build` to build for production
- Run `npm run lint` to check for linting errors
