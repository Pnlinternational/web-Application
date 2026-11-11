import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(marketing)/")({
  head: () => ({ meta: [{ title: "PNL Store — Everyday essentials, delivered" }] }),
  component: LandingPage,
});

const highlights = [
  { title: "Free delivery", body: "On every order over $50, no codes needed." },
  { title: "30-day returns", body: "Changed your mind? Send it back, on us." },
  { title: "Secure checkout", body: "Your payment details never touch our servers." },
];

function LandingPage() {
  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-24">
        <p className="text-sm font-medium text-accent">New season collection</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-balance">
          Everyday essentials, thoughtfully made.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground text-pretty">
          Quality products at fair prices, shipped fast. Find something you'll use every day.
        </p>
        <Link
          to="/products"
          className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Browse products
        </Link>
      </section>
      <section className="border-t border-border bg-muted/40">
        <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-3">
          {highlights.map((item) => (
            <li key={item.title}>
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
