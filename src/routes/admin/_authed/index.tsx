import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { QueryBoundary } from "@/components/errors/query-boundary";
import { StatsCards, StatsCardsSkeleton } from "@/features/dashboard/components/stats-cards";
import { dashboardStatsQueryOptions } from "@/features/dashboard/queries";

export const Route = createFileRoute("/admin/_authed/")({
  // Start the request during navigation, but don't block the page on it: the widget
  // suspends on its own and fails inside its QueryBoundary, not the whole route.
  loader: ({ context }) => {
    void context.queryClient.query(dashboardStatsQueryOptions()).catch(noop);
  },
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <QueryBoundary pending={<StatsCardsSkeleton />}>
        <StatsCards />
      </QueryBoundary>
    </div>
  );
}
