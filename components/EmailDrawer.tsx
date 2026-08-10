"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, Mail, User } from "lucide-react";
import type { CompanyRow } from "@/lib/starterData";
import type { UserProfile } from "@/components/ProfileModal";

/* ------------------------------------------------------------------ */
/* EmailDrawer — Internship Outreach Email Builder                    */
/* ------------------------------------------------------------------ */

interface EmailDrawerProps {
  open: boolean;
  onClose: () => void;
  row: CompanyRow | null;
  profile: UserProfile | null;
}

export default function EmailDrawer({ open, onClose, row, profile }: EmailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!open || !row || !profile) return null;

  const company = row.Company || "Company";
  const hook =
    row.Personalized_Hook ||
    "I really like what you are building around high-performance developer infrastructure.";
  const contactEmail = row.Contact_Email || "";

  /* ─── Build dynamic email content from profile ─────────────── */
  const senderName = profile.fullName || "[Your Name]";
  const college = profile.college || "[Your College]";
  const yearRole = profile.yearRole;
  const intro = profile.shortIntro;

  const subject =
    profile.emailSubject || `Software Engineering Intern | ${college}`;

  // Build the intro line
  const introLine = yearRole
    ? `I'm a ${yearRole} at ${college}${intro ? ` ${intro}` : ""}.`
    : `I'm a student at ${college}${intro ? `, ${intro}` : ""}.`;

  // Build project bullets
  const projectLines = profile.projectBullets
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const projectSection =
    projectLines.length > 0
      ? `Here are a few projects I've built:\n${projectLines
          .map((p) => `• ${p}`)
          .join("\n")}`
      : "";

  // Build links section
  const linkLines: string[] = [];
  if (profile.githubUrl) linkLines.push(`GitHub: ${profile.githubUrl}`);
  if (profile.portfolioUrl) linkLines.push(`Portfolio: ${profile.portfolioUrl}`);
  profile.customLinks.forEach((cl) => {
    if (cl.label && cl.url) linkLines.push(`${cl.label}: ${cl.url}`);
  });
  const linksSection = linkLines.length > 0 ? linkLines.join("\n") : "";

  const emailBody = [
    `Hi ${company} Team,`,
    "",
    introLine,
    "",
    hook,
    "",
    `I'd love to contribute to ${company} this fall as a software engineering intern.${
      projectSection ? " " + projectSection : ""
    }`,
    "",
    linksSection,
    "",
    "Best,",
    senderName,
  ]
    .filter((line, i, arr) => {
      // Remove consecutive blank lines
      if (line === "" && i > 0 && arr[i - 1] === "") return false;
      return true;
    })
    .join("\n")
    .trim();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Gmail Web Compose direct URL
  const handleOpenGmailWeb = () => {
    const encRecipient = encodeURIComponent(contactEmail);
    const encSubject = encodeURIComponent(subject);
    const encBody = encodeURIComponent(emailBody);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encRecipient}&su=${encSubject}&body=${encBody}`;
    window.open(gmailUrl, "_blank");
  };

  // Mailto fallback link
  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(
      contactEmail
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      emailBody
    )}`;
    window.open(mailtoUrl, "_blank");
  };

  // Check if profile is empty (no name set)
  const isProfileEmpty = !profile.fullName;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/80">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Outreach Email — {company}
              </h2>
              <p className="text-xs text-zinc-500">
                Internship Cold Outreach Draft
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

        {/* Profile notice */}
        {isProfileEmpty && (
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-3">
            <p className="text-xs text-amber-400">
              ⚠️ No profile configured yet. Open{" "}
              <strong>My Profile</strong> in the sidebar to personalize your
              outreach emails.
            </p>
          </div>
        )}

        {/* Contact Info Card */}
        <div className="border-b border-zinc-800/60 bg-zinc-950/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Target Contact
              </span>
            </div>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
              {row.Category || "Startup"}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-200">
            {contactEmail || (
              <span className="italic text-zinc-600">No email set in table</span>
            )}
          </p>
        </div>

        {/* Email Preview Area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
          {/* Subject Field */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Subject Line
            </label>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 font-mono text-xs font-semibold text-cyan-400">
              {subject}
            </div>
          </div>

          {/* Body Field */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <span>Email Body (Live Placeholders Swapped)</span>
              <span className="text-[10px] text-emerald-400 font-normal">
                ✓ Auto-formatted
              </span>
            </label>
            <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner">
              {emailBody}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2 border-t border-zinc-800 px-6 py-4">
          {/* One-Click Gmail Web Compose */}
          <button
            onClick={handleOpenGmailWeb}
            className="glow-btn inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40"
          >
            <ExternalLink className="h-4 w-4" />
            ✉️ Open in Gmail (One-Click Send)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOpenMailto}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
            >
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              Default Mail App
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Body
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
