import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import type { Device } from "../schemas";
import { DeviceList } from "./device-list";

const current: Device = {
  id: "s-current",
  created_at: "2026-01-01T00:00:00Z",
  last_refreshed_at: "2026-01-02T00:00:00Z",
  current: true,
  platform: "web",
};
const phone: Device = {
  id: "s-phone",
  created_at: "2026-01-01T00:00:00Z",
  last_refreshed_at: "2026-01-02T00:00:00Z",
  current: false,
  platform: "ios",
};

function renderList(devices: Device[]) {
  const onRevoke = vi.fn<(id: string) => void>();
  const onRevokeOthers = vi.fn<() => void>();
  render(<DeviceList devices={devices} onRevoke={onRevoke} onRevokeOthers={onRevokeOthers} />);
  return { onRevoke, onRevokeOthers };
}

function row(name: string) {
  const item = screen.getByText(name).closest("li");
  if (!item) throw new Error(`No device row for ${name}`);
  return within(item);
}

describe("DeviceList", () => {
  it("lists every session by platform", () => {
    renderList([current, phone]);
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Web"),
      expect.stringContaining("iPhone"),
    ]);
  });

  it("marks the current session as this device", () => {
    renderList([current, phone]);
    expect(row("Web").queryByText("This device")).toBeTruthy();
  });

  it("offers no per-row sign out for the current session", () => {
    renderList([current, phone]);
    expect(row("Web").queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("signs out one other device by id", async () => {
    const { onRevoke } = renderList([current, phone]);

    await userEvent.click(row("iPhone").getByRole("button", { name: "Sign out" }));

    expect(onRevoke).toHaveBeenCalledWith("s-phone");
  });

  it("signs out all other devices", async () => {
    const { onRevokeOthers } = renderList([current, phone]);

    await userEvent.click(screen.getByRole("button", { name: "Sign out other devices" }));

    expect(onRevokeOthers).toHaveBeenCalledTimes(1);
  });

  it("hides 'Sign out other devices' when this is the only session", () => {
    renderList([current]);
    expect(screen.queryByRole("button", { name: "Sign out other devices" })).toBeNull();
  });
});
