import type { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/errors/not-found";
import { RouteErrorComponent } from "@/components/errors/route-error";
import { Spinner } from "@/components/ui/spinner";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
  queryClient: QueryClient;
}

function DefaultPending() {
  return (
    <div className="grid min-h-48 place-items-center text-muted-foreground">
      <Spinner />
    </div>
  );
}

export function createAppRouter(context: RouterContext) {
  return createRouter({
    routeTree,
    context,
    defaultPreload: "intent",
    // React Query owns caching; let preloads always hit it instead of the router cache.
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteErrorComponent,
    defaultNotFoundComponent: () => <NotFound />,
    defaultPendingComponent: DefaultPending,
    scrollRestoration: true,
  });
}

/** App-wide router; the API layer imports it lazily to redirect on auth failure. */
export const router = createAppRouter({ queryClient });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
