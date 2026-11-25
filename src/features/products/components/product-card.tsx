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
  );
}
