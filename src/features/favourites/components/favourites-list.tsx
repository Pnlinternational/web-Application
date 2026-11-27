import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/errors";
import { ErrorFallback } from "@/components/errors/error-fallback";
import { Icon } from "@/components/icons/icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StaleNote } from "@/components/ui/stale-note";
import { formatPrice } from "@/features/market/market";
import type { Favourite } from "../schemas";
import { useFavourites } from "../use-favourites";

function FavouriteCard({ item, onRemove }: { item: Favourite; onRemove: () => void }) {
  return (
    <article className="relative overflow-hidden rounded-xl bg-card">
      <Link
        to="/products/$slug"
        params={{ slug: item.slug }}
        aria-label={`View ${item.name}`}
        className="flex min-h-34 gap-3 p-3 text-ink transition-colors duration-150 ease-out hover-pointer:bg-surface/60"
      >
        <span className="grid h-28 w-25 shrink-0 place-items-center rounded-md bg-tint">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              width={80}
              height={80}
              loading="lazy"
              className="block size-20"
            />
          ) : (
            <Icon name="box" size={36} className="text-primary" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 pb-9">
          <span className="text-meta font-semibold text-muted">{item.store}</span>
          <span className="truncate text-body-sm font-medium">{item.name}</span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-price text-primary">{formatPrice(item.price)}</span>
            <span className="text-meta font-normal text-muted">Plus freight</span>
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.name} from favourites`}
        className="absolute bottom-1.5 left-31 flex h-11 items-center gap-1.5 rounded-sm pr-2 pl-1 text-label text-danger hover-pointer:bg-danger-tint"
      >
        <Icon name="trash" size={17} />
        Remove
      </button>
    </article>
  );
}

/**
 * Favourites (account or this browser). Remove is instant with an Undo toast; if the request
 * fails, the item comes back and the toast is withdrawn.
 */
export function FavouritesList() {
  const favourites = useFavourites();

  if (favourites.status === "pending") {
    return (
      <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4" aria-busy="true">
        <Skeleton className="h-34 rounded-xl" />
        <Skeleton className="h-34 rounded-xl" />
      </div>
    );
  }

  if (favourites.status === "error") {
    return (
      <ErrorFallback
        title="We couldn't load your favourites"
        message={getErrorMessage(favourites.error)}
        onRetry={favourites.refetch}
      />
    );
  }

  if (favourites.items.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="heart" size={40} />}
        title="No favourites yet"
        message="Tap the heart on a product to save it here."
        action={
          <Link
            to="/products"
            className="inline-flex h-13 items-center rounded-lg bg-primary px-6 text-body-sm font-bold text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
          >
            Start shopping
          </Link>
        }
      />
    );
  }

  function remove(item: Favourite, index: number) {
    const toastId = toast("Removed from favourites", {
      action: { label: "Undo", onClick: () => favourites.add(item, index) },
    });
    favourites.remove(item.productId, { onError: () => toast.dismiss(toastId) });
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {favourites.items.length === 1 ? "1 item" : `${favourites.items.length} items`}
      </p>
      <div className="grid gap-3 desktop:grid-cols-2 desktop:gap-4">
        {favourites.items.map((item, index) => (
          <FavouriteCard key={item.productId} item={item} onRemove={() => remove(item, index)} />
        ))}
      </div>
      <StaleNote refetchFailed={favourites.refetchFailed} />
    </>
  );
}
