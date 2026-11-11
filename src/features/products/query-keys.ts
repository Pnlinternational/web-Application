import { adminKeys } from "@/features/admin-auth/query-keys";
import type { ProductListParams } from "./schemas";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const,
  adminList: (params: ProductListParams) => [...adminKeys.all, "products", params] as const,
};
