import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";
import { CardBoundary } from "@/features/account/components/card-boundary";
import { NotificationsCenter } from "@/features/notifications/components/notifications-center";

// The tab lives in the URL (?tab=wallet) so back and refresh keep it.
const searchSchema = z.object({
  tab: z.enum(["all", "orders", "wallet", "support", "promotions"]).default("all").catch("all"),
});

export const Route = createFileRoute("/(account)/account/_authed/notifications")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams({ tab: "all" })] },
  head: () => ({ meta: [{ title: "Notifications — PNL Store" }] }),
  staticData: { account: { title: "Notifications", mobileBar: "back" } },
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = Route.useRouteContext();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <CardBoundary label="your notifications" skeletonClassName="h-80">
      <NotificationsCenter
        user={user}
        tab={tab}
        onTabChange={(next) => void navigate({ search: { tab: next }, replace: true })}
      />
    </CardBoundary>
  );
}
