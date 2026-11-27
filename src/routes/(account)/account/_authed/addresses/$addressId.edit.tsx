import { createFileRoute, Link } from "@tanstack/react-router";
import { getErrorMessage, isNotFoundError } from "@/api/errors";
import { QueryBoundary } from "@/components/errors/query-boundary";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/features/auth/schemas";
import { AddressForm } from "@/features/addresses/components/address-form";
import { PRIMARY_LINK } from "@/features/addresses/components/address-list";
import { useAddress } from "@/features/addresses/queries";

export const Route = createFileRoute("/(account)/account/_authed/addresses/$addressId/edit")({
  head: () => ({ meta: [{ title: "Edit address — PNL Store" }] }),
  staticData: {
    account: { title: "Edit address", mobileBar: "back", backTo: "/account/addresses" },
  },
  component: EditAddressPage,
});

function EditAddress({ user, id }: { user: User; id: string }) {
  const { data: address } = useAddress(user, id);
  return <AddressForm user={user} address={address} />;
}

function EditAddressPage() {
  const { user } = Route.useRouteContext();
  const { addressId } = Route.useParams();

  return (
    <QueryBoundary
      resetKeys={[addressId]}
      pending={<Skeleton className="h-150 w-full max-w-180 rounded-xl" />}
      renderError={({ error, resetErrorBoundary }) =>
        isNotFoundError(error) ? (
          <EmptyState
            title="Address not found"
            message="It may have been deleted."
            action={
              <Link to="/account/addresses" className={PRIMARY_LINK}>
                Back to addresses
              </Link>
            }
          />
        ) : (
          <ErrorFallback message={getErrorMessage(error)} onRetry={resetErrorBoundary} />
        )
      }
    >
      <EditAddress user={user} id={addressId} />
    </QueryBoundary>
  );
}
