import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authed/orders/")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: () => <h1 className="text-h2">Orders</h1>,
});
