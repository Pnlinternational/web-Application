import { Form, FormField, useAppForm } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { withIdempotencyKey } from "@/api/idempotency";
import { CheckboxInput } from "@/components/form/checkbox-input";
import { clearSubmitErrors, toServerFormErrors } from "@/components/form/errors";
import { PhoneInput } from "@/components/form/phone-input";
import { Icon } from "@/components/icons/icon";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { User } from "@/features/auth/schemas";
import type { GeocodedAddress } from "@/features/geocoding/services";
import { type LocationStatus, useCurrentLocation } from "@/features/geocoding/use-current-location";
import { cn } from "@/lib/cn";
import { MARKET_PHONES, toE164 } from "@/lib/phone";
import { useSaveAddressMutation } from "../mutations";
import { REGIONS } from "../regions";
import {
  ADDRESS_LABELS,
  type Address,
  type AddressFormValues,
  addressFormSchema,
} from "../schemas";

const BANNER = "rounded-md bg-danger-tint px-3.5 py-3 text-label font-medium text-danger-ink";

function locationMessage(status: LocationStatus, country: string) {
  switch (status) {
    case "denied":
      return "Location access is off. Allow it in your browser settings, or enter your address below.";
    case "timeout":
      return "We couldn't get your location in time. Try again, or enter your address below.";
    case "unavailable":
      return "Your location isn't available right now. Enter your address below.";
    case "no_result":
      return "We couldn't find an address for your location. Enter it below.";
    case "out_of_country":
      return `Your location looks like it's outside ${country}. Enter your address below.`;
    default:
      return "";
  }
}

/** "+2348031234567" → "803 123 4567", which the phone field accepts back. */
function nationalPart(e164: string) {
  const digits = e164.replace(/\D/g, "");
  const dialCodes = Object.values(MARKET_PHONES).map((phone) => phone.dialCode);
  const dialCode = dialCodes.find((code) => digits.startsWith(code));
  return dialCode ? digits.slice(dialCode.length) : e164;
}

function initialValues(user: User, address: Address | undefined): AddressFormValues {
  return {
    market: user.market,
    label: address?.label ?? "home",
    recipient: address?.recipient ?? "",
    phone: address ? nationalPart(address.phone) : "",
    street: address?.street ?? "",
    area: address?.area ?? "",
    region: address?.region ?? "",
    landmark: address?.landmark ?? "",
    isDefault: address?.isDefault ?? false,
  };
}

/** Add and edit share this form. Saving returns to the list, which refetches the default. */
export function AddressForm({ user, address }: { user: User; address?: Address }) {
  const navigate = useNavigate();
  const save = useSaveAddressMutation(user);
  const regions = REGIONS[user.market];
  const location = useCurrentLocation(user.market);
  const [replacing, setReplacing] = useState<GeocodedAddress | null>(null);

  const form = useAppForm({
    defaultValues: initialValues(user, address),
    validators: {
      onChange: addressFormSchema,
      onSubmitAsync: async ({ value }) => {
        const input = {
          label: value.label,
          recipient: value.recipient.trim(),
          phone: toE164(user.market, value.phone),
          street: value.street.trim(),
          area: value.area.trim(),
          region: value.region,
          landmark: value.landmark.trim(),
          isDefault: value.isDefault,
        };
        try {
          await save.mutateAsync(withIdempotencyKey({ id: address?.id, input }));
          return undefined;
        } catch (error) {
          return toServerFormErrors(error);
        }
      },
    },
    listeners: { onChange: clearSubmitErrors },
    onSubmit: async () => {
      toast.success("Address saved");
      await navigate({ to: "/account/addresses" });
    },
  });
  const label = useSelector(form.store, (state) => state.values.label);

  // Landmark is never filled: only the person knows the nearest landmark.
  function fill(found: GeocodedAddress) {
    form.setFieldValue("street", found.street);
    form.setFieldValue("area", found.area);
    if (regions.options.includes(found.region)) form.setFieldValue("region", found.region);
  }

  async function fillFromLocation() {
    const found = await location.locate();
    if (!found) return;
    const { street, area, region } = form.state.values;
    const typed = street.trim() !== "" || area.trim() !== "" || region !== "";
    if (typed) setReplacing(found);
    else fill(found);
  }

  const locating = location.status === "locating";
  const message = locationMessage(location.status, MARKET_PHONES[user.market].name);

  return (
    <>
      <Form form={form} className="flex max-w-180 flex-col gap-3.5 rounded-xl bg-card p-5">
        <form.FormError className={BANNER} />
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={fillFromLocation}
            disabled={locating}
            aria-busy={locating || undefined}
            className="flex min-h-13 items-center gap-2.5 rounded-md bg-tint px-3.5 py-1.5 text-left text-body-sm font-semibold text-primary transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-divider active:scale-[0.99] disabled:cursor-progress"
          >
            {locating ? (
              <span
                aria-hidden="true"
                className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:600ms]"
              />
            ) : (
              <Icon name="locate" size={20} className="shrink-0" />
            )}
            {locating
              ? "Finding your location…"
              : location.status === "found"
                ? "Location added. Check the details below."
                : "Use my current location"}
          </button>
          <p role="status" className="text-caption text-danger-ink empty:hidden">
            {message}
          </p>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-label">Label</legend>
          <div className="grid grid-cols-3 gap-2">
            {ADDRESS_LABELS.map((option) => {
              const selected = option.id === label;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => form.setFieldValue("label", option.id)}
                  className={cn(
                    "h-11.5 rounded-sm text-label transition-colors duration-150 ease-out",
                    selected
                      ? "border-2 border-primary bg-tint font-semibold text-primary"
                      : "border border-border bg-card font-medium text-ink hover-pointer:bg-surface",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3.5 desktop:grid-cols-2">
          <form.AppField name="recipient">
            {(field) => (
              <FormField>
                <FormField.Label>Recipient name</FormField.Label>
                <field.TextInput autoComplete="name" placeholder="Who should receive it?" />
                <FormField.Error />
              </FormField>
            )}
          </form.AppField>
          <form.AppField name="phone">
            {() => (
              <FormField>
                <FormField.Label>Phone number</FormField.Label>
                <PhoneInput lockMarket />
                <FormField.Error />
              </FormField>
            )}
          </form.AppField>
        </div>
        <form.AppField name="street">
          {(field) => (
            <FormField>
              <FormField.Label>Street address</FormField.Label>
              <field.TextInput
                autoComplete="street-address"
                placeholder="House number and street"
              />
              <FormField.Error />
            </FormField>
          )}
        </form.AppField>
        <div className="grid gap-3.5 desktop:grid-cols-2">
          <form.AppField name="area">
            {(field) => (
              <FormField>
                <FormField.Label>City or area</FormField.Label>
                <field.TextInput autoComplete="address-level2" />
                <FormField.Error />
              </FormField>
            )}
          </form.AppField>
          <form.AppField name="region">
            {(field) => (
              <FormField>
                <FormField.Label>{regions.label}</FormField.Label>
                <field.SelectInput
                  options={regions.options}
                  placeholder={`Choose a ${regions.label.toLowerCase()}`}
                  autoComplete="address-level1"
                />
                <FormField.Error />
              </FormField>
            )}
          </form.AppField>
        </div>
        <form.AppField name="landmark">
          {(field) => (
            <FormField>
              <FormField.Label>Nearest landmark (optional)</FormField.Label>
              <field.TextInput placeholder="Helps the rider find you" />
              <FormField.Error />
            </FormField>
          )}
        </form.AppField>
        {address?.isDefault ? (
          <p className="text-caption text-muted">This is your default address.</p>
        ) : (
          <form.AppField name="isDefault">
            {() => (
              <CheckboxInput className="items-center text-body-sm font-medium text-ink">
                Set as default address
              </CheckboxInput>
            )}
          </form.AppField>
        )}
        <div className="flex justify-end">
          <form.SubmitButton
            radius="lg"
            className="h-13 w-full px-6 text-body-sm font-bold desktop:w-auto"
          >
            Save address
          </form.SubmitButton>
        </div>
      </Form>
      <ConfirmDialog
        open={replacing !== null}
        tone="primary"
        title="Use your current location?"
        description={
          replacing
            ? `We'll replace what you typed with ${[replacing.street, replacing.area, replacing.region].join(", ")}.`
            : undefined
        }
        cancelLabel="Keep mine"
        confirmLabel="Use location"
        onCancel={() => {
          setReplacing(null);
          location.reset();
        }}
        onConfirm={() => {
          if (replacing) fill(replacing);
          setReplacing(null);
        }}
      />
    </>
  );
}
