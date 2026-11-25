import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(shop)/cart")({
  head: () => ({ meta: [{ title: "Cart — PNL Store" }] }),
  component: CartPage,
});

function CartPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-h2">Your cart</h1>
      <p className="text-muted">Your cart is empty.</p>
      <Link to="/products" className="text-label text-primary">
        Continue shopping
      </Link>
    </div>
  );
}
