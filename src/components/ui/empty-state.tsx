import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  message: ReactNode;
  /** Usually a Link styled as a button. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, message, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-2 grid size-22 place-items-center rounded-full bg-tint text-primary"
        >
          {icon}
        </div>
      ) : null}
      <h2 className="text-bar-title">{title}</h2>
      <p className="max-w-sm text-body-sm text-muted">{message}</p>
      {action ? <div className="mt-2.5">{action}</div> : null}
    </div>
  );
}
