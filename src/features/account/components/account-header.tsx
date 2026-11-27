import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/ui/avatar";
import type { User } from "@/features/auth/schemas";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { useProfile } from "../queries";

/** Desktop (900px+) header from the web Account design: logo, Continue shopping, bell, avatar. */
export function AccountHeader({ user }: { user: User | null | undefined }) {
  const { data: profile } = useProfile(user);

  return (
    <header className="hidden bg-card desktop:block">
      <div className="mx-auto flex h-19 w-full max-w-300 items-center gap-4 px-10">
        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <img src="/assets/pnl-logo.png" alt="" width={32} height={39} className="block" />
          <span className="font-heading text-bar-title font-bold">PNL</span>
        </Link>
        <div className="flex-1" />
        <Link
          to="/products"
          className="inline-flex h-11 items-center rounded-sm px-2 text-label text-primary hover-pointer:underline"
        >
          Continue shopping
        </Link>
        {user ? (
          <>
            <NotificationBell user={user} />
            <Link to="/account" aria-label="Account" className="rounded-full">
              <Avatar name={profile?.name} className="size-10 text-label" />
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
