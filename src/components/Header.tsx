"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Heart,
  Settings,
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useCartStore, useUIStore } from "@/lib/store";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_CONFIGURED = !!CLERK_KEY && !CLERK_KEY.includes("your_");

// Lazy-loaded Clerk wrappers so build doesn't fail when Clerk isn't configured
function ClerkSignedIn({ children }: { children: ReactNode }) {
  const [Comp, setComp] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);
  useEffect(() => {
    if (CLERK_CONFIGURED) {
      import("@clerk/nextjs").then((m) => setComp(() => m.SignedIn));
    }
  }, []);
  if (!CLERK_CONFIGURED) return null;
  return Comp ? <Comp>{children}</Comp> : null;
}

function ClerkSignedOut({ children }: { children: ReactNode }) {
  const [Comp, setComp] = useState<React.ComponentType<{ children: ReactNode }> | null>(null);
  useEffect(() => {
    if (CLERK_CONFIGURED) {
      import("@clerk/nextjs").then((m) => setComp(() => m.SignedOut));
    }
  }, []);
  // When Clerk isn't configured, always show SignedOut content (sign-in link)
  if (!CLERK_CONFIGURED) return <>{children}</>;
  return Comp ? <Comp>{children}</Comp> : null;
}

function ClerkUserButton() {
  const [Comp, setComp] = useState<React.ComponentType<{ afterSignOutUrl: string }> | null>(null);
  useEffect(() => {
    if (CLERK_CONFIGURED) {
      import("@clerk/nextjs").then((m) => setComp(() => m.UserButton));
    }
  }, []);
  if (!CLERK_CONFIGURED || !Comp) return null;
  return <Comp afterSignOutUrl="/" />;
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items, toggleCart } = useCartStore();
  const { searchQuery, setSearchQuery } = useUIStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { href: "/shop", label: "Shop All" },
    { href: "/shop?category=Eastern+Wear", label: "Eastern Wear" },
    { href: "/shop?category=Western+Wear", label: "Western Wear" },
    { href: "/shop?category=Footwear", label: "Footwear" },
    { href: "/shop?category=Accessories", label: "Accessories" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              VIBE VAULT
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-indigo-400 ${
                  pathname === link.href
                    ? "text-indigo-400"
                    : "text-zinc-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <div className="flex items-center bg-zinc-800 rounded-full px-3 py-1.5">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm ml-2 w-40 text-zinc-200 placeholder-zinc-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = `/shop?q=${searchQuery}`;
                    }
                  }}
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <Search className="w-5 h-5 text-zinc-400" />
              </button>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block"
            >
              <Heart className="w-5 h-5 text-zinc-400" />
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-zinc-400" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Admin */}
            <ClerkSignedIn>
              <Link
                href="/admin"
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block"
              >
                <Settings className="w-5 h-5 text-zinc-400" />
              </Link>
            </ClerkSignedIn>

            {/* Auth */}
            <ClerkSignedIn>
              <ClerkUserButton />
            </ClerkSignedIn>
            <ClerkSignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-zinc-400 hover:text-indigo-400 transition-colors"
              >
                Sign in
              </Link>
            </ClerkSignedOut>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-zinc-800 rounded-full"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-zinc-300" />
              ) : (
                <Menu className="w-5 h-5 text-zinc-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <nav className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-zinc-400 hover:text-indigo-400"
              >
                {link.label}
              </Link>
            ))}
            <ClerkSignedIn>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-zinc-400 hover:text-indigo-400"
              >
                Admin Dashboard
              </Link>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-zinc-400 hover:text-indigo-400"
              >
                My Orders
              </Link>
            </ClerkSignedIn>
          </nav>
        </div>
      )}
    </header>
  );
}
