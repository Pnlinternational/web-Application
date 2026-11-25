import { useAppForm } from "@hackert-ui/form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vite-plus/test";
import { AuthNotice, PasswordChecks } from "./auth-ui";

function PasswordHarness() {
  const form = useAppForm({ defaultValues: { password: "" } });

  return (
    <form.AppField name="password">
      {(field) => (
        <>
          <input
            aria-label="Password"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          <PasswordChecks />
        </>
      )}
    </form.AppField>
  );
}

describe("AuthNotice", () => {
  it("keeps one live region and changes its text", () => {
    const { rerender } = render(<AuthNotice />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");

    rerender(<AuthNotice>Password updated.</AuthNotice>);

    expect(screen.getByRole("status")).toBe(region);
    expect(region.textContent).toBe("Password updated.");
  });
});

describe("PasswordChecks", () => {
  it("says nothing before the user types", () => {
    render(<PasswordHarness />);

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("summarises how many rules are met when one flips", async () => {
    render(<PasswordHarness />);

    await userEvent.type(screen.getByLabelText("Password"), "abcdefgh");

    expect(screen.getByRole("status").textContent).toBe("2 of 3 requirements met");
  });

  it("does not change the announcement when a keystroke flips nothing", async () => {
    render(<PasswordHarness />);
    const input = screen.getByLabelText("Password");
    const status = screen.getByRole("status");
    await userEvent.type(input, "abcdefgh");
    const mutations: string[] = [];
    new MutationObserver((records) => {
      for (const record of records) mutations.push(record.type);
    }).observe(status, { childList: true, characterData: true, subtree: true });

    await userEvent.type(input, "ij");
    await Promise.resolve();

    expect(mutations).toEqual([]);
  });
});
