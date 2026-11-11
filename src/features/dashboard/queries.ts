import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { dashboardKeys } from "./query-keys";
import { getDashboardService } from "./services";

export function dashboardStatsQueryOptions() {
  const { getDashboardStats } = getDashboardService();
  return queryOptions({
    queryKey: dashboardKeys.stats(),
    queryFn: ({ signal }) => getDashboardStats(signal),
  });
}

export function useDashboardStats() {
  return useSuspenseQuery(dashboardStatsQueryOptions());
}
