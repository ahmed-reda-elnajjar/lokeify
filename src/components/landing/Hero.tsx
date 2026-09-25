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
            Lokeify is the store builder for fashion brands: products, orders and
            checkout like Shopify — plus a 3D fit room, AI photo try-on and size
            advice on every product, so shoppers buy the right size first time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/signup"
              className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Start your store
            </a>
            <a
              href="/s/crate"
              className="rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              See the demo store
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">
            Free while you build. Your store is live at lokeify.com/s/your-name.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <HeroAvatarPreview />
        </div>
      </div>
    </section>
  );
}
