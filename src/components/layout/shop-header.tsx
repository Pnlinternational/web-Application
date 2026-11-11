import { useSession } from "@/features/auth/queries";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";

export function ShopHeader() {
  const { data: user } = useSession();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-1">
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          {user ? <NavLink to="/account">Account</NavLink> : <NavLink to="/login">Sign in</NavLink>}
        </nav>
      </div>
    </header>
  );
}
