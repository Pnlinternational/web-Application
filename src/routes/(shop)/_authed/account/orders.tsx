import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/_authed/account/orders")({
  head: () => ({ meta: [{ title: "Orders — PNL Store" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Your orders</h1>
      <p className="text-muted-foreground">You haven't placed any orders yet.</p>
    </div>
  );
}
