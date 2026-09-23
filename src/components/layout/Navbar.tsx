"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cartStore";
import { useAvatarStore } from "@/lib/store/avatarStore";
import { cn } from "@/lib/utils";

const links = [
  { href: "/store", label: "Store X" },
  { href: "/avatar", label: "My Avatar" },
];

export default function Navbar() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0)
  );
  const generated = useAvatarStore((s) => s.generated);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Loke<span className="text-brand">ify</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === link.href ? "text-foreground" : "text-muted"
              )}
            >
              {link.label}
              {link.href === "/avatar" && !generated && (
                <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                  create
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!generated && (
            <Link
              href="/create-avatar"
              className="hidden rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark sm:block"
            >
              Create Your Avatar
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full border border-border p-2 text-sm transition-colors hover:border-brand"
            aria-label="Cart"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h1.5l2.4 12.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L20 8H6"
              />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
