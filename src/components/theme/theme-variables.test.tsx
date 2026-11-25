import { AppProvider } from "@hackert-ui/core";
import { render } from "@testing-library/react";
import { expect, it } from "vite-plus/test";
import { PNL_THEME } from "@/lib/ui-theme";
import { ThemeVariables } from "./theme-variables";

function renderedCss() {
  render(
    <AppProvider theme={PNL_THEME}>
      <ThemeVariables />
    </AppProvider>,
  );
  return (
    document.querySelector('style[data-href="pnl-theme"], style[href="pnl-theme"]')?.textContent ??
    ""
  );
}

it("exposes each variant for both schemes", () => {
  expect(renderedCss()).toContain("--theme-primary: light-dark(#263782, #AEB9E2);");
});

it("exposes the derived foreground", () => {
  expect(renderedCss()).toContain("--theme-primary-fg: light-dark(#ffffff, #0a0a0a);");
});

it("exposes radius, spacing and font from the theme", () => {
  const css = renderedCss();
  expect(css).toContain("--theme-radius-2xl: 24px;");
  expect(css).toContain("--theme-spacing-xs: 4px;");
  expect(css).toContain(`--theme-font: ${PNL_THEME.fontFamily};`);
});
