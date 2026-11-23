import { accessTokenStore } from "@/api/access-token";
import { api, refreshSession } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { isApiError } from "@/api/errors";
import { parseResponse } from "@/api/parse";
import { TERMS_VERSION } from "./constants";
import {
  deviceListSchema,
  type LoginInput,
  meSchema,
  type OtpChallenge,
  otpChallengeSchema,
  type RegisterInput,
  resendAcceptedSchema,
  resetGrantedSchema,
  resetHeldSchema,
  signedInSchema,
  type User,
} from "./schemas";

/** 401/403 on a session probe just means "not signed in". */
export function isNoSessionError(error: unknown) {
  return isApiError(error) && (error.status === 401 || error.status === 403);
}

export type LoginResult =
  | { kind: "signed_in"; user: User }
  | { kind: "code_sent"; challenge: OtpChallenge };

export type ResetCompleteResult = { kind: "done" } | { kind: "held"; appliesAt: string };

/** Marketing consent is only sent when something is ticked. */
export function toSignupRequest(data: RegisterInput) {
  const marketing = {
    ...(data.marketingEmail ? { email: true } : {}),
    ...(data.marketingSms ? { sms: true } : {}),
  };
  return {
    phone: data.phone,
    full_name: data.fullName,
    ...(data.email ? { email: data.email } : {}),
    password: data.password,
    terms_version: TERMS_VERSION,
    ...(Object.keys(marketing).length > 0 ? { marketing } : {}),
  };
}

// The refresh token is an httpOnly cookie; only the short-lived access token is kept (in memory).
export function getAuthService() {
  const { auth, me } = endpoints;

  function acceptSignedIn(data: unknown, endpoint: string) {
    const signedIn = parseResponse(signedInSchema, data, endpoint);
    accessTokenStore.set(signedIn);
    return signedIn.user;
  }

  async function loginCustomer(data: LoginInput, idempotencyKey: string): Promise<LoginResult> {
    const res = await api.post(auth.login, data, { idempotencyKey });
    if (res.status === 202) {
      return {
        kind: "code_sent",
        challenge: parseResponse(otpChallengeSchema, res.data, auth.login),
      };
    }
    return { kind: "signed_in", user: acceptSignedIn(res.data, auth.login) };
  }

  async function verifyLogin(data: { challengeId: string; code: string }, idempotencyKey: string) {
    const body = { challenge_id: data.challengeId, code: data.code };
    const res = await api.post(auth.loginVerify, body, { idempotencyKey });
    return acceptSignedIn(res.data, auth.loginVerify);
  }

  async function registerCustomer(data: RegisterInput, idempotencyKey: string) {
    const res = await api.post(auth.signup, toSignupRequest(data), { idempotencyKey });
    return parseResponse(otpChallengeSchema, res.data, auth.signup);
  }

  async function verifySignup(data: { challengeId: string; code: string }, idempotencyKey: string) {
    const body = { challenge_id: data.challengeId, code: data.code };
    const res = await api.post(auth.signupVerify, body, { idempotencyKey });
    return acceptSignedIn(res.data, auth.signupVerify);
  }

  async function resendCode(data: { challengeId: string }, idempotencyKey: string) {
    const endpoint = auth.resendCode(data.challengeId);
    const res = await api.post(endpoint, undefined, { idempotencyKey });
    return parseResponse(resendAcceptedSchema, res.data, endpoint);
  }

  async function logoutCustomer(idempotencyKey: string) {
    try {
      await api.post(auth.logout, undefined, { idempotencyKey });
    } finally {
      accessTokenStore.clear();
    }
  }

  async function requestPasswordReset(data: { phone: string }, idempotencyKey: string) {
    const res = await api.post(auth.passwordReset, data, { idempotencyKey });
    return parseResponse(otpChallengeSchema, res.data, auth.passwordReset);
  }

  async function verifyPasswordReset(
    data: { challengeId: string; code: string; clientKey: string },
    idempotencyKey: string,
  ) {
    const body = { challenge_id: data.challengeId, code: data.code, client_key: data.clientKey };
    const res = await api.post(auth.passwordResetVerify, body, { idempotencyKey });
    return parseResponse(resetGrantedSchema, res.data, auth.passwordResetVerify);
  }

  async function completePasswordReset(
    data: { clientKey: string; password: string },
    idempotencyKey: string,
  ): Promise<ResetCompleteResult> {
    const body = { client_key: data.clientKey, password: data.password };
    const res = await api.post(auth.passwordResetComplete, body, { idempotencyKey });
    if (res.status === 202) {
      const held = parseResponse(resetHeldSchema, res.data, auth.passwordResetComplete);
      return { kind: "held", appliesAt: held.applies_at };
    }
    return { kind: "done" };
  }

  // Used by guards and the public header: a 401 is the normal logged-out case, so skip the
  // interceptor's login redirect and report "no session". Other failures still surface.
  // On a cold start there is no access token yet: refresh first instead of 401 -> refresh -> retry.
  async function getOptionalProfile(): Promise<User | null> {
    try {
      if (!accessTokenStore.get()) await refreshSession();
      const res = await api.get(me.index, { _skipAuthRedirect: true });
      return parseResponse(meSchema, res.data, me.index);
    } catch (error) {
      if (isNoSessionError(error)) return null;
      throw error;
    }
  }

  async function listDevices() {
    const res = await api.get(me.sessions);
    return parseResponse(deviceListSchema, res.data, me.sessions).sessions;
  }

  async function revokeOtherDevices(idempotencyKey: string) {
    await api.post(me.revokeOtherSessions, undefined, { idempotencyKey });
  }

  async function revokeDevice(id: string, idempotencyKey: string) {
    await api.delete(me.session(id), { idempotencyKey });
  }

  return {
    loginCustomer,
    verifyLogin,
    registerCustomer,
    verifySignup,
    resendCode,
    logoutCustomer,
    requestPasswordReset,
    verifyPasswordReset,
    completePasswordReset,
    getOptionalProfile,
    listDevices,
    revokeOtherDevices,
    revokeDevice,
  };
}
