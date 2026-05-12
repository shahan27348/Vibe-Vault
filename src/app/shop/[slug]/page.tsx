"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Shirt,
  Star,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  Check,
} from "lucide-react";
import { seedProducts, type Product, useCartStore, useWishlistStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import TryOnModal from "@/components/TryOnModal";
import VoiceControlButton from "@/components/VoiceControlButton";
import ReviewsSection from "@/components/ReviewsSection";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(seedProducts);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showTryOn, setShowTryOn] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCartStore();
  const { items: wishlist, toggleWishlist } = useWishlistStore();

  useEffect(() => {
    // Find product by slug from seed data
    const found = seedProducts.find((p) => p.slug === slug);
    if (found) {
      setProduct(found);
      if (found.sizes?.length) setSelectedSize(found.sizes[0]);
      if (found.colors?.length) setSelectedColor(found.colors[0].name);
    }

    // Also try API
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length) {
          setAllProducts(data.products);
          const apiProduct = data.products.find(
            (p: Product) => p.slug === slug || p._id === slug
          );
          if (apiProduct) {
            setProduct(apiProduct);
            if (apiProduct.sizes?.length && !selectedSize)
              setSelectedSize(apiProduct.sizes[0]);
            if (apiProduct.colors?.length && !selectedColor)
              setSelectedColor(apiProduct.colors[0].name);
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="shimmer w-16 h-16 rounded-full mx-auto mb-4" />
            <p className="text-zinc-500">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product._id);
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(
      {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        size: selectedSize || undefined,
        color: selectedColor || undefined,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Related products
  const related = allProducts
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <CartSidebar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-indigo-400">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-indigo-400">
            Shop
          </Link>
          <span>/</span>
          <Link
            href={`/shop?category=${product.category}`}
            className="hover:text-indigo-400"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-zinc-200 font-medium truncate">
            {product.name}
          </span>
        </div>

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Product layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden mb-3">
              <Image
                src={product.images[selectedImage] || "/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
              {product.tryOnEnabled && (
                <button
                  onClick={() => setShowTryOn(true)}
                  className="absolute bottom-4 right-4 bg-zinc-800/90 backdrop-blur-sm text-indigo-400 px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <Shirt className="w-4 h-4" />
                  Virtual Try-On
                </button>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? "border-indigo-500"
                        : "border-transparent hover:border-zinc-700"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="mb-2">
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                {product.category}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating!)
                          ? "text-amber-400 fill-amber-400"
                          : "text-zinc-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-zinc-500">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-white">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-zinc-400 line-through">
                  Rs. {product.compareAtPrice.toLocaleString()}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                  Save Rs. {(product.compareAtPrice! - product.price).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-zinc-400 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-zinc-200 mb-2 block">
                  Size
                </label>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-zinc-200 mb-2 block">
                  Color: {selectedColor}
                </label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedColor === color.name
                          ? "border-indigo-500 scale-110"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <Check
                          className="w-4 h-4"
                          style={{
                            color:
                              color.hex === "#FFFFFF" || color.hex === "#F5F5DC"
                                ? "#000"
                                : "#fff",
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
                <label className="text-sm font-medium text-zinc-200 mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-zinc-800 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-zinc-700 rounded-l-xl transition-colors text-zinc-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium text-sm min-w-12 text-center text-zinc-200">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="px-3 py-2 hover:bg-zinc-700 rounded-r-xl transition-colors text-zinc-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-zinc-500">
                  {product.stock > 0 ? (
                    product.stock < 10 ? (
                      <span className="text-amber-600">
                        Only {product.stock} left!
                      </span>
                    ) : (
                      "In Stock"
                    )
                  ) : (
                    <span className="text-red-500">Out of Stock</span>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all ${
                  addedToCart
                    ? "bg-green-600 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart — Rs. {(product.price * quantity).toLocaleString()}
                  </>
                )}
              </button>
              <button
                onClick={() => toggleWishlist(product._id)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${
                  isWishlisted
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-500/30"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? "fill-red-500" : ""}`}
                />
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-800">
              {[
                { icon: Truck, label: "Free Shipping", detail: "Orders Rs. 5,000+" },
                { icon: RotateCcw, label: "30-Day Returns", detail: "Easy returns" },
                { icon: Shield, label: "Secure Pay", detail: "256-bit SSL" },
              ].map((f) => (
                <div key={f.label} className="text-center">
                  <f.icon className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
                  <p className="text-xs font-medium text-zinc-200">{f.label}</p>
                  <p className="text-xs text-zinc-500">{f.detail}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/shop?q=${tag}`}
                      className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold text-white mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <div key={p._id} onClick={() => router.push(`/shop/${p.slug}`)}>
                  <div className="cursor-pointer">
                    <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-2 relative">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {p.name}
                    </p>
                    <p className="text-sm text-indigo-400 font-bold">Rs. {p.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <ReviewsSection productId={product._id} productName={product.name} />
      </div>

      <Footer />
      <VoiceControlButton products={allProducts} />

      {/* Try-On Modal */}
      {showTryOn && product.tryOnEnabled && (
        <TryOnModal product={product} onClose={() => setShowTryOn(false)} />
      )}
    </div>
  );
}
