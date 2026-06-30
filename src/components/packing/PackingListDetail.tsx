"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Plus, Trash2, Loader2, Share2, Copy,
  ChevronDown, ChevronRight, Check, X, Pencil, Package2,
  MapPin, Calendar, CheckSquare, Square,
} from "lucide-react";
import { cn, formatDate, getProgress } from "@/lib/utils";
import type { PackingList, PackingListItem } from "@prisma/client";
import { ShareDialog } from "./ShareDialog";
import { ItemRow } from "./ItemRow";

type ListWithShares = PackingList & {
  items: PackingListItem[];
  shares: { user: { id: string; name: string | null; email: string } }[];
};

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning" },
  { value: "PACKING", label: "Packing" },
  { value: "TRAVELING", label: "Traveling" },
  { value: "COMPLETED", label: "Completed" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "text-accent-blue",
  PACKING: "text-accent-yellow",
  TRAVELING: "text-accent-green",
  COMPLETED: "text-text-muted",
};

interface Props {
  list: ListWithShares;
}

export function PackingListDetail({ list: initial }: Props) {
  const [list, setList] = useState(initial);
  const [items, setItems] = useState(initial.items);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showShare, setShowShare] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    name: initial.name,
    destination: initial.destination ?? "",
    startDate: initial.startDate ? new Date(initial.startDate).toISOString().split("T")[0] : "",
    endDate: initial.endDate ? new Date(initial.endDate).toISOString().split("T")[0] : "",
    status: initial.status,
  });

  // New item form
  const [newItem, setNewItem] = useState({ name: "", category: "", quantity: 1, bag: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Group items by category
  const grouped = items.reduce<Record<string, PackingListItem[]>>((acc, item) => {
    const key = item.category || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort();
  const existingCategories = [...new Set(items.map((i) => i.category))].sort();
  const existingBags = [...new Set(items.map((i) => i.bag).filter(Boolean))].sort() as string[];

  const { gathered, packed, total } = getProgress(items);
  const isCompleted = list.status === "COMPLETED";

  async function saveHeader() {
    const res = await fetch(`/api/packing/lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: headerForm.name,
        destination: headerForm.destination || null,
        startDate: headerForm.startDate || null,
        endDate: headerForm.endDate || null,
        status: headerForm.status,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setList((l) => ({ ...l, ...data }));
      setEditingHeader(false);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setAddingItem(true);
    const res = await fetch(`/api/packing/lists/${list.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItem.name.trim(),
        category: newItem.category.trim() || "General",
        quantity: newItem.quantity,
        bag: newItem.bag.trim() || null,
        sortOrder: items.length,
      }),
    });
    const data = await res.json();
    setAddingItem(false);
    if (res.ok) {
      setItems((prev) => [...prev, data]);
      setNewItem((n) => ({ ...n, name: "" }));
    }
  }

  const updateItem = useCallback(async (id: string, patch: Partial<PackingListItem>) => {
    const res = await fetch(`/api/packing/lists/${list.id}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
    }
  }, [list.id]);

  const deleteItem = useCallback(async (id: string) => {
    await fetch(`/api/packing/lists/${list.id}/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [list.id]);

  function toggleCategory(cat: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function handleCopy() {
    const name = prompt(`Name for the copy?`, `${list.name} (copy)`);
    if (!name) return;
    const res = await fetch(`/api/packing/lists/${list.id}/copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (res.ok) window.location.href = `/packing/${data.id}`;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-bg-secondary px-6 py-3 flex items-center gap-4 shrink-0">
        <Link href="/packing" className="vscode-btn-ghost p-1">
          <ChevronLeft className="w-4 h-4" />
        </Link>

        {editingHeader ? (
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            <input className="vscode-input w-52" value={headerForm.name} onChange={(e) => setHeaderForm((f) => ({ ...f, name: e.target.value }))} placeholder="Trip name" autoFocus />
            <input className="vscode-input w-40" value={headerForm.destination} onChange={(e) => setHeaderForm((f) => ({ ...f, destination: e.target.value }))} placeholder="Destination" />
            <input type="date" className="vscode-input w-36" value={headerForm.startDate} onChange={(e) => setHeaderForm((f) => ({ ...f, startDate: e.target.value }))} />
            <span className="text-text-muted text-xs">to</span>
            <input type="date" className="vscode-input w-36" value={headerForm.endDate} onChange={(e) => setHeaderForm((f) => ({ ...f, endDate: e.target.value }))} />
            <select className="vscode-input w-32" value={headerForm.status} onChange={(e) => setHeaderForm((f) => ({ ...f, status: e.target.value as typeof headerForm.status }))}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={saveHeader} className="vscode-btn-primary"><Check className="w-4 h-4" /> Save</button>
            <button onClick={() => setEditingHeader(false)} className="vscode-btn-secondary"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-text-bright truncate">{list.name}</h1>
                <span className={cn("text-xs font-medium", STATUS_COLORS[list.status])}>
                  {STATUS_OPTIONS.find((s) => s.value === list.status)?.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                {list.destination && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{list.destination}</span>}
                {list.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(list.startDate)}{list.endDate && ` – ${formatDate(list.endDate)}`}</span>}
                <span>{gathered}/{total} gathered · {packed}/{total} packed</span>
              </div>
            </div>
            <button onClick={() => setEditingHeader(true)} className="vscode-btn-ghost p-1 shrink-0"><Pencil className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Progress bar */}
        {total > 0 && !editingHeader && (
          <div className="w-24 shrink-0">
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${Math.round((packed / total) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-text-muted text-right mt-0.5">{Math.round((packed / total) * 100)}% packed</p>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setShowShare(true)} className="vscode-btn-secondary text-xs">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button onClick={handleCopy} className="vscode-btn-ghost p-1.5" title="Copy list">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Add item */}
          <div className="card">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add item
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", showAddForm && "rotate-180")} />
            </button>
            {showAddForm && (
              <div className="border-t border-border px-4 py-3">
                <form onSubmit={handleAddItem} className="flex items-end gap-2 flex-wrap">
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Item Name *</label>
                    <input className="vscode-input w-44" placeholder="Passport" value={newItem.name} onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))} required autoFocus />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Category</label>
                    <input className="vscode-input w-32" placeholder="Documents" value={newItem.category} onChange={(e) => setNewItem((n) => ({ ...n, category: e.target.value }))} list="item-cats" />
                    <datalist id="item-cats">{existingCategories.map((c) => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Qty</label>
                    <input type="number" min={1} className="vscode-input w-16" value={newItem.quantity} onChange={(e) => setNewItem((n) => ({ ...n, quantity: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-text-muted">Bag</label>
                    <input className="vscode-input w-28" placeholder="Carry-on" value={newItem.bag} onChange={(e) => setNewItem((n) => ({ ...n, bag: e.target.value }))} list="item-bags" />
                    <datalist id="item-bags">{existingBags.map((b) => <option key={b} value={b} />)}</datalist>
                  </div>
                  <button type="submit" disabled={addingItem} className="vscode-btn-primary">
                    {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Items by category */}
          {items.length === 0 ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <Package2 className="w-10 h-10 text-text-muted/30 mb-3" />
              <p className="text-text-muted">No items yet. Add your first item above.</p>
            </div>
          ) : (
            categories.map((category) => {
              const catItems = grouped[category];
              const isCollapsed = collapsed.has(category);
              const catGathered = catItems.filter((i) => i.gathered).length;
              const catPacked = catItems.filter((i) => i.packed).length;

              return (
                <div key={category} className="card overflow-hidden">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary hover:bg-bg-hover transition-colors text-left"
                  >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted flex-1">{category}</span>
                    <span className="text-xs text-text-muted">{catGathered}/{catItems.length} gathered · {catPacked}/{catItems.length} packed</span>
                  </button>

                  {/* Column headers */}
                  {!isCollapsed && (
                    <>
                      <div className="grid items-center px-4 py-1.5 border-b border-border bg-bg-secondary" style={{ gridTemplateColumns: "1fr 48px 96px 80px 80px 200px 200px 32px" }}>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Item</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60 text-center">Qty</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Bag</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60 text-center">Gathered</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60 text-center">Packed</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Pre-trip Notes</span>
                        {isCompleted && <span className="text-[10px] uppercase tracking-wide text-text-muted/60">Post-trip Notes</span>}
                        <span />
                      </div>

                      <div className="divide-y divide-border">
                        {catItems.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            isCompleted={isCompleted}
                            existingBags={existingBags}
                            onUpdate={updateItem}
                            onDelete={deleteItem}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Share dialog */}
      {showShare && (
        <ShareDialog
          list={list}
          onClose={() => setShowShare(false)}
          onUpdate={(updated) => setList((l) => ({ ...l, ...updated }))}
        />
      )}
    </div>
  );
}
