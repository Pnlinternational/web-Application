export const favouriteKeys = {
  list: (userId: string) => ["favourites", userId, "list"] as const,
};
