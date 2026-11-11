import { Link } from "@tanstack/react-router";
import { formatMoney } from "@/lib/currency";
import type { Product } from "../schemas";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col gap-3"
    >
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
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
        <span className="text-sm font-medium">{product.name}</span>
        <span className="text-sm text-muted-foreground">{formatMoney(product.price)}</span>
      </div>
    </Link>
  );
}
