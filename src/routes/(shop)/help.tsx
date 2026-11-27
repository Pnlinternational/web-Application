import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/empty-state";

// Placeholder: Help and FAQs, live chat and the terms/privacy pages aren't built yet.
export const Route = createFileRoute("/(shop)/help")({
  head: () => ({ meta: [{ title: "Help — PNL Store" }] }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-page-title">Help and FAQs</h1>
      <EmptyState
        title="Help is on its way"
        message="FAQs, live chat, and our terms and privacy policy will be here soon."
      />
    </div>
  );
}
