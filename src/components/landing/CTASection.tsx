import Link from "next/link";

export default function CTASection() {
  return (
    <section className="border-t border-border bg-section">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to try it on yourself?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Build your avatar now and walk through the full experience — from
          measurements to checkout — in under two minutes.
        </p>
        <Link
          href="/create-avatar"
          className="mt-8 inline-block rounded-full bg-brand px-8 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.03] hover:bg-brand-dark"
        >
          Create Your Avatar
        </Link>
      </div>
    </section>
  );
}
