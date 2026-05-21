import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn-style classname merger. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a count with thousands separators. */
export function formatCount(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-GB").format(n);
}

/** Truncate to N chars with a single ellipsis. */
export function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}

/** Generate a stable, short-ish ID for client-only things like dialogs. */
export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Tiny deep-clone for JSON-safe values. */
export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}
