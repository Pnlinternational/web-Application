import { useFieldContext } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SHOW_GOOGLE_SIGN_IN } from "../constants";
import { checkPassword } from "../password";

// Shared auth styles from the design: 54px full-width primary, 44px text links, error banner.
export const AUTH_PRIMARY_BUTTON = "h-13.5 w-full text-body font-bold";
export const AUTH_LINK =
  "inline-flex h-11 items-center text-body-sm font-semibold text-primary hover-pointer:underline";
export const AUTH_BANNER =
  "rounded-md bg-danger-tint px-3.5 py-3 text-label font-medium text-danger-ink";

export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-md bg-tint px-3.5 py-3 text-label font-medium text-success">
      {children}
    </p>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-caption text-muted">
      <div className="h-px flex-1 bg-divider" />
      or
      <div className="h-px flex-1 bg-divider" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"
      />
    </svg>
  );
}

/** "or" + Google (shown disabled: no Google sign-in endpoint yet) + the sign-in/sign-up switch. */
export function AuthAlternatives({
  switchPrompt,
  switchLink,
}: {
  switchPrompt: string;
  switchLink: ReactNode;
}) {
  return (
    <>
      {SHOW_GOOGLE_SIGN_IN ? (
        <>
          <OrDivider />
          <button
            type="button"
            disabled
            aria-describedby="google-soon"
            className="flex h-13.5 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-card text-body-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <p id="google-soon" className="-mt-2 text-center text-caption text-muted">
            Coming soon
          </p>
        </>
      ) : null}
      <p className="flex items-center justify-center gap-1 text-body-sm text-muted">
        {switchPrompt} {switchLink}
      </p>
    </>
  );
}

/** Live password rules under a password field (inside `form.AppField name="password"`). */
export function PasswordChecks() {
  const field = useFieldContext<string>();
  const password = useSelector(field.store, (state) => state.value);

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1.5 text-caption">
      {checkPassword(password).map(({ label, met }) => (
        <li
          key={label}
          className={cn("flex items-center gap-1.5", met ? "text-primary" : "text-muted")}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10.5"
              strokeWidth="2"
              className={met ? "fill-primary stroke-primary" : "fill-none stroke-border"}
            />
          </svg>
          <span className="sr-only">{met ? "Done:" : "Still needed:"}</span>
          {label}
        </li>
      ))}
    </ul>
  );
}
