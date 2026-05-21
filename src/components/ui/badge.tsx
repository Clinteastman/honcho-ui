import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-1.5 h-5 text-[11px] font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        neutral: "bg-surface1/80 text-subtext",
        mauve: "bg-mauve/15 text-mauve",
        sapphire: "bg-sapphire/15 text-sapphire",
        green: "bg-green/15 text-green",
        peach: "bg-peach/15 text-peach",
        red: "bg-red/15 text-red",
        outline: "border border-surface1 text-subtext",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
