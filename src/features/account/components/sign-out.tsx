import { useState } from "react";
import { createIdempotencyKey } from "@/api/idempotency";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useLogoutMutation } from "@/features/auth/mutations";
import { cn } from "@/lib/cn";

/** "Sign out" (danger) that confirms first. Shows the guest Account afterwards. */
export function SignOutButton({ className }: { className?: string }) {
  const [confirming, setConfirming] = useState(false);
  const logout = useLogoutMutation();

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(
          "flex h-12 items-center rounded-md text-body-sm font-semibold text-danger transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-danger-tint active:scale-[0.97]",
          className,
        )}
      >
        Sign out
      </button>
      <ConfirmDialog
        open={confirming}
        title="Sign out?"
        description="You'll need your phone number and password to sign in again."
        confirmLabel="Sign out"
        pending={logout.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => logout.mutate(createIdempotencyKey())}
      />
    </>
  );
}
