import "@fontsource/bricolage-grotesque/500.css";
import "@fontsource/bricolage-grotesque/600.css";
import "@fontsource/bricolage-grotesque/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import { AppProvider } from "@hackert-ui/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@/components/errors/app-error-boundary";
import { ThemeVariables } from "@/components/theme/theme-variables";
import { logger } from "@/lib/logger";
import { queryClient } from "@/lib/query-client";
import { PNL_THEME } from "@/lib/ui-theme";
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
    <AppProvider theme={PNL_THEME}>
      <ThemeVariables />
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AppErrorBoundary>
    </AppProvider>
  </StrictMode>,
);
