import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Idempotent } from "@/api/idempotency";
import { sessionQueryOptions } from "./queries";
import type { LoginInput, RegisterInput } from "./schemas";
import { getAuthService } from "./services";

// Forms render API errors themselves, so login/register skip the global toast.
// Guards read the session with a static staleTime, so refetch it (staleTime 0) after signing in.
export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { loginCustomer } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<LoginInput>) =>
      loginCustomer(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: () => queryClient.query({ ...sessionQueryOptions(), staleTime: 0 }),
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  const { registerCustomer } = getAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<RegisterInput>) =>
      registerCustomer(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: () => queryClient.query({ ...sessionQueryOptions(), staleTime: 0 }),
  });
}

/** Call as `logout.mutate(createIdempotencyKey())` when the user taps "Sign out". */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logoutCustomer } = getAuthService();

  return useMutation({
    mutationFn: logoutCustomer,
    onSettled: async () => {
      queryClient.clear();
      await router.invalidate();
    },
  });
}
