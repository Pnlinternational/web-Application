import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { createClientKey } from "../client-key";
import {
  useCompletePasswordResetMutation,
  useRequestPasswordResetMutation,
  useResendCodeMutation,
  useVerifyPasswordResetMutation,
} from "../mutations";
import type { OtpChallenge } from "../schemas";
import { DATE_TIME_FORMAT, formatDate } from "@/lib/format";
import { NewPasswordForm, RequestResetForm } from "./reset-password-forms";
import { VerifyCodeForm } from "./verify-code-form";

type Step =
  | { name: "phone" }
  | { name: "code"; challenge: OtpChallenge }
  | { name: "password" }
  | { name: "done" }
  | { name: "held"; appliesAt: string }
  | { name: "prove_ownership" };

function Outcome({ title, children }: { title: string; children: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">{children}</p>
      <Link to="/login" className="text-sm font-medium text-accent">
        Back to sign in
      </Link>
    </div>
  );
}

export function ResetPasswordFlow() {
  const [step, setStep] = useState<Step>({ name: "phone" });
  // One key per reset flow: the API ties the code check to the password change with it.
  const [clientKey, setClientKey] = useState(createClientKey);
  const request = useRequestPasswordResetMutation();
  const verify = useVerifyPasswordResetMutation();
  const complete = useCompletePasswordResetMutation();
  const resend = useResendCodeMutation();

  function startAgain() {
    setClientKey(createClientKey());
    setStep({ name: "phone" });
  }

  switch (step.name) {
    case "phone":
      return (
        <RequestResetForm
          onRequest={request.mutateAsync}
          onSuccess={(challenge) => setStep({ name: "code", challenge })}
        />
      );
    case "code": {
      const { challenge } = step;
      return (
        <VerifyCodeForm
          resendAfter={challenge.resend_after}
          submitLabel="Continue"
          onVerify={({ data, idempotencyKey }) =>
            verify.mutateAsync({
              data: { challengeId: challenge.challenge_id, code: data.code, clientKey },
              idempotencyKey,
            })
          }
          onResend={(idempotencyKey) =>
            resend.mutateAsync({ data: { challengeId: challenge.challenge_id }, idempotencyKey })
          }
          onSuccess={(granted) =>
            setStep(
              granted.next === "set_password" ? { name: "password" } : { name: "prove_ownership" },
            )
          }
          onStartAgain={startAgain}
        />
      );
    }
    case "password":
      return (
        <NewPasswordForm
          onComplete={({ data, idempotencyKey }) =>
            complete.mutateAsync({ data: { clientKey, password: data.password }, idempotencyKey })
          }
          onSuccess={(result) =>
            setStep(
              result.kind === "held"
                ? { name: "held", appliesAt: result.appliesAt }
                : { name: "done" },
            )
          }
        />
      );
    case "done":
      return (
        <Outcome title="Password changed">You can now sign in with your new password.</Outcome>
      );
    case "held":
      return (
        <Outcome title="Password change scheduled">
          {`For your security, your new password applies on ${formatDate(step.appliesAt, DATE_TIME_FORMAT)}. Until then, keep using your current password.`}
        </Outcome>
      );
    case "prove_ownership":
      return (
        <Outcome title="We can't reset this account online">
          This account has been inactive for a while. Please contact support to recover it.
        </Outcome>
      );
  }
}
