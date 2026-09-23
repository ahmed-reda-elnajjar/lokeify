import Link from "next/link";
import HeroAvatarPreview from "@/components/landing/HeroAvatarPreview";

export default function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs text-muted">
            Built for Egyptian fashion brands
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop guessing sizes.
            <br />
            <span className="bg-accent/10 px-1 text-accent">
              See it on your own body
            </span>{" "}
            first.
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted sm:text-lg">
            Lokeify gives every shopper a personal 3D avatar — so they can see
            exactly how a t-shirt, pair of pants, or jacket will look and fit
            on their body, in their size, before they buy.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/create-avatar"
              className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Create Your Avatar
            </Link>
            <Link
              href="/store"
              className="rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              Browse Demo Store
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            No signup needed — this is a click-through prototype.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <HeroAvatarPreview />
        </div>
      </div>
    </section>
  );
}
