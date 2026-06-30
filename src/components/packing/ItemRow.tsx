"use client";

import { useState, useRef } from "react";
import { Trash2, Loader2, Check, X, Pencil, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingListItem } from "@prisma/client";

interface Props {
  item: PackingListItem;
  isCompleted: boolean;
  existingBags: string[];
  onUpdate: (id: string, patch: Partial<PackingListItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ItemRow({ item, isCompleted, existingBags, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: item.name,
    quantity: item.quantity,
    bag: item.bag ?? "",
    preTripNotes: item.preTripNotes ?? "",
    postTripNotes: item.postTripNotes ?? "",
  });
  const [deleting, setDeleting] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  async function toggleField(field: "gathered" | "packed") {
    setSavingField(field);
    await onUpdate(item.id, { [field]: !item[field] });
    setSavingField(null);
  }

  async function saveEdit() {
    await onUpdate(item.id, {
      name: editForm.name,
      quantity: editForm.quantity,
      bag: editForm.bag || null,
      preTripNotes: editForm.preTripNotes || null,
      postTripNotes: editForm.postTripNotes || null,
    });
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(item.id);
  }

  const cols = isCompleted
    ? "1fr 48px 96px 80px 80px 200px 200px 32px"
    : "1fr 48px 96px 80px 80px 200px 32px";

  if (editing) {
    return (
      <div className="px-4 py-2 bg-bg-hover">
        <div className="flex flex-wrap items-end gap-2 mb-2">
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted">Name</label>
            <input className="vscode-input w-44" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted">Qty</label>
            <input type="number" min={1} className="vscode-input w-16" value={editForm.quantity} onChange={(e) => setEditForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted">Bag</label>
            <input className="vscode-input w-28" value={editForm.bag} onChange={(e) => setEditForm((f) => ({ ...f, bag: e.target.value }))} list="edit-bags" />
            <datalist id="edit-bags">{existingBags.map((b) => <option key={b} value={b} />)}</datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-text-muted">Pre-trip Notes</label>
            <input className="vscode-input w-48" value={editForm.preTripNotes} onChange={(e) => setEditForm((f) => ({ ...f, preTripNotes: e.target.value }))} />
          </div>
          {isCompleted && (
            <div className="space-y-1">
              <label className="text-[10px] text-text-muted">Post-trip Notes</label>
              <input className="vscode-input w-48" value={editForm.postTripNotes} onChange={(e) => setEditForm((f) => ({ ...f, postTripNotes: e.target.value }))} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={saveEdit} className="vscode-btn-primary text-xs"><Check className="w-3 h-3" /> Save</button>
          <button onClick={() => setEditing(false)} className="vscode-btn-secondary text-xs"><X className="w-3 h-3" /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid items-center px-4 py-2 gap-2 group hover:bg-bg-hover transition-colors",
        item.packed && "opacity-60"
      )}
      style={{ gridTemplateColumns: cols }}
    >
      {/* Name */}
      <span className={cn("text-sm text-text truncate", item.packed && "line-through text-text-muted")}>
        {item.name}
      </span>

      {/* Qty */}
      <span className="text-xs text-text-muted text-center">{item.quantity}×</span>

      {/* Bag */}
      <span className="text-xs text-text-muted truncate">{item.bag ?? "—"}</span>

      {/* Gathered */}
      <button
        onClick={() => toggleField("gathered")}
        disabled={savingField === "gathered"}
        className="flex justify-center text-text-muted hover:text-accent-green transition-colors"
      >
        {savingField === "gathered" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : item.gathered ? (
          <CheckSquare className="w-4 h-4 text-accent-green" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>

      {/* Packed */}
      <button
        onClick={() => toggleField("packed")}
        disabled={savingField === "packed"}
        className="flex justify-center text-text-muted hover:text-accent-blue transition-colors"
      >
        {savingField === "packed" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : item.packed ? (
          <CheckSquare className="w-4 h-4 text-accent-blue" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>

      {/* Pre-trip notes */}
      <span className="text-xs text-text-muted truncate" title={item.preTripNotes ?? ""}>
        {item.preTripNotes || <span className="opacity-30">—</span>}
      </span>

      {/* Post-trip notes (completed only) */}
      {isCompleted && (
        <span className="text-xs text-text-muted truncate" title={item.postTripNotes ?? ""}>
          {item.postTripNotes || <span className="opacity-30">—</span>}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="vscode-btn-ghost p-1">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleDelete} disabled={deleting} className="vscode-btn-ghost p-1 hover:text-status-error">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
