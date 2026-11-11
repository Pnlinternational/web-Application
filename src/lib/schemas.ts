import { z } from "zod";

// Shared API shapes. Money arrives as integer minor units, matching lib/currency.
export const moneySchema = z.object({
  amount: z.number().int(),
  currency: z.string().length(3),
});

// Assumed list envelope from the external API.
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;
