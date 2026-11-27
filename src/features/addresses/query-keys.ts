export const addressKeys = {
  all: (userId: string) => ["addresses", userId] as const,
  list: (userId: string) => [...addressKeys.all(userId), "list"] as const,
  detail: (userId: string, id: string) => [...addressKeys.all(userId), "detail", id] as const,
};
