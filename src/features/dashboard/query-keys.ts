import { adminKeys } from "@/features/admin-auth/query-keys";

export const dashboardKeys = {
  stats: () => [...adminKeys.all, "dashboard", "stats"] as const,
};
