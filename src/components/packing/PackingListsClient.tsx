"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Package, MapPin, Calendar, Loader2, Copy, Trash2, Settings } from "lucide-react";
import { cn, formatDate, getProgress } from "@/lib/utils";
import type { PackingList } from "@prisma/client";

type ListWithCounts = PackingList & { items: { id: string; gathered: boolean; packed: boolean }[] };

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "badge-blue" },
  PACKING: { label: "Packing", className: "badge-yellow" },
  TRAVELING: { label: "Traveling", className: "badge-green" },
  COMPLETED: { label: "Completed", className: "badge-gray" },
};

interface Props {
  lists: ListWithCounts[];
}

export function PackingListsClient({ lists: initial }: Props) {
  const router = useRouter();
  const [lists, setLists] = useState(initial);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", destination: "", startDate: "", endDate: "", fromDefaults: true });
  const [creating, setCreating] = useState(false);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/packing/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fromDefaults: form.fromDefaults }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setShowNew(false);
      setForm({ name: "", destination: "", startDate: "", endDate: "", fromDefaults: true });
      router.push(`/packing/${data.id}`);
    }
  }

  async function handleCopy(list: ListWithCounts) {
    const name = prompt(`Name for the copy of "${list.name}"?`, `${list.name} (copy)`);
    if (!name) return;
    setCopyingId(list.id);
    const res = await fetch(`/api/packing/lists/${list.id}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setCopyingId(null);
    if (res.ok) router.push(`/packing/${data.id}`);
  }

  async function handleDelete(list: ListWithCounts) {
    if (!confirm(`Delete "${list.name}"? This cannot be undone.`)) return;
    setDeletingId(list.id);
    await fetch(`/api/packing/lists/${list.id}`, { method: "DELETE" });
    setDeletingId(null);
    setLists((prev) => prev.filter((l) => l.id !== list.id));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-text-bright">Packing Lists</h1>
          <p className="text-sm text-text-muted mt-0.5">{lists.length} trip{lists.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/packing/defaults" className="vscode-btn-secondary">
            <Settings className="w-4 h-4" />
            Default Items
          </Link>
          <button onClick={() => setShowNew(true)} className="vscode-btn-primary">
            <Plus className="w-4 h-4" />
            New List
          </button>
        </div>
      </div>

      {/* New list modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="card-header">
              <span className="text-sm font-medium text-text-bright">New Packing List</span>
              <button onClick={() => setShowNew(false)} className="vscode-btn-ghost text-xs">Cancel</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Trip Name *</label>
                  <input
                    className="vscode-input"
                    placeholder="Weekend in NYC"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-muted">Destination</label>
                  <input
                    className="vscode-input"
                    placeholder="New York, NY"
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">Start Date</label>
                    <input type="date" className="vscode-input" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-muted">End Date</label>
                    <input type="date" className="vscode-input" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.fromDefaults}
                    onChange={(e) => setForm((f) => ({ ...f, fromDefaults: e.target.checked }))}
                    className="accent-accent-blue"
                  />
                  Start from default items
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowNew(false)} className="vscode-btn-secondary">Cancel</button>
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

      {/* List of trips */}
      {lists.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-text-muted/40 mb-4" />
          <p className="text-text-muted font-medium">No packing lists yet</p>
          <p className="text-text-muted/60 text-sm mt-1">Create your first list to get started</p>
          <button onClick={() => setShowNew(true)} className="vscode-btn-primary mt-4">
            <Plus className="w-4 h-4" />
            New List
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => {
            const { gathered, packed, total } = getProgress(list.items);
            const packedPct = total > 0 ? Math.round((packed / total) * 100) : 0;
            const status = STATUS_LABELS[list.status] ?? STATUS_LABELS.PLANNING;

            return (
              <div key={list.id} className="card hover:border-border-focus/50 transition-colors group">
                <div className="flex items-center gap-4 px-4 py-3">
                  <Link href={`/packing/${list.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text-bright truncate">{list.name}</span>
                      <span className={cn("badge", status.className)}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      {list.destination && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {list.destination}
                        </span>
                      )}
                      {list.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(list.startDate)}
                          {list.endDate && ` – ${formatDate(list.endDate)}`}
                        </span>
                      )}
                      <span>{total} items · {gathered} gathered · {packed} packed</span>
                    </div>
                    {total > 0 && (
                      <div className="mt-2 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${packedPct}%` }} />
                      </div>
                    )}
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(list)}
                      disabled={copyingId === list.id}
                      className="vscode-btn-ghost p-1.5"
                      title="Copy list"
                    >
                      {copyingId === list.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(list)}
                      disabled={deletingId === list.id}
                      className="vscode-btn-ghost p-1.5 hover:text-status-error"
                      title="Delete list"
                    >
                      {deletingId === list.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
