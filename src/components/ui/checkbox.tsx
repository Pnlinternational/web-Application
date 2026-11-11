import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-border accent-primary", className)}
      {...props}
    />
  );
}
