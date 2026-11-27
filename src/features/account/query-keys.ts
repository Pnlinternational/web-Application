// Scoped by user id so one account's cached data never shows for another.
export const accountKeys = {
  all: ["account"] as const,
  user: (userId: string) => [...accountKeys.all, userId] as const,
  profile: (userId: string) => [...accountKeys.user(userId), "profile"] as const,
  wallet: (userId: string) => [...accountKeys.user(userId), "wallet"] as const,
  identity: (userId: string) => [...accountKeys.user(userId), "identity"] as const,
  orderCounts: (userId: string) => [...accountKeys.user(userId), "order-counts"] as const,
};
