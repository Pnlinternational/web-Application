import { createFileRoute, Link } from "@tanstack/react-router";
import { orderGroupLabel, ordersSearchSchema } from "@/features/orders/status";

// Placeholder until the API has orders. ?status= comes from the Account overview's status tiles.
export const Route = createFileRoute("/(shop)/_authed/account/orders")({
  validateSearch: ordersSearchSchema,
  head: () => ({ meta: [{ title: "Orders — PNL Store" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { status } = Route.useSearch();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-h2">Your orders</h1>
      {status ? (
        <p className="flex items-center gap-2 text-body-sm">
          Showing: <span className="font-semibold">{orderGroupLabel(status)}</span>
          <Link to="/account/orders" className="text-label text-primary hover-pointer:underline">
            Show all
          </Link>
        </p>
      ) : null}
      <p className="text-muted">You haven't placed any orders yet.</p>
    </div>
  );
}
