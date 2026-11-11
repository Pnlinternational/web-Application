import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  errors?: readonly string[];
  className?: string;
  children: ReactNode;
}

/** Label + control + description/error, wired for aria-describedby by id convention. */
export function Field({ id, label, description, errors = [], className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {description ? (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {errors.length > 0 ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {errors.join(". ")}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(
  id: string,
  { hasDescription, hasError }: { hasDescription: boolean; hasError: boolean },
) {
  const ids = [hasDescription && `${id}-description`, hasError && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}
