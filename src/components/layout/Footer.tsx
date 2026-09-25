export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-sm text-muted sm:px-6">
        <p>
          Loke<span className="text-accent">ify</span> — fashion commerce with a fit room built in.
        </p>
        <p className="text-xs">Payments run in test mode: orders are recorded, no card is charged.</p>
      </div>
    </footer>
  );
}
