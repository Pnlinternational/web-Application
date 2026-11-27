import { z } from "zod";
import { MARKETS } from "@/lib/phone";
import { moneySchema } from "@/lib/schemas";

// Shapes the account screens need. GET me only has id/phone/market, so these are served by
// mocks (see mock-backend.ts) until the API has profile, wallet and identity endpoints.
export const profileSchema = z.object({
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  phone: z.string(),
  market: z.enum(MARKETS),
  customerId: z.string(),
});

export type Profile = z.infer<typeof profileSchema>;

export interface ProfileUpdate {
  name: string;
  email: string;
}

export const walletSummarySchema = z.object({
  balance: moneySchema,
  pending: moneySchema,
});

export type WalletSummary = z.infer<typeof walletSummarySchema>;

export const identityStatusSchema = z.enum(["not_started", "pending", "verified", "rejected"]);

export type IdentityStatus = z.infer<typeof identityStatusSchema>;

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

const nameField = z
  .string()
  .trim()
  .min(2, "Enter your full name")
  .max(80, "Use 80 characters or fewer");
const emailField = z.union([z.literal(""), z.email("Enter a valid email address")]);

export const profileFormSchema = z.object({ name: nameField, email: emailField });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
