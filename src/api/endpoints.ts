// All paths are relative to /v1 (see API_BASE_URL in api.ts). Assumed from the API design;
// verify against Swagger and fix here only.
export const endpoints = {
  auth: {
    login: "auth/login",
    register: "auth/register",
    refresh: "auth/refresh",
    logout: "auth/logout",
    me: "auth/me",
  },
  products: {
    index: "products",
    single: (slug: string) => `products/${encodeURIComponent(slug)}`,
  },
  admin: {
    auth: {
      login: "admin/auth/login",
      refresh: "admin/auth/refresh",
      logout: "admin/auth/logout",
      me: "admin/auth/me",
    },
    products: {
      index: "admin/products",
    },
    stats: {
      dashboard: "admin/stats/dashboard",
    },
  },
} as const;
