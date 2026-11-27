import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BackArrowIcon, Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

/** Sub-page bar under 900px: back to the parent page + title. */
export function MobileBackBar({
  title,
  backTo,
  action,
}: {
  title: string;
  backTo: LinkProps["to"];
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 bg-card px-3 pt-3 pb-2.5 desktop:hidden">
      <Link
        to={backTo}
        aria-label="Back"
        className="grid size-11 shrink-0 place-items-center rounded-full text-ink"
      >
        <BackArrowIcon />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-bar-title">{title}</h1>
      {action}
    </div>
  );
}

const TAB =
  "flex flex-col items-center justify-center gap-0.75 text-meta text-muted data-[status=active]:font-bold data-[status=active]:text-primary";

/** Fixed bottom navigation under 900px (Account overview and guest screens). */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-10 grid h-18 grid-cols-4 rounded-t-2xl bg-card px-2 pt-1.5 pb-2.5 shadow-[0_-6px_24px_rgb(38_55_130/0.08)] desktop:hidden"
    >
      <Link to="/" activeOptions={{ exact: true }} className={TAB}>
        <img
          src="/assets/pnl-logo.png"
          alt=""
          width={22}
          height={27}
          className="block opacity-70 grayscale"
        />
        Home
      </Link>
      <Link to="/products" className={TAB}>
        <Icon name="grid" />
        Categories
      </Link>
      <Link to="/account/orders" className={TAB}>
        <Icon name="box" />
        Orders
      </Link>
      <Link
        to="/account"
        activeOptions={{ exact: true }}
        className={cn(TAB, "aria-[current=page]:text-primary")}
      >
        <Icon name="person" />
        Account
      </Link>
    </nav>
  );
}
