"use client";

import { useRef, useState } from "react";

const CUSTOM = "__custom__";

interface Props {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

// Dropdown of bags with a "Custom bag…" escape hatch for one-time bags.
// An empty string means no bag.
export function BagSelect({ value, options, onChange, className }: Props) {
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState("");
  const cancelled = useRef(false);

  // Keep a current value that isn't in the options (legacy or one-time bag) selectable
  const allOptions = value && !options.includes(value) ? [...options, value] : options;

  function commit() {
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const trimmed = draft.trim();
    setCustom(false);
    if (trimmed && trimmed !== value) onChange(trimmed);
  }

  if (custom) {
    return (
      <input
        className={className}
        placeholder="Custom bag"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancelled.current = true;
            setCustom(false);
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => {
        if (e.target.value === CUSTOM) {
          setDraft("");
          setCustom(true);
        } else {
          onChange(e.target.value);
        }
      }}
      aria-label="Bag"
    >
      <option value="">No bag</option>
      {allOptions.map((b) => (
        <option key={b} value={b}>{b}</option>
      ))}
      <option value={CUSTOM}>+ Custom bag…</option>
    </select>
  );
}
