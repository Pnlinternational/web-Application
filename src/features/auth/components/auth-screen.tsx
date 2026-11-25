import { useCanGoBack, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMediaQuery } from "@/lib/use-media-query";

// Matches --breakpoint-desktop in app.css (900px).
const DESKTOP_QUERY = "(min-width: 56.25rem)";

const STORES = ["AliExpress", "Amazon", "1688", "Taobao", "Pinduoduo"];

interface AuthScreenProps {
  title: string;
  subtitle?: ReactNode;
  /** Where the back arrow goes when there is no history to go back to. */
  backFallback?: string;
  children: ReactNode;
}

function Arcs() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 520 520"
      fill="none"
      className="pointer-events-none absolute -top-30 -right-45 size-130"
    >
      <circle
        cx="260"
        cy="260"
        r="150"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="2"
      />
      <circle
        cx="260"
        cy="260"
        r="220"
        stroke="currentColor"
        strokeOpacity="0.06"
        strokeWidth="2"
      />
      <path d="M110 260a150 150 0 0 0 150 150" className="stroke-secondary" strokeWidth="12" />
    </svg>
  );
}

function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (canGoBack ? router.history.back() : void router.navigate({ href: fallback }))}
      className="-ml-2.5 flex size-11 items-center justify-center rounded-full focus-visible:outline-primary-foreground"
    >
      <svg
        aria-hidden="true"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
}

function BrandHero() {
  return (
    <div className="relative mt-auto hidden desktop:block">
      <p className="max-w-130 font-heading text-display">Shop the world. Pay in cedis or naira.</p>
      <p className="mt-4 max-w-115 text-lead text-on-primary-muted">
        Paste a link from any store, see one price, and follow your order from the China warehouse
        to your door.
      </p>
      <img src="/assets/parcels.svg" alt="" width={300} height={274} className="mt-7 block" />
      <ul
        aria-label="Stores you can buy from"
        className="mt-7 flex flex-wrap gap-2 text-caption font-semibold"
      >
        {STORES.map((store) => (
          <li key={store} className="rounded-full bg-primary-chip px-3 py-1.5">
            {store}
          </li>
        ))}
        <li className="rounded-full bg-primary-foreground px-3 py-1.5 text-primary">
          Any store link
        </li>
      </ul>
    </div>
  );
}

/** Navy brand header (mobile) or panel (desktop) beside a white form sheet; one per auth screen. */
export function AuthScreen({ title, subtitle, backFallback = "/", children }: AuthScreenProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const heading = <h1 className="font-heading text-h1">{title}</h1>;

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-primary desktop:grid-cols-2 desktop:grid-rows-1">
      <aside className="relative overflow-hidden px-6 pt-12 pb-10 text-primary-foreground desktop:flex desktop:flex-col desktop:px-16 desktop:py-12">
        <Arcs />
        <div className="relative flex items-center gap-2.5">
          <BackButton fallback={backFallback} />
          <img src="/assets/pnl-logo.png" alt="" width={34} height={42} className="block" />
          <span className="font-heading text-card-title font-bold">PNL</span>
        </div>
        {isDesktop ? null : (
          <div className="relative mt-5">
            {heading}
            {subtitle ? (
              <p className="mt-2 text-body-sm text-on-primary-muted">{subtitle}</p>
            ) : null}
          </div>
        )}
        <BrandHero />
      </aside>

      <main className="relative -mt-4 rounded-t-sheet-auth bg-card px-6 pt-7 pb-8 text-ink desktop:mt-0 desktop:flex desktop:items-center desktop:rounded-none desktop:p-14">
        <div className="mx-auto flex w-full max-w-105 flex-col gap-4">
          {isDesktop ? (
            <div className="mb-2">
              {heading}
              {subtitle ? <p className="mt-2 text-body-sm text-muted">{subtitle}</p> : null}
            </div>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
