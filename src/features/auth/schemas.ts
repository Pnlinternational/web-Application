import { z } from "zod";

// Assumed shape of GET auth/me; verify against the API.
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.email().nullish(),
});

export type User = z.infer<typeof userSchema>;

// Digits with an optional leading +, 7–15 digits (E.164 length).
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone number");

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    phone: phoneSchema,
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Only same-origin paths are allowed after login, to avoid open redirects (?redirect=https://evil).
export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .refine((path) => path.startsWith("/") && !path.startsWith("//"))
    .optional()
    .catch(undefined),
});
