import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/api/api";
import { authKeys } from "@/features/auth/query-keys";
import type { OtpChallenge } from "@/features/auth/schemas";
import { routeTree } from "@/routeTree.gen";
import { bodyOf, errorBody, installFakeAdapter, type Reply, requestsTo } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

const challenge: OtpChallenge = {
  challenge_id: "ch-1",
  expires_in: 300,
  resend_after: 30,
  next: "code",
};

const setPassword: Reply = { status: 200, data: { next: "set_password" } };

let fake: ReturnType<typeof installFakeAdapter>;

afterEach(() => {
  fake.restore();
});

// The real /forgot-password page, signed out, with the API answering from `routes`.
function visitReset(routes: Record<string, Reply[]>, initialPath = "/forgot-password") {
  fake = installFakeAdapter(api, {
    "auth/password/reset": [{ status: 202, data: challenge }],
    ...routes,
  });
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), null);
  const { router } = renderRouter({ routeTree, initialPath, queryClient });
  return { ...fake, router };
}

async function requestCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Phone number"), "0801 234 5678");
  await user.click(screen.getByRole("button", { name: "Send code" }));
}

async function enterCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Verification code"), "123456");
}

async function setNewPassword(user: ReturnType<typeof userEvent.setup>, password = "new-secret-1") {
  await user.type(await screen.findByLabelText("New password"), password);
  await user.click(screen.getByRole("button", { name: "Update password" }));
}

describe("password reset", () => {
  it("moves through its own URLs: code, then new password", async () => {
    const { router } = visitReset({ "auth/password/reset/verify": [setPassword] });
    const user = userEvent.setup();

    await requestCode(user);
    await waitFor(() => expect(router.state.location.pathname).toBe("/reset-code"));
    expect(await screen.findByText("We sent a 6-digit code to +234 801 234 5678.")).toBeTruthy();
    await enterCode(user);

    await waitFor(() => expect(router.state.location.pathname).toBe("/new-password"));
  });

  it("ties the code check and the password change to one client key", async () => {
    const { sent, router } = visitReset({
      "auth/password/reset/verify": [setPassword],
      "auth/password/reset/complete": [{ status: 204 }],
    });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);
    await setNewPassword(user);

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
    const verifyBody = bodyOf(requestsTo(sent, "auth/password/reset/verify")[0]) as {
      client_key: string;
    };
    expect(bodyOf(requestsTo(sent, "auth/password/reset/complete")[0])).toEqual({
      client_key: verifyBody.client_key,
      password: "new-secret-1",
    });
    expect(bodyOf(requestsTo(sent, "auth/password/reset")[0])).toEqual({ phone: "+2348012345678" });
  });

  it("returns to sign in with a success message", async () => {
    visitReset({
      "auth/password/reset/verify": [setPassword],
      "auth/password/reset/complete": [{ status: 204 }],
    });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);
    await setNewPassword(user);

    expect((await screen.findByRole("status")).textContent).toBe(
      "Password updated. Sign in with your new password.",
    );
  });

  it("explains a scheduled change (72-hour hold)", async () => {
    visitReset({
      "auth/password/reset/verify": [setPassword],
      "auth/password/reset/complete": [
        { status: 202, data: { hold_id: "h1", applies_at: "2026-12-01T09:30:00Z" } },
      ],
    });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);
    await setNewPassword(user);

    expect((await screen.findByRole("status")).textContent).toMatch(/applies on Dec 1, 2026/);
  });

  it("does not send a password that fails the live checks", async () => {
    const { sent } = visitReset({ "auth/password/reset/verify": [setPassword] });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);
    await setNewPassword(user, "abcdefgh");

    expect(
      await screen.findByText("Use at least 8 characters, with a letter and a number"),
    ).toBeTruthy();
    expect(requestsTo(sent, "auth/password/reset/complete")).toHaveLength(0);
  });

  it("sends accounts that need support to a dead end with a way back", async () => {
    visitReset({
      "auth/password/reset/verify": [{ status: 200, data: { next: "prove_ownership" } }],
    });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);

    expect(
      await screen.findByRole("heading", { name: "We can't reset this account online" }),
    ).toBeTruthy();
  });

  it("marks a wrong code and keeps the user on the code step", async () => {
    const { router } = visitReset({
      "auth/password/reset/verify": [
        { status: 422, data: errorBody("auth.invalid_code", "That code is incorrect.") },
      ],
    });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);

    expect(await screen.findByText("That code is incorrect.")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/reset-code");
  });

  it("sends a direct visit to a later step back to the start", async () => {
    const { router } = visitReset({}, "/new-password");

    await waitFor(() => expect(router.state.location.pathname).toBe("/forgot-password"));
  });
});
