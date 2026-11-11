import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlClasses } from "./input";

// Native select: free keyboard/screen-reader support and the OS picker on mobile.
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(controlClasses, "h-10 appearance-none pr-8", className)} {...props} />
  );
}
