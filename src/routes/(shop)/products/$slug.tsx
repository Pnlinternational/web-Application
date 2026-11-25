import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/errors/not-found";
import { Button } from "@hackert-ui/ui";
import { productQueryOptions, useProduct } from "@/features/products/queries";
import { formatMoney } from "@/lib/currency";
import { orNotFound } from "@/lib/route-errors";

export const Route = createFileRoute("/(shop)/products/$slug")({
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.query({ ...productQueryOptions(params.slug), staleTime: "static" }),
    ),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} — PNL Store` : "PNL Store" }],
  }),
  notFoundComponent: () => (
    <NotFound
      title="Product not found"
      message="This product may have been removed."
      homeTo="/products"
      homeLabel="Browse products"
    />
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useProduct(slug);
  const inStock = product.stock > 0;

  return (
    <article className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-xl bg-tint">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="size-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="text-h2">{product.name}</h1>
        <p className="font-heading text-card-title text-primary">{formatMoney(product.price)}</p>
        <p className="text-muted">{product.description}</p>
        <Button size="lg" radius="lg" disabled={!inStock} className="mt-4 self-start">
          {inStock ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </article>
  );
}
