import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/api/api";
import { authKeys } from "@/features/auth/query-keys";
import { routeTree } from "@/routeTree.gen";
import { errorBody, installFakeAdapter } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

vi.mock("@/features/products/constants", () => ({ CATALOGUE_LIVE: true }));

let fake: ReturnType<typeof installFakeAdapter>;

afterEach(() => {
  fake.restore();
});

describe("/products once the catalogue is live", () => {
  it("reports a 404 as not found instead of coming soon", async () => {
    fake = installFakeAdapter(api, {
      "products?page=1&pageSize=20": [
        { status: 404, data: errorBody("not_found", "resource not found") },
      ],
    });
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.session(), null);
    renderRouter({ routeTree, initialPath: "/products", queryClient });

    expect(await screen.findByText("Page not found")).toBeTruthy();
    expect(screen.queryByText("Products are coming soon")).toBeNull();
  });
});
