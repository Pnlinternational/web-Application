import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/api/api";
import { routeTree } from "@/routeTree.gen";
import { bodyOf, installFakeAdapter, type Reply, requestsTo } from "@/test/fake-api";
import { createTestQueryClient, renderRouter } from "@/test/render";
import { authKeys } from "../query-keys";
import type { OtpChallenge } from "../schemas";

const challenge: OtpChallenge = {
  challenge_id: "ch-1",
  expires_in: 300,
  resend_after: 30,
  next: "code",
};

let fake: ReturnType<typeof installFakeAdapter>;

afterEach(() => {
  fake.restore();
});

// The real /forgot-password page, signed out, with the API answering from `routes`.
function visitReset({ verify, complete = [] }: { verify: Reply[]; complete?: Reply[] }) {
  fake = installFakeAdapter(api, {
    "auth/password/reset": [{ status: 202, data: challenge }],
    "auth/password/reset/verify": verify,
    "auth/password/reset/complete": complete,
  });
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), null);
  renderRouter({ routeTree, initialPath: "/forgot-password", queryClient });
  return fake;
}

async function requestCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Phone number"), "+2348012345678");
  await user.click(screen.getByRole("button", { name: "Send code" }));
}

async function enterCode(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Verification code"), "123456");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

async function setNewPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("New password"), "new-secret-1");
  await user.type(screen.getByLabelText("Confirm password"), "new-secret-1");
  await user.click(screen.getByRole("button", { name: "Change password" }));
}

async function resetPassword() {
  const user = userEvent.setup();
  await requestCode(user);
  await enterCode(user);
  await setNewPassword(user);
}

const setPassword: Reply = { status: 200, data: { next: "set_password" } };

describe("ResetPasswordFlow", () => {
  it("sends the same client_key to verify and complete", async () => {
    const { sent } = visitReset({ verify: [setPassword], complete: [{ status: 204 }] });

    await resetPassword();

    await waitFor(() => expect(requestsTo(sent, "auth/password/reset/complete")).toHaveLength(1));
    const [verify] = requestsTo(sent, "auth/password/reset/verify");
    const [complete] = requestsTo(sent, "auth/password/reset/complete");
    expect(bodyOf(complete)).toMatchObject({
      client_key: (bodyOf(verify) as { client_key: string }).client_key,
    });
  });

  it("sends a base64url client_key with the code", async () => {
    const { sent } = visitReset({ verify: [setPassword], complete: [{ status: 204 }] });

    await resetPassword();

    await waitFor(() => expect(requestsTo(sent, "auth/password/reset/verify")).toHaveLength(1));
    expect(bodyOf(requestsTo(sent, "auth/password/reset/verify")[0])).toEqual({
      challenge_id: "ch-1",
      code: "123456",
      client_key: expect.stringMatching(/^[A-Za-z0-9_-]{22,}$/),
    });
  });

  it("tells the user to sign in once the password changed (204)", async () => {
    visitReset({ verify: [setPassword], complete: [{ status: 204 }] });

    await resetPassword();

    expect(await screen.findByRole("heading", { name: "Password changed" })).toBeTruthy();
  });

  it("shows when a held password change applies (202)", async () => {
    // No offset, so the local-time rendering is the same in every test time zone.
    visitReset({
      verify: [setPassword],
      complete: [{ status: 202, data: { hold_id: "h-1", applies_at: "2026-12-01T09:30:00" } }],
    });

    await resetPassword();

    expect(await screen.findByText(/applies on Dec 1, 2026 9:30 AM/)).toBeTruthy();
  });

  it("explains that a dormant account can't be reset online", async () => {
    visitReset({ verify: [{ status: 200, data: { next: "prove_ownership" } }] });
    const user = userEvent.setup();

    await requestCode(user);
    await enterCode(user);

    expect(
      await screen.findByRole("heading", { name: "We can't reset this account online" }),
    ).toBeTruthy();
  });
});
