import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ApiError } from "@/api/errors";
import type { Idempotent } from "@/api/idempotency";
import { describedText } from "@/test/dom";
import { VerifyCodeForm } from "./verify-code-form";

const onVerify = vi.fn<(variables: Idempotent<{ code: string }>) => Promise<string>>();
const onResend = vi.fn<(idempotencyKey: string) => Promise<{ resend_after: number }>>();
const onSuccess = vi.fn<(result: string) => void>();
const onStartAgain = vi.fn<() => void>();

beforeEach(() => {
  onVerify.mockReset().mockResolvedValue("signed-in");
  onResend.mockReset().mockResolvedValue({ resend_after: 0 });
  onSuccess.mockReset();
  onStartAgain.mockReset();
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
      onStartAgain={onStartAgain}
    />,
  );
}

function codeInput() {
  return screen.getByLabelText<HTMLInputElement>("Verification code");
}

function resendButton() {
  return screen.getByRole<HTMLButtonElement>("button", { name: /resend code/i });
}

async function enterCode(code: string) {
  const user = userEvent.setup();
  await user.type(codeInput(), code);
  await user.click(screen.getByRole("button", { name: "Verify" }));
}

// One second per act so each re-render schedules the next countdown tick.
function passSeconds(seconds: number) {
  for (let i = 0; i < seconds; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}

describe("VerifyCodeForm", () => {
  describe("code validation", () => {
    it.each(["12345", "12345a", "1234567"])("rejects %s without verifying", async (code) => {
      renderForm();

      await enterCode(code);

      await waitFor(() => expect(describedText(codeInput())).toContain("Enter the 6-digit code"));
      expect(onVerify).not.toHaveBeenCalled();
    });
  });

  describe("submit", () => {
    it("passes what onVerify resolved with to onSuccess", async () => {
      renderForm();

      await enterCode("123456");

      await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("signed-in"));
    });

    it("sends the code with an idempotency key made at submit time", async () => {
      renderForm();

      await enterCode("123456");

      await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(1));
      const variables = onVerify.mock.calls[0]?.[0];
      expect(variables?.data).toEqual({ code: "123456" });
      expect(variables?.idempotencyKey.length).toBeGreaterThanOrEqual(16);
    });

    it("shows auth.invalid_code under the code field", async () => {
      onVerify.mockRejectedValue(
        new ApiError({ status: 422, code: "auth.invalid_code", message: "That code is wrong" }),
      );
      renderForm();

      await enterCode("123456");

      await waitFor(() => expect(describedText(codeInput())).toContain("That code is wrong"));
    });

    it("uses a new key when the user submits a corrected code", async () => {
      onVerify.mockRejectedValueOnce(
        new ApiError({ status: 422, code: "auth.invalid_code", message: "That code is wrong" }),
      );
      renderForm();

      await enterCode("123456");
      await waitFor(() => expect(describedText(codeInput())).toContain("That code is wrong"));
      await userEvent.clear(codeInput());
      await enterCode("654321");

      await waitFor(() => expect(onVerify).toHaveBeenCalledTimes(2));
      const [first, second] = onVerify.mock.calls.map(([variables]) => variables.idempotencyKey);
      expect(first).not.toBe(second);
    });
  });

  describe("resend", () => {
    it("stays disabled until the resend_after countdown ends", () => {
      vi.useFakeTimers();
      renderForm(3);

      passSeconds(2);
      expect(resendButton().disabled).toBe(true);

      passSeconds(1);
      expect(resendButton().disabled).toBe(false);
    });

    it("shows the seconds left", () => {
      vi.useFakeTimers();
      renderForm(30);

      passSeconds(5);

      expect(resendButton().textContent).toBe("Resend code in 25s");
    });

    it("restarts the countdown from the new resend_after", async () => {
      onResend.mockResolvedValue({ resend_after: 60 });
      renderForm(0);

      await userEvent.click(resendButton());

      await waitFor(() => expect(resendButton().textContent).toBe("Resend code in 60s"));
      expect(resendButton().disabled).toBe(true);
    });

    it("uses a new key for each resend tap", async () => {
      renderForm(0);
      const user = userEvent.setup();

      await user.click(resendButton());
      await waitFor(() => expect(resendButton().disabled).toBe(false));
      await user.click(resendButton());

      await waitFor(() => expect(onResend).toHaveBeenCalledTimes(2));
      const [first, second] = onResend.mock.calls.map(([key]) => key);
      expect(first).not.toBe(second);
    });

    it("shows a failed resend as an alert", async () => {
      onResend.mockRejectedValue(
        new ApiError({ status: 429, code: "rate_limited", message: "Try again later" }),
      );
      renderForm(0);

      await userEvent.click(resendButton());

      expect((await screen.findByRole("alert")).textContent).toBe("Try again later");
    });
  });

  it("calls onStartAgain from the Start again link", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Start again" }));

    expect(onStartAgain).toHaveBeenCalledTimes(1);
  });
});
