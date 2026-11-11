// Every admin query lives under "admin", so an admin auth failure can drop them all at once.
export const adminKeys = {
  all: ["admin"] as const,
  session: () => [...adminKeys.all, "session"] as const,
};
