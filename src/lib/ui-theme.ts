import type { AppThemeOverride } from "@hackert-ui/core";

// Mirrors the tokens in styles/app.css (hackert-ui needs literal hex/rgb/oklch, not CSS vars).
// Keep in sync: primary, danger, success, radius-*, font-sans.
export const uiTheme: AppThemeOverride = {
  colors: {
    primary: "oklch(0.25 0.02 260)",
    secondary: "oklch(0.91 0.005 260)",
    danger: "oklch(0.58 0.2 25)",
    success: "oklch(0.6 0.14 150)",
  },
  radius: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem" },
  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
};
