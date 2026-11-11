import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFound } from "@/components/errors/not-found";
import { ShopHeader } from "@/components/layout/shop-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const Route = createFileRoute("/(shop)")({
  component: ShopLayout,
  notFoundComponent: () => <NotFound homeTo="/products" homeLabel="Back to products" />,
});

function ShopLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ShopHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
