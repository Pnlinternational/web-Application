import { createFileRoute } from "@tanstack/react-router";
import { CardBoundary } from "@/features/account/components/card-boundary";
import { AddressList } from "@/features/addresses/components/address-list";

export const Route = createFileRoute("/(account)/account/_authed/addresses/")({
  head: () => ({ meta: [{ title: "Saved addresses — PNL Store" }] }),
  staticData: { account: { title: "Saved addresses", mobileBar: "back" } },
  component: AddressesPage,
});

function AddressesPage() {
  const { user } = Route.useRouteContext();
  return (
    <CardBoundary label="your addresses" skeletonClassName="h-36">
      <AddressList user={user} />
    </CardBoundary>
  );
}
