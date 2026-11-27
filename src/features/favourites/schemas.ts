import { z } from "zod";
import { moneySchema } from "@/lib/schemas";

// What the Favourites list shows, stored with the favourite so it renders without a product fetch.
export const favouriteSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  name: z.string(),
  /** Source store, e.g. "Taobao". */
  store: z.string(),
  price: moneySchema,
  imageUrl: z.string().nullable(),
});

export type Favourite = z.infer<typeof favouriteSchema>;
