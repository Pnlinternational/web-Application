import { createFileRoute } from "@tanstack/react-router";
import { CardBoundary } from "@/features/account/components/card-boundary";
import { EditProfile } from "@/features/account/components/edit-profile";

export const Route = createFileRoute("/(account)/account/_authed/profile")({
  head: () => ({ meta: [{ title: "Edit profile — PNL Store" }] }),
  staticData: { account: { title: "Edit profile", mobileBar: "back" } },
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  return (
    <CardBoundary label="your profile" skeletonClassName="h-96 max-w-160">
      <EditProfile user={user} />
    </CardBoundary>
  );
}
