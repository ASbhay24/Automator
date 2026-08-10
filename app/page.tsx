"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Papa from "papaparse";
import { starterData, additionalYCStartups, defaultColumns } from "@/lib/starterData";
import type { CompanyRow, ApplicationStatus } from "@/lib/starterData";
import type { SyncStatus } from "@/components/Header";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DataGrid from "@/components/DataGrid";
import EnrichmentModal from "@/components/EnrichmentModal";
import EmailDrawer from "@/components/EmailDrawer";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal, { loadProfile, saveProfile, emptyProfile, UserProfile } from "@/components/ProfileModal";

const STATUS_CYCLE: ApplicationStatus[] = [
  "To Apply",
  "Applied 📩",
  "Response Received 💬",
  "Interviewing 🎯",
];

/* ------------------------------------------------------------------ */
/* Unique ID helper                                                    */
/* ------------------------------------------------------------------ */
let _uid = 100;
function uid(): string {
  return String(++_uid);
}

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  // ----- Auth -----
  const { data: session, status: authStatus } = useSession();

  // ----- State -----
  const [rows, setRows] = useState<CompanyRow[]>(starterData);
  const [columns, setColumns] = useState<string[]>([...defaultColumns]);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile); // Initialized empty, populated on mount
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [emailRow, setEmailRow] = useState<CompanyRow | null>(null);
  const [enrichingRowId, setEnrichingRowId] = useState<string | null>(null);
  const [fallbackMap, setFallbackMap] = useState<Record<string, string>>({});
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ----- Sync State -----
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const hasSyncedRef = useRef(false);

  // Read local profile on mount if not authenticated
  useEffect(() => {
    if (authStatus !== "loading" && authStatus !== "authenticated") {
      setProfile(loadProfile());
    }
  }, [authStatus]);

  // Persist local profile when it changes (as fallback)
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // ----- Auto-load from Google Sheets on sign-in -----
  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.accessToken) return;
    if (hasSyncedRef.current) return; // Only sync once per session

    hasSyncedRef.current = true;
    setSyncStatus("loading");

    fetch("/api/sync")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("[sync] Load error:", data.error);
          setSyncStatus("error");
          setTimeout(() => setSyncStatus("idle"), 3000);
          return;
        }

        setSheetId(data.sheetId);

        if (data.isNew) {
          // If the sheet is brand new, DO NOT wipe local state!
          // Instead, we immediately upload our current local work to the drive to preserve it.
          forceSaveToDrive(data.sheetId, rows, columns, profile);
          return;
        }

        // Hydrate grid with saved data from cloud
        if (data.rows && data.rows.length > 0) {
          const parsed: CompanyRow[] = data.rows.map(
            (row: Record<string, string>, idx: number) => ({
              id: String(idx + 1),
              Company: "",
              Website: "",
              Category: "",
              Personalized_Hook: "",
              Contact_Email: "",
              Status: "To Apply" as ApplicationStatus,
              ...row,
            })
          );
          setRows(parsed);
          setColumns(data.columns);
          setSelectedIds(new Set());
          setFallbackMap({});
        }

        // Hydrate profile with saved data from cloud
        if (data.profile) {
          // Ensure we don't drop fields by merging with emptyProfile
          setProfile({ ...emptyProfile, ...data.profile });
        }

        setSyncStatus("idle");
      })
      .catch((err) => {
        console.error("[sync] Load failed:", err);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 3000);
      });
  }, [authStatus, session]); // Only runs when session authenticates

  // ----- Save to Drive handler (can be called manually or auto) -----
  const forceSaveToDrive = useCallback(
    async (
      targetSheetId: string | null,
      targetRows: CompanyRow[],
      targetColumns: string[],
      targetProfile: UserProfile
    ) => {
      if (!session?.accessToken) return;
      setSyncStatus("saving");

      try {
        const exportRows = targetRows.map((r) => {
          const obj: Record<string, string> = {};
          targetColumns.forEach((c) => (obj[c] = String(r[c] ?? "")));
          return obj;
        });

        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: exportRows,
            columns: targetColumns,
            profile: targetProfile,
            sheetId: targetSheetId,
          }),
        });

        const data = await res.json();

        if (data.error) {
          console.error("[sync] Save error:", data.error);
          setSyncStatus("error");
          setTimeout(() => setSyncStatus("idle"), 3000);
          return;
        }

        if (data.sheetId) setSheetId(data.sheetId);
        setSyncStatus("saved");
        setTimeout(() => setSyncStatus("idle"), 2500);
      } catch (err) {
        console.error("[sync] Save failed:", err);
        setSyncStatus("error");
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    },
    [session]
  );

  const handleManualSave = useCallback(() => {
    forceSaveToDrive(sheetId, rows, columns, profile);
  }, [forceSaveToDrive, sheetId, rows, columns, profile]);

  // ----- Auto-Save (Debounced) -----
  useEffect(() => {
    // Only auto-save if authenticated and initial load has finished
    if (authStatus !== "authenticated" || !hasSyncedRef.current || syncStatus === "loading") return;

    const timeout = setTimeout(() => {
      forceSaveToDrive(sheetId, rows, columns, profile);
    }, 2500); // 2.5 seconds debounce

    return () => clearTimeout(timeout);
  }, [rows, columns, profile, authStatus, sheetId, forceSaveToDrive]);

  // ----- Mutations -----
  const handleUpdateCell = useCallback(
    (rowId: string, column: string, value: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [column]: value } : r))
      );
    },
    []
  );

  const handleCycleStatus = useCallback((rowId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const current = r.Status || "To Apply";
        const idx = STATUS_CYCLE.indexOf(current);
        const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return { ...r, Status: nextStatus };
      })
    );
  }, []);

  const handleAddRow = useCallback(() => {
    const empty: CompanyRow = {
      id: uid(),
      Company: "",
      Website: "",
      Category: "",
      Personalized_Hook: "",
      Contact_Email: "",
      Status: "To Apply",
    };
    columns.forEach((c) => {
      if (!(c in empty)) empty[c] = "";
    });
    setRows((prev) => [...prev, empty]);
  }, [columns]);

  const handleLoadMoreStartups = useCallback(() => {
    const newBatch: CompanyRow[] = additionalYCStartups.map((item) => {
      const row: CompanyRow = {
        id: uid(),
        Company: item.Company,
        Website: item.Website,
        Category: item.Category,
        Personalized_Hook: item.Personalized_Hook,
        Contact_Email: item.Contact_Email,
        Status: item.Status as ApplicationStatus,
      };
      columns.forEach((c) => {
        if (!(c in row)) row[c] = "";
      });
      return row;
    });
    setRows((prev) => [...prev, ...newBatch]);
  }, [columns]);

  const handleDeleteRows = useCallback(() => {
    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleAddColumn = useCallback(() => {
    const name = prompt("New column name:");
    if (!name) return;
    const clean = name.trim().replace(/\s+/g, "_");
    if (!clean || columns.includes(clean)) return;
    setColumns((prev) => [...prev, clean]);
    setRows((prev) => prev.map((r) => ({ ...r, [clean]: "" })));
  }, [columns]);

  // ----- Selection -----
  const handleToggleSelect = useCallback((rowId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id))
    );
  }, [rows]);

  // ----- CSV Import / Export -----
  const handleImportCSV = useCallback(() => {
    csvInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = results.data;
          if (!parsed.length) return;
          const cols = Object.keys(parsed[0]);
          const newRows: CompanyRow[] = parsed.map((row) => ({
            id: uid(),
            Company: "",
            Website: "",
            Category: "",
            Personalized_Hook: "",
            Contact_Email: "",
            Status: "To Apply",
            ...row,
          }));
          setColumns(cols);
          setRows(newRows);
          setSelectedIds(new Set());
          setFallbackMap({});
        },
      });
      e.target.value = "";
    },
    []
  );

  const handleExportCSV = useCallback(() => {
    const data = rows.map((r) => {
      const obj: Record<string, string> = {};
      columns.forEach((c) => (obj[c] = String(r[c] ?? "")));
      return obj;
    });
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "claylite_internships_export.csv";
    link.click();
  }, [rows, columns]);

  // ----- Enrichment callback -----
  const handleCellEnriched = useCallback(
    (
      rowId: string,
      column: string,
      value: string,
      fallbackNotice?: string
    ) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, [column]: value } : r))
      );
      if (fallbackNotice) {
        setFallbackMap((prev) => ({ ...prev, [rowId]: fallbackNotice }));
      }
    },
    []
  );

  // ----- CRM Metrics -----
  const totalLeads = rows.length;
  const appliedCount = rows.filter((r) => r.Status !== "To Apply").length;
  const interviewingCount = rows.filter(
    (r) => r.Status === "Interviewing 🎯"
  ).length;
  const enrichedCount = rows.filter(
    (r) => r.Personalized_Hook?.trim().length > 0
  ).length;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hidden CSV input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Sidebar */}
      <Sidebar
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onLoadMoreStartups={handleLoadMoreStartups}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Main area */}
      <main className="ml-[220px] flex flex-1 flex-col">
        <Header
          rowCount={rows.length}
          colCount={columns.length}
          enrichedCount={enrichedCount}
          onAddColumn={handleAddColumn}
          onAddRow={handleAddRow}
          onDeleteRows={handleDeleteRows}
          onOpenEnrichment={() => setEnrichModalOpen(true)}
          selectedCount={selectedIds.size}
          session={session ?? null}
          syncStatus={syncStatus}
          onSignIn={() => signIn("google")}
          onSignOut={() => {
            hasSyncedRef.current = false;
            signOut();
          }}
          onSaveToDrive={handleManualSave}
        />

        {/* CRM Metric Bar */}
        <div className="flex items-center gap-4 border-b border-zinc-800/70 bg-zinc-950/60 px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Outreach Pipeline Tracker:
          </span>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-zinc-300">
              Total Prospects: <strong className="text-white">{totalLeads}</strong>
            </span>
            <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-blue-300">
              Applications Sent:{" "}
              <strong className="text-blue-200">{appliedCount}</strong>
            </span>
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              Interviewing:{" "}
              <strong className="text-emerald-200">{interviewingCount}</strong>
            </span>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
              AI Enriched Hooks:{" "}
              <strong className="text-cyan-200">{enrichedCount}</strong>
            </span>
          </div>
        </div>

        {/* Data grid */}
        <div className="flex-1 overflow-auto p-6">
          <DataGrid
            rows={rows}
            columns={columns}
            selectedIds={selectedIds}
            onUpdateCell={handleUpdateCell}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onRowClick={(id) => {
              const row = rows.find((r) => r.id === id);
              if (row) setEmailRow(row);
            }}
            onCycleStatus={handleCycleStatus}
            enrichingRowId={enrichingRowId}
            fallbackMap={fallbackMap}
          />
        </div>
      </main>

      {/* Modals / Drawers */}
      <EnrichmentModal
        open={enrichModalOpen}
        onClose={() => setEnrichModalOpen(false)}
        columns={columns}
        rows={rows}
        onCellEnriched={handleCellEnriched}
        onEnrichingRow={setEnrichingRowId}
      />

      <EmailDrawer
        open={!!emailRow}
        onClose={() => setEmailRow(null)}
        row={emailRow}
        profile={profile}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onChange={setProfile}
      />
    </div>
  );
}
