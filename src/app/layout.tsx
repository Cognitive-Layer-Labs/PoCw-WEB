import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";
import { WalletButton } from "@/components/WalletButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PoCW — Proof of Cognitive Work",
  description: "Verify your knowledge on-chain with adaptive AI testing and Soulbound Tokens.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <img src="/logo.png" alt="PoCW" className="w-7 h-7" />
                <span className="font-semibold text-sm tracking-tight">PoCW</span>
                <span className="text-muted-foreground text-xs hidden sm:block">/ Proof of Cognitive Work</span>
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Home
                </Link>
                <Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Verify
                </Link>
                <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  History
                </Link>
                <WalletButton />
              </nav>
            </div>
          </header>
          <main className="min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
