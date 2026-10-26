"use client";

import { useState } from "react";
import { Pencil, Loader2, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingListItem } from "@prisma/client";
import { BagSelect } from "./BagSelect";
import { EditItemDialog } from "./EditItemDialog";

interface Props {
  item: PackingListItem;
  isCompleted: boolean;
  bagOptions: string[];
  categoryOptions: string[];
  onUpdate: (id: string, patch: Partial<PackingListItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const inlineInputClass =
  "w-full bg-transparent truncate rounded px-1 py-0.5 -mx-1 border border-transparent " +
  "hover:border-border focus:border-border-focus focus:bg-bg-tertiary focus:outline-none transition-colors";

// Phones: stacked row (checkboxes, name, qty, edit / bag / notes). lg+: one table row.
export function itemGridClass(isCompleted: boolean) {
  return cn(
    "grid-cols-[24px_24px_minmax(0,1fr)_minmax(0,1fr)_44px_28px]",
    isCompleted
      ? "lg:grid-cols-[1fr_48px_96px_80px_80px_200px_200px_32px]"
      : "lg:grid-cols-[1fr_48px_96px_80px_80px_200px_32px]"
  );
}

function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.currentTarget.blur();
}

export function ItemRow({ item, isCompleted, bagOptions, categoryOptions, onUpdate, onDelete }: Props) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [bag, setBag] = useState(item.bag ?? "");
  const [preTripNotes, setPreTripNotes] = useState(item.preTripNotes ?? "");
  const [postTripNotes, setPostTripNotes] = useState(item.postTripNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  async function toggleField(field: "gathered" | "packed") {
    setSavingField(field);
    await onUpdate(item.id, { [field]: !item[field] });
    setSavingField(null);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(item.name);
      return;
    }
    if (trimmed === item.name) return;
    await onUpdate(item.id, { name: trimmed });
  }

  async function saveQuantity() {
    const q = Number.isFinite(quantity) && quantity >= 1 ? quantity : item.quantity;
    setQuantity(q);
    if (q === item.quantity) return;
    await onUpdate(item.id, { quantity: q });
  }

  async function saveBag(next: string) {
    setBag(next);
    if (next === (item.bag ?? "")) return;
    await onUpdate(item.id, { bag: next || null });
  }

  async function savePreTripNotes() {
    const trimmed = preTripNotes.trim();
    if (trimmed === (item.preTripNotes ?? "")) return;
    await onUpdate(item.id, { preTripNotes: trimmed || null });
  }

  async function savePostTripNotes() {
    const trimmed = postTripNotes.trim();
    if (trimmed === (item.postTripNotes ?? "")) return;
    await onUpdate(item.id, { postTripNotes: trimmed || null });
  }

  async function saveEdit(patch: { name: string; category: string }) {
    setName(patch.name);
    if (patch.name === item.name && patch.category === item.category) return;
    await onUpdate(item.id, patch);
  }

  return (
    <div
      className={cn(
        "grid items-center px-4 py-2 gap-x-2 gap-y-1 group hover:bg-bg-hover transition-colors",
        itemGridClass(isCompleted),
        item.packed && "opacity-60"
      )}
    >
      {/* Name */}
      <input
        className={cn(inlineInputClass, "order-3 col-span-2 lg:order-none lg:col-span-1 text-sm text-text", item.packed && "line-through text-text-muted")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={blurOnEnter}
      />

      {/* Qty */}
      <input
        type="number"
        min={1}
        className={cn(inlineInputClass, "order-4 lg:order-none text-xs text-text-muted text-center")}
        aria-label="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        onBlur={saveQuantity}
        onKeyDown={blurOnEnter}
      />

      {/* Bag */}
      <BagSelect
        className={cn(inlineInputClass, "order-6 col-start-3 col-span-4 lg:order-none lg:col-start-auto lg:col-span-1 text-xs text-text-muted cursor-pointer")}
        value={bag}
        options={bagOptions}
        onChange={saveBag}
      />

      {/* Gathered */}
      <button
        onClick={() => toggleField("gathered")}
        disabled={savingField === "gathered"}
        className="order-1 lg:order-none flex justify-center text-text-muted hover:text-accent-green transition-colors"
        aria-label="Gathered"
      >
        {savingField === "gathered" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : item.gathered ? (
          <CheckSquare className="w-4 h-4 text-accent-green" />
        ) : (
          <Square className="w-4 h-4 text-accent-green/50 lg:text-inherit" />
        )}
      </button>

      {/* Packed */}
      <button
        onClick={() => toggleField("packed")}
        disabled={savingField === "packed"}
        className="order-2 lg:order-none flex justify-center text-text-muted hover:text-accent-blue transition-colors"
        aria-label="Packed"
      >
        {savingField === "packed" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : item.packed ? (
          <CheckSquare className="w-4 h-4 text-accent-blue" />
        ) : (
          <Square className="w-4 h-4 text-accent-blue/50 lg:text-inherit" />
        )}
      </button>

      {/* Pre-trip notes */}
      <input
        className={cn(inlineInputClass, "order-7 col-start-3 col-span-4 lg:order-none lg:col-start-auto lg:col-span-1 text-xs text-text-muted")}
        placeholder="Pre-trip notes"
        value={preTripNotes}
        onChange={(e) => setPreTripNotes(e.target.value)}
        onBlur={savePreTripNotes}
        onKeyDown={blurOnEnter}
      />

      {/* Post-trip notes (completed only) */}
      {isCompleted && (
        <input
          className={cn(inlineInputClass, "order-8 col-start-3 col-span-4 lg:order-none lg:col-start-auto lg:col-span-1 text-xs text-text-muted")}
          placeholder="Post-trip notes"
          value={postTripNotes}
          onChange={(e) => setPostTripNotes(e.target.value)}
          onBlur={savePostTripNotes}
          onKeyDown={blurOnEnter}
        />
      )}

      {/* Actions */}
      <div className="order-5 lg:order-none flex items-center justify-end reveal-on-hover">
        <button onClick={() => setEditing(true)} className="vscode-btn-ghost p-1" title="Edit item">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {editing && (
        <EditItemDialog
          item={item}
          categoryOptions={categoryOptions}
          onSave={saveEdit}
          onDelete={() => onDelete(item.id)}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
