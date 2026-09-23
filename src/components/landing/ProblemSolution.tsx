const points = [
  {
    icon: "❓",
    title: "The problem",
    body: "Egyptian shoppers buy fashion through Instagram DMs and generic store builders with zero fit confidence — leading to guesswork, high return rates, and lost sales for small brands.",
  },
  {
    icon: "🧍",
    title: "The solution",
    body: "Every shopper builds a personal 3D avatar once. From then on, they see exactly how any item on the platform will look and fit on their own body — before adding to cart.",
  },
  {
    icon: "📈",
    title: "The moat",
    body: "Every avatar and try-on session sharpens size-recommendation accuracy across every brand on the platform — a network effect no single-store app can replicate.",
  },
];

export default function ProblemSolution() {
  return (
    <section className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-surface p-6"
            >
              <div className="text-3xl">{p.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
