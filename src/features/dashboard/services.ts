import { adminApi } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { parseResponse } from "@/api/parse";
import { dashboardStatsSchema } from "./schemas";

export function getDashboardService() {
  const { dashboard } = endpoints.admin.stats;

  async function getDashboardStats(signal?: AbortSignal) {
    const res = await adminApi.get(dashboard, { signal });
    return parseResponse(dashboardStatsSchema, res.data, dashboard);
  }

  return { getDashboardStats };
}
