import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export function getProgress(items: { gathered: boolean; packed: boolean }[]) {
  if (items.length === 0) return { gathered: 0, packed: 0, total: 0 };
  const gathered = items.filter((i) => i.gathered).length;
  const packed = items.filter((i) => i.packed).length;
  return { gathered, packed, total: items.length };
}
