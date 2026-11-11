import { useSelector } from "@tanstack/react-form";
import type { ComponentProps, ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toErrorMessages } from "./errors";
import { useFieldContext, useFormContext } from "./form-context";

// Errors appear once the user leaves the field or tries to submit, not while typing the first char.
function useVisibleErrors() {
  const field = useFieldContext<unknown>();
  const submissionAttempts = useSelector(field.form.store, (state) => state.submissionAttempts);
  const meta = field.state.meta;
  const visible = meta.isBlurred || submissionAttempts > 0;
  return visible ? toErrorMessages(meta.errors) : [];
}

interface BaseFieldProps {
  label: ReactNode;
  description?: ReactNode;
}

type TextFieldProps = BaseFieldProps &
  Pick<ComponentProps<"input">, "type" | "autoComplete" | "placeholder" | "inputMode" | "disabled">;

export function TextField({ label, description, type = "text", ...inputProps }: TextFieldProps) {
  const field = useFieldContext<string>();
  const errors = useVisibleErrors();
  const id = `field-${field.name}`;

  return (
    <Field id={id} label={label} description={description} errors={errors}>
      <Input
        id={id}
        name={field.name}
        type={type}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={describedBy(id, {
          hasDescription: Boolean(description),
          hasError: errors.length > 0,
        })}
        {...inputProps}
      />
    </Field>
  );
}

type NumberFieldProps = BaseFieldProps &
  Pick<ComponentProps<"input">, "min" | "max" | "step" | "disabled">;

export function NumberField({ label, description, ...inputProps }: NumberFieldProps) {
  const field = useFieldContext<number | undefined>();
  const errors = useVisibleErrors();
  const id = `field-${field.name}`;

  return (
    <Field id={id} label={label} description={description} errors={errors}>
      <Input
        id={id}
        name={field.name}
        type="number"
        inputMode="decimal"
        value={field.state.value ?? ""}
        onChange={(event) =>
          field.handleChange(event.target.value === "" ? undefined : event.target.valueAsNumber)
        }
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={describedBy(id, {
          hasDescription: Boolean(description),
          hasError: errors.length > 0,
        })}
        {...inputProps}
      />
    </Field>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({ label, description, options, placeholder }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const errors = useVisibleErrors();
  const id = `field-${field.name}`;

  return (
    <Field id={id} label={label} description={description} errors={errors}>
      <Select
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0 || undefined}
        aria-describedby={describedBy(id, {
          hasDescription: Boolean(description),
          hasError: errors.length > 0,
        })}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function CheckboxField({ label }: { label: ReactNode }) {
  const field = useFieldContext<boolean>();
  const errors = useVisibleErrors();
  const id = `field-${field.name}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex items-center gap-2 text-sm">
        <Checkbox
          id={id}
          name={field.name}
          checked={field.state.value}
          onChange={(event) => field.handleChange(event.target.checked)}
          onBlur={field.handleBlur}
          aria-invalid={errors.length > 0 || undefined}
        />
        {label}
      </label>
      {errors.length > 0 ? <p className="text-xs text-danger">{errors.join(". ")}</p> : null}
    </div>
  );
}

export function SubmitButton({ children, ...props }: Omit<ButtonProps, "type" | "loading">) {
  const form = useFormContext();
  // Only block while a submit is in flight: after a failed attempt (e.g. dropped connection)
  // the user must be able to try again without editing a field.
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <Button type="submit" loading={isSubmitting} {...props}>
      {children}
    </Button>
  );
}

/** Form-level error (e.g. "Invalid credentials" or a network failure) from submit validators. */
export function FormError() {
  const form = useFormContext();
  const errors = toErrorMessages(useSelector(form.store, (state) => state.errors));
  if (errors.length === 0) return null;

  return (
    <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
      {errors.join(". ")}
    </p>
  );
}
