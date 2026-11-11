import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite-plus";

const DEFAULT_API_PROXY_TARGET = "https://api-staging.pnlinternationalltd.com";

// The browser calls same-origin /v1 (API_BASE_URL in src/api/api.ts) and this proxy forwards it
// to the staging API, adding X-Staging-Key. Behind Cloudflare /v1 is already the same site.
// STAGING_KEY has no VITE_ prefix on purpose: it must never reach the browser bundle.
function stagingApiProxy(): Plugin {
  let mode = "development";
  let stagingKey: string | undefined;

  function requireStagingKey() {
    if (mode === "test" || stagingKey) return;
    throw new Error(
      "STAGING_KEY is missing. Add it to .env.local (no VITE_ prefix); see .env.example.",
    );
  }

  return {
    name: "staging-api-proxy",
    config(_, env) {
      mode = env.mode;
      const vars = loadEnv(env.mode, ".", "");
      stagingKey = vars.STAGING_KEY;
      const proxy = {
        "/v1": {
          target: vars.API_PROXY_TARGET || DEFAULT_API_PROXY_TARGET,
          changeOrigin: true,
          headers: { "X-Staging-Key": stagingKey ?? "" },
        },
      };
      return { server: { proxy }, preview: { proxy } };
    },
    configureServer: requireStagingKey,
    configurePreviewServer: requireStagingKey,
  };
}

export default defineConfig({
  // Router plugin must run before react() so generated route splits get the React transform.
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    stagingApiProxy(),
  ],
  resolve: {
    alias: { "@": "/src" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  // Run by .husky/pre-commit via `vp staged` (bundled lint-staged): format, lint and fix staged files.
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["src/routeTree.gen.ts"],
  },
  lint: {
    ignorePatterns: ["src/routeTree.gen.ts"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-deprecated": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
