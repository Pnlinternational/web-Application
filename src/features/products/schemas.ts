import { z } from "zod";
import { moneySchema, paginatedSchema, sortOrderSchema } from "@/lib/schemas";

export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  price: moneySchema,
  imageUrl: z.url().nullable(),
  stock: z.number().int().nonnegative(),
  status: z.enum(["active", "draft", "archived"]),
  createdAt: z.iso.datetime({ offset: true }),
});

export type Product = z.infer<typeof productSchema>;

export const productPageSchema = paginatedSchema(productSchema);

export const productSortFields = ["name", "price", "stock", "createdAt"] as const;

// Doubles as the route search schema: URLs like /products?page=2&sortBy=price&order=asc.
// .catch() keeps hand-edited or stale URLs from crashing the page.
export const productListParamsSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  pageSize: z.number().int().min(1).max(100).default(20).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  sortBy: z.enum(productSortFields).optional().catch(undefined),
  order: sortOrderSchema.optional().catch(undefined),
});

export type ProductListParams = z.infer<typeof productListParamsSchema>;

/** Defaults are stripped from URLs so /products stays clean instead of ?page=1&pageSize=20. */
export const productListDefaults = { page: 1, pageSize: 20 } as const;
