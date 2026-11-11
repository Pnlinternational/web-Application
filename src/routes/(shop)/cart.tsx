import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/cart")({
  head: () => ({ meta: [{ title: "Cart — PNL Store" }] }),
  component: CartPage,
});

function CartPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
      <p className="text-muted-foreground">Your cart is empty.</p>
      <Link to="/products" className="text-sm font-medium text-accent">
        Continue shopping
      </Link>
    </div>
  );
}
