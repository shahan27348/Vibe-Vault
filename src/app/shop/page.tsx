"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { seedProducts, type Product, useVoiceStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import ProductCard from "@/components/ProductCard";
import VoiceControlButton from "@/components/VoiceControlButton";

const CATEGORIES = ["All", "Eastern Wear", "Western Wear", "Footwear", "Accessories"];

const SUBCATEGORIES: Record<string, string[]> = {
  "Eastern Wear": ["Shalwar Kameez", "Kurta Pajama", "3 Piece Suits"],
  "Western Wear": ["Jackets", "Sweaters", "Trousers", "Jeans", "T-Shirts"],
  Footwear: ["Eastern Sandals", "Western Shoes", "Formal Shoes", "Casual Shoes"],
  Accessories: ["Perfumes", "Glasses", "Caps & Hats", "Belts", "Watches"],
};
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
  { label: "Rating", value: "rating" },
  { label: "Name A-Z", value: "name" },
];

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [subcategory, setSubcategory] = useState<string>("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 25000]);
  const highlightedProductId = useVoiceStore((s) => s.highlightedProductId);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length > 0) setProducts(data.products);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setCategory(cat);
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...products];

    // Category filter
    if (category !== "All") {
      result = result.filter((p) => p.category === category);
    }

    // Subcategory filter
    if (subcategory !== "All") {
      result = result.filter((p) => p.subcategory === subcategory);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Price range
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Featured
    if (searchParams.get("featured") === "true") {
      result = result.filter((p) => p.featured);
    }

    // Sort
    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, category, subcategory, search, sort, priceRange, searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <CartSidebar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {category !== "All" ? category : "All Products"}
          </h1>
          <p className="text-zinc-500 mt-1">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search & filters bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                showFilters
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-zinc-400 cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setSubcategory("All"); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subcategory tabs */}
        {category !== "All" && SUBCATEGORIES[category] && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSubcategory("All")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                subcategory === "All"
                  ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
              }`}
            >
              All {category}
            </button>
            {SUBCATEGORIES[category].map((sub) => (
              <button
                key={sub}
                onClick={() => setSubcategory(sub)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  subcategory === sub
                    ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Expandable filters */}
        {showFilters && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Min Price: Rs. {priceRange[0].toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Max Price: Rs. {priceRange[1].toLocaleString()}
                </label>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPriceRange([0, 25000]);
                    setSearch("");
                    setCategory("All");
                    setSubcategory("All");
                    setSort("newest");
                  }}
                  className="px-4 py-2 bg-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors text-zinc-300"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product grid */}
        {filtered.length > 0 ? (
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 ${highlightedProductId ? "relative" : ""}`}>
            {filtered.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                highlighted={highlightedProductId === product._id}
                dimmed={!!highlightedProductId && highlightedProductId !== product._id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              No products found
            </h3>
            <p className="text-zinc-500 text-sm">
              Try a different search or category
            </p>
          </div>
        )}
      </div>

      <Footer />
      <VoiceControlButton products={products} />
    </div>
  );
}
