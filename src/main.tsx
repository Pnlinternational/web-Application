import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary";
import { logger } from "@/lib/logger";
import { queryClient } from "@/lib/query-client";
import { router } from "./router";
import "./styles/app.css";

window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", { reason: event.reason });
});

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Root element #app not found in index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
