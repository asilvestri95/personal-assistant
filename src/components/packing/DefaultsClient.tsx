"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, ChevronLeft, GripVertical, Pencil, Check, X } from "lucide-react";
import type { DefaultPackingItem } from "@prisma/client";

interface Props {
  items: DefaultPackingItem[];
}

export function DefaultsClient({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group by category
  const grouped = items.reduce<Record<string, DefaultPackingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  // Suggestions from existing categories
  const existingCategories = [...new Set(items.map((i) => i.category))].sort();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCategory.trim()) return;
    setAdding(true);
    const res = await fetch("/api/packing/defaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), category: newCategory.trim(), sortOrder: items.length }),
    });
    const data = await res.json();
    setAdding(false);
    if (res.ok) {
      setItems((prev) => [...prev, data]);
      setNewName("");
    }
  }

  function startEdit(item: DefaultPackingItem) {
    setEditingId(item.id);
    setEditForm({ name: item.name, category: item.category });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/packing/defaults/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/packing/defaults/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/packing" className="vscode-btn-ghost p-1">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-text-bright">Default Items</h1>
          <p className="text-sm text-text-muted">These items are added to every new packing list</p>
        </div>
      </div>

      {/* Add form */}
      <div className="card mb-6">
        <div className="card-header">
          <span className="text-sm font-medium text-text-bright">Add Item</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              className="vscode-input flex-1"
              placeholder="Item name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input
              className="vscode-input w-40"
              placeholder="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              list="categories"
              required
            />
            <datalist id="categories">
              {existingCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
            <button type="submit" disabled={adding} className="vscode-btn-primary shrink-0">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Items grouped by category */}
      {items.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-text-muted">No default items yet.</p>
          <p className="text-text-muted/60 text-sm mt-1">Add items above to auto-populate new packing lists.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category} className="card">
              <div className="card-header">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{category}</span>
                <span className="text-xs text-text-muted">{grouped[category].length} items</span>
              </div>
              <div className="divide-y divide-border">
                {grouped[category].map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-4 py-2 group">
                    <GripVertical className="w-4 h-4 text-text-muted/30 shrink-0" />

                    {editingId === item.id ? (
                      <>
                        <input
                          className="vscode-input flex-1 py-0.5 h-7"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          autoFocus
                        />
                        <input
                          className="vscode-input w-32 py-0.5 h-7"
                          value={editForm.category}
                          onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                          list="categories"
                        />
                        <button onClick={() => saveEdit(item.id)} className="vscode-btn-ghost p-1 text-accent-green">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="vscode-btn-ghost p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-text">{item.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="vscode-btn-ghost p-1">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            className="vscode-btn-ghost p-1 hover:text-status-error"
                          >
                            {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
