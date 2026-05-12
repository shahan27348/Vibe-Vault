"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Check,
} from "lucide-react";
import { useVoiceStore, useCartStore, useWishlistStore } from "@/lib/store";

export default function VoiceProductModal() {
  const {
    showcaseProducts,
    showcaseOpen,
    showcaseActiveIndex,
    setShowcaseActiveIndex,
    closeShowcase,
  } = useVoiceStore();
  const addItem = useCartStore((s) => s.addItem);
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const product = showcaseProducts[showcaseActiveIndex];

  // Reset selections when product changes
  const productId = product?.id;
  const firstSize = product?.sizes?.[0] || "";
  const firstName = product?.colors?.[0]?.name || "";
  useEffect(() => {
    if (productId) {
      requestAnimationFrame(() => {
        setSelectedSize(firstSize);
        setSelectedColor(firstName);
        setAddedToCart(false);
        setCurrentImageIndex(0);
      });
    }
  }, [productId, firstSize, firstName]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShowcase();
    };
    if (showcaseOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showcaseOpen, closeShowcase]);

  if (!showcaseOpen || !product) return null;

  const handleAddToCart = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: selectedSize,
        color: selectedColor,
      },
      1
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handlePrev = () => {
    if (showcaseActiveIndex > 0) {
      setShowcaseActiveIndex(showcaseActiveIndex - 1);
    }
  };

  const handleNext = () => {
    if (showcaseActiveIndex < showcaseProducts.length - 1) {
      setShowcaseActiveIndex(showcaseActiveIndex + 1);
    }
  };

  const handleImagePrev = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : product.images.length - 1
    );
  };

  const handleImageNext = () => {
    setCurrentImageIndex((prev) =>
      prev < product.images.length - 1 ? prev + 1 : 0
    );
  };

  const wishlisted = isWishlisted(product.id);
  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={closeShowcase}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl rounded-3xl border border-zinc-700/50 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">
              Voice Assistant — Showing Product
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showcaseProducts.length > 1 && (
              <span className="text-xs text-zinc-500">
                {showcaseActiveIndex + 1} / {showcaseProducts.length}
              </span>
            )}
            <button
              onClick={closeShowcase}
              className="p-1.5 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 52px)" }}>
          {/* Product Image */}
          <div className="relative aspect-square bg-zinc-800 overflow-hidden group">
            <Image
              src={product.images[currentImageIndex] || product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500"
              sizes="(max-width: 512px) 100vw, 512px"
            />

            {/* Image navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={handleImagePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleImageNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImageIndex
                          ? "bg-white w-4"
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.featured && (
                <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
              {discount > 0 && (
                <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                  {discount}% OFF
                </span>
              )}
              {product.stock < 10 && product.stock > 0 && (
                <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                  Only {product.stock} left!
                </span>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-3 right-3 p-2.5 bg-zinc-900/70 backdrop-blur-sm rounded-full hover:bg-zinc-800 transition-colors"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  wishlisted
                    ? "fill-red-500 text-red-500"
                    : "text-zinc-300"
                }`}
              />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-5 space-y-4">
            {/* Category & Name */}
            <div>
              <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">
                {product.category}
              </p>
              <h2 className="text-xl font-bold text-white leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-zinc-400">
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-white">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-base text-zinc-500 line-through">
                  Rs. {product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                {product.description}
              </p>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400/30"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Color — {selectedColor}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color.name
                          ? "border-indigo-500 scale-110"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  addedToCart
                    ? "bg-green-600 text-white"
                    : product.stock === 0
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98]"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" /> Added to Cart!
                  </>
                ) : product.stock === 0 ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" /> Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Voice hint */}
            <p className="text-center text-xs text-zinc-500 italic">
              💬 You can say &quot;add to cart&quot; or &quot;next product&quot; to
              control with your voice
            </p>
          </div>
        </div>

        {/* Multi-product navigation */}
        {showcaseProducts.length > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800/80">
            <button
              onClick={handlePrev}
              disabled={showcaseActiveIndex === 0}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-1.5">
              {showcaseProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setShowcaseActiveIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === showcaseActiveIndex
                      ? "bg-indigo-500 w-5"
                      : "bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={showcaseActiveIndex === showcaseProducts.length - 1}
              className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
