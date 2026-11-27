import { cn } from "@/lib/cn";

/** Decorative rings + red arc on navy (shared with the guest hero). */
export function Arcs({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 300 300"
      fill="none"
      className={cn("pointer-events-none absolute -top-20 -right-28 size-75", className)}
    >
      <circle cx="150" cy="150" r="96" stroke="currentColor" strokeOpacity="0.08" strokeWidth="2" />
      <circle
        cx="150"
        cy="150"
        r="146"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="2"
      />
      <path d="M54 150a96 96 0 0 0 96 96" className="stroke-secondary" strokeWidth="8" />
    </svg>
  );
}
