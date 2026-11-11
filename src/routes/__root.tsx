import { createRootRouteWithContext, HeadContent, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import type { RouterContext } from "@/router";

// Devtools are dev-only and lazy so they never reach the production bundle.
const Devtools = import.meta.env.DEV ? lazy(() => import("@/components/devtools")) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <HeadContent />
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  );
}
