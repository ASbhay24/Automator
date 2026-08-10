"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Check, ExternalLink, Zap, Mail } from "lucide-react";
import type { CompanyRow, ApplicationStatus } from "@/lib/starterData";

const STATUS_CYCLE: ApplicationStatus[] = [
  "To Apply",
  "Applied 📩",
  "Response Received 💬",
  "Interviewing 🎯",
];

/* ------------------------------------------------------------------ */
/* Status cycle badge                                                  */
/* ------------------------------------------------------------------ */
function StatusBadge({
  status,
  onClick,
}: {
  status: ApplicationStatus;
  onClick: () => void;
}) {
  const styles: Record<ApplicationStatus, string> = {
    "To Apply":
      "border-zinc-700 bg-zinc-800/80 text-zinc-400 hover:border-zinc-500",
    "Applied 📩":
      "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:border-blue-400/50",
    "Response Received 💬":
      "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50",
    "Interviewing 🎯":
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-bold hover:border-emerald-400",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="Click to cycle status"
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
        styles[status] || styles["To Apply"]
      }`}
    >
      {status}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Enrichment status badge                                             */
/* ------------------------------------------------------------------ */
function EnrichmentBadge({
  enriched,
  fallbackNotice,
}: {
  enriched: boolean;
  fallbackNotice?: string;
}) {
  if (fallbackNotice) {
    return (
      <span
        title={fallbackNotice}
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300"
      >
        <Zap className="h-2.5 w-2.5 text-amber-400" /> {fallbackNotice}
      </span>
    );
  }
  if (enriched) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
        <Check className="h-2.5 w-2.5" /> Enriched
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
      Pending
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Editable cell                                                       */
/* ------------------------------------------------------------------ */
function EditableCell({
  value,
  onChange,
  isUrl,
}: {
  value: string;
  onChange: (v: string) => void;
  isUrl?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full rounded border border-cyan-500/40 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none ring-1 ring-cyan-500/20"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <div
      className="group flex min-h-[28px] cursor-text items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-zinc-800/60"
      onClick={() => setEditing(true)}
    >
      <span className="truncate text-sm text-zinc-300">
        {value || <span className="italic text-zinc-600">empty</span>}
      </span>
      {isUrl && value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex-shrink-0 text-zinc-600 transition-colors hover:text-cyan-400"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DataGrid Component                                                  */
/* ------------------------------------------------------------------ */
interface DataGridProps {
  rows: CompanyRow[];
  columns: string[];
  selectedIds: Set<string>;
  onUpdateCell: (rowId: string, column: string, value: string) => void;
  onToggleSelect: (rowId: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (rowId: string) => void;
  onCycleStatus: (rowId: string) => void;
  enrichingRowId?: string | null;
  fallbackMap?: Record<string, string>;
}

export default function DataGrid({
  rows,
  columns,
  selectedIds,
  onUpdateCell,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onCycleStatus,
  enrichingRowId,
  fallbackMap = {},
}: DataGridProps) {
  const isAllSelected = rows.length > 0 && selectedIds.size === rows.length;

  const isUrlColumn = useCallback(
    (col: string) => /url|website|site|link/i.test(col),
    []
  );

  return (
    <div className="overflow-auto rounded-xl border border-zinc-800/70 bg-zinc-950/50">
      <table className="w-full min-w-[900px] table-fixed border-collapse">
        {/* Head */}
        <thead>
          <tr className="border-b border-zinc-800/70 bg-zinc-900/60">
            <th className="w-10 px-3 py-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                className="h-3.5 w-3.5 cursor-pointer rounded border-zinc-600 bg-zinc-800 accent-cyan-500"
              />
            </th>
            <th className="w-24 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              AI Status
            </th>
            <th className="w-40 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              App Status
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
              >
                {col.replace(/_/g, " ")}
              </th>
            ))}
            <th className="w-28 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Draft
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {rows.map((row) => {
            const isEnriching = row.id === enrichingRowId;
            const hasHook = row.Personalized_Hook?.trim().length > 0;
            const fallbackNotice = fallbackMap[row.id];
            const currentStatus = row.Status || "To Apply";

            return (
              <tr
                key={row.id}
                className={`group border-b border-zinc-800/40 transition-colors ${
                  selectedIds.has(row.id)
                    ? "bg-cyan-500/5"
                    : "hover:bg-zinc-800/30"
                } ${isEnriching ? "animate-pulse bg-cyan-500/5" : ""}`}
              >
                {/* Checkbox */}
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleSelect(row.id)}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-zinc-600 bg-zinc-800 accent-cyan-500"
                  />
                </td>

                {/* AI Enrichment Status */}
                <td className="px-3 py-2">
                  <EnrichmentBadge
                    enriched={hasHook}
                    fallbackNotice={fallbackNotice}
                  />
                </td>

                {/* Application Status Badge */}
                <td className="px-3 py-2">
                  <StatusBadge
                    status={currentStatus}
                    onClick={() => onCycleStatus(row.id)}
                  />
                </td>

                {/* Data Cells */}
                {columns.map((col) => (
                  <td key={col} className="px-1 py-1">
                    <EditableCell
                      value={String(row[col] ?? "")}
                      onChange={(v) => onUpdateCell(row.id, col, v)}
                      isUrl={isUrlColumn(col)}
                    />
                  </td>
                ))}

                {/* Draft Email Action Button */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => onRowClick(row.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:text-white"
                  >
                    <Mail className="h-3 w-3" /> Draft
                  </button>
                </td>
              </tr>
            );
          })}

          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + 4}
                className="px-6 py-16 text-center text-sm text-zinc-600"
              >
                No leads yet — add a row or upload a CSV to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
