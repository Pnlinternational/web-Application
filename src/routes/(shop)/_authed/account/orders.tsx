import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/_authed/account/orders")({
  head: () => ({ meta: [{ title: "Orders — PNL Store" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-h2">Your orders</h1>
      <p className="text-muted">You haven't placed any orders yet.</p>
    </div>
  );
}
