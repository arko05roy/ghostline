"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Zap,
  Landmark,
  Users,
  Lock,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Credit Interceptor",
    description:
      "Every DeFi action automatically builds your credit score. Swap, stake, lend - it all counts.",
    color: "#00D4FF",
  },
  {
    icon: Shield,
    title: "GhostScore",
    description:
      "Zero-knowledge proofs let you prove creditworthiness without revealing your actual score.",
    color: "#8B5CF6",
  },
  {
    icon: Landmark,
    title: "CreditVault",
    description:
      "Access undercollateralized loans based on your proven credit history. Better score = better terms.",
    color: "#10B981",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description:
      "Your credit data is yours. Stored on-chain but only you can see your actual score.",
    color: "#F59E0B",
  },
];

const stats = [
  { value: "1000+", label: "Credit Events" },
  { value: "50+", label: "Active Users" },
  { value: "$100K+", label: "Total Loans" },
  { value: "0%", label: "Default Rate" },
];

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="info" className="mb-6">
            Built on Creditcoin
          </Badge>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Deployable Credit Infrastructure for{" "}
          <span className="gradient-text">Everyone</span>
        </motion.h1>

        <motion.p
          className="text-lg text-gray-400 max-w-2xl mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CreditNet transforms your on-chain activity into verifiable credit
          scores. Build reputation, prove creditworthiness with ZK proofs, and
          access undercollateralized loans.
        </motion.p>

        <motion.div
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link href="/dashboard">
            <Button variant="gradient" size="lg">
              Launch App
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/actions">
            <Button variant="outline" size="lg">
              Build Credit
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card variant="glass" hover className="p-6 h-full">
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon
                      className="w-6 h-6"
                      style={{ color: feature.color }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 mt-2">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <Card variant="gradient" className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-gray-900 flex items-center justify-center"
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
              ))}
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">
            Join the Credit Revolution
          </h3>
          <p className="text-gray-400 mt-2 max-w-md mx-auto">
            Connect your wallet and start building your on-chain credit history
            today.
          </p>
          <Link href="/dashboard">
            <Button variant="default" size="lg" className="mt-6">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
