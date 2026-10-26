"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Trash2, X } from "lucide-react";
import type { PackingListItem } from "@prisma/client";

interface Props {
  item: PackingListItem;
  categoryOptions: string[];
  onSave: (patch: { name: string; category: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function EditItemDialog({ item, categoryOptions, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    await onSave({ name: trimmedName, category: category.trim() || "General" });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete();
  }

  // Portal out of the item row so the row's packed opacity doesn't fade the dialog
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <span className="text-sm font-medium text-text-bright">Edit Item</span>
          <button onClick={onClose} className="vscode-btn-ghost p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Name *</label>
              <input
                className="vscode-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Category</label>
              <input
                className="vscode-input"
                placeholder="General"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="edit-item-cats"
              />
              <datalist id="edit-item-cats">
                {categoryOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button type="button" onClick={handleDelete} disabled={deleting || saving} className="vscode-btn-danger">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={onClose} className="vscode-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving || deleting} className="vscode-btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
