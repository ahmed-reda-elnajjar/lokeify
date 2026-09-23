const steps = [
  {
    step: "01",
    title: "Create your avatar",
    body: "Enter your measurements and upload a few photos. It takes under a minute.",
  },
  {
    step: "02",
    title: "See yourself in 3D",
    body: "Your personal avatar is generated — rotate, zoom, and inspect it from every angle.",
  },
  {
    step: "03",
    title: "Try on real products",
    body: "Browse a brand's store and try any item on your avatar, in any color, instantly.",
  },
  {
    step: "04",
    title: "Buy with confidence",
    body: "Get a recommended size based on your real measurements, then check out.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <span className="text-sm font-mono text-brand">{s.step}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
