import { useOnline } from "@/lib/use-online";
import { cn } from "@/lib/cn";

/**
 * Shown under data that may be out of date: offline, or the last background refresh failed
 * (cached data stays on screen).
 */
export function StaleNote({
  refetchFailed,
  className,
}: {
  refetchFailed: boolean;
  className?: string;
}) {
  const online = useOnline();
  if (online && !refetchFailed) return null;

  return (
    <p role="status" className={cn("text-caption text-muted", className)}>
      {online
        ? "We couldn't refresh this. It may be out of date."
        : "You're offline. This may be out of date."}
    </p>
  );
}

/** Pending state for a card: a skeleton, plus a note when it can't load because we're offline. */
export function OfflinePendingNote() {
  const online = useOnline();
  if (online) return null;
  return (
    <p role="status" className="text-caption text-muted">
      You're offline. This will load when you're back online.
    </p>
  );
}
