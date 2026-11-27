import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/api/api";
import { authKeys } from "@/features/auth/query-keys";
import { routeTree } from "@/routeTree.gen";
import {
  customer,
  PRELOAD_TIMEOUT,
  preloadRouteChunks,
  ROUTE_TEST_TIMEOUT,
  SLOW,
  visitAccount,
} from "./account";
import { errorBody, installFakeAdapter, type Reply, requestsTo } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

let fake: ReturnType<typeof installFakeAdapter> | undefined;

vi.setConfig({ testTimeout: ROUTE_TEST_TIMEOUT });

beforeAll(preloadRouteChunks, PRELOAD_TIMEOUT);

afterEach(() => {
  fake?.restore();
  fake = undefined;
});

async function settled(router: { state: { status: string } }) {
  await waitFor(() => expect(router.state.status).toBe("idle"), SLOW);
}

describe("signed-in account pages", () => {
  it.each([
    "/account/profile",
    "/account/addresses",
    "/account/addresses/new",
    "/account/security",
    "/account/notifications",
  ])("send guests from %s to sign in and remember the page", async (path) => {
    const { router } = visitAccount(path, null);
    await settled(router);

    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toEqual({ redirect: path });
  });

  it("bring a customer back to that page after signing in", async () => {
    const { router } = visitAccount("/login?redirect=%2Faccount%2Faddresses", customer);
    await settled(router);

    expect(router.state.location.pathname).toBe("/account/addresses");
  });
});

describe("/account", () => {
  it("shows guests the sign-in hero, returning to /account afterwards", async () => {
    visitAccount("/account", null);

    expect(await screen.findByRole("heading", { name: "Your account" }, SLOW)).toBeTruthy();
    const signIn = screen.getByRole("link", { name: "Sign in" });
    expect(signIn.getAttribute("href")).toBe("/login?redirect=%2Faccount");
    expect(screen.queryByRole("region", { name: "Wallet" })).toBeNull();
  });

  it("shows signed-in customers their overview", async () => {
    visitAccount("/account", customer);

    const wallet = await screen.findByRole("region", { name: "Wallet" }, SLOW);
    expect(within(wallet).getByText("₦24,500")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Hello, Ada" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  });

  it("claims neither state while the session check fails, and offers a retry", async () => {
    fake = installFakeAdapter(api, {
      "auth/refresh": [{ status: 500, data: errorBody("internal", "Something broke") }],
    });
    renderRouter({ routeTree, initialPath: "/account", queryClient: createTestQueryClient() });

    expect(await screen.findByText("We couldn't load your account", {}, SLOW)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Your account" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Wallet" })).toBeNull();
  });
});

describe("sign out", () => {
  async function signOut(logoutReply: Reply, path = "/account") {
    fake = installFakeAdapter(api, { "auth/logout": [logoutReply] });
    const view = visitAccount(path, customer);
    const user = userEvent.setup();

    const [button] = await screen.findAllByRole("button", { name: "Sign out" }, SLOW);
    await user.click(button as HTMLElement);
    const dialog = await screen.findByRole("alertdialog", { name: "Sign out?" });
    await user.click(within(dialog).getByRole("button", { name: "Sign out" }));
    return view;
  }

  it.each<[string, Reply]>([
    ["succeeds", { status: 204 }],
    ["fails on the server", { status: 500, data: errorBody("internal") }],
    ["can't reach the server", new AxiosError("Network Error", "ERR_NETWORK")],
  ])("shows the guest Account when the call %s", async (_, reply) => {
    const { queryClient, router } = await signOut(reply, "/account/security");

    expect(await screen.findByRole("heading", { name: "Your account" }, SLOW)).toBeTruthy();
    expect(router.state.location.pathname).toBe("/account");
    expect(queryClient.getQueryData(authKeys.session())).toBeNull();
    expect(requestsTo(fake?.sent ?? [], "auth/logout")).toHaveLength(1);
  });

  it("asks first: cancelling keeps the customer signed in", async () => {
    fake = installFakeAdapter(api, {});
    visitAccount("/account", customer);
    const user = userEvent.setup();

    const [button] = await screen.findAllByRole("button", { name: "Sign out" }, SLOW);
    await user.click(button as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(requestsTo(fake.sent, "auth/logout")).toHaveLength(0);
    expect(screen.getByRole("region", { name: "Wallet" })).toBeTruthy();
  });
});
