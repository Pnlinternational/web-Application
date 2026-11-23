import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/api/api";
import { describedText } from "@/test/dom";
import { bodyOf, errorBody, installFakeAdapter, type Reply } from "@/test/fake-api";
import { renderWithQuery } from "@/test/render";
import { TERMS_VERSION } from "../constants";
import type { OtpChallenge } from "../schemas";
import { RegisterForm } from "./register-form";

const challenge: OtpChallenge = {
  challenge_id: "ch-1",
  expires_in: 300,
  resend_after: 30,
  next: "code",
};

const onSuccess = vi.fn<(challenge: OtpChallenge) => void>();
let fake: ReturnType<typeof installFakeAdapter>;

function serve(signup: Reply[] = [{ status: 202, data: challenge }]) {
  fake = installFakeAdapter(api, { "auth/signup": signup });
  return fake;
}

beforeEach(() => {
  onSuccess.mockReset();
});

afterEach(() => {
  fake.restore();
});

async function fillAndSubmit({
  acceptTerms = true,
  email = "",
  marketingSms = false,
}: { acceptTerms?: boolean; email?: string; marketingSms?: boolean } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Full name"), "Ada Obi");
  await user.type(screen.getByLabelText("Phone number"), "+2348012345678");
  if (email) await user.type(screen.getByLabelText("Email (optional)"), email);
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.type(screen.getByLabelText("Confirm password"), "secret123");
  if (acceptTerms) await user.click(screen.getByLabelText("I accept the terms and conditions"));
  if (marketingSms) await user.click(screen.getByLabelText("Send me offers by SMS"));
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("RegisterForm", () => {
  it("requires the terms to be accepted", async () => {
    const { sent } = serve();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit({ acceptTerms: false });

    expect(await screen.findByText("Accept the terms to continue")).toBeTruthy();
    expect(sent).toHaveLength(0);
  });

  it("posts the snake_case signup request without optional fields", async () => {
    const { sent } = serve();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit();

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(bodyOf(sent[0])).toEqual({
      phone: "+2348012345678",
      full_name: "Ada Obi",
      password: "secret123",
      terms_version: TERMS_VERSION,
    });
  });

  it("includes the email and the ticked marketing channel", async () => {
    const { sent } = serve();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit({ email: "ada@example.com", marketingSms: true });

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(bodyOf(sent[0])).toMatchObject({ email: "ada@example.com", marketing: { sms: true } });
  });

  it("sends an idempotency key made at submit time", async () => {
    const { sent } = serve();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit();

    await waitFor(() => expect(sent).toHaveLength(1));
    expect(String(sent[0]?.headers.get("Idempotency-Key")).length).toBeGreaterThanOrEqual(16);
  });

  it("hands the code challenge to onSuccess", async () => {
    serve();
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit();

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(challenge));
  });

  it("shows auth.weak_password under the password field", async () => {
    serve([{ status: 422, data: errorBody("auth.weak_password", "Pick a stronger password") }]);
    renderWithQuery(<RegisterForm onSuccess={onSuccess} />);

    await fillAndSubmit();

    await waitFor(() =>
      expect(describedText(screen.getByLabelText("Password"))).toContain(
        "Pick a stronger password",
      ),
    );
  });
});
