"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { config } from "@/config/wagmi";
import { ToastProvider } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const queryClient = new QueryClient();

const ghostTheme = darkTheme({
  accentColor: "#00FF88",
  accentColorForeground: "black",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

ghostTheme.colors.modalBackground = "#0a0a0a";
ghostTheme.colors.profileForeground = "#0a0a0a";
ghostTheme.colors.connectButtonBackground = "#111";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrains.variable} antialiased bg-black text-white`}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={ghostTheme} modalSize="compact">
              <ToastProvider>
                {children}
                <ToastContainer />
              </ToastProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
