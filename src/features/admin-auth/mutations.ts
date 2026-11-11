import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Idempotent } from "@/api/idempotency";
import type { LoginInput } from "@/features/auth/schemas";
import { adminSessionQueryOptions } from "./queries";
import { adminKeys } from "./query-keys";
import { getAdminAuthService } from "./services";

export function useAdminLoginMutation() {
  const queryClient = useQueryClient();
  const { loginAdmin } = getAdminAuthService();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<LoginInput>) =>
      loginAdmin(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: () => queryClient.query({ ...adminSessionQueryOptions(), staleTime: 0 }),
  });
}

/** Call as `logout.mutate(createIdempotencyKey())` when the admin taps "Sign out". */
export function useAdminLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { logoutAdmin } = getAdminAuthService();

  return useMutation({
    mutationFn: logoutAdmin,
    onSettled: async () => {
      queryClient.removeQueries({ queryKey: adminKeys.all });
      await router.invalidate();
    },
  });
}
