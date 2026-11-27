import { screen, within } from "@testing-library/react";
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

describe("account overview: My orders", () => {
  it("shows a count badge only above zero, with the count in the label", async () => {
    visitAccount("/account", customer);

    const inChina = await screen.findByRole("link", { name: "In China, 2 orders" }, SLOW);
    expect(within(inChina).getByTestId("order-badge").textContent).toBe("2");

    const arrived = screen.getByRole("link", { name: "Arrived, 0 orders" });
    expect(within(arrived).queryByTestId("order-badge")).toBeNull();
  });

  it("opens Orders filtered to the group", async () => {
    visitAccount("/account", customer);

    const toPay = await screen.findByRole("link", { name: "To pay, 1 order" }, SLOW);
    expect(toPay.getAttribute("href")).toBe("/account/orders?status=to_pay");
  });

  it("shows wallet amounts in the account's currency", async () => {
    const ghana = { ...customer, id: "c-gh", market: "GH" as const, phone: "+233241234567" };
    visitAccount("/account", ghana);

    const wallet = await screen.findByRole("region", { name: "Wallet" }, SLOW);
    expect(within(wallet).getByText("GH₵245")).toBeTruthy();
    expect(within(wallet).getByText("GH₵60 pending")).toBeTruthy();
  });

  it("shows the identity status from the server", async () => {
    visitAccount("/account", customer);
    editMockDb(customer, (db) => {
      db.identity = "pending";
    });

    expect(await screen.findByText("Verification in progress", {}, SLOW)).toBeTruthy();
  });
});
