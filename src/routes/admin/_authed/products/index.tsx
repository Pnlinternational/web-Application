import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { AdminProductsTable } from "@/features/products/components/admin-products-table";
import { adminProductListQueryOptions, useAdminProductList } from "@/features/products/queries";
import { productListDefaults, productListParamsSchema } from "@/features/products/schemas";

export const Route = createFileRoute("/admin/_authed/products/")({
  validateSearch: productListParamsSchema,
  search: { middlewares: [stripSearchParams(productListDefaults)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.query({ ...adminProductListQueryOptions(deps), staleTime: "static" }),
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useAdminProductList(params);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
      <AdminProductsTable
        page={data}
        params={params}
        onParamsChange={(next) => void navigate({ search: next })}
      />
    </div>
  );
}
