import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
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

const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");

afterEach(() => {
  if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
  else Reflect.deleteProperty(navigator, "geolocation");
});

/** Fakes the browser's answer to getCurrentPosition. */
function mockGeolocation(
  answer: { coords: { latitude: number; longitude: number } } | { code: number },
) {
  const getCurrentPosition = vi.fn((resolve: PositionCallback, reject: PositionErrorCallback) => {
    if ("coords" in answer) resolve(answer as GeolocationPosition);
    else reject(answer as GeolocationPositionError);
  });
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  });
  return getCurrentPosition;
}

const LAGOS = { coords: { latitude: 6.6, longitude: 3.35 } };
const ACCRA = { coords: { latitude: 5.6, longitude: -0.19 } };

describe("Saved addresses", () => {
  it("asks before deleting; Keep address leaves it and returns focus", async () => {
    visitAccount("/account/addresses", customer);
    const user = userEvent.setup();

    const trigger = await screen.findByRole("button", { name: "Delete Work address" }, SLOW);
    await user.click(trigger);
    const dialog = screen.getByRole("alertdialog", { name: "Delete this address?" });
    await user.click(within(dialog).getByRole("button", { name: "Keep address" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("heading", { name: "Work" })).toBeTruthy();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes the confirmation on Escape", async () => {
    visitAccount("/account/addresses", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete Work address" }, SLOW));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("deletes after confirming", async () => {
    visitAccount("/account/addresses", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Delete Work address" }, SLOW));
    await user.click(screen.getByRole("button", { name: "Delete address" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Work" })).toBeNull());
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
  });

  it("moves the default after Set as default (server-owned)", async () => {
    visitAccount("/account/addresses", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Set as default" }, SLOW));

    const work = (await screen.findByRole("heading", { name: "Work" })).closest("article");
    await waitFor(() => expect(within(work as HTMLElement).getByText("Default")).toBeTruthy());
    expect(screen.getAllByText("Default")).toHaveLength(1);
  });

  it("shows an empty state with Add address", async () => {
    visitAccount("/account/addresses", customer);
    editMockDb(customer, (db) => {
      db.addresses = [];
    });

    expect(await screen.findByRole("heading", { name: "No saved addresses" }, SLOW)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add address" }).getAttribute("href")).toBe(
      "/account/addresses/new",
    );
  });
});

describe("Add address form", () => {
  it("explains what's missing on submit", async () => {
    visitAccount("/account/addresses/new", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Save address" }, SLOW));

    expect(await screen.findByText("Enter who should receive it")).toBeTruthy();
    expect(screen.getByText("Enter your phone number")).toBeTruthy();
    expect(screen.getByText("Enter the house number and street")).toBeTruthy();
    expect(screen.getByText("Enter the city or area")).toBeTruthy();
  });

  it("checks the phone against the account's country", async () => {
    visitAccount("/account/addresses/new", customer);
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Phone number", {}, SLOW), "024 123 4567");
    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(
      await screen.findByText("Enter a valid Nigerian number, like 0803 123 4567"),
    ).toBeTruthy();
    expect(screen.getByText("+234")).toBeTruthy();
  });

  it("fills street, area and state from the location, never the landmark", async () => {
    mockGeolocation(LAGOS);
    visitAccount("/account/addresses/new", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Use my current location" }, SLOW));

    expect(await screen.findByText("Location added. Check the details below.")).toBeTruthy();
    expect((screen.getByLabelText("Street address") as HTMLInputElement).value).toBe(
      "12 Sample Street",
    );
    expect((screen.getByLabelText("City or area") as HTMLInputElement).value).toBe("Ikeja");
    expect((screen.getByLabelText("Nearest landmark (optional)") as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("asks before replacing what the user typed", async () => {
    mockGeolocation(LAGOS);
    visitAccount("/account/addresses/new", customer);
    const user = userEvent.setup();

    const street = await screen.findByLabelText("Street address", {}, SLOW);
    await user.type(street, "7 My Own Road");
    await user.click(screen.getByRole("button", { name: "Use my current location" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Use your current location?" });
    await user.click(within(dialog).getByRole("button", { name: "Keep mine" }));

    expect((street as HTMLInputElement).value).toBe("7 My Own Road");
    expect(screen.getByRole("button", { name: "Use my current location" })).toBeTruthy();
  });

  it.each([
    ["permission is denied", { code: 1 }, "Location access is off."],
    ["the lookup times out", { code: 3 }, "We couldn't get your location in time."],
    ["the position is unavailable", { code: 2 }, "Your location isn't available right now."],
    [
      "there's no address there",
      { coords: { latitude: 0, longitude: 0 } },
      "We couldn't find an address",
    ],
    ["it's outside the account's country", ACCRA, "outside Nigeria"],
  ])("keeps manual entry working when %s", async (_, answer, message) => {
    mockGeolocation(answer);
    visitAccount("/account/addresses/new", customer);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Use my current location" }, SLOW));

    expect(await screen.findByText(new RegExp(message))).toBeTruthy();
    const street = screen.getByLabelText("Street address") as HTMLInputElement;
    expect(street.value).toBe("");
    await user.type(street, "1 Manual Street");
    expect(street.value).toBe("1 Manual Street");
  });

  it("only asks for location permission on click", async () => {
    const getCurrentPosition = mockGeolocation(LAGOS);
    visitAccount("/account/addresses/new", customer);

    await screen.findByRole("button", { name: "Use my current location" }, SLOW);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
