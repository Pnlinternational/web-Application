import {
  createFileRoute,
  type ErrorComponentProps,
  Link,
  stripSearchParams,
} from "@tanstack/react-router";
import { isNotFoundError } from "@/api/errors";
import { RouteErrorComponent } from "@/components/errors/route-error";
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
  errorComponent: ProductsError,
});

// The API has no catalogue yet and answers 404; the list shows up on its own once it ships.
function ProductsError(props: ErrorComponentProps) {
  if (!isNotFoundError(props.error)) return <RouteErrorComponent {...props} />;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-h2">Products are coming soon</h1>
      <p className="text-body-sm text-muted">
        We're stocking the shelves. Check back shortly to start shopping.
      </p>
      <Link to="/" className="text-label text-primary underline-offset-4 hover-pointer:underline">
        Back to home
      </Link>
    </div>
  );
}

function ProductsPage() {
  const search = Route.useSearch();
  const { data } = useProductList(search);
  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-h2">Products</h1>
      {data.items.length === 0 ? (
        <p className="text-muted">No products match your search.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Pagination" className="flex items-center justify-between text-body-sm">
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page - 1 })}
          disabled={search.page <= 1}
          className="text-primary aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Previous
        </Link>
        <span className="text-muted">
          Page {search.page} of {pageCount}
        </span>
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page + 1 })}
          disabled={search.page >= pageCount}
          className="text-primary aria-disabled:pointer-events-none aria-disabled:opacity-40"
        >
          Next
        </Link>
      </nav>
    </div>
  );
}
