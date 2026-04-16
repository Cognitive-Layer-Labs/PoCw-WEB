"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Loader2, ChevronDown, Check } from "lucide-react";

const WALLET_CACHE_KEY = "cogniproof:last_wallet";

function getLastWallet(): string | null {
  try { return localStorage.getItem(WALLET_CACHE_KEY); } catch { return null; }
}

function setLastWallet(connectorId: string) {
  try { localStorage.setItem(WALLET_CACHE_KEY, connectorId); } catch {}
}

const WALLET_META: Record<string, { label: string; icon: string }> = {
  metaMask: { label: "MetaMask", icon: "🦊" },
  "com.coinbase.wallet": { label: "Coinbase Wallet", icon: "🔵" },
  injected: { label: "Browser Wallet", icon: "🌐" },
};

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => { setMounted(true); }, []);

  // Auto-connect last used wallet on mount
  useEffect(() => {
    if (!mounted || isConnected) return;
    const lastId = getLastWallet();
    if (lastId) {
      const lastConnector = connectors.find(c => c.id === lastId);
      if (lastConnector) {
        connect({ connector: lastConnector }, {
          onError: () => { /* silently fall back to showing selector */ },
        });
      }
    }
  }, [mounted, isConnected]);

  const handleConnect = useCallback((connectorId: string) => {
    const c = connectors.find(conn => conn.id === connectorId);
    if (c) {
      setLastWallet(connectorId);
      connect({ connector: c });
    }
    setShowSelector(false);
  }, [connectors, connect]);

  if (!mounted) {
    return (
      <Button size="sm" className="gap-2" disabled>
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-mono hidden sm:block">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="outline" size="sm" onClick={() => disconnect()} className="gap-2">
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  const availableConnectors = connectors.filter(c => {
    // Filter out duplicate injected connectors
    if (c.id === "injected" && connectors.some(other => other.id === "metaMask")) {
      return false;
    }
    return true;
  });

  return (
    <div className="relative">
      <Button
        onClick={() => setShowSelector(v => !v)}
        disabled={isPending}
        className="gap-2"
        size="sm"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {isPending ? "Connecting..." : "Connect Wallet"}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </Button>

      {showSelector && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSelector(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="p-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 pt-1 pb-1.5">
                Choose wallet
              </p>
              {availableConnectors.map(c => {
                const meta = WALLET_META[c.id] ?? { label: c.name, icon: "🔗" };
                return (
                  <button
                    key={c.id}
                    onClick={() => handleConnect(c.id)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm hover:bg-muted/40 transition-colors disabled:opacity-50"
                  >
                    <span className="text-base">{meta.icon}</span>
                    <span className="flex-1 text-left">{meta.label}</span>
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </button>
                );
              })}
              {availableConnectors.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                  No wallets detected. Install MetaMask or another Web3 wallet.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
