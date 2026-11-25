import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authed/customers/")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: () => <h1 className="text-h2">Customers</h1>,
});
