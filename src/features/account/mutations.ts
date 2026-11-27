import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idempotent } from "@/api/idempotency";
import type { User } from "@/features/auth/schemas";
import { accountKeys } from "./query-keys";
import type { PasswordChange, ProfileUpdate } from "./schemas";
import { getAccountService } from "./services";

// Forms show their own errors, so these skip the global toast.
export function useUpdateProfileMutation(user: User) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<ProfileUpdate>) =>
      getAccountService(user).updateProfile(data, idempotencyKey),
    meta: { silent: true },
    onSuccess: async (profile) => {
      queryClient.setQueryData(accountKeys.profile(user.id), profile);
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile(user.id) });
    },
  });
}

export function useChangePasswordMutation(user: User) {
  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<PasswordChange>) =>
      getAccountService(user).changePassword(data, idempotencyKey),
    meta: { silent: true },
  });
}
