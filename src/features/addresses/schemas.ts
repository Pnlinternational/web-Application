import { z } from "zod";
import { type Market, MARKETS, phoneError } from "@/lib/phone";

export const ADDRESS_LABELS = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "other", label: "Other" },
] as const;

export type AddressLabel = (typeof ADDRESS_LABELS)[number]["id"];

export const addressSchema = z.object({
  id: z.string(),
  label: z.enum(["home", "work", "other"]),
  recipient: z.string(),
  /** E.164 */
  phone: z.string(),
  street: z.string(),
  area: z.string(),
  region: z.string(),
  landmark: z.string(),
  isDefault: z.boolean(),
});

export type Address = z.infer<typeof addressSchema>;

export type AddressInput = Omit<Address, "id">;

export function addressLabelText(label: AddressLabel) {
  return ADDRESS_LABELS.find((item) => item.id === label)?.label ?? label;
}

/** The form keeps the market (fixed to the account's) and the phone as typed, like the auth forms. */
export const addressFormSchema = z
  .object({
    market: z.enum(MARKETS),
    label: z.enum(["home", "work", "other"]),
    recipient: z.string().trim().min(2, "Enter who should receive it"),
    phone: z.string(),
    street: z.string().trim().min(3, "Enter the house number and street"),
    area: z.string().trim().min(2, "Enter the city or area"),
    region: z.string().min(1, "Choose one"),
    landmark: z.string().trim().max(120, "Use 120 characters or fewer"),
    isDefault: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const message = phoneError(value.market as Market, value.phone);
    if (message) ctx.addIssue({ code: "custom", path: ["phone"], message });
  });

export type AddressFormValues = z.infer<typeof addressFormSchema>;
