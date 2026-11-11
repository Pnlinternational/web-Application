import { z } from "zod";

// Assumed shape of GET admin/auth/me; verify against the API.
export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.email().nullish(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
