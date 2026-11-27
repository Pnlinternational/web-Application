import { TextInput, useFieldContext } from "@hackert-ui/form";
import { useSelector } from "@tanstack/react-form";
import { type Market, MARKET_PHONES, MARKETS } from "@/lib/phone";

/**
 * Phone control for `form.AppField name="phone"` inside `<FormField>`, for forms that also hold
 * a `market` value. hackert's TextInput is the real input (label, errors, aria wiring); the
 * country picker is a native select laid over its left padding. With `lockMarket` (address form:
 * the account's country) the prefix is shown without a picker.
 */
export function PhoneInput({ lockMarket = false }: { lockMarket?: boolean }) {
  const field = useFieldContext<string>();
  const market = useSelector(field.form.store, (state) => state.values.market as Market);
  const { dialCode } = MARKET_PHONES[market];

  function changeMarket(next: Market) {
    field.form.setFieldValue("market", next);
    field.setErrorMap({ onSubmit: undefined });
    void field.validate("change");
  }

  return (
    <div className="relative">
      {lockMarket ? (
        <div className="absolute inset-y-px left-px z-10 flex items-center border-r border-divider pr-3 pl-3.5">
          <span className="text-body-sm font-semibold text-ink">+{dialCode}</span>
        </div>
      ) : (
        <div className="absolute inset-y-px left-px z-10 flex w-29 items-center gap-2 rounded-l-md border-r border-divider pr-2.5 pl-3.5 has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-ring">
          <img
            src={`/assets/flags/${market.toLowerCase()}.svg`}
            alt=""
            width={24}
            height={17}
            className="block ring-1 ring-divider"
          />
          <span className="text-body-sm font-semibold text-ink">+{dialCode}</span>
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <select
            aria-label="Country code"
            value={market}
            onChange={(event) => changeMarket(event.target.value as Market)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {MARKETS.map((option) => (
              <option key={option} value={option}>
                {MARKET_PHONES[option].name} (+{MARKET_PHONES[option].dialCode})
              </option>
            ))}
          </select>
        </div>
      )}
      <TextInput
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="Phone number"
        className={lockMarket ? "pl-20" : "pl-32.5"}
      />
    </div>
  );
}
