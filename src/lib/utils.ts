import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  // Trip dates are stored as midnight UTC, so format in UTC to avoid showing the previous day
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// Parses a quantity field's text; null when empty or not a whole number >= 0
export function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : null;
}

export function getProgress(items: { gathered: boolean; packed: boolean }[]) {
  if (items.length === 0) return { gathered: 0, packed: 0, total: 0 };
  const gathered = items.filter((i) => i.gathered).length;
  const packed = items.filter((i) => i.packed).length;
  return { gathered, packed, total: items.length };
}
