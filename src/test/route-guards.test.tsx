import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import type { AdminUser } from "@/features/admin-auth/schemas";
import { adminKeys } from "@/features/admin-auth/query-keys";
import { authKeys } from "@/features/auth/query-keys";
import type { User } from "@/features/auth/schemas";
import { routeTree } from "@/routeTree.gen";
import { createTestQueryClient, renderRouter } from "./render";

const customer: User = { id: "c1", phone: "+2348012345678", name: "Cara" };
const admin: AdminUser = { id: "a1", phone: "+2348087654321", name: "Ada" };

// Customer and admin sessions are separate; seed each one's cached session (null = signed out).
function visit(path: string, sessions: { customer?: User | null; admin?: AdminUser | null } = {}) {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), sessions.customer ?? null);
  queryClient.setQueryData(adminKeys.session(), sessions.admin ?? null);
  return renderRouter({ routeTree, initialPath: path, queryClient });
}

async function settledLocation(router: ReturnType<typeof visit>["router"]) {
  await waitFor(() => expect(router.state.status).toBe("idle"));
  return router.state.location;
}

describe("customer area", () => {
  it("sends guests to /login and remembers where they were going", async () => {
    const { router } = visit("/account/orders");
    const location = await settledLocation(router);

    expect(location.pathname).toBe("/login");
    expect(location.search).toEqual({ redirect: "/account/orders" });
  });

  it("lets signed-in customers in", async () => {
    const { router } = visit("/account", { customer });
    expect((await settledLocation(router)).pathname).toBe("/account");
  });
});

describe("admin area", () => {
  it.each([
    ["guests", {}],
    ["signed-in customers", { customer }],
  ])("sends %s to the admin login", async (_, sessions) => {
    const { router } = visit("/admin/products", sessions);
    const location = await settledLocation(router);

    expect(location.pathname).toBe("/admin/login");
    expect(location.search).toMatchObject({ redirect: "/admin/products" });
  });

  it("lets admins in", async () => {
    const { router } = visit("/admin/orders", { admin });
    expect((await settledLocation(router)).pathname).toBe("/admin/orders");
  });
});

describe("auth pages", () => {
  it("bounces signed-in users to their redirect target", async () => {
    const { router } = visit("/login?redirect=%2Fcheckout", { customer });
    expect((await settledLocation(router)).pathname).toBe("/checkout");
  });

  it("falls back to the account page and ignores off-site redirects", async () => {
    const { router } = visit("/login?redirect=%2F%2Fevil.example", { customer });
    expect((await settledLocation(router)).pathname).toBe("/account");
  });

  it("sends signed-in admins to the dashboard", async () => {
    const { router } = visit("/admin/login", { admin });
    expect((await settledLocation(router)).pathname).toBe("/admin");
  });
});
