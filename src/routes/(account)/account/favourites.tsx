import { createFileRoute } from "@tanstack/react-router";
import { GuestFrame } from "@/features/account/components/account-layout";
import { useSession } from "@/features/auth/queries";
import { FavouritesList } from "@/features/favourites/components/favourites-list";

// Open to guests too: they see the favourites saved in this browser.
export const Route = createFileRoute("/(account)/account/favourites")({
  head: () => ({ meta: [{ title: "Favourites — PNL Store" }] }),
  staticData: { account: { title: "Favourites", mobileBar: "back" } },
  component: FavouritesPage,
});

function FavouritesPage() {
  const { data: user } = useSession();
  return user ? (
    <FavouritesList />
  ) : (
    <GuestFrame title="Favourites">
      <FavouritesList />
    </GuestFrame>
  );
}
