import { Link, Outlet, useMatches } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/api/errors";
import { useSession } from "@/features/auth/queries";
import type { User } from "@/features/auth/schemas";
import { FavouritesSync } from "@/features/favourites/components/favourites-sync";
import { cn } from "@/lib/cn";
import type { AccountRouteMeta } from "@/router";
import { useProfile } from "../queries";
import { AccountHeader } from "./account-header";
import { Arcs } from "./arcs";
import { AccountSidebar } from "./account-sidebar";
import { MobileBackBar, MobileTabBar } from "./mobile-bars";

const FALLBACK_META: AccountRouteMeta = { title: "Account", mobileBar: "back" };

const WRAP = "mx-auto w-full max-w-300 px-4 desktop:px-10";

function firstName(name: string | undefined) {
  return name?.trim().split(/\s+/)[0];
}

/** Mobile overview: navy header with avatar, name, customer ID and an edit link. */
function MobileProfileHeader({ user }: { user: User }) {
  const { data: profile } = useProfile(user);

  return (
    <div className="relative flex items-center gap-3.5 overflow-hidden rounded-b-sheet bg-primary px-5 pt-7 pb-23 text-primary-foreground desktop:hidden">
      <Arcs />
      <Avatar name={profile?.name} tone="light" className="relative size-14 text-section" />
      <div className="relative min-w-0 flex-1">
        <h1 className="truncate text-bar-title">{profile?.name ?? "Your account"}</h1>
        <p className="text-label font-normal text-on-primary-muted">{profile?.customerId}</p>
      </div>
      <Link
        to="/account/profile"
        aria-label="Edit profile"
        className="relative grid size-11 place-items-center rounded-full focus-visible:outline-primary-foreground"
      >
        <Icon name="edit" size={22} />
      </Link>
    </div>
  );
}

function SessionPending() {
  return (
    <div className={cn(WRAP, "flex flex-col gap-4 pt-6")} aria-busy="true">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

function SignedInFrame({ user, meta }: { user: User; meta: AccountRouteMeta }) {
  const { data: profile } = useProfile(user);
  const name = firstName(profile?.name);
  const title = meta.overview ? (name ? `Hello, ${name}` : "Your account") : meta.title;

  return (
    <>
      {meta.overview ? <MobileProfileHeader user={user} /> : null}
      <div
        className={cn(
          WRAP,
          "relative pt-6",
          meta.overview && "max-desktop:-mt-18 max-desktop:pt-0",
        )}
      >
        <div className="desktop:grid desktop:grid-cols-[280px_minmax(0,1fr)] desktop:items-start desktop:gap-7">
          <AccountSidebar user={user} className="hidden desktop:block" />
          <div className="flex min-w-0 flex-col gap-4">
            <h1 className="mt-1 hidden text-page-title desktop:block">{title}</h1>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Shell for every /account page. Signed in: desktop header + sidebar + page title; under 900px a
 * back bar (sub-pages) or the bottom tabs (overview). Guests: the page's own content (guest hero,
 * browser favourites). While the session check is loading or failed, it claims neither state.
 */
export function AccountLayout() {
  const session = useSession();
  const meta =
    useMatches({ select: (matches) => matches.at(-1)?.staticData.account }) ?? FALLBACK_META;
  const user = session.data;

  let content;
  if (user === undefined) {
    content = session.isError ? (
      <div className={cn(WRAP, "pt-6")}>
        <ErrorFallback
          title="We couldn't load your account"
          message={getErrorMessage(session.error)}
          onRetry={() => void session.refetch()}
        />
      </div>
    ) : (
      <SessionPending />
    );
  } else if (user) {
    content = <SignedInFrame user={user} meta={meta} />;
  } else {
    content = <Outlet />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <FavouritesSync />
      <AccountHeader user={user} />
      {meta.mobileBar === "back" ? (
        <MobileBackBar title={meta.title} backTo={meta.backTo ?? "/account"} />
      ) : null}
      <main className="flex-1 pb-8">{content}</main>
      {meta.mobileBar === "tabs" ? <MobileTabBar /> : null}
    </div>
  );
}

/** Guest pages that aren't the hero (e.g. browser favourites): same width, desktop title. */
export function GuestFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={cn(WRAP, "flex flex-col gap-4 pt-6")}>
      <h1 className="mt-1 hidden text-page-title desktop:block">{title}</h1>
      {children}
    </div>
  );
}
