"use client";

import { useState } from "react";
import { Trash2, Loader2, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingListItem } from "@prisma/client";

interface Props {
  item: PackingListItem;
  isCompleted: boolean;
  existingBags: string[];
  onUpdate: (id: string, patch: Partial<PackingListItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const inlineInputClass =
  "w-full bg-transparent truncate rounded px-1 py-0.5 -mx-1 border border-transparent " +
  "hover:border-border focus:border-border-focus focus:bg-bg-tertiary focus:outline-none transition-colors";

function blurOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") e.currentTarget.blur();
}

export function ItemRow({ item, isCompleted, existingBags, onUpdate, onDelete }: Props) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [bag, setBag] = useState(item.bag ?? "");
  const [preTripNotes, setPreTripNotes] = useState(item.preTripNotes ?? "");
  const [postTripNotes, setPostTripNotes] = useState(item.postTripNotes ?? "");
  const [deleting, setDeleting] = useState(false);
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

  async function saveBag() {
    const trimmed = bag.trim();
    if (trimmed === (item.bag ?? "")) return;
    await onUpdate(item.id, { bag: trimmed || null });
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

  async function handleDelete() {
    setDeleting(true);
    await onDelete(item.id);
  }

  const cols = isCompleted
    ? "1fr 48px 96px 80px 80px 200px 200px 32px"
    : "1fr 48px 96px 80px 80px 200px 32px";

  return (
    <div
      className={cn(
        "grid items-center px-4 py-2 gap-2 group hover:bg-bg-hover transition-colors",
        item.packed && "opacity-60"
      )}
      style={{ gridTemplateColumns: cols }}
    >
      {/* Name */}
      <input
        className={cn(inlineInputClass, "text-sm text-text", item.packed && "line-through text-text-muted")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={blurOnEnter}
      />

      {/* Qty */}
      <input
        type="number"
        min={1}
        className={cn(inlineInputClass, "text-xs text-text-muted text-center")}
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        onBlur={saveQuantity}
        onKeyDown={blurOnEnter}
      />

      {/* Bag */}
      <input
        className={cn(inlineInputClass, "text-xs text-text-muted")}
        placeholder="—"
        value={bag}
        onChange={(e) => setBag(e.target.value)}
        onBlur={saveBag}
        onKeyDown={blurOnEnter}
        list={`bag-options-${item.id}`}
      />
      <datalist id={`bag-options-${item.id}`}>
        {existingBags.map((b) => <option key={b} value={b} />)}
      </datalist>

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
      <input
        className={cn(inlineInputClass, "text-xs text-text-muted")}
        placeholder="—"
        value={preTripNotes}
        onChange={(e) => setPreTripNotes(e.target.value)}
        onBlur={savePreTripNotes}
        onKeyDown={blurOnEnter}
      />

      {/* Post-trip notes (completed only) */}
      {isCompleted && (
        <input
          className={cn(inlineInputClass, "text-xs text-text-muted")}
          placeholder="—"
          value={postTripNotes}
          onChange={(e) => setPostTripNotes(e.target.value)}
          onBlur={savePostTripNotes}
          onKeyDown={blurOnEnter}
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleDelete} disabled={deleting} className="vscode-btn-ghost p-1 hover:text-status-error">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
