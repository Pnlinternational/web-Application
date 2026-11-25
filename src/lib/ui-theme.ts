import type { AppThemeOverride } from "@hackert-ui/core";

// Single source for colours, radius, spacing and body font. ThemeVariables exposes these as
// --theme-* CSS vars, which app.css maps onto Tailwind tokens. Units match DEFAULT_THEME (px, hex).
export const PNL_THEME: AppThemeOverride = {
  colors: {
    primary: "#263782", // brand navy: primary buttons, links, active nav, focus
    secondary: "#ED1D24", // brand red: accents only (arcs, badges, progress, icons); never carries text
    success: "#0F6B43", // verified, completed
    danger: "#D0161D", // errors, destructive actions, count badges
    warning: "#B45309", // pending, attention
  },
  dark: {
    // Provisional: the canvas has no dark designs yet.
    colors: {
      primary: "#AEB9E2",
      secondary: "#FF5A5F",
      success: "#5CC98F",
      danger: "#FF6B70",
      warning: "#F5B547",
    },
  },
  radius: {
    xs: "8px", // discount and status badges, small tags
    sm: "12px", // chips, Add to cart, small icon buttons
    md: "14px", // inputs, OTP boxes, secondary buttons, market badges
    lg: "16px", // primary buttons, list cards, upload tiles
    xl: "20px", // product cards, account cards, order tracker
    "2xl": "24px", // banners, dialogs, header and bottom nav corners
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
  },
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
