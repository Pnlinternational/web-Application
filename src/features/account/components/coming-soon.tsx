import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/empty-state";

/** Placeholder for linked pages that aren't built yet (wallet, refunds, tickets, help…). */
export function ComingSoon({ title, message }: { title: string; message: string }) {
  return (
    <EmptyState
      title={title}
      message={message}
      action={
        <Link
          to="/account"
          className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-body-sm font-bold text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
        >
          Back to account
        </Link>
      }
    />
  );
}
