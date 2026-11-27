import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/cn";

export function initialsOf(name: string | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

interface AvatarProps {
  name?: string;
  /** navy: navy disc, white letters (desktop). light: white disc, navy letters (on the navy header). */
  tone?: "navy" | "light";
  className?: string;
}

/** Decorative: the name is always shown as text next to it. */
export function Avatar({ name, tone = "navy", className }: AvatarProps) {
  const initials = initialsOf(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-heading font-bold",
        tone === "navy" ? "bg-primary text-primary-foreground" : "bg-card text-primary",
        className,
      )}
    >
      {initials || <Icon name="person" size={20} />}
    </span>
  );
}
