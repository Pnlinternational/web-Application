import { Link } from "@tanstack/react-router";
import { ChevronRightIcon, Icon, type IconName } from "@/components/icons/icon";
import { MarketRow } from "@/features/market/market-picker";
import { SHOW_LIVE_CHAT } from "../constants";
import { Arcs } from "./arcs";

const ROW =
  "flex h-14 items-center gap-3 border-t border-tint pr-3.5 pl-4 text-body-sm font-medium text-ink transition-colors duration-150 ease-out hover-pointer:bg-surface";

const HERO_BUTTON =
  "flex h-13 items-center justify-center rounded-lg text-body-sm transition-[background-color,transform] duration-150 ease-out active:scale-[0.97]";

interface GuestRow {
  label: string;
  icon: IconName;
  to: "/account/favourites" | "/help";
  hash?: string;
}

const ROWS: readonly GuestRow[] = [
  { label: "Favourites", icon: "heart", to: "/account/favourites" },
  { label: "Help and FAQs", icon: "doc", to: "/help" },
  // Live chat has no provider yet (SHOW_LIVE_CHAT); /help is where it will live.
  ...(SHOW_LIVE_CHAT
    ? [{ label: "Live chat", icon: "chat", to: "/help", hash: "chat" } as const]
    : []),
  // /terms and /privacy don't exist yet; the help page links them when they do.
  { label: "Terms and privacy", icon: "shield", to: "/help", hash: "legal" },
];

/** /account for guests: navy hero with sign-in, the "Shopping from" picker and help rows. */
export function GuestAccount() {
  return (
    <div className="pb-8">
      <div className="relative overflow-hidden rounded-b-sheet bg-primary px-6 pt-10 pb-8 text-primary-foreground desktop:rounded-none">
        <Arcs className="-top-15 -right-24" />
        <div className="relative mx-auto flex max-w-140 flex-col items-center gap-2.5 text-center">
          <img src="/assets/parcels.svg" alt="" width={132} height={120} className="block" />
          <h1 className="text-page-title font-bold">Your account</h1>
          <p className="text-body-sm text-on-primary-muted">
            Sign in to track orders, use your wallet and check out.
          </p>
          <div className="mt-2 grid w-full max-w-95 grid-cols-2 gap-2.5">
            <Link
              to="/login"
              search={{ redirect: "/account" }}
              className={`${HERO_BUTTON} bg-card font-bold text-primary hover-pointer:bg-tint focus-visible:outline-primary-foreground`}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              search={{ redirect: "/account" }}
              className={`${HERO_BUTTON} border border-on-primary-muted/60 font-semibold text-primary-foreground hover-pointer:bg-primary-chip focus-visible:outline-primary-foreground`}
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-5 w-full max-w-160 px-4">
        <div className="overflow-hidden rounded-xl bg-card">
          <MarketRow />
          <ul>
            {ROWS.map((row) => (
              <li key={row.label}>
                <Link to={row.to} hash={row.hash} className={ROW}>
                  <Icon name={row.icon} size={22} className="text-primary" />
                  <span className="flex-1">{row.label}</span>
                  <ChevronRightIcon className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
