import { type AppTheme, useAppTheme, useVariantColors, type VariantColors } from "@hackert-ui/core";

interface SchemePair {
  readonly light: VariantColors;
  readonly dark: VariantColors;
}

function byScheme(light: string, dark: string) {
  return light === dark ? light : `light-dark(${light}, ${dark})`;
}

function variantDeclarations(name: string, { light, dark }: SchemePair) {
  return [
    `--theme-${name}: ${byScheme(light.background, dark.background)};`,
    `--theme-${name}-fg: ${byScheme(light.foreground, dark.foreground)};`,
    `--theme-${name}-hover: ${byScheme(light.hoverBackground, dark.hoverBackground)};`,
    `--theme-${name}-hover-fg: ${byScheme(light.hoverForeground, dark.hoverForeground)};`,
    `--theme-${name}-active: ${byScheme(light.activeBackground, dark.activeBackground)};`,
  ];
}

function scaleDeclarations(prefix: string, scale: AppTheme["radius"] | AppTheme["spacing"]) {
  return Object.entries(scale).map(([step, value]) => `--theme-${prefix}-${step}: ${value};`);
}

// Bridges the hackert theme into CSS so Tailwind tokens (app.css) read the theme instead of copying it.
export function ThemeVariables() {
  const theme = useAppTheme();
  const variants: Record<string, SchemePair> = {
    primary: {
      light: useVariantColors("primary", "light"),
      dark: useVariantColors("primary", "dark"),
    },
    secondary: {
      light: useVariantColors("secondary", "light"),
      dark: useVariantColors("secondary", "dark"),
    },
    success: {
      light: useVariantColors("success", "light"),
      dark: useVariantColors("success", "dark"),
    },
    danger: {
      light: useVariantColors("danger", "light"),
      dark: useVariantColors("danger", "dark"),
    },
    warning: {
      light: useVariantColors("warning", "light"),
      dark: useVariantColors("warning", "dark"),
    },
  };

  const declarations = [
    ...Object.entries(variants).flatMap(([name, pair]) => variantDeclarations(name, pair)),
    ...scaleDeclarations("radius", theme.radius),
    ...scaleDeclarations("spacing", theme.spacing),
    `--theme-font: ${theme.fontFamily};`,
  ];

  return (
    <style href="pnl-theme" precedence="default">
      {`:root {\n  ${declarations.join("\n  ")}\n}`}
    </style>
  );
}
