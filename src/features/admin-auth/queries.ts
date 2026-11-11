import { queryOptions } from "@tanstack/react-query";
import { adminKeys } from "./query-keys";
import { getAdminAuthService } from "./services";

export function adminSessionQueryOptions() {
  const { getOptionalAdminProfile } = getAdminAuthService();
  return queryOptions({
    queryKey: adminKeys.session(),
    queryFn: getOptionalAdminProfile,
    staleTime: 5 * 60_000,
  });
}
