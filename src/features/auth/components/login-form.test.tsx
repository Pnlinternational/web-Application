import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "@/api/errors";
import type { Idempotent } from "@/api/idempotency";
import { describedText } from "@/test/dom";
import type { LoginInput } from "../schemas";
import { LoginForm } from "./login-form";

const onLogin = vi.fn<(variables: Idempotent<LoginInput>) => Promise<unknown>>();

const wrongCredentials = new ApiError({
  status: 401,
  code: "auth.invalid_credentials",
  message: "the phone number or password is wrong",
});

beforeEach(() => {
  onLogin.mockReset().mockResolvedValue(undefined);
});

async function fillAndSubmit(phone: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Phone number"), phone);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
  return user;
}

describe("LoginForm", () => {
  it("checks the number against the chosen country before sending", async () => {
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("024 123 4567", "x");

    await waitFor(() =>
      expect(describedText(screen.getByLabelText("Phone number"))).toContain(
        "Enter a valid Nigerian number",
      ),
    );
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("sends the number in E.164 with an idempotency key made at submit time", async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onLogin={onLogin} onSuccess={onSuccess} />);

    await fillAndSubmit("0801 234 5678", "secret123");

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const variables = onLogin.mock.calls[0]?.[0];
    expect(variables?.data).toEqual({ phone: "+2348012345678", password: "secret123" });
    expect(variables?.idempotencyKey.length).toBeGreaterThanOrEqual(16);
  });

  it("uses the Ghana code when Ghana is picked", async () => {
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText(/country code/i), "GH");
    await fillAndSubmit("024 123 4567", "secret123");

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
    expect(onLogin.mock.calls[0]?.[0].data.phone).toBe("+233241234567");
  });

  it("shows wrong credentials as the design's banner", async () => {
    onLogin.mockRejectedValue(wrongCredentials);
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("0801 234 5678", "wrong-password");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Phone number or password is incorrect. Check them and try again.",
    );
  });

  it("clears the banner when the user edits a field", async () => {
    onLogin.mockRejectedValue(wrongCredentials);
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    const user = await fillAndSubmit("0801 234 5678", "wrong-password");
    await screen.findByRole("alert");
    await user.type(screen.getByLabelText("Password"), "!");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses a new key for a new attempt", async () => {
    onLogin.mockRejectedValueOnce(wrongCredentials);
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("0801 234 5678", "wrong");
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(2));
    const [first, second] = onLogin.mock.calls.map(([variables]) => variables.idempotencyKey);
    expect(first).not.toBe(second);
  });
});
