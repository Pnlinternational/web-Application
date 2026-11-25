import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

function NavAnchor({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "rounded-sm px-3 py-2 text-label font-medium text-muted transition-colors duration-150 ease-out hover-pointer:text-ink data-[status=active]:font-semibold data-[status=active]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

// Router-aware link; TanStack sets data-status="active" on the current route.
export const NavLink = createLink(NavAnchor);
