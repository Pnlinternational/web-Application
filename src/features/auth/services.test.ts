import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { accessTokenStore } from "@/api/access-token";
import { api } from "@/api/api";
import { errorBody, installFakeAdapter, type Reply } from "@/test/fake-api";
import { TERMS_VERSION } from "./constants";
import type { OtpChallenge, RegisterInput, User } from "./schemas";
import { getAuthService, toSignupRequest } from "./services";

const user: User = {
  id: "c1",
  phone: "+2348012345678",
  market: "NG",
  created_at: "2026-01-01T00:00:00Z",
};

const tokens = {
  access_token: "at-1",
  access_expires_in: 900,
  access_expires_at: "2026-01-01T00:15:00Z",
  session_expires_at: "2026-02-01T00:00:00Z",
};

const challenge: OtpChallenge = {
  challenge_id: "ch-1",
  expires_in: 300,
  resend_after: 30,
  next: "code",
};

const credentials = { phone: "+2348012345678", password: "secret123" };

let fake: ReturnType<typeof installFakeAdapter> | undefined;

function serve(routes: Record<string, Reply[]>) {
  fake = installFakeAdapter(api, routes);
  return fake;
}

beforeEach(() => {
  accessTokenStore.clear();
});

afterEach(() => {
  fake?.restore();
  fake = undefined;
});

describe("loginCustomer", () => {
  it("returns the user when the device is recognised (200)", async () => {
    serve({ "auth/login": [{ status: 200, data: { ...tokens, user } }] });

    const result = await getAuthService().loginCustomer(credentials, "key-from-tap-0001");

    expect(result).toEqual({ kind: "signed_in", user });
  });

  it("keeps the access token in memory when signed in", async () => {
    serve({ "auth/login": [{ status: 200, data: { ...tokens, user } }] });

    await getAuthService().loginCustomer(credentials, "key-from-tap-0001");

    expect(accessTokenStore.get()?.token).toBe("at-1");
  });

  it("returns the challenge when a code was sent (202)", async () => {
    serve({ "auth/login": [{ status: 202, data: challenge }] });

    const result = await getAuthService().loginCustomer(credentials, "key-from-tap-0001");

    expect(result).toEqual({ kind: "code_sent", challenge });
  });
});

describe("getOptionalProfile", () => {
  it("refreshes before asking for the profile on a cold start", async () => {
    const { sent } = serve({
      "auth/refresh": [{ status: 200, data: tokens }],
      me: [{ status: 200, data: user }],
    });

    const profile = await getAuthService().getOptionalProfile();

    expect(profile).toEqual(user);
    expect(sent.map((config) => config.url)).toEqual(["auth/refresh", "me"]);
  });

  it("returns null without asking for the profile when the refresh is rejected", async () => {
    const { sent } = serve({
      "auth/refresh": [{ status: 401, data: errorBody("auth.refresh_invalid") }],
    });

    const profile = await getAuthService().getOptionalProfile();

    expect(profile).toBeNull();
    expect(sent.map((config) => config.url)).toEqual(["auth/refresh"]);
  });

  it("skips the refresh when an access token is already in memory", async () => {
    accessTokenStore.set(tokens);
    const { sent } = serve({ me: [{ status: 200, data: user }] });

    await getAuthService().getOptionalProfile();

    expect(sent.map((config) => config.url)).toEqual(["me"]);
  });
});

describe("toSignupRequest", () => {
  const input: RegisterInput = {
    fullName: "Ada Obi",
    phone: "+2348012345678",
    email: "",
    password: "secret123",
    acceptTerms: true,
    marketingEmail: false,
    marketingSms: false,
  };

  it("sends snake_case fields with the current terms version", () => {
    expect(toSignupRequest(input)).toEqual({
      phone: "+2348012345678",
      full_name: "Ada Obi",
      password: "secret123",
      terms_version: TERMS_VERSION,
    });
  });

  it("includes the email only when given", () => {
    expect(toSignupRequest({ ...input, email: "ada@example.com" })).toMatchObject({
      email: "ada@example.com",
    });
  });

  it("includes only the ticked marketing channels", () => {
    expect(toSignupRequest({ ...input, marketingSms: true }).marketing).toEqual({ sms: true });
  });
});
