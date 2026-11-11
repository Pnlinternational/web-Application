import { z } from "zod";
import { moneySchema } from "@/lib/schemas";

export const dashboardStatsSchema = z.object({
  revenue: moneySchema,
  orders: z.number().int().nonnegative(),
  customers: z.number().int().nonnegative(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
