import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "@/api/errors";
import type { Idempotent } from "@/api/idempotency";
import type { LoginInput } from "../schemas";
import { LoginForm } from "./login-form";

const onLogin = vi.fn<(variables: Idempotent<LoginInput>) => Promise<unknown>>();

beforeEach(() => {
  onLogin.mockReset().mockResolvedValue(undefined);
});

async function fillAndSubmit(phone: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Phone number"), phone);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("LoginForm", () => {
  it("shows zod validation errors once the user tries to submit", async () => {
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("12ab", "x");

    expect(await screen.findByText("Enter a valid phone number")).toBeTruthy();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("sends the credentials with an idempotency key made at submit time", async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onLogin={onLogin} onSuccess={onSuccess} />);

    await fillAndSubmit("+2348012345678", "secret123");

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const variables = onLogin.mock.calls[0]?.[0];
    expect(variables?.data).toEqual({ phone: "+2348012345678", password: "secret123" });
    expect(variables?.idempotencyKey.length).toBeGreaterThanOrEqual(16);
  });

  it("shows the API message as a form error", async () => {
    onLogin.mockRejectedValue(
      new ApiError({
        status: 401,
        code: "auth.invalid_credentials",
        message: "the phone number or password is wrong",
      }),
    );
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("+2348012345678", "wrong-password");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "the phone number or password is wrong",
    );
  });

  it("uses a new key for a new attempt", async () => {
    onLogin.mockRejectedValueOnce(new ApiError({ status: 401, message: "wrong" }));
    render(<LoginForm onLogin={onLogin} onSuccess={vi.fn()} />);

    await fillAndSubmit("+2348012345678", "wrong");
    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(2));
    const [first, second] = onLogin.mock.calls.map(([variables]) => variables.idempotencyKey);
    expect(first).not.toBe(second);
  });
});
