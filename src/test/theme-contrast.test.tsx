import {
  AppProvider,
  type AppColorTheme,
  type ColorScheme,
  useVariantColors,
} from "@hackert-ui/core";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, it } from "vite-plus/test";
import { contrastRatio } from "@/lib/contrast";
import { PNL_THEME } from "@/lib/ui-theme";

const AA = 4.5;
const VARIANTS: (keyof AppColorTheme)[] = ["primary", "secondary", "success", "danger", "warning"];
const SCHEMES: ColorScheme[] = ["light", "dark"];

// Known failure: brand red picks near-black text (4.53), and a touch press keeps that text on the
// 20%-darker active fill (3.14). That is why the secondary variant must never carry text.
const EXPECTED_FAILURES = new Set(["light secondary active"]);

function wrapper({ children }: { children: ReactNode }) {
  return <AppProvider theme={PNL_THEME}>{children}</AppProvider>;
}

function variantPairs(variant: keyof AppColorTheme, scheme: ColorScheme) {
  const { result } = renderHook(() => useVariantColors(variant, scheme), { wrapper });
  const colors = result.current;
  return {
    rest: contrastRatio(colors.background, colors.foreground),
    hover: contrastRatio(colors.hoverBackground, colors.hoverForeground),
    // hackert Button keeps the rest foreground on :active when no hover applies (touch).
    active: contrastRatio(colors.activeBackground, colors.foreground),
  };
}

for (const scheme of SCHEMES) {
  for (const variant of VARIANTS) {
    it(`${scheme} ${variant} meets AA except for known failures`, () => {
      for (const [state, ratio] of Object.entries(variantPairs(variant, scheme))) {
        const key = `${scheme} ${variant} ${state}`;
        expect({ key, passes: ratio >= AA }).toEqual({ key, passes: !EXPECTED_FAILURES.has(key) });
      }
    });
  }
}
