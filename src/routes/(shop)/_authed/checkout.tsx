import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/_authed/checkout")({
  head: () => ({ meta: [{ title: "Checkout — PNL Store" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>;
}
