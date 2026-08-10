"use client";

import React, { useState } from "react";
import { X, Copy, Check, Mail } from "lucide-react";
import type { CompanyRow } from "@/lib/starterData";

/* ------------------------------------------------------------------ */
/* Master email template                                               */
/* ------------------------------------------------------------------ */
const MASTER_TEMPLATE = `Subject: Quick note about {Company}

Hi {Name},

{Hook}

I'm building tools that help teams like yours move faster — from automated data enrichment to AI-powered outreach pipelines.

Would love to show you a 5-minute demo this week. Open to a quick chat?

Best,
[Your Name]
[Your Title]`;

/* ------------------------------------------------------------------ */
/* EmailPreview Drawer                                                 */
/* ------------------------------------------------------------------ */
interface EmailPreviewProps {
  open: boolean;
  onClose: () => void;
  row: CompanyRow | null;
}

export default function EmailPreview({
  open,
  onClose,
  row,
}: EmailPreviewProps) {
  const [recipientName, setRecipientName] = useState("there");
  const [template, setTemplate] = useState(MASTER_TEMPLATE);
  const [copied, setCopied] = useState(false);

  if (!open || !row) return null;

  const company = row.Company || "Company";
  const hook = row.Personalized_Hook || "";

  const rendered = template
    .replace(/\{Company\}/g, company)
    .replace(/\{Name\}/g, recipientName)
    .replace(/\{Hook\}/g, hook);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Email Preview — {company}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Row data summary */}
        <div className="border-b border-zinc-800/60 px-6 py-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Row Data
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(row)
              .filter(([k]) => k !== "id")
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-[10px] font-semibold uppercase text-zinc-600">
                    {k.replace(/_/g, " ")}
                  </span>
                  <p className="truncate text-xs text-zinc-300">
                    {String(v) || "—"}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Config */}
        <div className="space-y-4 border-b border-zinc-800/60 px-6 py-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Recipient Name
            </label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Email Template
            </label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300 outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Rendered email */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Generated Email
            </p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-700 hover:text-zinc-100"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300">
            {rendered}
          </pre>
        </div>
      </div>
    </div>
  );
}
