import { cn } from "@/lib/cn";
import type { Favourite } from "../schemas";
import { useFavourites } from "../use-favourites";

/** Heart toggle for product cards; shares the store with the Favourites page. */
export function FavouriteButton({ item, className }: { item: Favourite; className?: string }) {
  const favourites = useFavourites();
  const saved = favourites.isFavourite(item.productId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
      onClick={() => (saved ? favourites.remove(item.productId) : favourites.add(item))}
      className={cn(
        "grid size-11 place-items-center rounded-full bg-card/90 transition-[color,transform] duration-150 ease-out active:scale-[0.9]",
        saved ? "text-secondary" : "text-muted hover-pointer:text-ink",
        className,
      )}
    >
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
        <path
          d="M12 21S3 15.7 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.7-9 12-9 12z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
