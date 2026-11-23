import { z } from "zod";
import { tokensSchema } from "@/api/access-token";

export const meSchema = z.object({
  id: z.string(),
  phone: z.string(),
  market: z.enum(["NG", "GH"]),
  created_at: z.string(),
});

export type User = z.infer<typeof meSchema>;

export const signedInSchema = tokensSchema.extend({
  user: meSchema,
  device_id: z.string().optional(),
});

export const otpChallengeSchema = z.object({
  challenge_id: z.string(),
  expires_in: z.number(),
  resend_after: z.number(),
  next: z.literal("code"),
});

export type OtpChallenge = z.infer<typeof otpChallengeSchema>;

export const resendAcceptedSchema = z.object({
  expires_in: z.number(),
  resend_after: z.number(),
});

export const resetGrantedSchema = z.object({
  next: z.enum(["set_password", "prove_ownership"]),
});

export const resetHeldSchema = z.object({
  hold_id: z.string(),
  applies_at: z.string(),
});

export const deviceListSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      created_at: z.string(),
      last_refreshed_at: z.string(),
      current: z.boolean(),
      platform: z.string().optional(),
    }),
  ),
});

export type Device = z.infer<typeof deviceListSchema>["sessions"][number];

// Digits with an optional leading +, 7–15 digits (E.164 length). Kept loose on purpose:
// the API's auth.invalid_phone is shown on the field if it disagrees.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number");

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const codeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

export type CodeInput = z.infer<typeof codeSchema>;

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(120, "That name is too long"),
    phone: phoneSchema,
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((accepted) => accepted, "Accept the terms to continue"),
    marketingEmail: z.boolean(),
    marketingSms: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetRequestSchema = z.object({ phone: phoneSchema });

export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

// Only same-origin paths are allowed after login, to avoid open redirects (?redirect=https://evil).
export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .refine((path) => path.startsWith("/") && !path.startsWith("//"))
    .optional()
    .catch(undefined),
});
