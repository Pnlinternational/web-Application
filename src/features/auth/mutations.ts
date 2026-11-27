import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Idempotent } from "@/api/idempotency";
import { AFTER_SIGN_OUT_PATH } from "./constants";
import { authKeys } from "./query-keys";
import type { LoginInput, RegisterInput, User } from "./schemas";
import { getAuthService } from "./services";

// Forms render API errors themselves, so the auth mutations skip the global toast.
// Sign-in returns the user, so seed the session cache instead of refetching /me.
function seedSession(queryClient: QueryClient, user: User) {
  queryClient.setQueryData(authKeys.session(), user);
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { loginCustomer } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<LoginInput>) =>
      loginCustomer(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: (result) => {
      if (result.kind === "signed_in") seedSession(queryClient, result.user);
    },
  });
}

export function useVerifyLoginMutation() {
  const queryClient = useQueryClient();
  const { verifyLogin } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ challengeId: string; code: string }>) =>
      verifyLogin(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: (user) => seedSession(queryClient, user),
  });
}

export function useRegisterMutation() {
  const { registerCustomer } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<RegisterInput>) =>
      registerCustomer(data, idempotencyKey),
    meta: { silent: true },
  });
}

export function useVerifySignupMutation() {
  const queryClient = useQueryClient();
  const { verifySignup } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ challengeId: string; code: string }>) =>
      verifySignup(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: (user) => seedSession(queryClient, user),
  });
}

/** Resend is silent: the code form shows the error next to the resend button. */
export function useResendCodeMutation() {
  const { resendCode } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ challengeId: string }>) =>
      resendCode(data, idempotencyKey),
    meta: { silent: true },
  });
}

export function useRequestPasswordResetMutation() {
  const { requestPasswordReset } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ phone: string }>) =>
      requestPasswordReset(data, idempotencyKey),
    meta: { silent: true },
  });
}

export function useVerifyPasswordResetMutation() {
  const { verifyPasswordReset } = getAuthService();

  return useMutation({
    mutationFn: ({
      data,
      idempotencyKey,
    }: Idempotent<{ challengeId: string; code: string; clientKey: string }>) =>
      verifyPasswordReset(data, idempotencyKey),
    meta: { silent: true },
  });
}

export function useCompletePasswordResetMutation() {
  const { completePasswordReset } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ clientKey: string; password: string }>) =>
      completePasswordReset(data, idempotencyKey),
    meta: { silent: true },
  });
}

/**
 * Call as `logout.mutate(createIdempotencyKey())` when the user confirms "Sign out".
 * Signs out on this device even if the server call fails: caches are cleared and the session is
 * set to null (not refetched, which could sign the user straight back in), then it navigates to
 * `redirectTo` (the guest Account by default). The server-side refresh cookie can only be revoked
 * by the API, so a failed call can leave it valid until it expires.
 */
export function useLogoutMutation({
  redirectTo = AFTER_SIGN_OUT_PATH,
}: { redirectTo?: "/account" | "/forgot-password" } = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logoutCustomer } = getAuthService();

  return useMutation({
    mutationFn: logoutCustomer,
    meta: { silent: true },
    onSettled: async () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.session(), null);
      await router.navigate({ to: redirectTo });
    },
  });
}

/** Call as `mutate(createIdempotencyKey())` on tap. */
export function useRevokeOtherDevicesMutation() {
  const queryClient = useQueryClient();
  const { revokeOtherDevices } = getAuthService();

  return useMutation({
    mutationFn: revokeOtherDevices,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.devices() }),
  });
}

export function useRevokeDeviceMutation() {
  const queryClient = useQueryClient();
  const { revokeDevice } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ id: string }>) =>
      revokeDevice(data.id, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.devices() }),
  });
}
