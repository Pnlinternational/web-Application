import { adminApi, api } from "@/api/api";
import { endpoints } from "@/api/endpoints";
import { parseResponse } from "@/api/parse";
import { appendQueryParams } from "@/lib/utils";
import { type ProductListParams, productPageSchema, productSchema } from "./schemas";

export function getProductService() {
  const { index, single } = endpoints.products;

  async function listProducts(params: ProductListParams, signal?: AbortSignal) {
    const res = await api.get(appendQueryParams(index, params), { signal });
    return parseResponse(productPageSchema, res.data, index);
  }

  async function getProduct(slug: string, signal?: AbortSignal) {
    const endpoint = single(slug);
    const res = await api.get(endpoint, { signal });
    return parseResponse(productSchema, res.data, endpoint);
  }

  return { listProducts, getProduct };
}

export function getAdminProductService() {
  const { index } = endpoints.admin.products;

  async function listAdminProducts(params: ProductListParams, signal?: AbortSignal) {
    const res = await adminApi.get(appendQueryParams(index, params), { signal });
    return parseResponse(productPageSchema, res.data, index);
  }

  return { listAdminProducts };
}
