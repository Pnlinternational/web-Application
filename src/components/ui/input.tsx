import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const controlClasses =
  "w-full rounded-md border border-border bg-background px-3 text-sm transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-50 aria-invalid:border-danger aria-invalid:ring-danger/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClasses, "h-10", className)} {...props} />;
}
