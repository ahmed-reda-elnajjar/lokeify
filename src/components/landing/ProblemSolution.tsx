const features = [
  { title: "Your own online store", body: "Home page sections, collections, product pages, search, bag and checkout — on your brand, at your own address." },
  { title: "Products & inventory", body: "Photos, colourways, sizes with stock per size, draft or active, and a size chart the fit engine reads." },
  { title: "3D fit room", body: "A male and a female 3D model that stand, breathe and walk. Shoppers set their body and see how a size fits, with a fit heat map." },
  { title: "AI photo try-on", body: "Shoppers upload a photo (or use your model) and see themselves wearing the piece. Connect your Meta Model API key." },
  { title: "Size advice", body: "Every product recommends a size from the shopper's height, weight and measurements, tight to loose." },
  { title: "Orders & customers", body: "Orders arrive in your admin with the customer, address and items. Mark them paid, shipped or delivered." },
];

export default function ProblemSolution() {
  return (
    <section id="features" className="border-t border-border bg-section">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">Everything a fashion store needs</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">The store builder you know, with the fitting room your customers ask for.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-surface p-6">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
