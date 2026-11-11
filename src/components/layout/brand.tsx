import { Link } from "@tanstack/react-router";

export function Brand({ to = "/" }: { to?: "/" | "/admin" }) {
  return (
    <Link to={to} className="text-base font-semibold tracking-tight">
      PNL Store
    </Link>
  );
}
