import { z } from "zod";

// The access token lives in memory only (never storage): a reload gets a new one from the
// httpOnly refresh cookie. Shape shared by `auth/refresh` and `SignedIn`.
export const tokensSchema = z.object({
  access_token: z.string(),
  access_expires_in: z.number(),
  access_expires_at: z.string(),
  session_expires_at: z.string(),
});

export type Tokens = z.infer<typeof tokensSchema>;

export interface AccessTokenStore {
  get(): { token: string; expiresAt: string } | undefined;
  set(tokens: Pick<Tokens, "access_token" | "access_expires_at">): void;
  clear(): void;
}

export function createAccessTokenStore(): AccessTokenStore {
  let current: { token: string; expiresAt: string } | undefined;
  return {
    get: () => current,
    set: ({ access_token, access_expires_at }) => {
      current = { token: access_token, expiresAt: access_expires_at };
    },
    clear: () => {
      current = undefined;
    },
  };
}

export const accessTokenStore = createAccessTokenStore();
