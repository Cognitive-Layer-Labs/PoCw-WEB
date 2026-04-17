"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, Loader2, Link, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadFile, indexContent, pollIndexStatus, validateIndexSourceUrl } from "@/lib/api";

interface FileUploadProps {
  /** Called with the knowledgeId once indexing is complete */
  onIndexed: (knowledgeId: string) => void;
}

type Mode = "file" | "url";
type Phase = "idle" | "uploading" | "polling" | "ready" | "error";

const ACCEPTED_TYPES = ".pdf,.txt,.md,.html,.htm";

const PROGRESS_STAGES = [
  { threshold: 0, message: "Downloading content…" },
  { threshold: 25, message: "Extracting text…" },
  { threshold: 50, message: "Building knowledge graph…" },
  { threshold: 75, message: "Preparing questions…" },
  { threshold: 90, message: "Finalizing…" },
];

async function pollUntilReady(
  knowledgeId: string,
  onProgress: (pct: number, msg: string) => void
): Promise<void> {
  const start = Date.now();
  const maxDuration = 180_000; // 3 min
  let stageIndex = 0;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await pollIndexStatus(knowledgeId);
    if (poll.status === "ready") {
      onProgress(100, "Indexed and ready!");
      return;
    }
    if (poll.status === "failed") throw new Error(poll.error ?? "Indexing failed");

    // Calculate progress based on elapsed time
    const elapsed = Date.now() - start;
    const pct = Math.min(90, Math.round((elapsed / maxDuration) * 100));

    // Advance stage message based on progress
    while (stageIndex < PROGRESS_STAGES.length - 1 && pct >= PROGRESS_STAGES[stageIndex + 1].threshold) {
      stageIndex++;
    }
    onProgress(pct, PROGRESS_STAGES[stageIndex].message);
  }
  throw new Error("Indexing timed out — please try again");
}

export function FileUpload({ onIndexed }: FileUploadProps) {
  const [mode, setMode] = useState<Mode>("file");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  const busy = phase === "uploading" || phase === "polling";

  const reset = () => {
    abortRef.current = true;
    setFileName("");
    setUrlInput("");
    setPhase("idle");
    setStatusMsg("");
    setErrorMsg("");
    setProgress(0);
    abortRef.current = false;
  };

  const handleFile = useCallback(async (f: File) => {
    setFileName(f.name);
    setPhase("uploading");
    setStatusMsg("Uploading file…");
    setProgress(5);
    setErrorMsg("");
    abortRef.current = false;
    try {
      const { knowledgeId, status } = await uploadFile(f);
      if (abortRef.current) return;
      if (status === "ready") {
        setPhase("ready");
        setProgress(100);
        setStatusMsg("Indexed and ready!");
        onIndexed(knowledgeId);
        return;
      }
      setPhase("polling");
      setProgress(10);
      await pollUntilReady(knowledgeId, (pct, msg) => {
        if (abortRef.current) return;
        setProgress(pct);
        setStatusMsg(msg);
      });
      if (abortRef.current) return;
      setPhase("ready");
      setStatusMsg("Indexed and ready!");
      onIndexed(knowledgeId);
    } catch (err) {
      if (abortRef.current) return;
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, [onIndexed]);

  const handleUrlSubmit = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;

    const validationError = validateIndexSourceUrl(url);
    if (validationError) {
      setPhase("error");
      setErrorMsg(validationError);
      setStatusMsg("");
      setProgress(0);
      return;
    }

    setPhase("uploading");
    setStatusMsg("Fetching URL…");
    setProgress(5);
    setErrorMsg("");
    abortRef.current = false;
    try {
      const { knowledgeId, status } = await indexContent(url);
      if (abortRef.current) return;
      if (status === "ready") {
        setPhase("ready");
        setProgress(100);
        setStatusMsg("Indexed and ready!");
        onIndexed(knowledgeId);
        return;
      }
      setPhase("polling");
      setProgress(10);
      await pollUntilReady(knowledgeId, (pct, msg) => {
        if (abortRef.current) return;
        setProgress(pct);
        setStatusMsg(msg);
      });
      if (abortRef.current) return;
      setPhase("ready");
      setStatusMsg("Indexed and ready!");
      onIndexed(knowledgeId);
    } catch (err) {
      if (abortRef.current) return;
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, [urlInput, onIndexed]);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/30 border border-border/40">
        {(["file", "url"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { reset(); setMode(m); }}
            className={cn(
              "flex-1 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === m
                ? "bg-background border border-border/60 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "file" ? "Upload File" : "Paste URL"}
          </button>
        ))}
      </div>

      {/* File drop zone */}
      {mode === "file" && (
        <label
          className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
            dragOver ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
            busy && "pointer-events-none",
            phase === "ready" && "border-green-500/50 bg-green-500/5",
            phase === "error" && "border-red-500/50 bg-red-500/5"
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f && !busy) handleFile(f);
          }}
        >
          <input
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            disabled={busy || phase === "ready"}
          />

          {busy ? (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-primary">{statusMsg}</p>
            </div>
          ) : phase === "ready" ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle className="h-10 w-10 text-green-400" />
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{statusMsg}</p>
            </div>
          ) : phase === "error" ? (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-300 max-h-16 overflow-y-auto w-full text-center line-clamp-3">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={e => { e.preventDefault(); reset(); }}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drop your document here</p>
              <p className="text-xs text-muted-foreground">PDF, TXT, Markdown, or HTML · up to 10 MB</p>
              <Button variant="outline" size="sm" className="mt-1 pointer-events-none">
                Browse files
              </Button>
            </div>
          )}
        </label>
      )}

      {/* URL input */}
      {mode === "url" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !busy) handleUrlSubmit(); }}
                placeholder="https://..., http://..., or ipfs://..."
                disabled={busy || phase === "ready"}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              onClick={handleUrlSubmit}
              disabled={busy || !urlInput.trim() || phase === "ready"}
              size="sm"
              className="shrink-0"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Index"}
            </Button>
          </div>

          {/* Progress bar */}
          {busy && (
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-primary flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> {statusMsg}
              </p>
            </div>
          )}

          {!busy && phase === "ready" && (
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3" /> {statusMsg}
            </p>
          )}

          {!busy && phase === "error" && (
            <div className="space-y-1">
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" /> {errorMsg}
              </p>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline">
                Try again
              </button>
            </div>
          )}

          {!busy && phase === "idle" && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Supported schemes: http://, https://, ipfs://
            </p>
          )}
        </div>
      )}

      {/* Progress bar for file mode during upload/polling */}
      {mode === "file" && busy && (
        <div className="space-y-1.5">
          <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-primary flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> {statusMsg}
          </p>
        </div>
      )}
    </div>
  );
}
