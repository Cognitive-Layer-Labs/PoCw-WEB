"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Trophy, Loader2, RotateCcw, FileText, Trash2, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import { POCW_SBT_ABI, getChainConfig } from "@/lib/contracts";
import { loadHistory, clearHistory, setHistory, saveChainSnapshot, isChainReset, isHistoryExpired, hasFreshHistorySnapshot, type SBTRecord } from "@/lib/history";
import { WalletButton } from "@/components/WalletButton";

/** Explorer URLs per chain. Add entries as contracts are deployed. */
const EXPLORER_URLS: Record<number, string> = {
  31337: "http://localhost:5100",
  84532: "https://base-sepolia.blockscout.com",
};

const BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

const QTYPE_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  mcq: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  true_false: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  scenario: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { sbtAddress, controllerAddress } = getChainConfig(chainId);
  const hasContracts = sbtAddress !== "0x0000000000000000000000000000000000000000";
  const explorerUrl = EXPLORER_URLS[chainId];

  const [records, setRecords] = useState<SBTRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Load valid (non-expired) history for current chain.
    const cached = loadHistory(chainId);
    setRecords(cached);
    setScanned(cached.length > 0 || hasFreshHistorySnapshot(chainId));
  }, [chainId]);

  // Detect chain reset (e.g. Anvil restart) and clear stale cache
  useEffect(() => {
    if (!mounted || !publicClient || !chainId) return;
    publicClient.getBlockNumber().then(block => {
      if (isChainReset(chainId, Number(block))) {
        clearHistory();
        setRecords([]);
      }
      saveChainSnapshot(chainId, Number(block));
    }).catch(() => {});
  }, [mounted, chainId, publicClient]);

  const scanOnChain = useCallback(async () => {
    if (!address || !hasContracts || !isConnected || !publicClient) return;
    setLoading(true);
    setError(null);

    try {
      const logs = await publicClient.getLogs({
        address: sbtAddress as `0x${string}`,
        event: {
          type: "event",
          name: "TransferSingle",
          inputs: [
            { indexed: true, name: "operator", type: "address" },
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "id", type: "uint256" },
            { indexed: false, name: "value", type: "uint256" },
          ],
        } as const,
        args: {
          from: "0x0000000000000000000000000000000000000000",
          to: address as `0x${string}`,
        },
      });

      if (logs.length === 0) {
        // Keep an empty snapshot so we don't repeatedly re-fetch until TTL expires.
        setHistory([], chainId);
        setRecords([]);
        setScanned(true);
        setLoading(false);
        return;
      }

      const found: SBTRecord[] = [];
      const seen = new Set<number>();

      for (const log of logs) {
        const tokenId = Number(log.args.id);
        if (seen.has(tokenId)) continue;
        seen.add(tokenId);

        const uri = await publicClient.readContract({
          address: sbtAddress as `0x${string}`,
          abi: POCW_SBT_ABI,
          functionName: "uri",
          args: [BigInt(tokenId)],
        }) as string;

        if (!uri) continue;

        const meta = decodeBase64Uri(uri);
        if (!meta) continue;

        const record: SBTRecord = {
          contentId: tokenId,
          score: meta.score,
          subject: meta.subject,
          timestamp: meta.timestamp,
          passed: meta.passed,
          chainId,
          theta: meta.theta,
          se: meta.se,
          questions: meta.questions,
          bloom: meta.bloom,
          title: meta.title,
          source: meta.source,
          oracle: meta.oracle,
          qTypes: meta.qTypes,
          ciLow: meta.ciLow,
          ciHigh: meta.ciHigh,
          converged: meta.converged,
        };

        found.push(record);
      }

      setHistory(found, chainId);
      setRecords(found);
      setScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan SBTs");
    } finally {
      setLoading(false);
    }
  }, [address, hasContracts, isConnected, publicClient, sbtAddress, chainId]);

  // Auto-refresh history on page entry if cache is older than 30 minutes.
  useEffect(() => {
    if (!mounted || !isConnected || !hasContracts || loading) return;
    if (isHistoryExpired(chainId)) {
      scanOnChain();
    }
  }, [mounted, isConnected, hasContracts, loading, scanOnChain, chainId]);

  const handleClear = () => {
    clearHistory();
    setRecords([]);
    setScanned(true);
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  if (!mounted) {
    return (
      <div className="max-w-xl mx-auto py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Connect your wallet to view your on-chain SBT credentials.
              </p>
            </div>
            <WalletButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasContracts) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-6 text-center">
            <div className="p-4 rounded-2xl bg-muted/10 border border-border/40">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Contracts Not Deployed</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                The SBT contract is not deployed on the current chain. History will be available once contracts are deployed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verification History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your on-chain SBT credentials
          </p>
        </div>
        <div className="flex gap-2">
          {records.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={scanOnChain} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {loading ? "Scanning..." : scanned ? "Rescan" : "Scan SBTs"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {scanned && records.length === 0 && !loading && (
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No SBTs found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Complete a verification session and mint an SBT to see it here
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!scanned && !loading && (
        <Card className="border-border/60">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ready to scan</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Click &quot;Scan SBTs&quot; to read your on-chain credentials
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-sm text-muted-foreground">Reading on-chain SBTs...</span>
        </div>
      )}

      <div className="space-y-3">
        {records.map((record) => {
          const isExpanded = expandedId === record.contentId;
          return (
            <Card key={record.contentId} className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${record.passed ? "bg-green-500/15" : "bg-red-500/15"}`}>
                      <Trophy className={`h-5 w-5 ${record.passed ? "text-green-400" : "text-red-400"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{record.title || record.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Score: {record.score}% · {formatTimestamp(record.timestamp)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5 font-mono">
                        Token #{record.contentId}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={`${record.passed ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
                      {record.passed ? "Passed" : "Failed"}
                    </Badge>
                    {explorerUrl && sbtAddress && (
                      <a href={`${explorerUrl}/address/${sbtAddress}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 hover:text-primary">
                        Explorer <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {(record.theta !== undefined || record.bloom || record.title || record.source) && (
                      <button onClick={() => setExpandedId(isExpanded ? null : record.contentId)} className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5 hover:text-primary">
                        {isExpanded ? "Less" : "Details"}
                        {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/40 space-y-4">
                    {/* Score bar */}
                    <MetricSection label="Score" value={`${record.score}%`}>
                      <GradientBar value={record.score} min={0} max={100} />
                    </MetricSection>

                    {/* Theta bar */}
                    {record.theta !== undefined && (
                      <MetricSection label="Theta" value={record.theta.toFixed(3)}>
                        <ThetaBar value={record.theta} />
                      </MetricSection>
                    )}

                    {/* Std Error bar */}
                    {record.se !== undefined && (
                      <MetricSection label="Std Error" value={record.se.toFixed(3)}>
                        <GradientBar value={record.se} min={0} max={1} invert />
                      </MetricSection>
                    )}

                    {/* Confidence Interval */}
                    {record.ciLow !== undefined && record.ciHigh !== undefined && (
                      <MetricSection label="Confidence Interval" value={`${record.ciLow.toFixed(1)} — ${record.ciHigh.toFixed(1)}`}>
                        <CIBar low={record.ciLow} high={record.ciHigh} score={record.score} />
                      </MetricSection>
                    )}

                    {/* Bloom Level */}
                    {record.bloom && (
                      <MetricSection label="Bloom Level" value={record.bloom}>
                        <BloomProgress reached={record.bloom} />
                      </MetricSection>
                    )}

                    {/* Question Types */}
                    {record.qTypes && (
                      <MetricSection label="Question Types" value={record.qTypes}>
                        <QuestionTypeBubbles types={record.qTypes.split(",").filter(Boolean)} />
                      </MetricSection>
                    )}

                    {/* Converged */}
                    {record.converged !== undefined && (
                      <MetricSection label="Converged" value="">
                        {record.converged ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </MetricSection>
                    )}

                    {/* Content Source */}
                    {record.source && (
                      <MetricSection label="Source" value="">
                        {record.source.startsWith("http") ? (
                          <a href={record.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-full">
                            {record.source}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate max-w-full">{record.source}</p>
                        )}
                      </MetricSection>
                    )}

                    {/* Oracle Address */}
                    {record.oracle && (
                      <MetricSection label="Oracle" value="">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground truncate">{record.oracle}</span>
                          <button onClick={() => handleCopy(record.oracle!)} className="shrink-0 text-muted-foreground hover:text-foreground">
                            {copiedAddr === record.oracle ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </MetricSection>
                    )}

                    {/* Questions count */}
                    {record.questions !== undefined && (
                      <MetricSection label="Questions" value={String(record.questions)} />
                    )}

                    {/* Content ID */}
                    <MetricSection label="Content ID" value={String(record.contentId)} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Visual Components ─────────────────────────────────────────────────── */

function MetricSection({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {value && <span className="text-xs font-mono text-foreground/80">{value}</span>}
      </div>
      {children}
    </div>
  );
}

/** Horizontal bar: red (bad) → yellow → green (good). Lower values = red, higher = green. */
function GradientBar({ value, min, max, invert }: { value: number; min: number; max: number; invert?: boolean }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const displayPct = invert ? 100 - pct : pct;
  const color = displayPct < 40 ? "bg-red-500" : displayPct < 70 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${displayPct}%` }} />
    </div>
  );
}

/** Theta bar: -3 (red) → 0 (yellow) → +3 (green), with center marker */
function ThetaBar({ value }: { value: number }) {
  const clamped = Math.max(-3, Math.min(3, value));
  const pct = ((clamped + 3) / 6) * 100; // 0% = -3, 50% = 0, 100% = +3

  return (
    <div className="relative w-full h-2.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 overflow-visible">
      <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-background border-2 border-foreground shadow-sm" style={{ left: `calc(${pct}% - 7px)` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-foreground/30" style={{ left: "50%" }} />
    </div>
  );
}

/** Confidence interval bar: shows range with score as a dot */
function CIBar({ low, high, score }: { low: number; high: number; score: number }) {
  const min = 0, max = 100;
  const lowPct = Math.max(0, ((low - min) / (max - min)) * 100);
  const highPct = Math.min(100, ((high - min) / (max - min)) * 100);
  const scorePct = Math.max(0, Math.min(100, score));

  return (
    <div className="relative w-full h-2.5 rounded-full bg-muted overflow-visible">
      <div className="absolute h-full rounded-full bg-blue-500/30" style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow-sm" style={{ left: `calc(${scorePct}% - 7px)` }} />
    </div>
  );
}

/** Bloom's taxonomy progress indicator */
function BloomProgress({ reached }: { reached: string }) {
  const reachedIdx = BLOOM_LEVELS.indexOf(reached);

  return (
    <div className="flex gap-1">
      {BLOOM_LEVELS.map((level, i) => {
        const active = i <= reachedIdx;
        return (
          <div key={level} className="flex-1 text-center">
            <div className={`h-2 rounded-full transition-colors ${active ? "bg-green-500" : "bg-muted"}`} />
            <span className={`text-[9px] mt-0.5 block ${active ? "text-green-400" : "text-muted-foreground/40"}`}>
              {level.slice(0, 3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Colored bubbles for question types */
function QuestionTypeBubbles({ types }: { types: string[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {types.map((t) => (
        <span key={t} className={`px-2 py-0.5 rounded-full text-[10px] border ${QTYPE_COLORS[t] || "bg-muted/50 text-muted-foreground border-border"}`}>
          {t.replace("_", " ")}
        </span>
      ))}
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function decodeBase64Uri(uri: string): {
  score: number;
  subject: string;
  timestamp: string;
  passed: boolean;
  theta?: number;
  se?: number;
  questions?: number;
  bloom?: string;
  title?: string;
  source?: string;
  oracle?: string;
  qTypes?: string;
  ciLow?: number;
  ciHigh?: number;
  converged?: boolean;
} | null {
  try {
    const base64Part = uri.split(",")[1];
    if (!base64Part) return null;
    const json = atob(base64Part);
    const data = JSON.parse(json);

    const attrs = data.attributes || [];
    const find = (trait: string) => attrs.find((a: any) => a.trait_type === trait)?.value;

    const score = find("Score") ?? 0;
    const theta = find("Theta");
    const se = find("Std Error");
    const questions = find("Questions");
    const bloom = find("Bloom");
    const rawTs = find("Timestamp");
    const passedAttr = find("Passed");
    const title = find("Title");
    const source = find("Source");
    const oracle = find("Oracle");
    const qTypes = find("QTypes");
    const ciLow = find("CI Low");
    const ciHigh = find("CI High");
    const converged = find("Converged");

    return {
      score,
      subject: data.name ?? "Unknown",
      timestamp: typeof rawTs === "string" ? rawTs : "",
      passed: passedAttr === 1,
      theta: typeof theta === "number" ? theta : undefined,
      se: typeof se === "number" ? se : undefined,
      questions: typeof questions === "number" ? questions : undefined,
      bloom: typeof bloom === "string" ? bloom : undefined,
      title: typeof title === "string" ? title : undefined,
      source: typeof source === "string" ? source : undefined,
      oracle: typeof oracle === "string" ? oracle : undefined,
      qTypes: typeof qTypes === "string" ? qTypes : undefined,
      ciLow: typeof ciLow === "number" ? ciLow : undefined,
      ciHigh: typeof ciHigh === "number" ? ciHigh : undefined,
      converged: converged === 1,
    };
  } catch {
    return null;
  }
}
