import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — used wherever a list, search, or detail has no content yet.
 * Designed to set expectations rather than look like an error.
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 py-16 px-8",
        "rounded-xl border border-dashed border-surface1/60 bg-mantle/30",
        className,
      )}
    >
      {icon && (
        <div className="grid place-items-center size-12 rounded-full bg-surface1/60 text-subtext">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-sm">
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="text-xs text-subtext leading-relaxed">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

/** Spinner — small, considered, accessible. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 rounded-full border-2 border-surface2 border-t-mauve animate-spin",
        className,
      )}
    />
  );
}

/** Skeleton — block-level placeholder during data fetches. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface1/40",
        className,
      )}
    />
  );
}
