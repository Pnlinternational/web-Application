import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idempotent } from "@/api/idempotency";
import type { User } from "@/features/auth/schemas";
import { addressKeys } from "./query-keys";
import type { AddressInput } from "./schemas";
import { getAddressService } from "./services";

// Default handling is server-owned: every change refetches the list rather than guessing.
function useRefetchAddresses(user: User) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: addressKeys.all(user.id) });
}

export function useSaveAddressMutation(user: User) {
  const refetch = useRefetchAddresses(user);

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ id?: string; input: AddressInput }>) => {
      const service = getAddressService(user);
      return data.id
        ? service.update(data.id, data.input, idempotencyKey)
        : service.create(data.input, idempotencyKey);
    },
    meta: { silent: true },
    onSuccess: refetch,
  });
}

export function useDeleteAddressMutation(user: User) {
  const refetch = useRefetchAddresses(user);

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ id: string }>) =>
      getAddressService(user).remove(data.id, idempotencyKey),
    onSuccess: refetch,
  });
}

export function useSetDefaultAddressMutation(user: User) {
  const refetch = useRefetchAddresses(user);

  return useMutation({
    mutationFn: ({ data, idempotencyKey }: Idempotent<{ id: string }>) =>
      getAddressService(user).setDefault(data.id, idempotencyKey),
    onSuccess: refetch,
  });
}
