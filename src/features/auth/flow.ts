import type { OtpChallenge } from "./schemas";

// What one auth step hands the next, carried in router history state (not the URL or storage):
// a challenge id and the phone, never a password or code. A reload keeps it; a fresh visit to
// a later step without it is sent back to the start of the flow.
export type AuthFlow =
  | { kind: "login" | "signup"; challenge: OtpChallenge; phone: string }
  | { kind: "reset"; challenge: OtpChallenge; phone: string; clientKey: string }
  | { kind: "reset-granted"; phone: string; clientKey: string };

declare module "@tanstack/react-router" {
  interface HistoryState {
    authFlow?: AuthFlow;
    /** One-off success message for the sign-in page (after a password reset). */
    authNotice?: string;
  }
}
