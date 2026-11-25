import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Custom tokens from app.css; without these, text-h1 reads as a colour and drops text-ink.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "h1",
        "h2",
        "section",
        "card-title",
        "price",
        "lead",
        "body",
        "body-sm",
        "label",
        "caption",
        "meta",
        "badge",
      ],
      radius: ["sheet", "sheet-auth"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
