// @hackert-ui/form imports four icons from the full @hugeicons/core-free-icons barrel, which takes
// ~10s to load. Tests don't assert on icon artwork, so they get empty icon data (see vite.config.ts).
const icon = [] as const;

export const Tick02Icon = icon;
export const UnfoldMoreIcon = icon;
export const ViewIcon = icon;
export const ViewOffSlashIcon = icon;
