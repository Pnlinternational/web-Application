import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { logger } from "@/lib/logger";
import { ErrorFallback } from "./error-fallback";

// Last resort for crashes outside the router (providers, router itself).
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, info) =>
        logger.error("App crashed", { error, componentStack: info.componentStack })
      }
      fallbackRender={() => (
        <div className="grid min-h-dvh place-items-center p-4">
          <ErrorFallback
            message="The app hit an unexpected error. Reloading usually fixes it."
            retryLabel="Reload"
            onRetry={() => window.location.reload()}
          />
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
