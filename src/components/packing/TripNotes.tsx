"use client";

import { useState } from "react";
import { ChevronDown, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  preTripNotes: string | null;
  postTripNotes: string | null;
  showPostTripNotes: boolean;
  // Completed trips: pre-trip notes are read-only, matching item notes
  locked: boolean;
  onSave: (patch: { preTripNotes?: string | null; postTripNotes?: string | null }) => Promise<void>;
}

const textareaClass =
  "vscode-input min-h-[5rem] resize-y read-only:cursor-default read-only:focus:border-border read-only:focus:ring-0";

export function TripNotes({ preTripNotes, postTripNotes, showPostTripNotes, locked, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [pre, setPre] = useState(preTripNotes ?? "");
  const [post, setPost] = useState(postTripNotes ?? "");

  const filled = [pre.trim(), showPostTripNotes ? post.trim() : ""].filter(Boolean).length;

  async function savePre() {
    const trimmed = pre.trim();
    if (trimmed === (preTripNotes ?? "")) return;
    await onSave({ preTripNotes: trimmed || null });
  }

  async function savePost() {
    const trimmed = post.trim();
    if (trimmed === (postTripNotes ?? "")) return;
    await onSave({ postTripNotes: trimmed || null });
  }

  return (
    <div className="card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
        aria-expanded={open}
      >
        <NotebookPen className="w-4 h-4" />
        Trip notes
        {filled > 0 && <span className="badge-gray">{filled}</span>}
        <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn("border-t border-border px-4 py-3 grid gap-3", showPostTripNotes && "md:grid-cols-2")}>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wide text-text-muted">Pre-trip notes</label>
            <textarea
              className={textareaClass}
              placeholder="—"
              value={pre}
              readOnly={locked}
              onChange={(e) => setPre(e.target.value)}
              onBlur={savePre}
            />
          </div>
          {showPostTripNotes && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-text-muted">Post-trip notes</label>
              <textarea
                className={textareaClass}
                placeholder="—"
                value={post}
                onChange={(e) => setPost(e.target.value)}
                onBlur={savePost}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
