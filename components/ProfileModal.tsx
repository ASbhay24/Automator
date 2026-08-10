"use client";

import React, { useState } from "react";
import { X, UserCircle2, Plus, Trash2, Check, LinkIcon, Briefcase, GraduationCap } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */
export interface CustomLink {
  label: string;
  url: string;
}

export interface UserProfile {
  fullName: string;
  college: string;
  yearRole: string;
  shortIntro: string;
  emailSubject: string;
  githubUrl: string;
  portfolioUrl: string;
  customLinks: CustomLink[];
  projectBullets: string;
}

export const PROFILE_STORAGE_KEY = "claylite_user_profile";

export const emptyProfile: UserProfile = {
  fullName: "",
  college: "",
  yearRole: "",
  shortIntro: "",
  emailSubject: "",
  githubUrl: "",
  portfolioUrl: "",
  customLinks: [],
  projectBullets: "",
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
export function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { ...emptyProfile };
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...emptyProfile };
    return { ...emptyProfile, ...JSON.parse(raw) };
  } catch {
    return { ...emptyProfile };
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

/* ------------------------------------------------------------------ */
/* ProfileModal                                                        */
/* ------------------------------------------------------------------ */
interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}

export default function ProfileModal({ open, onClose, profile, onChange }: ProfileModalProps) {
  const [status, setStatus] = useState<"idle" | "saved">("idle");

  if (!open) return null;

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    const updated = { ...profile, [key]: value };
    onChange(updated);
  };

  /* ----- Custom links management ----- */
  const addCustomLink = () =>
    update("customLinks", [...profile.customLinks, { label: "", url: "" }]);

  const updateCustomLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...profile.customLinks];
    updated[index] = { ...updated[index], [field]: value };
    update("customLinks", updated);
  };

  const removeCustomLink = (index: number) =>
    update(
      "customLinks",
      profile.customLinks.filter((_, i) => i !== index)
    );

  /* ----- Save handler ----- */
  const handleSave = () => {
    // Note: State is now hoisted to page.tsx, so onChange handles actual data flow.
    // This button just serves as a visual confirmation now.
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2200);
    onClose();
  };

  /* ----- Shared input styles ----- */
  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20";

  const labelCls =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
              <UserCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">My Profile</h2>
              <p className="text-[11px] text-zinc-500">
                Personalizes your outreach emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────────────────────── */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* ─── Personal Details ──────────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Personal Details
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  value={profile.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>College / Affiliation *</label>
                  <input
                    value={profile.college}
                    onChange={(e) => update("college", e.target.value)}
                    placeholder="e.g. MIT"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Year / Role</label>
                  <input
                    value={profile.yearRole}
                    onChange={(e) => update("yearRole", e.target.value)}
                    placeholder="e.g. Junior, CS Major"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Short Intro</label>
                <input
                  value={profile.shortIntro}
                  onChange={(e) => update("shortIntro", e.target.value)}
                  placeholder="e.g. building distributed systems and ML pipelines"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email Subject Line Override</label>
                <input
                  value={profile.emailSubject}
                  onChange={(e) => update("emailSubject", e.target.value)}
                  placeholder="Default: Software Engineering Intern | [College]"
                  className={inputCls}
                />
                <p className="mt-1 text-[10px] text-zinc-600">
                  Leave blank to auto-generate from your college name
                </p>
              </div>
            </div>
          </div>

          {/* ─── Links ─────────────────────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Links
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>GitHub URL</label>
                <input
                  value={profile.githubUrl}
                  onChange={(e) => update("githubUrl", e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Portfolio URL</label>
                <input
                  value={profile.portfolioUrl}
                  onChange={(e) => update("portfolioUrl", e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  className={inputCls}
                />
              </div>

              {/* Dynamic custom links */}
              {profile.customLinks.length > 0 && (
                <div className="space-y-2">
                  <label className={labelCls}>Custom Links</label>
                  {profile.customLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={link.label}
                        onChange={(e) => updateCustomLink(i, "label", e.target.value)}
                        placeholder="Label (e.g. LinkedIn)"
                        className={`${inputCls} !w-[130px] flex-shrink-0`}
                      />
                      <input
                        value={link.url}
                        onChange={(e) => updateCustomLink(i, "url", e.target.value)}
                        placeholder="https://..."
                        className={`${inputCls} flex-1`}
                      />
                      <button
                        onClick={() => removeCustomLink(i)}
                        className="flex-shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={addCustomLink}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-500 transition-all hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Custom Link (LinkedIn, Twitter, etc.)
              </button>
            </div>
          </div>

          {/* ─── Projects ──────────────────────────────────────── */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Projects
              </span>
            </div>

            <div>
              <label className={labelCls}>Project Bullets</label>
              <textarea
                value={profile.projectBullets}
                onChange={(e) => update("projectBullets", e.target.value)}
                placeholder={"DistCache: distributed caching layer for microservices\nMLPipe: automated ML training pipeline with auto-scaling"}
                rows={4}
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-zinc-600">
                One project per line — each line becomes a bullet point in emails
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4">
          <div>
            {status === "saved" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Saved & Applied
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-violet-500/40"
          >
            <Check className="h-3.5 w-3.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
