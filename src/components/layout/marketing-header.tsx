import { Link } from "@tanstack/react-router";
import { AccountNav } from "./account-nav";
import { Brand } from "./brand";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-divider bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-1">
          <Link
            to="/products"
            className="rounded-md bg-primary px-4 py-2 text-label text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
          >
            Start shopping
          </Link>
          <AccountNav />
        </nav>
      </div>
    </header>
  );
}
