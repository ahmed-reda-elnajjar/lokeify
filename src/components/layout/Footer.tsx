export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-muted sm:px-6">
        <p>
          Loke<span className="text-brand">ify</span> — try it on before you
          buy it.
        </p>
        <p className="text-xs">
          Prototype build · demo data only · no real payments processed
        </p>
      </div>
    </footer>
  );
}
