// All paths are relative to /v1 (see API_BASE_URL in api.ts); customer auth is confirmed against
// the staging OpenAPI. Admin paths are still assumed: verify and fix here only.
export const endpoints = {
  auth: {
    /** Every customer auth path starts with this; see authEndpoints in api.ts. */
    prefix: "auth/",
    login: "auth/login",
    loginVerify: "auth/login/verify",
    signup: "auth/signup",
    signupVerify: "auth/signup/verify",
    refresh: "auth/refresh",
    logout: "auth/logout",
    resendCode: (challengeId: string) =>
      `auth/challenges/${encodeURIComponent(challengeId)}/resend`,
    passwordReset: "auth/password/reset",
    passwordResetVerify: "auth/password/reset/verify",
    passwordResetComplete: "auth/password/reset/complete",
  },
  me: {
    index: "me",
    sessions: "me/sessions",
    revokeOtherSessions: "me/sessions/others/revoke",
    session: (id: string) => `me/sessions/${encodeURIComponent(id)}`,
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
