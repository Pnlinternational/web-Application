import { adminApi } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { parseResponse } from "@/api/parse";
import { isNoSessionError } from "@/features/auth/services";
import type { LoginInput } from "@/features/auth/schemas";
import { type AdminUser, adminUserSchema } from "./schemas";

export function getAdminAuthService() {
  const { login, logout, me } = endpoints.admin.auth;

  async function loginAdmin(data: LoginInput, idempotencyKey: string) {
    await adminApi.post(login, data, { idempotencyKey });
  }

  async function logoutAdmin(idempotencyKey: string) {
    await adminApi.post(logout, undefined, { idempotencyKey });
  }

  async function getOptionalAdminProfile(): Promise<AdminUser | null> {
    try {
      const res = await adminApi.get(me, { _skipAuthRedirect: true });
      return parseResponse(adminUserSchema, res.data, me);
    } catch (error) {
      if (isNoSessionError(error)) return null;
      throw error;
    }
  }

  return { loginAdmin, logoutAdmin, getOptionalAdminProfile };
}
