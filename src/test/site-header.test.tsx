import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/api/api";
import { authKeys } from "@/features/auth/query-keys";
import type { User } from "@/features/auth/schemas";
import { routeTree } from "@/routeTree.gen";
import { errorBody, installFakeAdapter } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

const customer: User = {
  id: "c1",
  phone: "+2348012345678",
  market: "NG",
  created_at: "2026-01-01T00:00:00Z",
};

function visit(path: string, session: User | null) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), session);
  return renderRouter({ routeTree, initialPath: path, queryClient });
}

describe.each(["/", "/cart"])("header on %s", (path) => {
  it("links signed-in customers to their account instead of sign in", async () => {
    visit(path, customer);

    const account = await screen.findByRole("link", { name: "Account" });
    expect(account.getAttribute("href")).toBe("/account");
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("offers guests sign in", async () => {
    visit(path, null);

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
  });
});

describe("header when the session check fails", () => {
  let fake: ReturnType<typeof installFakeAdapter>;

  afterEach(() => {
    fake.restore();
  });

  it("shows neither sign in nor account on a server error", async () => {
    fake = installFakeAdapter(api, {
      "auth/refresh": [{ status: 500, data: errorBody("internal", "Something broke") }],
    });
    const queryClient = createTestQueryClient();
    renderRouter({ routeTree, initialPath: "/", queryClient });

    await waitFor(() =>
      expect(queryClient.getQueryState(authKeys.session())?.status).toBe("error"),
    );

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Account" })).toBeNull();
  });
});
