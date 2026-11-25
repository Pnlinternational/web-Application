import { Link } from "@tanstack/react-router";

export function Brand({ to = "/" }: { to?: "/" | "/admin" }) {
  return (
    <Link to={to} className="font-heading text-section font-bold">
      PNL Store
    </Link>
  );
}
