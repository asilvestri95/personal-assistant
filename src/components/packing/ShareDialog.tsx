"use client";

import { useState } from "react";
import { X, Link, Lock, Globe, Loader2, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingList } from "@prisma/client";

interface Props {
  list: PackingList;
  onClose: () => void;
  onUpdate: (data: Partial<PackingList>) => void;
}

export function ShareDialog({ list, onClose, onUpdate }: Props) {
  const [shareType, setShareType] = useState<"PUBLIC" | "INVITE_ONLY" | null>(
    (list.shareType as "PUBLIC" | "INVITE_ONLY" | null) ?? null
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState(
    list.shareToken ? `${window.location.origin}/share/${list.shareToken}` : ""
  );
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/packing/lists/${list.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareType,
        inviteEmails: inviteEmail ? [inviteEmail] : [],
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      onUpdate(data);
      if (data.shareUrl) setShareUrl(data.shareUrl);
      if (inviteEmail) setInviteEmail("");
    }
  }

  async function handleDisable() {
    setSaving(true);
    const res = await fetch(`/api/packing/lists/${list.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareType: null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      onUpdate(data);
      setShareType(null);
      setShareUrl("");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="card-header">
          <span className="text-sm font-medium text-text-bright">Share List</span>
          <button onClick={onClose} className="vscode-btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <div className="card-body space-y-4">
          <p className="text-xs text-text-muted">Choose how others can view &ldquo;{list.name}&rdquo;</p>

          {/* Share type */}
          <div className="space-y-2">
            <button
              onClick={() => setShareType("PUBLIC")}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded border text-left transition-colors",
                shareType === "PUBLIC"
                  ? "border-accent-blue bg-accent-blue/10"
                  : "border-border hover:border-border-focus/50"
              )}
            >
              <Globe className={cn("w-4 h-4 mt-0.5 shrink-0", shareType === "PUBLIC" ? "text-accent-blue" : "text-text-muted")} />
              <div>
                <p className="text-sm font-medium text-text-bright">Public link</p>
                <p className="text-xs text-text-muted">Anyone with the link can view the list (no login required)</p>
              </div>
            </button>

            <button
              onClick={() => setShareType("INVITE_ONLY")}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded border text-left transition-colors",
                shareType === "INVITE_ONLY"
                  ? "border-accent-blue bg-accent-blue/10"
                  : "border-border hover:border-border-focus/50"
              )}
            >
              <Lock className={cn("w-4 h-4 mt-0.5 shrink-0", shareType === "INVITE_ONLY" ? "text-accent-blue" : "text-text-muted")} />
              <div>
                <p className="text-sm font-medium text-text-bright">Invite only</p>
                <p className="text-xs text-text-muted">Only specific registered users can view the list</p>
              </div>
            </button>
          </div>

          {/* Invite email (invite only) */}
          {shareType === "INVITE_ONLY" && (
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Invite user by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="vscode-input flex-1"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Share URL */}
          {shareUrl && (
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Share link</label>
              <div className="flex gap-2">
                <input className="vscode-input flex-1 text-xs font-mono" value={shareUrl} readOnly />
                <button onClick={copyLink} className="vscode-btn-secondary shrink-0">
                  {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {list.shareType && (
              <button onClick={handleDisable} disabled={saving} className="vscode-btn-danger text-xs">
                Disable sharing
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button onClick={onClose} className="vscode-btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving || !shareType} className="vscode-btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                {list.shareType ? "Update" : "Enable sharing"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
