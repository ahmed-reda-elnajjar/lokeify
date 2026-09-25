"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/s/crate", label: "Demo store" },
];

/** Marketing header for the Lokeify platform (merchants), not for shoppers. */
export default function Navbar({ signedIn }: { signedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Loke<span className="text-accent">ify</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {signedIn ? (
            <a href="/admin" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark">
              Go to admin
            </a>
          ) : (
            <>
              <a href="/login" className="hidden text-sm text-muted hover:text-foreground sm:block">Log in</a>
              <a href="/signup" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark">
                Start free
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border sm:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              {menuOpen ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface-2">
                {link.label}
              </a>
            ))}
            {!signedIn && <a href="/login" className="rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface-2">Log in</a>}
          </div>
        </div>
      )}
    </header>
  );
}
