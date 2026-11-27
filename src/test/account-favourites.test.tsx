import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "@/api/errors";
import { guestFavourites } from "@/features/favourites/guest-store";
import type { Favourite } from "@/features/favourites/schemas";
import {
  customer,
  PRELOAD_TIMEOUT,
  preloadRouteChunks,
  ROUTE_TEST_TIMEOUT,
  SLOW,
  visitAccount,
} from "./account";

// Lets a test make the account's "remove favourite" request fail.
const control = vi.hoisted(() => ({ failRemove: false }));

vi.mock("@/features/favourites/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/favourites/services")>();
  return {
    ...actual,
    getFavouritesService: (...args: Parameters<typeof actual.getFavouritesService>) => {
      const service = actual.getFavouritesService(...args);
      return {
        ...service,
        remove: async (productId: string, key: string) => {
          if (control.failRemove) {
            throw new ApiError({ status: 500, message: "Server error" });
          }
          return service.remove(productId, key);
        },
      };
    },
  };
});

vi.setConfig({ testTimeout: ROUTE_TEST_TIMEOUT });

beforeAll(preloadRouteChunks, PRELOAD_TIMEOUT);

afterEach(() => {
  control.failRemove = false;
  // Sonner's toast list is module state; don't let one test's toasts leak into the next.
  toast.dismiss();
});

const kettle: Favourite = {
  productId: "p-kettle",
  slug: "electric-kettle",
  name: "Electric kettle",
  store: "1688",
  price: { amount: 1_200_000, currency: "NGN" },
  imageUrl: null,
};

const sneakersFromBrowser: Favourite = {
  productId: "p-sneakers",
  slug: "running-sneakers",
  name: "Running sneakers",
  store: "Taobao",
  price: { amount: 3_900_000, currency: "NGN" },
  imageUrl: null,
};

function removeButton(name: string) {
  return screen.findByRole("button", { name: `Remove ${name} from favourites` }, SLOW);
}

describe("Favourites", () => {
  it("removes at once and brings the item back with Undo", async () => {
    visitAccount("/account/favourites", customer);
    const user = userEvent.setup();

    await user.click(await removeButton("Wireless headphones"));

    expect(screen.queryByRole("link", { name: "View Wireless headphones" })).toBeNull();
    expect(await screen.findByText("Removed from favourites")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Undo" }));

    const links = await screen.findAllByRole("link", { name: /^View / });
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "View Running sneakers",
      "View Wireless headphones",
      "View Desk lamp",
    ]);
  });

  it("restores the item if the request fails", async () => {
    control.failRemove = true;
    visitAccount("/account/favourites", customer);
    const user = userEvent.setup();

    await user.click(await removeButton("Desk lamp"));

    expect(await screen.findByRole("link", { name: "View Desk lamp" })).toBeTruthy();
    // The Undo toast is withdrawn (sonner marks it removed, then animates it out).
    await waitFor(() => {
      const shown = screen
        .queryAllByText("Removed from favourites")
        .map((text) => text.closest("[data-sonner-toast]"))
        .filter((element) => element?.getAttribute("data-removed") !== "true");
      expect(shown).toHaveLength(0);
    });
  });

  it("shows the empty state with Start shopping", async () => {
    visitAccount("/account/favourites", null);

    expect(await screen.findByRole("heading", { name: "No favourites yet" }, SLOW)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start shopping" }).getAttribute("href")).toBe(
      "/products",
    );
  });

  it("shows guests the favourites saved in this browser", async () => {
    visitAccount("/account/favourites", null, { savedInBrowser: [kettle] });

    expect(await screen.findByRole("link", { name: "View Electric kettle" }, SLOW)).toBeTruthy();
    await userEvent.setup().click(await removeButton("Electric kettle"));
    expect(guestFavourites.read()).toEqual([]);
  });

  it("merges browser favourites into the account after sign-in, without duplicates", async () => {
    visitAccount("/account/favourites", customer, {
      savedInBrowser: [kettle, sneakersFromBrowser],
    });

    expect(await screen.findByRole("link", { name: "View Electric kettle" }, SLOW)).toBeTruthy();
    await waitFor(() => expect(guestFavourites.read()).toEqual([]));
    expect(screen.getAllByRole("link", { name: "View Running sneakers" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /^View / })).toHaveLength(4);
  });
});
