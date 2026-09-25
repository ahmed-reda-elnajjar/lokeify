const steps = [
  { step: "01", title: "Create your store", body: "Sign up, name your brand and get a live store at /s/your-name — with demo products to start from if you like." },
  { step: "02", title: "Add your products", body: "Photos, prices, sizes and stock, plus flat measurements per size so the fit room knows how each piece fits." },
  { step: "03", title: "Switch on the fit room", body: "Shoppers try pieces on a 3D model sized to their body, or on their own photo with AI try-on." },
  { step: "04", title: "Take orders", body: "Customers check out, you see every order and customer in your admin and mark them shipped." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <span className="font-mono text-sm text-accent">{s.step}</span>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
