import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { accessTokenStore } from "@/api/access-token";
import { api } from "@/api/api";
import { describedText } from "@/test/dom";
import { TERMS_VERSION } from "@/features/auth/constants";
import { authKeys } from "@/features/auth/query-keys";
import type { OtpChallenge } from "@/features/auth/schemas";
import { routeTree } from "@/routeTree.gen";
import { bodyOf, errorBody, installFakeAdapter, type Reply, requestsTo } from "./fake-api";
import { createTestQueryClient, renderRouter } from "./render";

const challenge: OtpChallenge = {
  challenge_id: "ch-9",
  expires_in: 300,
  resend_after: 30,
  next: "code",
};

const signedIn = {
  access_token: "at-1",
  access_expires_in: 900,
  access_expires_at: "2026-01-01T00:15:00Z",
  session_expires_at: "2026-02-01T00:00:00Z",
  user: { id: "c1", phone: "+2348012345678", market: "NG", created_at: "2026-01-01T00:00:00Z" },
};

let fake: ReturnType<typeof installFakeAdapter>;

afterEach(() => {
  fake.restore();
  accessTokenStore.clear();
});

function visitSignup(routes: Record<string, Reply[]>) {
  fake = installFakeAdapter(api, routes);
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.session(), null);
  const { router } = renderRouter({ routeTree, initialPath: "/signup", queryClient });
  return { ...fake, router };
}

async function fillSignup(
  user: ReturnType<typeof userEvent.setup>,
  { password = "secret123", acceptTerms = true } = {},
) {
  await user.type(await screen.findByLabelText("Full name"), "Ada Obi");
  await user.type(screen.getByLabelText("Phone number"), "0801 234 5678");
  await user.type(screen.getByLabelText("Password"), password);
  if (acceptTerms) await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Create account" }));
}

describe("/signup", () => {
  it("creates the account in E.164 and goes to Verify account", async () => {
    const { sent, router } = visitSignup({ "auth/signup": [{ status: 202, data: challenge }] });

    await fillSignup(userEvent.setup());

    await waitFor(() => expect(router.state.location.pathname).toBe("/verify"));
    expect(bodyOf(requestsTo(sent, "auth/signup")[0])).toEqual({
      phone: "+2348012345678",
      full_name: "Ada Obi",
      password: "secret123",
      terms_version: TERMS_VERSION,
    });
  });

  it("goes on to identity verification once the code is accepted", async () => {
    const { router } = visitSignup({
      "auth/signup": [{ status: 202, data: challenge }],
      "auth/signup/verify": [{ status: 201, data: signedIn }],
    });
    const user = userEvent.setup();

    await fillSignup(user);
    await user.type(await screen.findByLabelText("Verification code"), "123456");

    await waitFor(() => expect(router.state.location.pathname).toBe("/verify-identity"));
  });

  it("needs the consent box ticked", async () => {
    const { sent } = visitSignup({});

    await fillSignup(userEvent.setup(), { acceptTerms: false });

    expect(await screen.findByText("Accept the terms to continue")).toBeTruthy();
    expect(requestsTo(sent, "auth/signup")).toHaveLength(0);
  });

  it("ticks each password rule as it is met", async () => {
    visitSignup({});
    const user = userEvent.setup();

    const password = await screen.findByLabelText("Password");
    await user.type(password, "abc");

    const field = password.closest<HTMLElement>(".hui-field");
    const rules = within(field!)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(rules).toEqual(["Still needed:8+ characters", "Done:A letter", "Still needed:A number"]);
  });

  it("shows a taken number on the phone field with a Sign in link, cleared on edit", async () => {
    visitSignup({
      "auth/signup": [{ status: 409, data: errorBody("auth.phone_taken", "taken") }],
    });
    const user = userEvent.setup();

    await fillSignup(user);

    const phone = screen.getByLabelText("Phone number");
    await waitFor(() =>
      expect(describedText(phone)).toContain("This number already has an account."),
    );
    const field = phone.closest<HTMLElement>(".hui-field");
    expect(within(field!).getByRole("link", { name: "Sign in" })).toBeTruthy();
    await user.type(phone, "1");
    expect(describedText(phone)).not.toContain("already has an account");
  });
});
