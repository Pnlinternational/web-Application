import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { editMockDb } from "@/features/account/mock-backend";
import {
  customer,
  PRELOAD_TIMEOUT,
  preloadRouteChunks,
  ROUTE_TEST_TIMEOUT,
  SLOW,
  visitAccount,
} from "./account";

vi.setConfig({ testTimeout: ROUTE_TEST_TIMEOUT });

beforeAll(preloadRouteChunks, PRELOAD_TIMEOUT);

function rows() {
  return within(screen.getByRole("tabpanel")).queryAllByRole("button");
}

describe("Notifications", () => {
  it("filters by group tab and keeps the tab in the URL", async () => {
    const { router } = visitAccount("/account/notifications", customer);
    const user = userEvent.setup();

    await screen.findByRole("tab", { name: "All", selected: true }, SLOW);
    expect(rows()).toHaveLength(6);

    await user.click(screen.getByRole("tab", { name: "Wallet" }));

    expect(screen.getByRole("tab", { name: "Wallet", selected: true })).toBeTruthy();
    expect(rows().map((row) => row.getAttribute("aria-label"))).toEqual([
      expect.stringContaining("Refund added to your wallet"),
    ]);
    await waitFor(() => expect(router.state.location.search).toEqual({ tab: "wallet" }));
  });

  it("shows each tab's own empty state", async () => {
    visitAccount("/account/notifications?tab=support", customer);
    editMockDb(customer, (db) => {
      db.notifications = db.notifications.filter((item) => item.group !== "support");
    });

    expect(
      await screen.findByRole("heading", { name: "No support notifications" }, SLOW),
    ).toBeTruthy();
  });

  it("groups into Today and Earlier and labels unread rows", async () => {
    visitAccount("/account/notifications", customer);

    const today = await screen.findByRole("region", { name: "Today" }, SLOW);
    const earlier = screen.getByRole("region", { name: "Earlier" });
    expect(
      within(today).getByRole("button", {
        name: /^Unread\. Your items reached the China warehouse/,
      }),
    ).toBeTruthy();
    expect(within(earlier).getByRole("button", { name: /^Shipment left for Lagos/ })).toBeTruthy();
  });

  it("Mark all read clears every dot and the header bell at once", async () => {
    visitAccount("/account/notifications?tab=promotions", customer);
    const user = userEvent.setup();

    expect(await screen.findByRole("link", { name: "Notifications, 3 unread" }, SLOW)).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: "Mark all read" }));

    // Every group, not only the Promotions tab on screen.
    expect(screen.queryByRole("link", { name: /unread/ })).toBeNull();
    expect(screen.queryAllByTestId("unread-dot")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Mark all read" })).toBeNull();
    await user.click(screen.getByRole("tab", { name: "All" }));
    expect(screen.queryAllByTestId("unread-dot")).toHaveLength(0);
  });

  it("marks a row read and opens its destination", async () => {
    const { router } = visitAccount("/account/notifications", customer);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: /^Unread\. Choose your packing option/ }, SLOW),
    );

    await waitFor(() => expect(router.state.location.pathname).toBe("/account/orders"));
  });
});
