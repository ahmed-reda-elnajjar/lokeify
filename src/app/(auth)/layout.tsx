import "../globals.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-section text-foreground">
      <header className="px-6 py-5">
        <a href="/" className="text-lg font-semibold tracking-tight">
          Loke<span className="text-accent">ify</span>
        </a>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:pt-10">{children}</main>
    </div>
  );
}
