import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vite-plus/test";
import { Tabs } from "./tabs";

const TABS = [
  { id: "all", label: "All" },
  { id: "orders", label: "Orders" },
  { id: "wallet", label: "Wallet" },
] as const;

function Harness() {
  const [value, setValue] = useState<(typeof TABS)[number]["id"]>("all");
  return <Tabs label="Groups" tabs={TABS} value={value} onChange={setValue} panelId="panel" />;
}

describe("Tabs", () => {
  it("lets Tab reach only the selected tab, and arrows move and select", async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "All", selected: true }));

    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(
      screen.getByRole("tab", { name: "Orders", selected: true }),
    );

    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Wallet", selected: true })).toBeTruthy();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "All", selected: true }).tabIndex).toBe(0);
  });
});
