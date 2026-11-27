import { useSuspenseQuery } from "@tanstack/react-query";
import type { User } from "@/features/auth/schemas";
import { addressKeys } from "./query-keys";
import { getAddressService } from "./services";

export function useAddresses(user: User) {
  return useSuspenseQuery({
    queryKey: addressKeys.list(user.id),
    queryFn: () => getAddressService(user).list(),
  });
}

export function useAddress(user: User, id: string) {
  return useSuspenseQuery({
    queryKey: addressKeys.detail(user.id, id),
    queryFn: () => getAddressService(user).get(id),
  });
}
