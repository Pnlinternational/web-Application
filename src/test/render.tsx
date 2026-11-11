import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  type AnyRoute,
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

export function renderWithQuery(ui: ReactNode, queryClient = createTestQueryClient()) {
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

export function renderRouter<TRoute extends AnyRoute>(options: {
  routeTree: TRoute;
  initialPath: string;
  context?: Record<string, unknown>;
  queryClient?: QueryClient;
}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const router = createRouter({
    routeTree: options.routeTree,
    history: createMemoryHistory({ initialEntries: [options.initialPath] }),
    context: { queryClient, ...options.context },
  });

  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}
