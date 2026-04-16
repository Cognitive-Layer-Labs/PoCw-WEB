import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  BrainCircuit,
  ShieldCheck,
  Coins,
  ArrowRight,
  Zap,
  Lock,
  Globe,
} from "lucide-react";

const HOW_IT_WORKS = [
  {
    icon: FileUp,
    step: "01",
    title: "Index Your Content",
    description:
      "Upload a PDF, webpage, or plain text. The oracle parses and builds a knowledge graph — extracting concepts, relationships, and Bloom's levels.",
    badge: "Knowledge Graph",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: BrainCircuit,
    step: "02",
    title: "Adaptive Testing",
    description:
      "Answer 5–15 adaptive questions generated from your document. Difficulty adjusts in real-time via IRT (Item Response Theory) based on your responses.",
    badge: "IRT Engine",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Oracle Attestation",
    description:
      "Your score is signed by the oracle with ECDSA. The signature covers your wallet address, content ID, score, nonce, and expiry — preventing replay attacks.",
    badge: "ECDSA Signature",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    icon: Coins,
    step: "04",
    title: "Mint Your SBT",
    description:
      "Submit the oracle signature on-chain. The PoCW Controller verifies it and mints a Soulbound Token — permanent, non-transferable proof of comprehension.",
    badge: "ERC-1155 SBT",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Adaptive by design",
    description: "Questions adjust to your ability level in real time. No fixed question bank.",
  },
  {
    icon: Lock,
    title: "Soulbound & permanent",
    description: "Non-transferable ERC-1155 tokens. Yours forever, on-chain.",
  },
  {
    icon: Globe,
    title: "Content-agnostic",
    description: "Any URL, PDF, or text. Whitepaper, textbook, documentation — all supported.",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-24">
      {/* Hero */}
      <section className="text-center space-y-6 pt-8">
        <Badge variant="outline" className="text-xs border-primary/40 text-primary px-3 py-1">
          Demo
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          Prove What You Know,{" "}
          <span className="text-primary">On-Chain</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          PoCW uses adaptive AI testing and IRT psychometrics to verify knowledge comprehension —
          then anchors the result to your wallet as a permanent, non-transferable credential.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="lg" className="gap-2 text-base">
            <Link href="/verify">
              Start Verification
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base">
            <a
              href="https://github.com/Cognitive-Layer-Labs/PoCW"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* Feature pills */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map(f => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/50"
            >
              <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground mt-2 text-sm">Four steps from content to credential</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map(step => {
            const Icon = step.icon;
            return (
              <Card key={step.step} className={`border ${step.bg}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-muted-foreground/60">{step.step}</span>
                    <Badge variant="outline" className={`text-xs border-current ${step.color}`}>
                      {step.badge}
                    </Badge>
                  </div>
                  <div className={`p-2.5 rounded-xl ${step.bg} border w-fit mb-2`}>
                    <Icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 border border-primary/20 bg-primary/5 rounded-2xl py-12 px-6">
        <h2 className="text-2xl font-bold">Ready to get verified?</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Connect your wallet, upload a document, and earn your on-chain knowledge credential.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/verify">
            Launch Demo <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
