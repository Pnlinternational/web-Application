import { resetMockBackend } from "@/features/account/mock-backend";
import { authKeys } from "@/features/auth/query-keys";
import type { User } from "@/features/auth/schemas";
import { guestFavourites } from "@/features/favourites/guest-store";
import type { Favourite } from "@/features/favourites/schemas";
import { routeTree } from "@/routeTree.gen";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { createTestQueryClient, renderRouter } from "./render";

export const customer: User = {
  id: "c1",
  phone: "+2348031234567",
  market: "NG",
  created_at: "2026-01-01T00:00:00Z",
};

/** Fresh mock data, browser storage and query cache; `session` null = guest. */
export function visitAccount(
  path: string,
  session: User | null,
  { savedInBrowser = [] }: { savedInBrowser?: Favourite[] } = {},
) {
  resetMockBackend();
  window.localStorage.clear();
  guestFavourites.reload();
  if (savedInBrowser.length > 0) guestFavourites.write(savedInBrowser);
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), session);
  return renderRouter({ routeTree, initialPath: path, queryClient });
}

/** findBy* with room for code-split route chunks to load under a busy (parallel) test run. */
export const SLOW = { timeout: 10_000 };

/** Full-route tests render the whole app; under a parallel run the default 5s is too tight. */
export const ROUTE_TEST_TIMEOUT = 15_000;

/**
 * Loads every code-split route chunk once (use in beforeAll). Their first transform can take
 * seconds on a busy run, which otherwise lands inside the first test's timeout.
 */
export async function preloadRouteChunks() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory(),
    context: { queryClient: createTestQueryClient() },
  });
  await Promise.all(
    Object.values(router.routesById).map((route) => Promise.resolve(router.loadRouteChunk(route))),
  );
}

export const PRELOAD_TIMEOUT = 60_000;
