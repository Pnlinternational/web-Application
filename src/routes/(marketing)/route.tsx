import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/(marketing)")({
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
