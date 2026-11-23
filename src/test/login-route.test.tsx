import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { accessTokenStore } from "@/api/access-token";
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

let fake: ReturnType<typeof installFakeAdapter>;

afterEach(() => {
  fake.restore();
  accessTokenStore.clear();
});

function visitLogin(routes: Record<string, Reply[]>, initialPath = "/login") {
  fake = installFakeAdapter(api, routes);
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), null);
  const { router } = renderRouter({ routeTree, initialPath, queryClient });
  return { ...fake, router };
}

async function signIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText("Phone number"), "+2348012345678");
  await user.type(screen.getByLabelText("Password"), "secret123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("/login", () => {
  it("goes straight to the redirect target on a recognised device (200)", async () => {
    const signedIn = {
      access_token: "at-1",
      access_expires_in: 900,
      access_expires_at: "2026-01-01T00:15:00Z",
      session_expires_at: "2026-02-01T00:00:00Z",
      user: { id: "c1", phone: "+2348012345678", market: "NG", created_at: "2026-01-01T00:00:00Z" },
    };
    const { router } = visitLogin(
      { "auth/login": [{ status: 200, data: signedIn }] },
      "/login?redirect=%2Faccount%2Forders",
    );

    await signIn(userEvent.setup());

    await waitFor(() => expect(router.state.location.pathname).toBe("/account/orders"));
  });

  it("asks for the code when the API sent one (202)", async () => {
    visitLogin({ "auth/login": [{ status: 202, data: challenge }] });

    await signIn(userEvent.setup());

    expect(await screen.findByLabelText("Verification code")).toBeTruthy();
  });

  it("verifies the code against the challenge it was sent for", async () => {
    const { sent } = visitLogin({
      "auth/login": [{ status: 202, data: challenge }],
      "auth/login/verify": [{ status: 422, data: errorBody("auth.invalid_code") }],
    });
    const user = userEvent.setup();

    await signIn(user);
    await user.type(await screen.findByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(requestsTo(sent, "auth/login/verify")).toHaveLength(1));
    expect(bodyOf(requestsTo(sent, "auth/login/verify")[0])).toEqual({
      challenge_id: "ch-1",
      code: "123456",
    });
  });

  it("goes back to the credentials on Start again", async () => {
    visitLogin({ "auth/login": [{ status: 202, data: challenge }] });
    const user = userEvent.setup();

    await signIn(user);
    await user.click(await screen.findByRole("button", { name: "Start again" }));

    expect(await screen.findByLabelText("Password")).toBeTruthy();
  });
});
