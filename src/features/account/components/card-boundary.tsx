import type { ReactNode } from "react";
import { getErrorMessage } from "@/api/errors";
import { QueryBoundary } from "@/components/errors/query-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { OfflinePendingNote } from "@/components/ui/stale-note";
import { cn } from "@/lib/cn";

/**
 * One overview/list section: its own skeleton while loading and its own error with "Try again",
 * so one failing request doesn't blank the page.
 */
export function CardBoundary({
  children,
  label,
  skeletonClassName = "h-28",
}: {
  children: ReactNode;
  /** Names the section in the error message, e.g. "your wallet". */
  label: string;
  skeletonClassName?: string;
}) {
  return (
    <QueryBoundary
      pending={
        <div className="flex flex-col gap-1.5" aria-busy="true">
          <Skeleton className={cn("w-full rounded-xl", skeletonClassName)} />
          <OfflinePendingNote />
        </div>
      }
      renderError={({ error, resetErrorBoundary }) => (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-4.5"
        >
          <div className="min-w-0">
            <p className="font-semibold">We couldn't load {label}</p>
            <p className="text-caption text-muted">{getErrorMessage(error)}</p>
          </div>
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="h-11 rounded-md bg-tint px-4 text-label text-primary transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-divider active:scale-[0.97]"
          >
            Try again
          </button>
        </div>
      )}
    >
      {children}
    </QueryBoundary>
  );
}
