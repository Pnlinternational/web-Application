import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/api/api";
import { installFakeAdapter, type Reply, requestsTo } from "@/test/fake-api";
import { renderWithQuery } from "@/test/render";
import type { Device } from "../schemas";
import { DevicesSection } from "./devices-section";

const sessions: Device[] = [
  {
    id: "s-current",
    created_at: "2026-01-01T00:00:00Z",
    last_refreshed_at: "2026-01-02T00:00:00Z",
    current: true,
    platform: "web",
  },
  {
    id: "s-phone",
    created_at: "2026-01-01T00:00:00Z",
    last_refreshed_at: "2026-01-02T00:00:00Z",
    current: false,
    platform: "ios",
  },
];

const list: Reply = { status: 200, data: { sessions } };
let fake: ReturnType<typeof installFakeAdapter>;

function serve(routes: Record<string, Reply[]>) {
  fake = installFakeAdapter(api, { "me/sessions": [list, list, list], ...routes });
  renderWithQuery(<DevicesSection />);
  return fake;
}

afterEach(() => {
  fake.restore();
});

function idempotencyKeys(sent: typeof fake.sent, url: string) {
  return requestsTo(sent, url).map((config) => config.headers.get("Idempotency-Key"));
}

describe("DevicesSection", () => {
  it("shows the signed-in devices", async () => {
    serve({});
    expect(await screen.findByText("iPhone")).toBeTruthy();
  });

  it("signs out other devices with a key made on tap", async () => {
    const { sent } = serve({ "me/sessions/others/revoke": [{ status: 204 }] });

    await userEvent.click(await screen.findByRole("button", { name: "Sign out other devices" }));

    await waitFor(() => expect(idempotencyKeys(sent, "me/sessions/others/revoke")).toHaveLength(1));
    expect(String(idempotencyKeys(sent, "me/sessions/others/revoke")[0]).length).toBeGreaterThan(
      15,
    );
  });

  it("refetches the list after signing out other devices", async () => {
    const { sent } = serve({ "me/sessions/others/revoke": [{ status: 204 }] });

    await userEvent.click(await screen.findByRole("button", { name: "Sign out other devices" }));

    await waitFor(() => expect(requestsTo(sent, "me/sessions")).toHaveLength(2));
  });

  it("makes a fresh key for every per-row sign out tap", async () => {
    const { sent } = serve({ "me/sessions/s-phone": [{ status: 204 }, { status: 204 }] });
    const user = userEvent.setup();
    const signOut = () => screen.findByRole("button", { name: "Sign out" });

    await user.click(await signOut());
    await waitFor(() => expect(requestsTo(sent, "me/sessions")).toHaveLength(2));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign out" }).getAttribute("aria-busy")).toBeNull(),
    );
    await user.click(await signOut());

    await waitFor(() => expect(idempotencyKeys(sent, "me/sessions/s-phone")).toHaveLength(2));
    const [first, second] = idempotencyKeys(sent, "me/sessions/s-phone");
    expect(first).not.toBe(second);
  });

  it("signs out one device with DELETE", async () => {
    const { sent } = serve({ "me/sessions/s-phone": [{ status: 204 }] });

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(requestsTo(sent, "me/sessions/s-phone")).toHaveLength(1));
    expect(requestsTo(sent, "me/sessions/s-phone")[0]?.method).toBe("delete");
  });
});
