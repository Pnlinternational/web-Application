# Claude Context

## Architecture decisions

- **SPA, not TanStack Start.** The API is external; static hosting was preferred over a BFF runtime.
- **One app, route groups:** `(marketing)` landing, `(shop)` + `(auth)` customer, `admin/` admin. Guards live in
  pathless `_authed/route.tsx` `beforeLoad`s; areas are code-split via `autoCodeSplitting`.
- **UI:** `@hackert-ui/*` (your library, pinned, exempt from pnpm's release-age delay) for forms, used as documented
  (`useAppForm`, `Form`, `FormField` + `field.TextInput`, no local wrappers), `Button` and `Card`; `AppProvider` theme in `src/lib/ui-theme.ts` duplicates `app.css` token values.
  Local Checkbox (`CheckboxInput` on hackert's `useFieldContext`), Spinner and Skeleton remain until hackert-ui
  ships them. Dates go through dayjs (`src/lib/format.ts`).
- **Originally hand-rolled UI** on Tailwind v4 tokens (`src/styles/app.css`), Emil-style motion (custom ease curves,
  `active:scale-[0.97]`, `hover-pointer:` variant gating hover to real pointers).
- **API layer (axios):** `src/api/api.ts` (instances + refresh queue) → `endpoints.ts` → `features/*/services.ts`
  (`getXService()`) → `queries.ts` / `mutations.ts` hooks → routes/components. Zod parses every response
  (`parseResponse`). Query strings via `appendQueryParams` (`lib/utils.ts`).
- **Auth (customer):** access token in memory only (`src/api/access-token.ts`), sent as `Authorization: Bearer`;
  refresh token in the API's httpOnly `__Host-cus_rt` cookie (shop transport, ADR 0014). The customer client sends
  `X-PNL-CSRF: 1`. Refresh is single-flight (in-tab promise + `navigator.locks` across tabs); 401 `refresh_invalid`
  signs out, 409 `refresh_superseded` retries once, 429/5xx/network keep the session. Cold start calls
  `refreshSession()` before `GET me`. Sign-in seeds the session cache from `SignedIn.user` (no `/me` refetch).
  Admin client (`adminApi`) still uses the old cookie-only assumption and has no bearer.
- **Dev shop transport (`config/shop-transport.ts`):** staging refuses any POST with a localhost `Origin`
  (403 `auth.origin_refused`). In dev/preview a middleware plays the shop address for `POST /v1/auth/*`: requires
  `X-PNL-CSRF`, calls the API as an app (no Origin), and moves refresh/reset tokens between JSON bodies and httpOnly
  localhost cookies (`pnl_dev_rt`, `pnl_dev_reset`). The generic `/v1` proxy strips `Origin`/`Sec-Fetch-*`.
- **Idempotency:** every non-GET (POST, DELETE) sends `Idempotency-Key`. Keys are made when the user acts
  (`withIdempotencyKey(value)` / `createIdempotencyKey()`) and passed as mutation variables, so retries reuse
  them. That is why mutations now retry network/5xx errors.
- **Same-origin `/v1`:** no CORS by design (API ADR 0014). The Vite dev/preview proxy adds `X-Staging-Key` from
  `STAGING_KEY` in `.env.local`. Never give it a `VITE_` prefix (it would ship in the bundle).
- **Money** is integer minor units everywhere; conversion goes through a `RatesProvider` strategy
  (static table for now).
- **Errors:** HTTP failures normalise to `ApiError | NetworkError | ParseError`; `QueryBoundary` for widgets,
  `RouteErrorComponent` for loaders, `AppErrorBoundary` as last resort; toasts only for background
  refetch and non-silent mutation failures.

## API contract

- Source of truth: staging OpenAPI at `/v1/docs/openapi.json` (needs the staging key; via the dev proxy).
- Confirmed: error envelope `{ error: { code, message, request_id } }` with a closed set of codes; POST/DELETE need
  an `Idempotency-Key` of 16–128 chars; login is by NG/GH phone + password.
- Customer auth: `auth/login` → 200 `SignedIn` or 202 `OtpChallenge` → `auth/login/verify`; `auth/signup` →
  `auth/signup/verify` (201 `SignedIn`); `auth/challenges/{id}/resend`; `auth/refresh` → `Tokens`; `auth/logout` → 204;
  `auth/password/reset` → `/verify` (`client_key`, reset token in cookie) → `/complete` (204, or 202 72-hour hold).
  `GET me` → `{ id, phone, market: NG|GH, created_at }` (no name). `me/sessions`, `me/sessions/others/revoke`,
  `DELETE me/sessions/{id}`.
- `TERMS_VERSION` (`src/features/auth/constants.ts`) is a placeholder until the API team confirms the value.
- Still assumed: admin auth paths, `products`, `admin/products`, `admin/stats/dashboard`, list and money shapes.
- Not yet integrated: device keys (`device_proof`, so every web sign-in asks for a code), Turnstile, email/OIDC,
  staff auth.

## Lessons learned

- **Rejected/redirected:** I recommended TanStack Start as a BFF (SSR + httpOnly cookies); you chose SPA only.
  I recommended shadcn on Base UI; you chose hand-rolled components.
- Guards read the session via `query({ staleTime: "static" })` with no observer, so `invalidateQueries`
  won't refetch it — after login, `query({ staleTime: 0 })` is required or guards see stale `null`.
- **Redirected:** you replaced my fetch client with your axios services pattern (simpler to read and familiar),
  and pointed me to the API team's rules (cookies, idempotency per user action, staging proxy).
- Submit buttons must not disable on `!canSubmit`: after a failed submit that blocks retrying the same action.
- Keep `vite.config.ts` a plain object (vp reads fmt/lint/staged from it); mode-dependent config goes in a
  plugin `config` hook. Server-only checks go in `configureServer` so lint/build/tests don't need secrets.
- TanStack deprecations (Query: `fetchQuery`/`ensureQueryData`/`prefetchQuery` → `query()`; Form/Store:
  `useStore` → `useSelector`). `typescript/no-deprecated` is now a lint error to catch these early.
  `useSelector` compares with `Object.is`, so select primitives/stable refs, never fresh arrays.
- Route tree is generated by the Vite plugin: `build` must run `vp build` before `tsc`.
- jsdom's `DOMException` is not `instanceof Error`; detect aborts by `name`.
- `@testing-library/jest-dom/vitest` imports `vitest` directly, which Vite+ doesn't expose; use plain assertions.
- TanStack Table v9 (not v8): `useTable({ features: tableFeatures({...}) })`, `table.FlexRender`; number
  columns sort descending first.
- Router writes validated search defaults into URLs; use `stripSearchParams(defaults)` middleware.
- Commit hooks: `.husky/pre-commit` runs `vp staged` (Vite+ bundles lint-staged and a husky-compatible
  dispatcher), so no `husky`/`lint-staged` packages. Staged rules live in `vite.config.ts` → `staged`.
  `prepare` reinstalls the dispatcher; skip hooks with `HUSKY=0` or `VP_GIT_HOOKS=0`.
- **Redirected:** you chose a dev proxy that emulates the shop address over two client transports, and asked for
  your `@hackert-ui/*` packages for forms/buttons and dayjs for all date formatting. You rejected wrapping
  hackert's fields in a local `TextField`/`createFormHook`: use the library's own API directly.
- The API team's documented dev proxy (only adds `X-Staging-Key`) fails every auth POST with `origin_refused`:
  verify proxy setups against staging with a harmless request before building on them.
- pnpm 12 holds back releases younger than its minimum release age; a fresh `@hackert-ui` publish installs an older
  version silently. Check the installed version after `pnpm add`.
- `@hackert-ui/form` imports the full hugeicons barrel (~10s in Node); tests inline it and stub the icons
  (`vite.config.ts` test config, `src/test/hugeicons-stub.ts`).
- Route tests go in `src/test/`, not `src/routes/` (the router plugin treats any file there as a route).
- Form submit-time field errors block resubmitting the _same_ value (e.g. the same wrong OTP): the click looks
  ignored. Undecided whether to keep it.
