import { z } from "zod";
import { tokensSchema } from "@/api/access-token";
import { type Market, MARKETS, phoneError } from "@/lib/phone";
import { isStrongPassword, PASSWORD_HINT } from "./password";

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

// API inputs: the phone is E.164 (+234…/+233…).
export interface LoginInput {
  phone: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  acceptTerms: boolean;
  marketingEmail: boolean;
  marketingSms: boolean;
}

export interface ResetRequestInput {
  phone: string;
}

// Forms keep the chosen market and the number as typed; they convert with toE164 on submit.
const phoneFields = { market: z.enum(MARKETS), phone: z.string() };

// `when` keeps the phone check running while other fields are still invalid.
function withPhoneCheck<T extends z.ZodType<{ market: Market; phone: string }>>(schema: T) {
  return schema.refine((value) => phoneError(value.market, value.phone) === undefined, {
    path: ["phone"],
    error: (issue) => {
      const value = issue.input as { market: Market; phone: string };
      return phoneError(value.market, value.phone);
    },
    when: () => true,
  });
}

export const loginFormSchema = withPhoneCheck(
  z.object({ ...phoneFields, password: z.string().min(1, "Enter your password") }),
);

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const codeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Enter the 6-digit code"),
});

export type CodeInput = z.infer<typeof codeSchema>;

const strongPasswordSchema = z
  .string()
  .max(128, "Use at most 128 characters")
  .refine(isStrongPassword, PASSWORD_HINT);

export const signupFormSchema = withPhoneCheck(
  z.object({
    fullName: z.string().trim().min(2, "Enter your full name").max(120, "That name is too long"),
    email: z.union([z.literal(""), z.email("Enter a valid email")]),
    ...phoneFields,
    password: strongPasswordSchema,
    acceptTerms: z.boolean().refine((accepted) => accepted, "Accept the terms to continue"),
  }),
);

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const resetRequestFormSchema = withPhoneCheck(z.object(phoneFields));

export type ResetRequestFormValues = z.infer<typeof resetRequestFormSchema>;

export const newPasswordSchema = z.object({ password: strongPasswordSchema });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

const REDIRECT_BASE = "https://redirect.invalid";

// Only same-origin paths are allowed after login, to avoid open redirects. Browsers strip tabs and
// newlines and treat "\" as "/", so "/\evil.com" or "/\t/evil.com" would leave the site.
function hasBackslashOrControl(path: string) {
  for (let i = 0; i < path.length; i++) {
    const code = path.charCodeAt(i);
    if (code === 0x5c || code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function isSafeRedirect(path: string) {
  if (!path.startsWith("/") || hasBackslashOrControl(path)) return false;
  try {
    return new URL(path, REDIRECT_BASE).origin === REDIRECT_BASE;
  } catch {
    return false;
  }
}

export const redirectSearchSchema = z.object({
  redirect: z.string().refine(isSafeRedirect).optional().catch(undefined),
});
