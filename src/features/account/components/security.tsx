import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { isApiError } from "@/api/errors";
import { createIdempotencyKey, withIdempotencyKey } from "@/api/idempotency";
import { clearSubmitErrors, toServerFormErrors } from "@/components/form/errors";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PasswordChecks } from "@/features/auth/components/auth-ui";
import { useLogoutMutation, useRevokeOtherDevicesMutation } from "@/features/auth/mutations";
import { strongPasswordSchema, type User } from "@/features/auth/schemas";
import { useChangePasswordMutation } from "../mutations";

const BANNER = "rounded-md bg-danger-tint px-3.5 py-3 text-label font-medium text-danger-ink";
const CARD = "flex flex-col rounded-xl bg-card p-5";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: strongPasswordSchema,
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const EMPTY: ChangePasswordValues = { currentPassword: "", newPassword: "" };

/** A wrong current password belongs under that field, not in the form banner. */
function toPasswordFormErrors(error: unknown) {
  if (isApiError(error) && error.code === "auth.invalid_credentials") {
    return { fields: { currentPassword: error.message } };
  }
  return toServerFormErrors(error);
}

/**
 * "Forgot password?" while signed in: the reset flow is for signed-out users, so confirm,
 * sign out on this device, then open it.
 */
function ForgotPasswordLink() {
  const [confirming, setConfirming] = useState(false);
  const logout = useLogoutMutation({ redirectTo: "/forgot-password" });

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="-mb-2 inline-flex h-11 items-center self-end text-label text-primary hover-pointer:underline"
      >
        Forgot password?
      </button>
      <ConfirmDialog
        open={confirming}
        tone="primary"
        title="Reset your password?"
        description="We'll sign you out on this device, then send a code to your phone."
        confirmLabel="Continue"
        pending={logout.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => logout.mutate(createIdempotencyKey())}
      />
    </>
  );
}

function ChangePasswordForm({ user }: { user: User }) {
  const change = useChangePasswordMutation(user);
  const form = useAppForm({
    defaultValues: EMPTY,
    validators: {
      onChange: changePasswordSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await change.mutateAsync(withIdempotencyKey(value));
          return undefined;
        } catch (error) {
          return toPasswordFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: () => {
      // Never keep passwords around longer than the request.
      form.reset(EMPTY);
      toast.success("Password updated");
    },
  });
  const valid = useSelector(
    form.store,
    (state) => changePasswordSchema.safeParse(state.values).success,
  );

  return (
    <Form form={form} aria-label="Change password" className={`${CARD} gap-3.5`}>
      <h2 className="text-section-sm">Change password</h2>
      <form.FormError className={BANNER} />
      <form.AppField name="currentPassword">
        {(field) => (
          <FormField>
            <FormField.Label>Current password</FormField.Label>
            <field.TextInput
              type="password"
              visibilityToggle
              autoComplete="current-password"
              placeholder="Enter current password"
            />
            <FormField.Error />
            <ForgotPasswordLink />
          </FormField>
        )}
      </form.AppField>
      <form.AppField name="newPassword">
        {(field) => (
          <FormField>
            <FormField.Label>New password</FormField.Label>
            <field.TextInput
              type="password"
              visibilityToggle
              autoComplete="new-password"
              placeholder="Create a new password"
            />
            <PasswordChecks />
          </FormField>
        )}
      </form.AppField>
      <form.SubmitButton radius="lg" disabled={!valid} className="h-13 text-body-sm font-bold">
        Update password
      </form.SubmitButton>
    </Form>
  );
}

function SignedInDevices() {
  const [confirming, setConfirming] = useState(false);
  const revoke = useRevokeOtherDevicesMutation();

  return (
    <section aria-labelledby="devices-title" className={`${CARD} gap-1.5`}>
      <h2 id="devices-title" className="text-section-sm">
        Signed-in devices
      </h2>
      <p className="text-label font-normal text-muted">
        If you lost a phone or see activity you don't recognise, sign out everywhere else.
      </p>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="-ml-2 inline-flex h-11 items-center self-start rounded-sm px-2 text-label font-bold text-danger hover-pointer:bg-danger-tint"
      >
        Sign out of other devices
      </button>
      <ConfirmDialog
        open={confirming}
        title="Sign out of other devices?"
        description="You'll stay signed in on this device."
        confirmLabel="Sign out"
        pending={revoke.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          revoke.mutate(createIdempotencyKey(), {
            onSuccess: () => toast.success("Signed out of your other devices"),
            onSettled: () => setConfirming(false),
          })
        }
      />
    </section>
  );
}

export function SecuritySettings({ user }: { user: User }) {
  return (
    <div className="grid items-start gap-4 desktop:grid-cols-2">
      <ChangePasswordForm user={user} />
      <SignedInDevices />
    </div>
  );
}
