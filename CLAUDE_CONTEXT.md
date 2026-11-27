# Claude Context

## Architecture decisions

- **SPA, not TanStack Start.** The API is external; static hosting was preferred over a BFF runtime.
- **One app, route groups:** `(marketing)` landing, `(shop)` + `(auth)` customer, `admin/` admin. Guards live in
  pathless `_authed/route.tsx` `beforeLoad`s; areas are code-split via `autoCodeSplitting`.
- **UI:** `@hackert-ui/*` (your library, pinned, exempt from pnpm's release-age delay) for forms, used as documented
  (`useAppForm`, `Form`, `FormField` + `field.TextInput`, no local wrappers), `Button` and `Card`; `PNL_THEME` (`src/lib/ui-theme.ts`) is the only source for colours, radius, spacing and body font.
- **Theme bridge:** `ThemeVariables` (`src/components/theme/`) reads `useAppTheme()`/`useVariantColors()` and writes
  `--theme-*` vars (`light-dark()` pairs); `app.css` `@theme inline` maps Tailwind tokens onto them. Tokens the theme
  lacks (neutrals with provisional dark values, `font-heading` Bricolage, `radius-sheet*`, type scale `text-display…badge`,
  `desktop:` = 900px) live in `app.css @theme`. Only the type-scale sizes exist (`--text-*: initial`). `cn` registers them
  with tailwind-merge. `hackert-overrides.css` points `@hackert-ui/form`'s hardcoded neutrals and 14px inputs at tokens.
- **Contrast rule:** never put text on `variant="secondary"` (brand red: near-black text 4.53, flips to white on hover,
  3.14 on touch press; guarded by `src/test/theme-contrast.test.tsx`). Actions use primary, red text-bearing use danger.
  Warning text fails on `tint` (4.45); `border` fails 3:1 on `surface` (inputs sit on `card`).
- **Fonts:** Fontsource static packages. DM Sans has no ₦/₵ glyphs (falls back to `system-ui`); Bricolage has both.
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

- **Auth screens (web):** built from the Claude Design canvas "PNL Intro and Auth" (`design/` holds a gitignored
  snapshot; `project/web/WebAuth.dc.html` is the source of truth). One route per step: `/login`, `/signup`, `/verify`
  (signup, and login 202), `/forgot-password`, `/reset-code`, `/new-password`; `/verify-identity` is a placeholder.
  Steps hand over `{ challenge, phone, clientKey }` in router history state (`features/auth/flow.ts`), never the code
  or password; a later step without it redirects to the flow start. `AuthScreen` renders the navy header/panel and
  sheet; the title renders once (`useMediaQuery` picks header vs panel). Forms hold `market` + the number as typed and
  convert with `toE164` (`lib/phone.ts`) on submit, so services still get E.164. `PhoneInput`/`OtpInput` wrap hackert's
  own `TextInput` (label/error wiring) with a country `<select>` / six display boxes. `clearSubmitErrors` (form
  `listeners.onChange`) clears API errors on edit. Password rules: `features/auth/password.ts`.
- **Auth gaps:** `auth.phone_taken` and `auth.code_expired` are unconfirmed guesses (`AUTH_ERROR_CODES`); "tries left"
  comes from the API's `invalid_code` message; no Google endpoint (`SHOW_GOOGLE_SIGN_IN` shows it disabled); `/terms`
  and `/privacy` don't exist.
- **Open questions for the API team:** the real error codes for a taken phone at signup (`auth.phone_taken`) and an
  expired OTP (`auth.code_expired`). `errors.test.ts` pins both literal strings, so a rename is a one-line change in
  `AUTH_ERROR_CODES` plus the test.
- **Accepted risk, account enumeration:** signup says "This number already has an account." (design copy), so it
  reveals which numbers are registered. Accepted for now; it relies on API-side rate limiting of `auth/signup`.
- **Remove when the catalogue ships:** flip `CATALOGUE_LIVE` (`features/products/constants.ts`) to `true`, then delete
  the constant, the coming-soon branch in `routes/(shop)/products/index.tsx`, and `products-live-route.test.tsx`
  (and the coming-soon case in `products-route.test.tsx`).

- **Account area (web):** from the canvas `project/web/WebAccount.dc.html` (snapshot in `design/`). Own shell in
  `routes/(account)/account/route.tsx` → `AccountLayout`: desktop header (logo, Continue shopping, bell, avatar), 280px
  sidebar, page title; under 900px a back bar (sub-pages) or the bottom tab bar (overview, guest). Each route sets
  `staticData.account` (`AccountRouteMeta` in `router.tsx`: title, mobileBar, backTo, overview). `/account` and
  `/account/favourites` are open to guests; everything else sits under `(account)/account/_authed` (same guard as shop).
  `ACCOUNT_NAV` (`features/account/constants.ts`) feeds the sidebar and mobile rows. Orders stays in `(shop)` with
  `?status=` from `features/orders/status.ts` (the one status→group mapping).
- **Account mocks:** the API has no profile name/email, wallet, KYC status, order counts, addresses, favourites,
  notifications or change-password endpoints. Each feature's `get*Service(user)` returns the in-memory
  `features/account/mock-backend.ts` (per-user store, design sample data in the user's currency, 300ms latency, 0 in
  tests, `resetMockBackend`/`editMockDb` for tests). Replace each service body with axios calls when endpoints ship.
  Mocks run in every build (accepted: the site isn't live). The mock rejects the current password `wrong-password`.
- **Shared UI added:** `components/ui/dialog.tsx` (native `<dialog>` + `ConfirmDialog`; motion in `app.css .app-dialog`),
  `tabs.tsx` (roving tabindex), `empty-state`, `avatar`, `stale-note` (offline / failed refresh), `components/icons/icon.tsx`
  (design glyph paths). Tokens added on request: `text-page-title`, `text-bar-title`, `text-section-sm`, `success-tint`.
  `formatPrice` (`features/market/market.ts`) shows "₦24,500" via `formatMoney(..., { trimZeroFraction })`.
- **Favourites:** one store (`features/favourites/use-favourites.ts`): account list (optimistic add/remove with
  rollback) or the browser list for guests (`guest-store.ts`, `pnl.favourites`). `FavouritesSync` (shop + account
  layouts) merges browser favourites into the account after sign-in and clears them only on success. Product cards
  carry the heart.
- **Sign out:** `useLogoutMutation({ redirectTo })` clears caches, sets the session to `null` (not refetched) and
  navigates to the guest Account, even when `auth/logout` fails. Gap: a failed call leaves the refresh cookie valid
  server-side. "Forgot password?" on Security signs out first, because `(auth)` routes bounce signed-in users.
- **Geocoding:** stub (`features/geocoding/services.ts`, bounding boxes, nothing leaves the browser); a real provider
  needs sign-off (paid/key). Regions are config (`features/addresses/regions.ts`), not delivery zones.

## API contract

- Source of truth: staging OpenAPI at `https://api-staging.pnlinternationalltd.com/docs/openapi.json` (outside `/v1`,
  so not through the dev proxy; send `X-Staging-Key`). Swagger UI at `/docs/`.
- As of 2026-11-25 the API has no catalogue, cart, order or stats endpoints, so `products` → 404 `not_found` and the
  products page renders the 404 screen. Admin has only `admin/auth/{login,logout,factor}`; no `refresh` or `me`.
- Confirmed: error envelope `{ error: { code, message, request_id } }` with a closed set of codes; POST/DELETE need
  an `Idempotency-Key` of 16–128 chars; login is by NG/GH phone + password.
- Customer auth: `auth/login` → 200 `SignedIn` or 202 `OtpChallenge` → `auth/login/verify`; `auth/signup` →
  `auth/signup/verify` (201 `SignedIn`); `auth/challenges/{id}/resend`; `auth/refresh` → `Tokens`; `auth/logout` → 204;
  `auth/password/reset` → `/verify` (`client_key`, reset token in cookie) → `/complete` (204, or 202 72-hour hold).
  `GET me` → `{ id, phone, market: NG|GH, created_at }` (no name). `me/sessions`, `me/sessions/others/revoke`,
  `DELETE me/sessions/{id}`.
- `TERMS_VERSION` (`src/features/auth/constants.ts`) is a placeholder until the API team confirms the value.
- 2026-11-26 recheck: new `me/phone` + `me/phone/verify` are for social onboarding only (not "change phone");
  `me/identities` lists masked sign-in methods. Neither covers the account screens, so Change phone and Verify email
  are placeholders.
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
- **Redirected:** I recommended staying light-only until dark designs exist; you chose dark mode now with provisional
  neutrals (`color-scheme: light dark`).
- **Redirected:** I treated the "shared foundation" brief as tokens-only and reskinned the old auth layout; you expected
  the screens to match the canvas (split navy hero + form, phone with country picker, OTP boxes, error banner, mobile
  sheet). When a brief mentions a canvas/design, get the design source before touching screens.
- TanStack Form never clears `onSubmit` (API) errors on change: that is why a wrong OTP blocked resubmitting. Fixed
  with `clearSubmitErrors` on every auth form.
- **Redirected:** you chose light-only after seeing dark mode, "Show, disabled" for Google, and a full design-driven
  rebuild of auth from the canvas rather than token-only restyling.
- Headless Chrome (`--headless=new`) won't lay out narrower than 500px; for phone widths drive it over CDP with
  `Emulation.setDeviceMetricsOverride`.
- To see signed-in pages in the browser without a staging account, intercept `*/v1/auth/refresh*` and `*/v1/me*`
  with CDP `Fetch.enable` + `Fetch.fulfillRequest` (tokens + a fake user). No app code changes needed.
- Route tests that render whole account pages: preload route chunks in `beforeAll` (`preloadRouteChunks`,
  `src/test/account.ts`) and allow 15s per test; cold chunk transforms under a parallel run blew the 5s default.
- Sonner's toast list is module state: call `toast.dismiss()` in `afterEach` or one test's toasts leak into the next.
  jsdom lacks pointer capture (sonner calls it on press); `src/test/setup.ts` shims it.
- In jsdom, Tailwind's `hidden desktop:block` doesn't apply, so mobile and desktop copies are both in the DOM:
  use `getAll*` or `checkVisibility()` in the browser.
- **Redirected (account):** you chose mocks in every build, adding the missing type tokens rather than reusing the
  closest ones, and a stub geocoder over Nominatim.
