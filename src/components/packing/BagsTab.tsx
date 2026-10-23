"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bag } from "@prisma/client";

interface Props {
  bags: Bag[];
}

const inlineInputClass =
  "bg-transparent truncate rounded px-1 py-0.5 -mx-1 border border-transparent " +
  "hover:border-border focus:border-border-focus focus:bg-bg-tertiary focus:outline-none transition-colors";

interface RowProps {
  bag: Bag;
  onRename: (id: string, name: string) => Promise<string | null>;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function BagRow({ bag, onRename, onDelete, deleting }: RowProps) {
  const [name, setName] = useState(bag.name);
  const [error, setError] = useState<string | null>(null);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === bag.name) {
      setName(bag.name);
      setError(null);
      return;
    }
    const err = await onRename(bag.id, trimmed);
    setError(err);
    if (err) setName(bag.name);
  }

  return (
    <div className="px-4 py-2 group">
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-text-muted/40 shrink-0" />
        <input
          className={cn(inlineInputClass, "flex-1 min-w-0 text-sm text-text")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Bag name"
        />
        <div className="flex items-center reveal-on-hover">
          <button
            onClick={() => onDelete(bag.id)}
            disabled={deleting}
            className="vscode-btn-ghost p-1 hover:text-status-error"
            title="Delete bag"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-status-error mt-1 ml-6">{error}</p>}
    </div>
  );
}

export function BagsTab({ bags: initial }: Props) {
  const [bags, setBags] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/packing/bags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sortOrder: bags.length }),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok) {
      setBags((prev) => [...prev, data]);
      setNewName("");
    } else {
      setAddError(data.error ?? "Could not add bag");
    }
  }

  async function handleRename(id: string, name: string): Promise<string | null> {
    const res = await fetch(`/api/packing/bags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "Could not rename bag";
    setBags((prev) => prev.map((b) => (b.id === id ? data : b)));
    return null;
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/packing/bags/${id}`, { method: "DELETE" });
    setBags((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <p className="text-sm text-text-muted mb-4">
        These bags appear in the bag dropdown on every packing list. Renaming or deleting a bag doesn&apos;t change existing lists.
      </p>

      {/* Add form */}
      <div className="card mb-6">
        <div className="card-header">
          <span className="text-sm font-medium text-text-bright">Add Bag</span>
        </div>
        <div className="card-body space-y-2">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="vscode-input flex-1 min-w-0"
              placeholder="Carry-on"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <button type="submit" disabled={adding} className="vscode-btn-primary shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
          {addError && <p className="text-xs text-status-error">{addError}</p>}
        </div>
      </div>

      {bags.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-text-muted">No bags yet.</p>
          <p className="text-text-muted/60 text-sm mt-1">Add bags above to pick them from a dropdown on your packing lists.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bags</span>
            <span className="text-xs text-text-muted">{bags.length} {bags.length === 1 ? "bag" : "bags"}</span>
          </div>
          <div className="divide-y divide-border">
            {bags.map((bag) => (
              <BagRow
                key={bag.id}
                bag={bag}
                onRename={handleRename}
                onDelete={handleDelete}
                deleting={deletingId === bag.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
