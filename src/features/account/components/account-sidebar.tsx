import { Link } from "@tanstack/react-router";
import { Icon } from "@/components/icons/icon";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/features/auth/schemas";
import { cn } from "@/lib/cn";
import { ACCOUNT_NAV } from "../constants";
import { useProfile } from "../queries";
import { SignOutButton } from "./sign-out";

/** Desktop sidebar: who's signed in, the account nav (current page tinted), Sign out. */
export function AccountSidebar({ user, className }: { user: User; className?: string }) {
  const { data: profile } = useProfile(user);

  return (
    <aside className={cn("rounded-xl bg-card p-4.5", className)}>
      <div className="mb-3.5 flex items-center gap-3">
        <Avatar name={profile?.name} className="size-13 text-section" />
        <div className="min-w-0">
          {profile ? (
            <p className="truncate font-semibold">{profile.name}</p>
          ) : (
            <Skeleton className="mb-1 h-5 w-32" />
          )}
          <p className="text-caption text-muted">{profile?.customerId}</p>
        </div>
      </div>
      <nav aria-label="Account" className="-mx-2 flex flex-col gap-0.5">
        {ACCOUNT_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/account" }}
            className="flex h-13 items-center gap-3 rounded-md px-3.5 text-body-sm font-medium text-ink transition-colors duration-150 ease-out hover-pointer:bg-surface data-[status=active]:bg-tint data-[status=active]:font-semibold data-[status=active]:text-primary"
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </Link>
        ))}
        <SignOutButton className="px-3.5" />
      </nav>
    </aside>
  );
}
