"use client";

import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { seedProducts, useWishlistStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import ProductCard from "@/components/ProductCard";
import VoiceControlButton from "@/components/VoiceControlButton";

export default function WishlistPage() {
  const { items: wishlistIds } = useWishlistStore();

  const wishlistProducts = seedProducts.filter((p) =>
    wishlistIds.includes(p._id)
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <CartSidebar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/shop"
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Wishlist</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              {wishlistProducts.length} item
              {wishlistProducts.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Your wishlist is empty
            </h3>
            <p className="text-zinc-500 text-sm mb-6">
              Save your favorite pieces and come back to them later
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Browse Products
            </Link>
          </div>
        )}
      </div>

      <Footer />
      <VoiceControlButton products={seedProducts} />
    </div>
  );
}
