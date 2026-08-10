"use client";

import React from "react";
import { Sparkles, Plus, Trash2, LogIn, LogOut, Save, Loader2, Cloud, CloudOff } from "lucide-react";
import type { Session } from "next-auth";

/* ------------------------------------------------------------------ */
/* Sync status type                                                    */
/* ------------------------------------------------------------------ */
export type SyncStatus = "idle" | "loading" | "saving" | "saved" | "error";

interface HeaderProps {
  rowCount: number;
  colCount: number;
  enrichedCount: number;
  onAddColumn: () => void;
  onAddRow: () => void;
  onDeleteRows: () => void;
  onOpenEnrichment: () => void;
  selectedCount: number;
  // Auth & Sync props
  session: Session | null;
  syncStatus: SyncStatus;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaveToDrive: () => void;
}

export default function Header({
  rowCount,
  colCount,
  enrichedCount,
  onAddColumn,
  onAddRow,
  onDeleteRows,
  onOpenEnrichment,
  selectedCount,
  session,
  syncStatus,
  onSignIn,
  onSignOut,
  onSaveToDrive,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800/70 bg-zinc-950/80 px-6 py-4 backdrop-blur-md">
      {/* Left — stats */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">
            Leads
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {rowCount} rows · {colCount} columns ·{" "}
            <span className="text-emerald-400">{enrichedCount} enriched</span>
          </p>
        </div>

        {/* Stat pills */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-3 py-1 text-xs font-medium text-zinc-300">
            📊 {rowCount} rows
          </span>
          <span className="inline-flex items-center rounded-full bg-zinc-800/70 px-3 py-1 text-xs font-medium text-zinc-300">
            🧩 {colCount} cols
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ✅ {enrichedCount} filled
          </span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* ─── Auth & Sync Section ─────────────────────────── */}
        {!session ? (
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in with Google
          </button>
        ) : (
          <>
            {/* User avatar + name */}
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-5 w-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                  {session.user?.name?.[0] || "?"}
                </div>
              )}
              <span className="max-w-[80px] truncate text-[11px] font-medium text-zinc-400">
                {session.user?.name?.split(" ")[0] || "User"}
              </span>
            </div>

            {/* Sync status + Save button */}
            {syncStatus === "loading" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs font-medium text-cyan-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Syncing…
              </span>
            )}
            {syncStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </span>
            )}
            {syncStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400">
                <Cloud className="h-3.5 w-3.5" />
                Saved ✓
              </span>
            )}
            {syncStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">
                <CloudOff className="h-3.5 w-3.5" />
                Sync Error
              </span>
            )}

            <button
              onClick={onSaveToDrive}
              disabled={syncStatus === "saving" || syncStatus === "loading"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 hover:text-blue-300 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              💾 Save to Drive
            </button>

            <button
              onClick={onSignOut}
              className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-400"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-zinc-800" />

        {/* ─── Grid Actions ────────────────────────────────── */}
        {selectedCount > 0 && (
          <button
            onClick={onDeleteRows}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete ({selectedCount})
          </button>
        )}

        <button
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60 hover:text-zinc-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </button>

        <button
          onClick={onAddColumn}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700/60 hover:text-zinc-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Column
        </button>

        <button
          onClick={onOpenEnrichment}
          className="glow-btn inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/40"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Enrich with AI
        </button>
      </div>
    </header>
  );
}
