import { createFileRoute } from "@tanstack/react-router";

// Placeholder: identity verification (KYC) is out of scope for the auth work; sign-up lands here.
export const Route = createFileRoute("/(shop)/_authed/verify-identity")({
  head: () => ({ meta: [{ title: "Verify your identity — PNL Store" }] }),
  component: VerifyIdentityPage,
});

function VerifyIdentityPage() {
  return <h1 className="text-h2">Verify your identity</h1>;
}
