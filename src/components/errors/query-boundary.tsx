import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { getErrorMessage } from "@/api/errors";
import { logger } from "@/lib/logger";
import { ErrorFallback } from "./error-fallback";

interface QueryBoundaryProps {
  children: ReactNode;
  /** Suspense fallback while suspense queries load. */
  pending?: ReactNode;
  /** Custom error UI; defaults to ErrorFallback with a retry button. */
  renderError?: (props: FallbackProps) => ReactNode;
  /** Resets the boundary when these change (e.g. route params). */
  resetKeys?: unknown[];
}

function DefaultQueryError({ error, resetErrorBoundary }: FallbackProps) {
  return <ErrorFallback message={getErrorMessage(error)} onRetry={resetErrorBoundary} />;
}

// Wrap independent widgets so one failing query doesn't blank the whole page.
// Resetting the boundary also resets failed queries, so "Try again" refetches them.
export function QueryBoundary({
  children,
  pending = null,
  renderError,
  resetKeys,
}: QueryBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      resetKeys={resetKeys}
      onError={(error) => logger.error("QueryBoundary caught", { error })}
      fallbackRender={renderError ?? DefaultQueryError}
    >
      <Suspense fallback={pending}>{children}</Suspense>
    </ErrorBoundary>
  );
}
