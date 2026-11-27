import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { withIdempotencyKey } from "@/api/idempotency";
import { Icon } from "@/components/icons/icon";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StaleNote } from "@/components/ui/stale-note";
import type { User } from "@/features/auth/schemas";
import { formatE164 } from "@/lib/phone";
import { useDeleteAddressMutation, useSetDefaultAddressMutation } from "../mutations";
import { useAddresses } from "../queries";
import { type Address, addressLabelText } from "../schemas";

const TEXT_BUTTON =
  "inline-flex h-11 items-center rounded-sm px-2 text-label disabled:opacity-60 hover-pointer:underline";

export const PRIMARY_LINK =
  "inline-flex h-13 items-center justify-center rounded-lg bg-primary px-6 text-body-sm font-bold text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]";

function AddAddressLink({ className }: { className?: string }) {
  return (
    <Link to="/account/addresses/new" className={`${PRIMARY_LINK} ${className ?? ""}`}>
      Add address
    </Link>
  );
}

interface AddressCardProps {
  address: Address;
  settingDefault: boolean;
  onSetDefault: () => void;
  onDelete: () => void;
}

function AddressCard({ address, settingDefault, onSetDefault, onDelete }: AddressCardProps) {
  const label = addressLabelText(address.label);

  return (
    <article className="flex flex-col gap-1 rounded-xl bg-card px-4 pt-4 pb-1.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{label}</h2>
        {address.isDefault ? (
          <span className="rounded-xs bg-tint px-2.25 py-0.75 text-meta font-semibold text-primary">
            Default
          </span>
        ) : null}
      </div>
      <p className="text-label font-medium">
        {address.recipient}, {formatE164(address.phone)}
      </p>
      <p className="text-label font-normal text-muted">
        {[address.street, address.area, address.region].join(", ")}
      </p>
      <div className="-mx-2 mt-1 flex items-center">
        <Link
          to="/account/addresses/$addressId/edit"
          params={{ addressId: address.id }}
          aria-label={`Edit ${label} address`}
          className={`${TEXT_BUTTON} text-primary`}
        >
          Edit
        </Link>
        {address.isDefault ? null : (
          <button
            type="button"
            disabled={settingDefault}
            aria-busy={settingDefault || undefined}
            onClick={onSetDefault}
            className={`${TEXT_BUTTON} text-primary`}
          >
            {settingDefault ? "Setting as default…" : "Set as default"}
          </button>
        )}
        <span className="flex-1" />
        <button
          type="button"
          aria-label={`Delete ${label} address`}
          onClick={onDelete}
          className={`${TEXT_BUTTON} text-danger`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export function AddressList({ user }: { user: User }) {
  const { data: addresses, isRefetchError } = useAddresses(user);
  const setDefault = useSetDefaultAddressMutation(user);
  const remove = useDeleteAddressMutation(user);
  const [deleting, setDeleting] = useState<Address | null>(null);

  if (addresses.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="pin" size={40} />}
        title="No saved addresses"
        message="Add one to choose it quickly for last-mile delivery."
        action={<AddAddressLink />}
      />
    );
  }

  function confirmDelete() {
    if (!deleting) return;
    remove.mutate(withIdempotencyKey({ id: deleting.id }), {
      onSuccess: () => toast.success("Address deleted"),
      onSettled: () => setDeleting(null),
    });
  }

  return (
    <>
      <div className="hidden justify-end desktop:flex">
        <AddAddressLink />
      </div>
      <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            settingDefault={setDefault.isPending && setDefault.variables.data.id === address.id}
            onSetDefault={() => setDefault.mutate(withIdempotencyKey({ id: address.id }))}
            onDelete={() => setDeleting(address)}
          />
        ))}
      </div>
      <StaleNote refetchFailed={isRefetchError} />
      <AddAddressLink className="w-full desktop:hidden" />
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this address?"
        description="You can add it again later. Orders already placed will not change."
        cancelLabel="Keep address"
        confirmLabel="Delete address"
        pending={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
