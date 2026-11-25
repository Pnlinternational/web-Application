import { AccountNav } from "./account-nav";
import { Brand } from "./brand";
import { NavLink } from "./nav-link";

export function ShopHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-divider bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-1">
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <AccountNav />
        </nav>
      </div>
    </header>
  );
}
