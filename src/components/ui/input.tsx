import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Adds left padding when an icon is rendered absolutely positioned before. */
  hasLeftIcon?: boolean;
  /** Use monospace font (good for tokens, IDs). */
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, hasLeftIcon, mono, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-surface0/60 px-3 py-2 text-sm",
          "placeholder:text-muted",
          "transition-colors duration-150 ease-[var(--ease-out-quart)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus-visible:outline-none focus-visible:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          mono && "font-mono tracking-tight",
          hasLeftIcon && "pl-10",
          invalid
            ? "border-red/60 focus-visible:ring-red focus-visible:border-red"
            : "border-surface1 focus-visible:ring-mauve focus-visible:border-mauve",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
