import type { ReactNode } from "react";
import { Button } from "@hackert-ui/ui";
import { cn } from "@/lib/cn";

interface ErrorFallbackProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorFallback({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  action,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-divider bg-card p-6 text-center",
        className,
      )}
    >
      <h2 className="text-section">{title}</h2>
      <p className="max-w-prose text-body-sm text-muted">{message}</p>
      <div className="flex gap-2">
        {onRetry ? (
          <Button variant="primary" size="sm" radius="md" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
