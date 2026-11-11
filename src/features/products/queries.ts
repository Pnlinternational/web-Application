import { keepPreviousData, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { productKeys } from "./query-keys";
import type { ProductListParams } from "./schemas";
import { getAdminProductService, getProductService } from "./services";

// Loaders prime these with `queryClient.query({ ...options, staleTime: "static" })`;
// components read them through the hooks below.
export function productListQueryOptions(params: ProductListParams) {
  const { listProducts } = getProductService();
  return queryOptions({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => listProducts(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function productQueryOptions(slug: string) {
  const { getProduct } = getProductService();
  return queryOptions({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }) => getProduct(slug, signal),
  });
}

export function adminProductListQueryOptions(params: ProductListParams) {
  const { listAdminProducts } = getAdminProductService();
  return queryOptions({
    queryKey: productKeys.adminList(params),
    queryFn: ({ signal }) => listAdminProducts(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProductList(params: ProductListParams) {
  return useSuspenseQuery(productListQueryOptions(params));
}

export function useProduct(slug: string) {
  return useSuspenseQuery(productQueryOptions(slug));
}

export function useAdminProductList(params: ProductListParams) {
  return useSuspenseQuery(adminProductListQueryOptions(params));
}
