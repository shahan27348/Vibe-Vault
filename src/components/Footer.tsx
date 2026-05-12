"use client";

import Link from "next/link";
import { ShoppingBag, Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-6 h-6 text-indigo-500" />
              <span className="text-xl font-bold text-white tracking-tight">
                VIBE VAULT
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              Your AI-powered premium shopping destination. Try before you buy with
              our virtual try-on, chat with Maya, your personal shopping assistant.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: "https://instagram.com/vibevault" },
                { Icon: Facebook, href: "https://facebook.com/vibevault" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Shop All", href: "/shop" },
                { label: "Eastern Wear", href: "/shop?category=Eastern+Wear" },
                { label: "Western Wear", href: "/shop?category=Western+Wear" },
                { label: "Footwear", href: "/shop?category=Footwear" },
                { label: "Accessories", href: "/shop?category=Accessories" },
                { label: "Virtual Try-On", href: "/try-on" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Shipping & Returns", href: "/shipping" },
                { label: "Size Guide", href: "/size-guide" },
                { label: "Track Order", href: "/orders" },
                { label: "Contact Us", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Get In Touch
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" />
                hello@vibevault.store
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500" />
                0322 1227348
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                Lahore, Pakistan
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-xs text-zinc-500 mb-2">Payment Methods</p>
              <div className="flex gap-2">
                {["Stripe", "JazzCash", "EasyPaisa", "COD"].map((m) => (
                  <span
                    key={m}
                    className="text-xs bg-zinc-800 px-2 py-1 rounded"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} Vibe Vault. All rights reserved.
          </p>
          <p className="text-xs">
            Made by SHAHAN
          </p>
        </div>
      </div>
    </footer>
  );
}
