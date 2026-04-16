const HISTORY_KEY = "pocw:history";
const CHAIN_KEY = "pocw:chain_snapshot";
const HISTORY_META_KEY = "pocw:history_meta";
const HISTORY_RETENTION_MS = 30 * 60 * 1000;

interface HistoryMeta {
  updatedAt: number;
  chainId?: number;
}

export interface SBTRecord {
  contentId: number;
  score: number;
  subject: string;
  timestamp: string;
  passed: boolean;
  chainId?: number;
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
}

function writeHistoryMeta(updatedAt: number = Date.now(), chainId?: number) {
  try {
    const meta: HistoryMeta = { updatedAt, chainId };
    localStorage.setItem(HISTORY_META_KEY, JSON.stringify(meta));
  } catch {}
}

function readHistoryMeta(): HistoryMeta | null {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_META_KEY) || "null") as HistoryMeta | null;
  } catch {
    return null;
  }
}

export function isHistoryExpired(chainId?: number): boolean {
  const meta = readHistoryMeta();
  if (!meta || typeof meta.updatedAt !== "number") {
    return true;
  }
  if (chainId !== undefined && meta.chainId !== undefined && meta.chainId !== chainId) {
    return true;
  }
  return Date.now() - meta.updatedAt > HISTORY_RETENTION_MS;
}

export function hasFreshHistorySnapshot(chainId?: number): boolean {
  return !isHistoryExpired(chainId);
}

export function setHistory(records: SBTRecord[], chainId?: number) {
  try {
    const deduped = new Map<string, SBTRecord>();
    for (const record of records) {
      deduped.set(`${record.chainId ?? "any"}:${record.contentId}`, record);
    }
    const trimmed = Array.from(deduped.values()).slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    writeHistoryMeta(Date.now(), chainId);
  } catch {}
}

export function saveToHistory(record: SBTRecord) {
  try {
    const existing: SBTRecord[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const filtered = existing.filter(r => !(r.contentId === record.contentId && r.chainId === record.chainId));
    filtered.push(record);
    const trimmed = filtered.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    writeHistoryMeta(Date.now(), record.chainId);
  } catch {}
}

export function loadHistory(chainId?: number): SBTRecord[] {
  try {
    if (isHistoryExpired(chainId)) {
      clearHistory();
      return [];
    }

    const all: SBTRecord[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    // If chainId provided, filter to only records from this chain
    if (chainId !== undefined) {
      return all.filter(r => r.chainId === undefined || r.chainId === chainId);
    }
    return all;
  } catch {
    return [];
  }
}

/** Save a snapshot of the current chain state (block number) to detect chain resets */
export function saveChainSnapshot(chainId: number, blockNumber: number) {
  try {
    localStorage.setItem(CHAIN_KEY, JSON.stringify({ chainId, blockNumber, at: Date.now() }));
  } catch {}
}

/** Check if the chain was reset (e.g. Anvil restart). Returns true if cache should be cleared. */
export function isChainReset(chainId: number, currentBlock: number): boolean {
  try {
    const snapshot = JSON.parse(localStorage.getItem(CHAIN_KEY) || "null");
    if (!snapshot || snapshot.chainId !== chainId) return false;
    // If current block is much lower than snapshot, chain was reset
    return currentBlock < snapshot.blockNumber - 10;
  } catch {
    return false;
  }
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(HISTORY_META_KEY);
}
