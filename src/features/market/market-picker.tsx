import { useState } from "react";
import { ChevronRightIcon } from "@/components/icons/icon";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { type Market, MARKET_PHONES, MARKETS } from "@/lib/phone";
import { marketLabel, setGuestMarket, useGuestMarket } from "./market";

function Flag({ market }: { market: Market }) {
  return (
    <img
      src={`/assets/flags/${market.toLowerCase()}.svg`}
      alt=""
      width={24}
      height={17}
      className="block shrink-0 rounded-[3px] ring-1 ring-divider"
    />
  );
}

/** "Shopping from" row (guest Account) + a dialog to pick Nigeria (NGN) or Ghana (GHS). */
export function MarketRow({ className }: { className?: string }) {
  const market = useGuestMarket();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Shopping from ${MARKET_PHONES[market].name}. Change country`}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-14 w-full items-center gap-3 pr-3.5 pl-4 text-left text-body-sm font-medium transition-colors duration-150 ease-out hover-pointer:bg-surface",
          className,
        )}
      >
        <Flag market={market} />
        <span className="flex-1">Shopping from</span>
        <span className="text-label font-normal text-muted">{marketLabel(market)}</span>
        <ChevronRightIcon className="text-muted" />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Where are you shopping from?"
        description="Prices and payments use this country's currency."
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Country</legend>
          {MARKETS.map((option) => (
            <label
              key={option}
              className="flex min-h-13 cursor-pointer items-center gap-3 rounded-md border border-border px-3.5 text-body-sm font-medium has-checked:border-2 has-checked:border-primary has-checked:bg-tint"
            >
              <input
                type="radio"
                name="market"
                value={option}
                checked={option === market}
                data-autofocus={option === market ? "" : undefined}
                onChange={() => setGuestMarket(option)}
                className="size-5 accent-primary"
              />
              <Flag market={option} />
              {marketLabel(option)}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 h-12 rounded-md bg-primary text-body-sm font-bold text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
        >
          Done
        </button>
      </Dialog>
    </>
  );
}
