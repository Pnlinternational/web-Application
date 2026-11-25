import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/api/api";
import { authKeys } from "@/features/auth/query-keys";
import { routeTree } from "@/routeTree.gen";
import { errorBody, installFakeAdapter, type Reply } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

const productsUrl = "products?page=1&pageSize=20";
let fake: ReturnType<typeof installFakeAdapter>;

function visitProducts(reply: Reply) {
  fake = installFakeAdapter(api, { [productsUrl]: [reply] });
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), null);
  return renderRouter({ routeTree, initialPath: "/products", queryClient });
}

afterEach(() => {
  fake.restore();
});

describe("/products", () => {
  it("says products are coming soon while the API has no catalogue", async () => {
    visitProducts({ status: 404, data: errorBody("not_found", "resource not found") });

    expect(await screen.findByRole("heading", { name: "Products are coming soon" })).toBeTruthy();
    expect(screen.queryByText("Page not found")).toBeNull();
  });

  it("still reports other failures as errors", async () => {
    visitProducts({ status: 500, data: errorBody("internal", "Something broke") });

    expect(await screen.findByRole("button", { name: /try again/i })).toBeTruthy();
    expect(screen.queryByText("Products are coming soon")).toBeNull();
  });
});
