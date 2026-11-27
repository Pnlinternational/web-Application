import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import { Link, useBlocker } from "@tanstack/react-router";
import { type ReactNode, useRef } from "react";
import { toast } from "sonner";
import { withIdempotencyKey } from "@/api/idempotency";
import { clearSubmitErrors, toServerFormErrors } from "@/components/form/errors";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { User } from "@/features/auth/schemas";
import { marketLabel } from "@/features/market/market";
import { formatE164 } from "@/lib/phone";
import { useUpdateProfileMutation } from "../mutations";
import { useSuspenseProfile } from "../queries";
import { type Profile, profileFormSchema, type ProfileFormValues } from "../schemas";

const TEXT_LINK =
  "inline-flex h-11 items-center rounded-sm px-2 text-label font-bold text-primary hover-pointer:underline";

function hasChanges(values: ProfileFormValues, profile: Profile) {
  return values.name.trim() !== profile.name || values.email.trim() !== profile.email;
}

function EmailStatus({ email, profile }: { email: string; profile: Profile }) {
  const trimmed = email.trim();
  if (trimmed === "") return null;
  const isSavedEmail = trimmed === profile.email;

  // A changed email is unverified until it's saved and confirmed.
  if (isSavedEmail && profile.emailVerified) {
    return <p className="text-caption text-success">Verified</p>;
  }
  return (
    <div className="flex min-h-11 items-center justify-between gap-2 text-caption text-muted">
      <span>
        {isSavedEmail ? "Not verified yet" : "Not verified yet. Save to verify the new email."}
      </span>
      {isSavedEmail ? (
        <Link to="/account/verify-email" className={`${TEXT_LINK} -mr-2`}>
          Verify email
        </Link>
      ) : null}
    </div>
  );
}

function ReadOnlyRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-t border-disabled py-1.5 first:border-t-0">
      <div className="min-w-0">
        <p className="text-caption text-muted">{label}</p>
        <p className="text-body-sm font-medium">{value}</p>
      </div>
      {action}
    </div>
  );
}

function ProfileForm({ user, profile }: { user: User; profile: Profile }) {
  const update = useUpdateProfileMutation(user);
  const form = useAppForm({
    defaultValues: { name: profile.name, email: profile.email } satisfies ProfileFormValues,
    validators: {
      onChange: profileFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await update.mutateAsync(
            withIdempotencyKey({ name: value.name.trim(), email: value.email.trim() }),
          );
          return undefined;
        } catch (error) {
          return toServerFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    // The saved profile comes back with a new key, which remounts this form with fresh defaults.
    onSubmit: () => void toast.success("Profile saved"),
  });
  const values = useSelector(form.store, (state) => state.values);
  const changed = hasChanges(values, profile);
  const canSave = changed && profileFormSchema.safeParse(values).success;

  // Warn before leaving with unsaved edits (in-app navigation and tab close/refresh).
  const dirty = useRef(changed);
  dirty.current = changed;
  const blocker = useBlocker({
    shouldBlockFn: () => dirty.current,
    enableBeforeUnload: () => dirty.current,
    withResolver: true,
  });

  return (
    <>
      <Form form={form} className="flex max-w-160 flex-col gap-4 rounded-xl bg-card p-5">
        <form.FormError className="rounded-md bg-danger-tint px-3.5 py-3 text-label font-medium text-danger-ink" />
        <div className="grid gap-4 desktop:grid-cols-2">
          <form.AppField name="name">
            {(field) => (
              <FormField>
                <FormField.Label>Full name</FormField.Label>
                <field.TextInput autoComplete="name" />
                <FormField.Error />
              </FormField>
            )}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <FormField>
                <FormField.Label>Email</FormField.Label>
                <field.TextInput type="email" autoComplete="email" placeholder="you@example.com" />
                <FormField.Error />
                <EmailStatus email={values.email} profile={profile} />
              </FormField>
            )}
          </form.AppField>
        </div>
        <div className="rounded-lg bg-surface px-4 py-1">
          <ReadOnlyRow
            label="Phone number"
            value={formatE164(profile.phone)}
            action={
              <Link to="/account/phone" aria-label="Change phone number" className={TEXT_LINK}>
                Change
              </Link>
            }
          />
          <ReadOnlyRow label="Country" value={marketLabel(profile.market)} />
          <ReadOnlyRow label="Customer ID" value={profile.customerId} />
        </div>
        <p className="text-caption text-muted">
          Your country and customer ID are set when you register. Contact support if your country is
          wrong.
        </p>
        <div className="flex justify-end">
          <form.SubmitButton
            radius="lg"
            disabled={!canSave}
            className="h-13 w-full px-6 text-body-sm font-bold desktop:w-auto"
          >
            Save changes
          </form.SubmitButton>
        </div>
      </Form>
      <ConfirmDialog
        open={blocker.status === "blocked"}
        title="Discard your changes?"
        description="Your profile changes haven't been saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </>
  );
}

export function EditProfile({ user }: { user: User }) {
  const { data: profile } = useSuspenseProfile(user);
  return <ProfileForm key={`${profile.name}|${profile.email}`} user={user} profile={profile} />;
}
