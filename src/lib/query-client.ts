import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, isRetryableError } from "@/api/errors";
import { logger } from "./logger";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Skip the global error toast; the caller renders the error itself (e.g. form field errors). */
      silent?: boolean;
    };
  }
}

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown) {
  return failureCount < MAX_RETRIES && isRetryableError(error);
}

export interface QueryClientOptions {
  /** Surfaces errors the user can't otherwise see (toast). */
  notifyError: (message: string) => void;
}

export function createQueryClient({ notifyError }: QueryClientOptions) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        logger.error("Query failed", { queryKey: query.queryKey, error });
        // First-load failures render in an error boundary; only toast when stale data is
        // still on screen and a background refetch failed.
        if (query.state.data !== undefined) {
          notifyError(getErrorMessage(error));
        }
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _onMutateResult, mutation) {
        logger.error("Mutation failed", { mutationKey: mutation.options.mutationKey, error });
        if (!mutation.meta?.silent) {
          notifyError(getErrorMessage(error));
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
      },
      // Safe because every POST carries an Idempotency-Key that retries reuse (api/idempotency.ts).
      mutations: {
        retry: shouldRetry,
      },
    },
  });
}

/** App-wide client; tests build their own with createQueryClient/createTestQueryClient. */
export const queryClient = createQueryClient({ notifyError: (message) => toast.error(message) });
