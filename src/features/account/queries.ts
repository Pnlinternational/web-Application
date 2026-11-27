import { queryOptions, skipToken, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/queries";
import type { User } from "@/features/auth/schemas";
import { accountKeys } from "./query-keys";
import { getAccountService } from "./services";

/** For components that only render under the signed-in guard (or after checking the session). */
export function useSignedInUser(): User {
  const { data } = useSession();
  if (!data) {
    throw new Error("useSignedInUser needs a signed-in session; render it under the _authed guard");
  }
  return data;
}

export function profileQueryOptions(user: User) {
  return queryOptions({
    queryKey: accountKeys.profile(user.id),
    queryFn: () => getAccountService(user).getProfile(),
  });
}

/** Non-suspense: the header and sidebar show the name when it arrives. */
export function useProfile(user: User | null | undefined) {
  return useQuery({
    queryKey: accountKeys.profile(user?.id ?? "guest"),
    queryFn: user ? () => getAccountService(user).getProfile() : skipToken,
  });
}

export function useSuspenseProfile(user: User) {
  return useSuspenseQuery(profileQueryOptions(user));
}

export function useWallet(user: User) {
  return useSuspenseQuery({
    queryKey: accountKeys.wallet(user.id),
    queryFn: () => getAccountService(user).getWallet(),
  });
}

export function useIdentityStatus(user: User) {
  return useSuspenseQuery({
    queryKey: accountKeys.identity(user.id),
    queryFn: () => getAccountService(user).getIdentityStatus(),
  });
}

export function useOrderCounts(user: User) {
  return useSuspenseQuery({
    queryKey: accountKeys.orderCounts(user.id),
    queryFn: () => getAccountService(user).getOrderCounts(),
  });
}
