import { useFieldContext } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";

/**
 * Boolean field control for use inside `<FormField>` under `form.AppField`, until hackert-ui
 * ships a checkbox. Marks itself invalid on the same rule as hackert's inputs: once blurred or submitted.
 */
export function CheckboxInput({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const field = useFieldContext<boolean>();
  const touched = useSelector(field.store, (state) => state.meta.isBlurred);
  const submitted = useSelector(field.form.store, (state) => state.submissionAttempts > 0);
  const hasErrors = useSelector(field.store, (state) => state.meta.errors.length > 0);

  return (
    <label className={cn("flex min-h-11 items-start gap-2.5 text-caption text-muted", className)}>
      <Checkbox
        name={field.name}
        checked={field.state.value}
        onChange={(event) => field.handleChange(event.target.checked)}
        onBlur={field.handleBlur}
        aria-invalid={(hasErrors && (touched || submitted)) || undefined}
        className="size-5.5 shrink-0"
      />
      <span>{children}</span>
    </label>
  );
}
