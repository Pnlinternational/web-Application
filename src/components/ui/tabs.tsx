import { type KeyboardEvent, useId, useRef } from "react";
import { cn } from "@/lib/cn";

interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  label: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** id of the element with role="tabpanel" that shows the selected tab. */
  panelId: string;
  className?: string;
}

/**
 * Chip-style tablist (Notifications design). Roving tabindex: Tab enters the selected tab,
 * arrows/Home/End move and select. Only colours transition; tabs change too often for motion.
 */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  panelId,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef(new Map<T, HTMLButtonElement>());

  function select(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (!tab) return;
    onChange(tab.id);
    refs.current.get(tab.id)?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex gap-2 overflow-x-auto [scrollbar-width:none]", className)}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) refs.current.set(tab.id, node);
              else refs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`${baseId}-${tab.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "h-11 shrink-0 rounded-md px-4 text-label transition-colors duration-150 ease-out",
              selected
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-card font-medium text-primary hover-pointer:bg-tint",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
