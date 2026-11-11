import { createFormHook } from "@tanstack/react-form";
import {
  CheckboxField,
  FormError,
  NumberField,
  SelectField,
  SubmitButton,
  TextField,
} from "./fields";
import { fieldContext, formContext } from "./form-context";

// App-wide form hook: `<form.AppField name="email">{(f) => <f.TextField label="Email" />}</form.AppField>`.
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, NumberField, SelectField, CheckboxField },
  formComponents: { SubmitButton, FormError },
});
