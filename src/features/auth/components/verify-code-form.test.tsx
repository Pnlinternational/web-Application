import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "@/api/errors";
import type { Idempotent } from "@/api/idempotency";
import { describedText } from "@/test/dom";
import { VerifyCodeForm } from "./verify-code-form";

const onVerify = vi.fn<(variables: Idempotent<{ code: string }>) => Promise<string>>();
const onResend = vi.fn<(idempotencyKey: string) => Promise<{ resend_after: number }>>();
const onSuccess = vi.fn<(result: string) => void>();
const onChangePhone = vi.fn<() => void>();

const wrongCode = new ApiError({
  status: 422,
  code: "auth.invalid_code",
  message: "That code is incorrect. You have 2 tries left.",
});

beforeEach(() => {
  onVerify.mockReset().mockResolvedValue("signed-in");
  onResend.mockReset().mockResolvedValue({ resend_after: 0 });
  onSuccess.mockReset();
  onChangePhone.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderForm(resendAfter = 0) {
  return render(
    <VerifyCodeForm
      resendAfter={resendAfter}
      onVerify={onVerify}
      onResend={onResend}
      onSuccess={onSuccess}
      onChangePhone={onChangePhone}
    />,
  );
}

function codeInput() {
  return screen.getByLabelText<HTMLInputElement>("Verification code");
}

function verifyButton() {
  return screen.getByRole<HTMLButtonElement>("button", { name: "Verify" });
}

function digitBoxes() {
  return codeInput().closest(".group")?.querySelectorAll("[aria-hidden] > div") ?? [];
}

// One second per act so each re-render schedules the next countdown tick.
function passSeconds(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}

describe("OTP input", () => {
  it("shows each typed digit in its own box", async () => {
    renderForm();

    await userEvent.type(codeInput(), "482");

    expect([...digitBoxes()].map((box) => box.textContent)).toEqual(["4", "8", "2", "", "", ""]);
  });

  it("keeps Verify disabled until all six digits are in", async () => {
    renderForm();

    await userEvent.type(codeInput(), "48219");

    expect(verifyButton().disabled).toBe(true);
  });

  it("ignores anything that isn't a digit", async () => {
    renderForm();

    await userEvent.type(codeInput(), "4a8-2");

    expect(codeInput().value).toBe("482");
  });

  it("accepts a pasted code with spaces and submits it", async () => {
    renderForm();

    fireEvent.change(codeInput(), { target: { value: "482 196" } });

    await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(1));
    expect(onVerify.mock.calls[0]?.[0].data).toEqual({ code: "482196" });
  });

  it("submits by itself once six digits are typed", async () => {
    renderForm();

    await userEvent.type(codeInput(), "482196");

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("signed-in"));
    expect(onVerify).toHaveBeenCalledTimes(1);
  });
});

describe("submit", () => {
  it("sends the code with an idempotency key made at submit time", async () => {
    renderForm();

    await userEvent.type(codeInput(), "123456");

    await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(1));
    expect(onVerify.mock.calls[0]?.[0].idempotencyKey.length).toBeGreaterThanOrEqual(16);
  });

  it("shows a wrong code under the field and marks the boxes", async () => {
    onVerify.mockRejectedValue(wrongCode);
    renderForm();

    await userEvent.type(codeInput(), "482196");

    await waitFor(() =>
      expect(describedText(codeInput())).toContain(
        "That code is incorrect. You have 2 tries left.",
      ),
    );
    expect(digitBoxes()[0]?.className).toContain("border-danger");
  });

  it("clears the wrong-code error when the user edits, and retries with a new key", async () => {
    onVerify.mockRejectedValueOnce(wrongCode);
    renderForm();
    const user = userEvent.setup();

    await user.type(codeInput(), "482196");
    await waitFor(() => expect(describedText(codeInput())).toContain("incorrect"));
    await user.type(codeInput(), "{backspace}");
    expect(describedText(codeInput())).not.toContain("incorrect");
    await user.type(codeInput(), "7");

    await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(2));
    const [first, second] = onVerify.mock.calls.map(([variables]) => variables.idempotencyKey);
    expect(first).not.toBe(second);
  });

  it("turns an expired code into a banner and a Resend code button", async () => {
    onVerify.mockRejectedValue(
      new ApiError({ status: 410, code: "auth.code_expired", message: "expired" }),
    );
    renderForm(30);

    await userEvent.type(codeInput(), "482196");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "This code has expired. Send a new one to continue.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: "Verify" })).toBeTruthy();
  });
});

describe("resend", () => {
  it("counts down before offering Resend code", () => {
    vi.useFakeTimers();
    renderForm(58);

    expect(screen.getByText("Resend code in 0:58")).toBeTruthy();
    passSeconds(58);

    expect(screen.getByRole("button", { name: "Resend code" })).toBeTruthy();
  });

  it("restarts the countdown from the new resend_after", async () => {
    onResend.mockResolvedValue({ resend_after: 60 });
    renderForm(0);

    await userEvent.click(screen.getByRole("button", { name: "Resend code" }));

    expect(await screen.findByText("Resend code in 1:00")).toBeTruthy();
  });

  it("uses a new key for each resend tap", async () => {
    renderForm(0);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() => expect(onResend).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole("button", { name: "Resend code" }));

    await waitFor(() => expect(onResend).toHaveBeenCalledTimes(2));
    const [first, second] = onResend.mock.calls.map(([key]) => key);
    expect(first).not.toBe(second);
  });

  it("shows a failed resend as an alert", async () => {
    onResend.mockRejectedValue(
      new ApiError({ status: 429, code: "rate_limited", message: "Try again later" }),
    );
    renderForm(0);

    await userEvent.click(screen.getByRole("button", { name: "Resend code" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Try again later");
  });
});

it("calls onChangePhone from Change phone number", async () => {
  renderForm();

  await userEvent.click(screen.getByRole("button", { name: "Change phone number" }));

  expect(onChangePhone).toHaveBeenCalledTimes(1);
});
