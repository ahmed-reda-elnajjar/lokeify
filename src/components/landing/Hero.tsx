import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 gradient-bg opacity-20 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            Built for Egyptian fashion brands
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Stop guessing sizes.
            <br />
            <span className="gradient-text">See it on your own body</span>{" "}
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
              className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.03] hover:bg-brand-dark"
            >
              Create Your Avatar
            </Link>
            <Link
              href="/store"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand"
            >
              Browse Demo Store
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            No signup needed — this is a click-through prototype.
          </p>
        </div>

        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <div className="absolute inset-0 rounded-3xl border border-border bg-surface" />
          <div className="absolute inset-4 rounded-2xl bg-gradient-to-b from-surface-2 to-surface" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full gradient-bg text-4xl">
              🧍
            </div>
            <p className="text-sm font-medium">Your Avatar</p>
            <p className="text-xs text-muted">
              Height · Weight · Chest · Waist — mapped to a 3D model you can
              rotate and dress
            </p>
            <div className="mt-2 flex gap-2">
              <span className="h-8 w-8 rounded-full border-2 border-surface bg-[#1a1a1a]" />
              <span className="h-8 w-8 rounded-full border-2 border-surface bg-[#5b7391]" />
              <span className="h-8 w-8 rounded-full border-2 border-surface bg-[#8c4a2f]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
