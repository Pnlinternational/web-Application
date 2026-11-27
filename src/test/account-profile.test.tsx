import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
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

function saveButton() {
  return screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement;
}

describe("Edit profile", () => {
  it("keeps Save disabled until something changes", async () => {
    visitAccount("/account/profile", customer);
    const user = userEvent.setup();

    const name = await screen.findByLabelText("Full name", {}, SLOW);
    expect(saveButton().disabled).toBe(true);

    await user.type(name, " A.");
    expect(saveButton().disabled).toBe(false);

    await user.clear(name);
    await user.type(name, "Ada Okafor");
    expect(saveButton().disabled).toBe(true);
  });

  it("keeps Save disabled while the email is invalid", async () => {
    visitAccount("/account/profile", customer);
    const user = userEvent.setup();

    const email = await screen.findByLabelText("Email", {}, SLOW);
    await user.clear(email);
    await user.type(email, "not-an-email");

    expect(saveButton().disabled).toBe(true);
  });

  it("treats a changed email as unverified", async () => {
    visitAccount("/account/profile", customer);
    const user = userEvent.setup();

    const email = await screen.findByLabelText("Email", {}, SLOW);
    expect(screen.getByRole("link", { name: "Verify email" })).toBeTruthy();

    await user.clear(email);
    await user.type(email, "ada.new@example.com");

    expect(screen.getByText("Not verified yet. Save to verify the new email.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Verify email" })).toBeNull();
  });

  it("saves, then shows the new name in the account chrome", async () => {
    visitAccount("/account/profile", customer);
    const user = userEvent.setup();

    const name = await screen.findByLabelText("Full name", {}, SLOW);
    await user.clear(name);
    await user.type(name, "Adaeze Okafor");
    await user.click(saveButton());

    expect(await screen.findByText("Profile saved")).toBeTruthy();
    await waitFor(() => expect(screen.getAllByText("Adaeze Okafor").length).toBeGreaterThan(0));
    expect(saveButton().disabled).toBe(true);
  });
});
