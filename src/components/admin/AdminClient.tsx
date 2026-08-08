"use client";

import { useState } from "react";
import {
  Plus, Loader2, Trash2, ShieldCheck, Shield, KeyRound, Copy, Check, X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type SafeUser = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
};

interface Props {
  users: SafeUser[];
  currentUserId: string;
}

const COLS = "1fr 1fr 90px 110px 76px";

export function AdminClient({ users: initial, currentUserId }: Props) {
  const [users, setUsers] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", isAdmin: false });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
        isAdmin: form.isAdmin,
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setUsers((prev) => [...prev, data.user].sort((a, b) => a.email.localeCompare(b.email)));
      setShowAdd(false);
      setForm({ name: "", email: "", password: "", isAdmin: false });
      if (data.generatedPassword) {
        setRevealed({ email: data.user.email, password: data.generatedPassword });
      }
    } else {
      setFormError(data.error || "Failed to create user.");
    }
  }

  async function toggleAdmin(user: SafeUser) {
    setTogglingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    const data = await res.json();
    setTogglingId(null);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
    } else {
      alert(data.error || "Failed to update user.");
    }
  }

  async function handleResetPassword(user: SafeUser) {
    if (!confirm(`Reset the password for ${user.email}? Their current password will stop working.`)) return;
    setResettingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setResettingId(null);
    if (res.ok) {
      setRevealed({ email: user.email, password: data.password });
    } else {
      alert(data.error || "Failed to reset password.");
    }
  }

  async function handleDelete(user: SafeUser) {
    if (!confirm(`Delete ${user.email}? This also deletes all of their packing lists and cannot be undone.`)) return;
    setDeletingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete user.");
    }
  }

  function copyPassword() {
    if (!revealed) return;
    navigator.clipboard.writeText(revealed.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-text-bright">Users</h1>
          <p className="text-sm text-text-muted mt-0.5">{users.length} user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setFormError(null); }}
          className="vscode-btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div
          className="grid items-center gap-2 px-4 py-1.5 border-b border-border bg-bg-secondary"
          style={{ gridTemplateColumns: COLS }}
        >
          <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Name</span>
          <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Email</span>
          <span className="text-[10px] uppercase tracking-wide text-text-muted/60 text-center">Role</span>
          <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Joined</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <div
                key={user.id}
                className="grid items-center gap-2 px-4 py-2 group hover:bg-bg-hover transition-colors"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className="text-sm text-text truncate">
                  {user.name || <span className="text-text-muted/50">—</span>}
                </span>
                <span className="text-xs text-text-muted truncate">{user.email}</span>

                <button
                  onClick={() => toggleAdmin(user)}
                  disabled={isSelf || togglingId === user.id}
                  title={isSelf ? "You can't change your own admin status" : user.isAdmin ? "Remove admin access" : "Make admin"}
                  className="flex justify-center disabled:cursor-not-allowed"
                >
                  {togglingId === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                  ) : user.isAdmin ? (
                    <span className="badge-green flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>
                  ) : (
                    <span className="badge-gray flex items-center gap-1"><Shield className="w-3 h-3" /> User</span>
                  )}
                </button>

                <span className="text-xs text-text-muted">{formatDate(user.createdAt)}</span>

                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleResetPassword(user)}
                    disabled={resettingId === user.id}
                    className="vscode-btn-ghost p-1"
                    title="Reset password"
                  >
                    {resettingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    disabled={isSelf || deletingId === user.id}
                    className="vscode-btn-ghost p-1 hover:text-status-error"
                    title={isSelf ? "You can't delete your own account" : "Delete user"}
                  >
                    {deletingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add user modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <span className="text-sm font-medium text-text-bright">Add User</span>
              <button onClick={() => setShowAdd(false)} className="vscode-btn-ghost text-xs">Cancel</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleAdd} className="space-y-3">
                {formError && <p className="text-xs text-status-error">{formError}</p>}
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Name *</label>
                  <input
                    className="vscode-input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Email *</label>
                  <input
                    type="email"
                    className="vscode-input"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Password</label>
                  <input
                    className="vscode-input"
                    placeholder="Leave blank to auto-generate"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAdmin}
                    onChange={(e) => setForm((f) => ({ ...f, isAdmin: e.target.checked }))}
                    className="accent-accent-blue"
                  />
                  Grant admin access
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="vscode-btn-secondary">Cancel</button>
                  <button type="submit" disabled={creating} className="vscode-btn-primary">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Revealed password modal */}
      {revealed && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <span className="text-sm font-medium text-text-bright">Password for {revealed.email}</span>
              <button onClick={() => setRevealed(null)} className="vscode-btn-ghost p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="card-body space-y-3">
              <p className="text-xs text-text-muted">Save this now — it will not be shown again.</p>
              <div className="flex items-center gap-2">
                <input className="vscode-input flex-1 text-xs font-mono" value={revealed.password} readOnly />
                <button onClick={copyPassword} className="vscode-btn-secondary shrink-0">
                  {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => setRevealed(null)} className="vscode-btn-primary">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
