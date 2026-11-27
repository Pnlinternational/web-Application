import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, Icon, type IconName } from "@/components/icons/icon";
import { StaleNote } from "@/components/ui/stale-note";
import type { User } from "@/features/auth/schemas";
import { formatPrice } from "@/features/market/market";
import { ORDER_GROUPS, orderGroupAria } from "@/features/orders/status";
import { cn } from "@/lib/cn";
import { ACCOUNT_NAV } from "../constants";
import { useIdentityStatus, useOrderCounts, useWallet } from "../queries";
import type { IdentityStatus } from "../schemas";
import { CardBoundary } from "./card-boundary";
import { SignOutButton } from "./sign-out";

const TEXT_LINK =
  "inline-flex h-11 items-center rounded-sm px-2 text-label text-primary hover-pointer:underline";

function WalletCard({ user }: { user: User }) {
  const { data: wallet, isRefetchError } = useWallet(user);

  return (
    <section
      aria-label="Wallet"
      className="flex flex-col gap-1 rounded-xl bg-card p-4.5 shadow-[0_6px_20px_rgb(38_55_130/0.08)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-caption text-muted">Wallet balance</span>
          <span className="font-heading text-h2 font-bold text-primary">
            {formatPrice(wallet.balance)}
          </span>
          <span className="text-caption text-muted">{formatPrice(wallet.pending)} pending</span>
        </div>
        <Link
          to="/account/wallet"
          className="flex h-11 shrink-0 items-center rounded-lg bg-primary px-4.5 text-label font-bold text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
        >
          Top up
        </Link>
      </div>
      <StaleNote refetchFailed={isRefetchError} />
    </section>
  );
}

const IDENTITY: Record<
  IdentityStatus,
  { icon: IconName; tile: string; title: string; text: string; action: string }
> = {
  verified: {
    icon: "shieldCheck",
    tile: "bg-success-tint text-success",
    title: "Identity verified",
    text: "You can place orders and use your wallet.",
    action: "View",
  },
  pending: {
    icon: "shield",
    tile: "bg-tint text-warning",
    title: "Verification in progress",
    text: "We'll let you know when it's done.",
    action: "View",
  },
  not_started: {
    icon: "shield",
    tile: "bg-tint text-primary",
    title: "Verify your identity",
    text: "You need this before you can place orders or use your wallet.",
    action: "Start",
  },
  rejected: {
    icon: "shield",
    tile: "bg-danger-tint text-danger",
    title: "We couldn't verify you",
    text: "Check your details and try again.",
    action: "View",
  },
};

function IdentityCard({ user }: { user: User }) {
  const { data: status, isRefetchError } = useIdentityStatus(user);
  const view = IDENTITY[status];

  return (
    <section
      aria-label="Identity verification"
      className="flex flex-col gap-1 rounded-xl bg-card p-4.5"
    >
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={cn("grid size-12 shrink-0 place-items-center rounded-lg", view.tile)}
        >
          <Icon name={view.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{view.title}</p>
          <p className="text-caption text-muted">{view.text}</p>
        </div>
        <Link
          to="/verify-identity"
          aria-label={`${view.action} identity verification`}
          className={TEXT_LINK}
        >
          {view.action}
        </Link>
      </div>
      <StaleNote refetchFailed={isRefetchError} />
    </section>
  );
}

const SHORTCUTS = [
  { label: "Favourites", icon: "heart", to: "/account/favourites" },
  { label: "Addresses", icon: "pin", to: "/account/addresses" },
  { label: "Refunds", icon: "refund", to: "/account/refunds" },
  { label: "Tickets", icon: "ticket", to: "/account/tickets" },
] as const satisfies readonly { label: string; icon: IconName; to: string }[];

const TILE =
  "relative flex h-18 flex-col items-center justify-center gap-1 rounded-md text-caption font-medium text-ink transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-surface active:scale-[0.97]";

function OrdersCard({ user }: { user: User }) {
  const { data: counts, isRefetchError } = useOrderCounts(user);

  return (
    <section aria-labelledby="my-orders" className="rounded-xl bg-card px-4 pt-2 pb-3.5">
      <div className="flex items-center justify-between">
        <h2 id="my-orders" className="text-section-sm">
          My orders
        </h2>
        <Link to="/account/orders" className={TEXT_LINK}>
          View all
        </Link>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {ORDER_GROUPS.map((group) => {
          const count = counts[group.id];
          return (
            <li key={group.id}>
              <Link
                to="/account/orders"
                search={{ status: group.id }}
                aria-label={orderGroupAria(group.label, count)}
                className={TILE}
              >
                <Icon name={group.icon} size={26} className="text-primary" />
                {group.label}
                {count > 0 ? (
                  <span
                    aria-hidden="true"
                    data-testid="order-badge"
                    className="absolute top-1 left-1/2 ml-1.5 h-4.5 min-w-4.5 rounded-full bg-danger px-1 text-center text-badge text-danger-foreground"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="my-2 h-px bg-tint" />
      <ul className="grid grid-cols-4 gap-2">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.to}>
            <Link to={shortcut.to} className={TILE}>
              {/* Brand red is an accent here: icons only, the label stays ink. */}
              <Icon name={shortcut.icon} size={26} className="text-secondary" />
              {shortcut.label}
            </Link>
          </li>
        ))}
      </ul>
      <StaleNote refetchFailed={isRefetchError} className="mt-1" />
    </section>
  );
}

/** Under 900px the sidebar becomes list rows on the overview. */
function MobileAccountNav() {
  return (
    <div className="flex flex-col gap-2 desktop:hidden">
      <nav aria-label="Account" className="overflow-hidden rounded-xl bg-card">
        <ul className="divide-y divide-tint">
          {ACCOUNT_NAV.filter((item) => item.to !== "/account").map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex h-13 items-center gap-3 pr-3.5 pl-4 text-body-sm font-medium text-ink transition-colors duration-150 ease-out hover-pointer:bg-surface"
              >
                <Icon name={item.icon} size={22} className="text-primary" />
                <span className="flex-1">{item.label}</span>
                <ChevronRightIcon className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <SignOutButton className="w-full justify-center" />
    </div>
  );
}

export function AccountOverview({ user }: { user: User }) {
  return (
    <>
      <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4">
        <CardBoundary label="your wallet">
          <WalletCard user={user} />
        </CardBoundary>
        <CardBoundary label="your verification status">
          <IdentityCard user={user} />
        </CardBoundary>
      </div>
      <CardBoundary label="your orders" skeletonClassName="h-48">
        <OrdersCard user={user} />
      </CardBoundary>
      <MobileAccountNav />
    </>
  );
}
