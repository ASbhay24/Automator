"use client";

import React, { useState } from "react";
import { X, Sparkles, Loader2, Zap } from "lucide-react";
import type { CompanyRow } from "@/lib/starterData";

/* ------------------------------------------------------------------ */
/* EnrichmentModal                                                     */
/* ------------------------------------------------------------------ */

interface EnrichmentModalProps {
  open: boolean;
  onClose: () => void;
  columns: string[];
  rows: CompanyRow[];
  onCellEnriched: (
    rowId: string,
    column: string,
    value: string,
    fallbackNotice?: string
  ) => void;
  onEnrichingRow: (rowId: string | null) => void;
}

export default function EnrichmentModal({
  open,
  onClose,
  columns,
  rows,
  onCellEnriched,
  onEnrichingRow,
}: EnrichmentModalProps) {
  const [targetCol, setTargetCol] = useState(
    columns.includes("Personalized_Hook")
      ? "Personalized_Hook"
      : columns[columns.length - 1] || ""
  );
  const [prompt, setPrompt] = useState(
    "Write exactly ONE highly technical sentence starting with 'I really like what you are building around...' based on their core tech."
  );
  const [provider, setProvider] = useState<"gemini" | "openai" | "nvidia">(
    "gemini"
  );
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    company: "",
  });
  const [log, setLog] = useState<string[]>([]);

  if (!open) return null;

  const urlCol =
    columns.find((c) => /url|website|site|link/i.test(c)) || columns[1] || "";

  const validRows = rows.filter(
    (row) => row.Company?.trim() && row.Website?.trim()
  );

  const handleRun = async () => {
    setRunning(true);
    setLog([]);
    const totalValid = validRows.length;
    const totalAll = rows.length;

    if (totalValid === 0) {
      setLog(["⚠️ No valid rows found with both Company and Website filled."]);
      setRunning(false);
      return;
    }

    setLog([
      `🚀 Starting enrichment for ${totalValid} valid row${
        totalValid === 1 ? "" : "s"
      } (out of ${totalAll} total rows)…`,
    ]);

    for (let i = 0; i < totalValid; i++) {
      const row = validRows[i];
      const company = row.Company.trim();
      const url = row.Website.trim();

      setProgress({ current: i + 1, total: totalValid, company });
      onEnrichingRow(row.id);

      try {
        const resp = await fetch("/api/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url,
            prompt,
            companyName: company,
            provider,
          }),
        });

        const data = await resp.json();

        if (data.skipped) {
          setLog((prev) => [...prev, `⏭️ ${company}: Skipped (empty URL/company)`]);
          continue;
        }

        if (data.error) {
          const msg = `⚠️ ${company}: ${data.error}`;
          setLog((prev) => [...prev, msg]);
          onCellEnriched(row.id, targetCol, `⚠️ ${data.error}`);
        } else {
          const result = data.result || "";
          if (data._fallbackUsed) {
            const providerName = data._fallbackProvider || "OpenRouter";
            const fallbackMsg = `⚡ ${company}: Quota Hit → Switched to ${providerName}!`;
            setLog((prev) => [...prev, fallbackMsg]);
            onCellEnriched(
              row.id,
              targetCol,
              result,
              providerName
            );
          } else {
            onCellEnriched(row.id, targetCol, result);
            const display =
              result.length > 60 ? result.slice(0, 60) + "…" : result;
            setLog((prev) => [...prev, `✅ ${company}: ${display}`]);
          }
        }
      } catch (err) {
        const msg = `⚠️ ${company}: Network error`;
        setLog((prev) => [...prev, msg]);
        onCellEnriched(row.id, targetCol, msg);
      }
    }

    onEnrichingRow(null);
    setRunning(false);
  };

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-100">
              AI Column Enrichment
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={running}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Target column */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Target Column
            </label>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              disabled={running}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Enrichment Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={running}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              LLM Provider & Fallback Engine
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setProvider("gemini")}
                disabled={running}
                className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                  provider === "gemini"
                    ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                    : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span>Gemini (Fallback OR → NVIDIA)</span>
                </div>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                  Recommended
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("nvidia")}
                  disabled={running}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                    provider === "nvidia"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  } disabled:opacity-50`}
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  OpenRouter Direct
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("openai")}
                  disabled={running}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-all ${
                    provider === "openai"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  } disabled:opacity-50`}
                >
                  OpenAI gpt-4o-mini
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          {running && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Processing {progress.current}/{progress.total}:{" "}
                  <span className="font-semibold text-zinc-200">
                    {progress.company}
                  </span>
                </span>
                <span className="text-cyan-400">{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              {log.map((entry, i) => (
                <p key={i} className="text-xs text-zinc-400">
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-4">
          <button
            onClick={handleRun}
            disabled={running || rows.length === 0}
            className="glow-btn inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40 disabled:opacity-40 disabled:shadow-none"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enriching…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run Column Enrichment ({validRows.length} valid of {rows.length} rows)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
