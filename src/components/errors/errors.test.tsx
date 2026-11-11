import { useSuspenseQuery } from "@tanstack/react-query";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError, NetworkError } from "@/api/errors";
import { orNotFound } from "@/lib/route-errors";
import { renderRouter, renderWithQuery } from "@/test/render";
import { NotFound } from "./not-found";
import { QueryBoundary } from "./query-boundary";
import { RouteErrorComponent } from "./route-error";

beforeEach(() => {
  // React and our logger report caught errors; keep test output readable.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function Product({ load }: { load: () => Promise<string> }) {
  const { data } = useSuspenseQuery({ queryKey: ["product"], queryFn: load });
  return <p>{data}</p>;
}

describe("QueryBoundary", () => {
  it("shows a friendly fallback and refetches on retry", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new NetworkError(new TypeError("offline")))
      .mockResolvedValueOnce("Blue sneakers");

    renderWithQuery(
      <QueryBoundary pending={<p>Loading…</p>}>
        <Product load={load} />
      </QueryBoundary>,
    );

    expect((await screen.findByRole("alert")).textContent).toMatch(/couldn't reach the server/);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("Blue sneakers")).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("route errors", () => {
  function buildTree(loader: () => Promise<unknown>) {
    const rootRoute = createRootRoute({
      component: Outlet,
      errorComponent: RouteErrorComponent,
      notFoundComponent: () => <NotFound />,
    });
    const productRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/products/$slug",
      loader,
      component: () => <p>Product page</p>,
    });
    return rootRoute.addChildren([productRoute]);
  }

  it("renders NotFound when a loader hits an API 404", async () => {
    const missing = new ApiError({ status: 404, message: "No product" });
    renderRouter({
      routeTree: buildTree(() => orNotFound(Promise.reject(missing))),
      initialPath: "/products/x",
    });

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
  });

  it("shows the error with a retry that re-runs the loader", async () => {
    const loader = vi
      .fn<() => Promise<unknown>>()
      .mockRejectedValueOnce(new ApiError({ status: 503, message: "Down" }))
      .mockResolvedValueOnce(null);

    renderRouter({ routeTree: buildTree(loader), initialPath: "/products/x" });

    expect((await screen.findByRole("alert")).textContent).toMatch(/Something went wrong/);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Product page")).toBeTruthy();
  });
});
