import { createFileRoute, stripSearchParams, Link } from "@tanstack/react-router";
import { ProductCard } from "@/features/products/components/product-card";
import { productListQueryOptions, useProductList } from "@/features/products/queries";
import { productListDefaults, productListParamsSchema } from "@/features/products/schemas";

export const Route = createFileRoute("/(shop)/products/")({
  validateSearch: productListParamsSchema,
  search: { middlewares: [stripSearchParams(productListDefaults)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...productListQueryOptions(deps), staleTime: "static" }),
  head: () => ({ meta: [{ title: "Products — PNL Store" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const { data } = useProductList(search);
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      {data.items.length === 0 ? (
        <p className="text-muted-foreground">No products match your search.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page - 1 })}
          disabled={search.page <= 1}
          className="text-accent aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Previous
        </Link>
        <span className="text-muted-foreground">
          Page {search.page} of {pageCount}
        </span>
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page + 1 })}
          disabled={search.page >= pageCount}
          className="text-accent aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
