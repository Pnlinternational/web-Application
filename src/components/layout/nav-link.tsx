import { createLink } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

function NavAnchor({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 ease-out hover-pointer:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

// Router-aware link; TanStack sets data-status="active" on the current route.
export const NavLink = createLink(NavAnchor);
