"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, ChevronLeft, GripVertical, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DefaultPackingItem } from "@prisma/client";

interface Props {
  items: DefaultPackingItem[];
}

const inlineInputClass =
  "bg-transparent truncate rounded px-1 py-0.5 -mx-1 border border-transparent " +
  "hover:border-border focus:border-border-focus focus:bg-bg-tertiary focus:outline-none transition-colors";

function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.currentTarget.blur();
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
  return value;
}

function itemsToCsv(items: DefaultPackingItem[]): string {
  const lines = [
    "name,category",
    ...items.map((i) => `${csvEscape(i.name)},${csvEscape(i.category)}`),
  ];
  return lines.join("\n");
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.length > 0)) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
  }
  return rows;
}

function parseDefaultItemsCsv(text: string): { name: string; category: string }[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const catIdx = header.indexOf("category");
  const hasHeader = nameIdx !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const nameCol = hasHeader ? nameIdx : 0;
  const catCol = hasHeader && catIdx !== -1 ? catIdx : 1;
  return dataRows
    .map((r) => ({
      name: (r[nameCol] ?? "").trim(),
      category: (r[catCol] ?? "").trim() || "General",
    }))
    .filter((r) => r.name.length > 0);
}

interface RowProps {
  item: DefaultPackingItem;
  onUpdate: (id: string, patch: Partial<DefaultPackingItem>) => Promise<void>;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function DefaultItemRow({ item, onUpdate, onDelete, deleting }: RowProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) { setName(item.name); return; }
    if (trimmed === item.name) return;
    await onUpdate(item.id, { name: trimmed });
  }

  async function saveCategory() {
    const trimmed = category.trim();
    if (!trimmed) { setCategory(item.category); return; }
    if (trimmed === item.category) return;
    await onUpdate(item.id, { category: trimmed });
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 group">
      <GripVertical className="w-4 h-4 text-text-muted/30 shrink-0" />
      <input
        className={cn(inlineInputClass, "flex-1 text-sm text-text")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={blurOnEnter}
      />
      <input
        className={cn(inlineInputClass, "w-32 text-sm text-text-muted")}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        onBlur={saveCategory}
        onKeyDown={blurOnEnter}
        list="categories"
      />
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          className="vscode-btn-ghost p-1 hover:text-status-error"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function DefaultsClient({ items: initial }: Props) {
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const updateItem = async (id: string, patch: Partial<DefaultPackingItem>) => {
    const res = await fetch(`/api/packing/defaults/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? data : i)));
    }
  };

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/packing/defaults/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  function handleExport() {
    const csv = itemsToCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "default-packing-items.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const text = await file.text();
    const parsed = parseDefaultItemsCsv(text);
    if (parsed.length === 0) return;

    setImporting(true);
    const res = await fetch("/api/packing/defaults/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: parsed }),
    });
    setImporting(false);
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, ...created]);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/packing" className="vscode-btn-ghost p-1">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-text-bright">Default Items</h1>
          <p className="text-sm text-text-muted">These items are added to every new packing list</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImportFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="vscode-btn-secondary text-xs"
        >
          {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Import CSV
        </button>
        <button onClick={handleExport} disabled={items.length === 0} className="vscode-btn-secondary text-xs">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
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
          <p className="text-text-muted/60 text-sm mt-1">Add items above, or import a CSV, to auto-populate new packing lists.</p>
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
                  <DefaultItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateItem}
                    onDelete={handleDelete}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
