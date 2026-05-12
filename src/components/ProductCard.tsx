"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Sparkles, Mic } from "lucide-react";
import { useCartStore, useWishlistStore, type Product } from "@/lib/store";

export default function ProductCard({
  product,
  highlighted = false,
  dimmed = false,
}: {
  product: Product;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const router = useRouter();
  const wishlisted = isWishlisted(product._id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={`group block bg-zinc-900 rounded-2xl overflow-hidden border transition-all duration-500 ${
        highlighted
          ? "border-indigo-500 shadow-2xl shadow-indigo-500/40 scale-[1.03] z-10 relative"
          : dimmed
          ? "border-zinc-800 opacity-40 blur-[1px] scale-[0.98] pointer-events-none"
          : "border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/20"
      }`}
      style={{ animation: "fadeIn 0.5s ease-out both" }}
    >
      {/* Voice highlight ring */}
      {highlighted && (
        <div className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400 ring-offset-2 ring-offset-zinc-950 pointer-events-none z-20 animate-pulse" />
      )}

      {/* Voice agent indicator badge */}
      {highlighted && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg">
          <Mic className="w-3 h-3" /> Voice Pick
        </div>
      )}
      {/* Image */}
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {product.compareAtPrice && (
            <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              {Math.round(
                ((product.compareAtPrice - product.price) /
                  product.compareAtPrice) *
                  100
              )}
              % OFF
            </span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
              Low Stock
            </span>
          )}
        </div>

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300">
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {product.tryOnEnabled && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/try-on?product=${product._id}`); }}
                className="flex-1 py-2.5 bg-zinc-800/90 backdrop-blur-sm text-zinc-200 text-xs font-medium rounded-xl text-center hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Try On
              </button>
            )}
            <button
              onClick={handleAddToCart}
              className="flex-1 py-2.5 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-medium rounded-xl text-center hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product._id);
          }}
          className="absolute top-3 right-3 p-2 bg-zinc-800/80 backdrop-blur-sm rounded-full hover:bg-zinc-700 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? "fill-red-500 text-red-500" : "text-zinc-400"
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
          {product.category}
        </p>
        <h3 className="text-sm font-semibold text-zinc-100 mt-1 truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-xs ${
                  i < Math.round(product.rating)
                    ? "text-amber-400"
                    : "text-zinc-600"
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-400">
            ({product.reviewCount})
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-white">
            Rs. {product.price.toLocaleString()}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-zinc-400 line-through">
              Rs. {product.compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
