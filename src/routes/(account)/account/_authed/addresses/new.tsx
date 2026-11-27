import { createFileRoute } from "@tanstack/react-router";
import { AddressForm } from "@/features/addresses/components/address-form";

export const Route = createFileRoute("/(account)/account/_authed/addresses/new")({
  head: () => ({ meta: [{ title: "Add address — PNL Store" }] }),
  staticData: {
    account: { title: "Add address", mobileBar: "back", backTo: "/account/addresses" },
  },
  component: NewAddressPage,
});

function NewAddressPage() {
  const { user } = Route.useRouteContext();
  return <AddressForm user={user} />;
}
