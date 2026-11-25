import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/_authed/checkout")({
  head: () => ({ meta: [{ title: "Checkout — PNL Store" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return <h1 className="text-h2">Checkout</h1>;
}
