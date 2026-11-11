import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authed/orders/")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: () => <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>,
});
