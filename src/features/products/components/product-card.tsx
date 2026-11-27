import { Link } from "@tanstack/react-router";
import { FavouriteButton } from "@/features/favourites/components/favourite-button";
import type { Favourite } from "@/features/favourites/schemas";
import { formatMoney } from "@/lib/currency";
import type { Product } from "../schemas";

/** What a favourite keeps of a product. The catalogue has no store field yet. */
function toFavourite(product: Product): Favourite {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    store: "",
    price: product.price,
    imageUrl: product.imageUrl,
  };
}

// The heart is a sibling of the link (a button can't sit inside a link).
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="relative">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group flex flex-col gap-3"
      >
        <div className="aspect-square overflow-hidden rounded-xl bg-tint">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 ease-out hover-pointer:scale-[1.03]"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-body-sm font-medium">{product.name}</span>
          <span className="text-price text-primary">{formatMoney(product.price)}</span>
        </div>
      </Link>
      <FavouriteButton item={toFavourite(product)} className="absolute top-2 right-2" />
    </div>
  );
}
