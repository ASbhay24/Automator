"use client";

import React, { useState } from "react";
import { X, Key, Check, AlertTriangle, Zap } from "lucide-react";

/* ------------------------------------------------------------------ */
/* SettingsModal                                                       */
/* ------------------------------------------------------------------ */
interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  if (!open) return null;

  const handleSave = () => {
    try {
      if (geminiKey) localStorage.setItem("claylite_gemini_key", geminiKey);
      if (nvidiaKey) localStorage.setItem("claylite_nvidia_key", nvidiaKey);
      if (openaiKey) localStorage.setItem("claylite_openai_key", openaiKey);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-100">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">
              API keys are loaded automatically from{" "}
              <code className="rounded bg-zinc-800 px-1 py-0.5 text-cyan-400">
                .env.local
              </code>{" "}
              on the server. Use the fields below to inspect or add session
              overrides.
            </p>
          </div>

          {/* Gemini Key */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Gemini API Key
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-400">
                <Check className="h-2.5 w-2.5" /> .env loaded
              </span>
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Override: paste key here…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* NVIDIA NIM Key (Fallback) */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              NVIDIA NIM API Key (Zero-Cost Backup)
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-cyan-400">
                <Zap className="h-2.5 w-2.5" /> Auto-Fallback
              </span>
            </label>
            <input
              type="password"
              value={nvidiaKey}
              onChange={(e) => setNvidiaKey(e.target.value)}
              placeholder="nvapi-... (from build.nvidia.com)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* OpenAI Key */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              OpenAI API Key
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-amber-400">
                <AlertTriangle className="h-2.5 w-2.5" /> optional
              </span>
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Override: paste key here…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <div>
            {status === "saved" && (
              <span className="text-xs font-semibold text-emerald-400">
                ✅ Overrides saved to local storage
              </span>
            )}
            {status === "error" && (
              <span className="text-xs font-semibold text-red-400">
                ⚠️ Failed to save
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700"
          >
            Save Overrides
          </button>
        </div>
      </div>
    </div>
  );
}
