import { api } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { isApiError } from "@/api/errors";
import { parseResponse } from "@/api/parse";
import type { LoginInput, RegisterInput, User } from "./schemas";
import { userSchema } from "./schemas";

/** 401/403 on a session probe just means "not signed in". */
export function isNoSessionError(error: unknown) {
  return isApiError(error) && (error.status === 401 || error.status === 403);
}

// Session tokens live in httpOnly cookies set by the API; nothing is stored client-side.
export function getAuthService() {
  const { login, register, logout, me } = endpoints.auth;

  async function loginCustomer(data: LoginInput, idempotencyKey: string) {
    await api.post(login, data, { idempotencyKey });
  }

  async function registerCustomer(data: RegisterInput, idempotencyKey: string) {
    const { name, phone, password } = data;
    await api.post(register, { name, phone, password }, { idempotencyKey });
  }

  async function logoutCustomer(idempotencyKey: string) {
    await api.post(logout, undefined, { idempotencyKey });
  }

  // Used by guards and the public header: a 401 is the normal logged-out case, so skip the
  // interceptor's login redirect and report "no session". Other failures still surface.
  async function getOptionalProfile(): Promise<User | null> {
    try {
      const res = await api.get(me, { _skipAuthRedirect: true });
      return parseResponse(userSchema, res.data, me);
    } catch (error) {
      if (isNoSessionError(error)) return null;
      throw error;
    }
  }

  return { loginCustomer, registerCustomer, logoutCustomer, getOptionalProfile };
}
