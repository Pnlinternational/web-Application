import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { getErrorMessage, isNotFoundError } from "@/api/errors";
import { logger } from "@/lib/logger";
import { ErrorFallback } from "./error-fallback";
import { NotFound } from "./not-found";

// Loader/render errors for a route. Resetting the query boundary on mount lets
// router.invalidate() re-run loaders against fresh queries instead of cached errors.
export function RouteErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  useEffect(() => {
    logger.error("Route error", { error, path: router.state.location.pathname });
  }, [error, router]);

  if (isNotFoundError(error)) {
    return <NotFound />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <ErrorFallback message={getErrorMessage(error)} onRetry={() => void router.invalidate()} />
    </div>
  );
}
