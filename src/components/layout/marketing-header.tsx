import { Link } from "@tanstack/react-router";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-1">
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/login">Sign in</NavLink>
          <Link
            to="/products"
            className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Start shopping
          </Link>
        </nav>
      </div>
    </header>
  );
}
