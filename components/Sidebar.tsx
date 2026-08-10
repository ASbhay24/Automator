"use client";

import React from "react";
import {
  Database,
  Zap,
  Settings,
  FileDown,
  FileUp,
  LayoutGrid,
  PlusCircle,
  UserCircle2,
} from "lucide-react";

interface SidebarProps {
  onImportCSV: () => void;
  onExportCSV: () => void;
  onLoadMoreStartups: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export default function Sidebar({
  onImportCSV,
  onExportCSV,
  onLoadMoreStartups,
  onOpenSettings,
  onOpenProfile,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[220px] flex-col border-r border-zinc-800/70 bg-zinc-950 px-4 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Database className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-zinc-100">
          ClayLite
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        <span className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Workspace
        </span>

        <button className="group flex items-center gap-2.5 rounded-lg bg-zinc-800/50 px-3 py-2.5 text-sm font-medium text-zinc-100 transition-all">
          <LayoutGrid className="h-4 w-4 text-cyan-400" />
          Data Grid
        </button>

        <button
          onClick={onLoadMoreStartups}
          className="group flex items-center gap-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5 text-sm font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-white"
        >
          <PlusCircle className="h-4 w-4 text-cyan-400 transition-transform group-hover:scale-110" />
          ⚡ Add 8 YC Leads
        </button>

        <button
          onClick={onImportCSV}
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800/40 hover:text-zinc-100"
        >
          <FileUp className="h-4 w-4 transition-colors group-hover:text-cyan-400" />
          Import CSV
        </button>

        <button
          onClick={onExportCSV}
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800/40 hover:text-zinc-100"
        >
          <FileDown className="h-4 w-4 transition-colors group-hover:text-cyan-400" />
          Export CSV
        </button>

        <div className="my-3 border-t border-zinc-800/60" />

        <span className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          AI Tools
        </span>

        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-zinc-300">Enrichment Engine</span>
        </div>
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-zinc-800/60 pt-4">
        <span className="mb-2 block px-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Personalize
        </span>
        <button
          onClick={onOpenProfile}
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-violet-500/10 hover:text-violet-300"
        >
          <UserCircle2 className="h-4 w-4 transition-colors group-hover:text-violet-400" />
          My Profile
        </button>
        <button
          onClick={onOpenSettings}
          className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-800/40 hover:text-zinc-100"
        >
          <Settings className="h-4 w-4 transition-colors group-hover:text-cyan-400" />
          Settings
        </button>
        <p className="mt-3 px-2 text-[10px] text-zinc-600">
          ClayLite v2.0 · Open Source
        </p>
      </div>
    </aside>
  );
}
