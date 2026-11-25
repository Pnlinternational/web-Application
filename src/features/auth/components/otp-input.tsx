import { TextInput, useFieldContext } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import { cn } from "@/lib/cn";

export const CODE_LENGTH = 6;

const BOX = "flex items-center justify-center rounded-md font-heading text-h2 font-bold";

function boxClass(index: number, length: number, wrong: boolean) {
  if (wrong) return cn(BOX, "border-2 border-danger bg-danger-tint text-danger-ink");
  if (index < length) return cn(BOX, "border border-primary bg-tint text-primary");
  if (index === length) {
    return cn(
      BOX,
      "border border-border bg-card group-focus-within:border-2 group-focus-within:border-primary",
    );
  }
  return cn(BOX, "border border-border bg-card");
}

/**
 * Six digit boxes backed by ONE input (one-time-code autofill, paste, screen readers see a single
 * field). Use inside `form.AppField name="code"` and `<FormField>`. The field only gets errors from
 * the API (no change validator), so red boxes always mean "wrong code".
 */
export function OtpInput() {
  const field = useFieldContext<string>();
  const code = useSelector(field.store, (state) => state.value);
  const wrong = useSelector(field.store, (state) => state.meta.errors.length > 0);

  return (
    <div className="group relative h-15 [&_.hui-input-wrapper]:absolute [&_.hui-input-wrapper]:inset-0">
      <div aria-hidden="true" className="grid h-full grid-cols-6 gap-2.5">
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <div key={index} className={boxClass(index, code.length, wrong)}>
            {code[index] ?? ""}
          </div>
        ))}
      </div>
      <TextInput
        inputMode="numeric"
        autoComplete="one-time-code"
        className="size-full min-h-0 cursor-text border-0 bg-transparent p-0 text-transparent caret-transparent shadow-none selection:bg-transparent focus:shadow-none"
      />
    </div>
  );
}
