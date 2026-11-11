import { cn } from "@/lib/cn";

// Fast rotation reads as "fast loading" (perceived performance).
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:600ms]",
        className,
      )}
    />
  );
}
