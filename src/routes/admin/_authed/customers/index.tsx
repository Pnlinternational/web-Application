import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authed/customers/")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: () => <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>,
});
