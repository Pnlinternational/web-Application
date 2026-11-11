import { queryOptions, useQuery } from "@tanstack/react-query";
import { authKeys } from "./query-keys";
import { getAuthService } from "./services";

export function sessionQueryOptions() {
  const { getOptionalProfile } = getAuthService();
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: getOptionalProfile,
    staleTime: 5 * 60_000,
  });
}

/** Non-suspense on purpose: headers render immediately and fill in the account link. */
export function useSession() {
  return useQuery(sessionQueryOptions());
}
