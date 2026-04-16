"use client";

import { useState, useRef, useEffect } from "react";
import { SessionConfig } from "@/lib/api";
import { ChevronDown, Check } from "lucide-react";

interface SessionConfigProps {
  config: SessionConfig;
  onChange: (config: SessionConfig) => void;
}

const Q_TYPES = ["open", "mcq", "true_false", "scenario"] as const;
const Q_TYPE_LABELS: Record<string, string> = {
  open: "Open-ended",
  mcq: "Multiple choice",
  true_false: "True / False",
  scenario: "Scenario",
};

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Dutch", "Polish", "Romanian", "Russian", "Ukrainian", "Chinese",
  "Japanese", "Korean", "Arabic", "Hindi", "Turkish", "Swedish",
  "Norwegian", "Danish", "Finnish", "Czech", "Hungarian", "Greek",
  "Hebrew", "Thai", "Vietnamese", "Indonesian", "Malay", "Bengali",
];

function LanguageSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isAuto = value === "";
  const selectedLabel = isAuto ? "Auto-detect" : value;

  const filtered = LANGUAGES.filter(l =>
    l.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(""); }}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <span className={isAuto ? "text-muted-foreground/60" : ""}>{selectedLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search language…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-2 py-1 rounded-md bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
            >
              <span className={isAuto ? "text-accent font-medium" : "text-muted-foreground"}>Auto-detect</span>
              {isAuto && <Check className="h-3.5 w-3.5 text-accent" />}
            </button>
            {filtered.map(lang => {
              const selected = !isAuto && value === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => { onChange(lang); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/40 transition-colors"
                >
                  <span className={selected ? "text-foreground font-medium" : "text-muted-foreground"}>{lang}</span>
                  {selected && <Check className="h-3.5 w-3.5 text-accent" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground/60">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SessionConfigPanel({ config, onChange }: SessionConfigProps) {
  const update = (patch: Partial<SessionConfig>) =>
    onChange({ ...config, ...patch });

  const toggleQType = (type: (typeof Q_TYPES)[number]) => {
    const current = config.q_types ?? ["open"];
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    if (next.length === 0) return; // keep at least one
    update({ q_types: next });
  };

  const difficulty = config.difficulty ?? 0.5;
  const threshold = config.threshold ?? 0.7;
  const maxQ = config.max_questions ?? 10;
  const selectedTypes = config.q_types ?? ["open"];

  return (
    <div className="space-y-5 rounded-xl border border-border/50 bg-muted/10 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Session Settings
      </p>

      {/* Max questions */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <label className="text-foreground/80">Max questions</label>
          <span className="font-mono text-primary">{maxQ}</span>
        </div>
        <input
          type="range"
          min={3}
          max={20}
          step={1}
          value={maxQ}
          onChange={e => update({ max_questions: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3</span>
          <span>20</span>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <label className="text-foreground/80">Starting difficulty</label>
          <span className="font-mono text-primary">
            {difficulty <= 0.33 ? "Easy" : difficulty <= 0.66 ? "Medium" : "Hard"}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={difficulty}
          onChange={e => update({ difficulty: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Easy</span>
          <span>Hard</span>
        </div>
      </div>

      {/* Pass threshold */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <label className="text-foreground/80">Pass threshold</label>
          <span className="font-mono text-primary">{Math.round(threshold * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.4}
          max={0.95}
          step={0.05}
          value={threshold}
          onChange={e => update({ threshold: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>40%</span>
          <span>95%</span>
        </div>
      </div>

      {/* Question types */}
      <div className="space-y-2">
        <label className="text-sm text-foreground/80">Question types</label>
        <div className="grid grid-cols-2 gap-2">
          {Q_TYPES.map(type => {
            const active = selectedTypes.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleQType(type)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                {Q_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Response detail */}
      <div className="space-y-1.5">
        <label className="text-sm text-foreground/80">Response detail</label>
        <div className="flex gap-2">
          {(["boolean", "score", "detailed"] as const).map(r => (
            <button
              key={r}
              onClick={() => update({ response: r })}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize ${
                (config.response ?? "detailed") === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <label className="text-sm text-foreground/80">Language</label>
        <LanguageSelector
          value={config.language ?? ""}
          onChange={v => update({ language: v || undefined })}
        />
      </div>

    </div>
  );
}
