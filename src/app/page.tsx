"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Mic,
  ShoppingBag,
  Shirt,
  Star,
  TrendingUp,
  Watch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { seedProducts, type Product } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import ProductCard from "@/components/ProductCard";
import VoiceControlButton from "@/components/VoiceControlButton";
import { useStoreSettings } from "@/lib/useStoreSettings";
import { useUIStore } from "@/lib/store";

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1600&q=80",
    title: "Eastern Elegance",
    subtitle: "Premium Shalwar Kameez & Kurta Collection",
  },
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&q=80",
    title: "Western Edge",
    subtitle: "Jackets, Jeans & Contemporary Streetwear",
  },
  {
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&q=80",
    title: "Step Up Your Game",
    subtitle: "Handcrafted Footwear for Every Occasion",
  },
  {
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600&q=80",
    title: "Timeless Accessories",
    subtitle: "Watches, Perfumes & Signature Pieces",
  },
  {
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1600&q=80",
    title: "New Arrivals",
    subtitle: "Fresh Drops Every Week — Stay Ahead of the Curve",
  },
];

const CATEGORIES = [
  { name: "All", icon: Sparkles },
  { name: "Eastern Wear", icon: Shirt },
  { name: "Western Wear", icon: Shirt },
  { name: "Footwear", icon: TrendingUp },
  { name: "Accessories", icon: Watch },
];

export default function Home() {
  const { selectedCategory, setSelectedCategory } =
    useUIStore();
  const { settings } = useStoreSettings();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use DB slides if available, fallback to hardcoded
  const activeSlides = settings.heroSlides.length > 0 ? settings.heroSlides : HERO_SLIDES.map((s) => ({
    imageUrl: s.image, badge: "", title: s.title, subtitle: s.subtitle, ctaText: "Shop Now", ctaLink: "/shop",
  }));

  useEffect(() => {
    setIsMounted(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-slide every 5 seconds
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const featuredProducts = products.filter((p) => p.featured);
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  if (!isMounted) return null;

  return (
    <>
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <CartSidebar />

        {/* Hero Slider */}
        <section className="relative h-[70vh] sm:h-[80vh] overflow-hidden">
          {activeSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent" />
            </div>
          ))}

          {/* Slide content */}
          <div className="relative z-10 flex items-center h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
                  <Mic className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-200">
                    AI Voice Assistant — Say &quot;Hi {settings.voiceAgent.agentName}&quot;
                  </span>
                </div>

                <h1
                  key={currentSlide}
                  className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-4"
                  style={{ animation: "fadeIn 0.6s ease-out" }}
                >
                  {activeSlides[currentSlide]?.title}
                </h1>
                <p
                  key={`sub-${currentSlide}`}
                  className="text-lg sm:text-xl text-zinc-300 max-w-xl mb-8"
                  style={{ animation: "fadeIn 0.6s ease-out 0.1s both" }}
                >
                  {activeSlides[currentSlide]?.subtitle}
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={activeSlides[currentSlide]?.ctaLink || "/shop"}
                    className="group flex items-center gap-2 bg-white text-zinc-900 px-6 py-3 rounded-full font-medium transition-all hover:bg-zinc-200"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {activeSlides[currentSlide]?.ctaText || "Shop Now"}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/try-on"
                    className="group flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-all border border-white/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Virtual Try-On
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Slide controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentSlide ? "bg-white w-6" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Features Strip */}
        <section className="bg-zinc-900/50 border-y border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Mic,
                  title: "Voice Shopping",
                  desc: 'Say "Add this to cart" and Maya handles it',
                },
                {
                  icon: Shirt,
                  title: "Virtual Try-On",
                  desc: "See how clothes look on you with AI",
                },
                {
                  icon: Star,
                  title: "Premium Men's Collection",
                  desc: "Eastern & Western wear, footwear & accessories",
                },
              ].map((f) => (
                <div key={f.title} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-zinc-100">{f.title}</p>
                    <p className="text-xs text-zinc-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Featured Picks
                </h2>
                <p className="text-zinc-500 mt-1">Hand-picked by our AI stylist</p>
              </div>
              <Link
                href="/shop?featured=true"
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Category Browser */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Browse Store
            </h2>
            <Link
              href="/shop"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
            >
              Shop All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-2 px-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500">No products found in this category.</p>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-zinc-900 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Ready to Try Before You Buy?
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto mb-8">
              Upload your photo and see how any product looks on you. Powered by
              Gemini AI — it&apos;s like having a fitting room in your pocket.
            </p>
            <Link
              href="/try-on"
              className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Open Virtual Try-On
            </Link>
          </div>
        </section>

        <Footer />
        <VoiceControlButton
          products={products}
          agentName={settings.voiceAgent.agentName}
          greeting={settings.voiceAgent.greeting}
          personality={settings.voiceAgent.personality}
          voice={settings.voiceAgent.voice}
          autoStart={settings.voiceAgent.autoStart}
          discounts={settings.activeDiscounts}
        />
      </div>
    </>
  );
}
