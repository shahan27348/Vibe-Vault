"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, Search, Package,
  X, Save, Loader2, Image as ImageIcon, ChevronDown,
} from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

const CATEGORIES = ["Eastern Wear", "Western Wear", "Footwear", "Accessories"];
const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

interface ColorEntry { name: string; hex: string }
interface ProductForm {
  name: string; slug: string; description: string;
  price: string; compareAtPrice: string;
  images: string[]; category: string; subcategory: string;
  sizes: string[]; colors: ColorEntry[];
  stock: string; featured: boolean; tryOnEnabled: boolean;
  tags: string; rating: string; reviewCount: string;
}

const emptyForm = (): ProductForm => ({
  name: "", slug: "", description: "", price: "", compareAtPrice: "",
  images: [""], category: "Eastern Wear", subcategory: "",
  sizes: ["M", "L"], colors: [{ name: "Black", hex: "#000000" }],
  stock: "10", featured: false, tryOnEnabled: false,
  tags: "", rating: "4.5", reviewCount: "0",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Product = Record<string, any>;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/products?limit=200");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) { setProducts(data.products || []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name || "", slug: p.slug || "", description: p.description || "",
      price: String(p.price || ""), compareAtPrice: String(p.compareAtPrice || ""),
      images: p.images?.length ? p.images : [""],
      category: p.category || "Eastern Wear", subcategory: p.subcategory || "",
      sizes: p.sizes || [], colors: p.colors?.length ? p.colors : [{ name: "Black", hex: "#000000" }],
      stock: String(p.stock || "0"), featured: !!p.featured, tryOnEnabled: !!p.tryOnEnabled,
      tags: (p.tags || []).join(", "), rating: String(p.rating || "4.5"),
      reviewCount: String(p.reviewCount || "0"),
    });
    setEditId(p._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug || toSlug(form.name),
      description: form.description, price: parseFloat(form.price),
      compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
      images: form.images.filter(Boolean),
      category: form.category, subcategory: form.subcategory,
      sizes: form.sizes, colors: form.colors,
      stock: parseInt(form.stock) || 0,
      featured: form.featured, tryOnEnabled: form.tryOnEnabled,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      rating: parseFloat(form.rating) || 4.5,
      reviewCount: parseInt(form.reviewCount) || 0,
    };
    if (editId) {
      await fetch(`/api/products/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false); setShowForm(false); fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
    setDeleting(false); setDeleteId(null); fetchProducts();
  };

  const filtered = products.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const setColor = (i: number, field: "name" | "hex", val: string) => {
    const cols = [...form.colors];
    cols[i] = { ...cols[i], [field]: val };
    setForm({ ...form, colors: cols });
  };

  return (
    <AdminGuard>
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="pt-20">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <Link href="/admin" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Products</h1>
              <p className="text-zinc-500 text-sm mt-1">{products.length} total products</p>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Products Table */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-zinc-500"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" />No products found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">Product</th>
                      <th className="text-left px-4 py-3 text-zinc-500 font-medium">Category</th>
                      <th className="text-right px-4 py-3 text-zinc-500 font-medium">Price</th>
                      <th className="text-right px-4 py-3 text-zinc-500 font-medium">Stock</th>
                      <th className="text-center px-4 py-3 text-zinc-500 font-medium">Featured</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-zinc-800" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-600" /></div>
                            )}
                            <span className="font-medium text-zinc-200 line-clamp-1">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{p.category}</td>
                        <td className="px-4 py-3 text-right text-zinc-200">Rs. {p.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium ${p.stock < 5 ? "text-red-400" : p.stock < 15 ? "text-amber-400" : "text-green-400"}`}>{p.stock}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.featured ? <span className="text-amber-400 text-xs font-medium">⭐ Yes</span> : <span className="text-zinc-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => openEdit(p)} className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteId(p._id)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl my-8">
            <div className="sticky top-0 bg-zinc-900 rounded-t-2xl border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">{editId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Shalwar Kameez Premium" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Slug (URL)</label>
                  <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="auto-generated" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (Rs.) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="3500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Compare At Price (Rs.)</label>
                  <input type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="5000" />
                </div>
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
                  <div className="relative">
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full appearance-none px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subcategory</label>
                  <input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Shalwar Kameez" />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Images (Unsplash URLs)</label>
                <div className="space-y-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={img} onChange={(e) => { const imgs = [...form.images]; imgs[i] = e.target.value; setForm({ ...form, images: imgs }); }}
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="https://images.unsplash.com/..." />
                      {form.images.length > 1 && <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, images: [...form.images, ""] })} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add image URL</button>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Sizes</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => (
                    <button key={s} onClick={() => {
                      const sz = form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s];
                      setForm({ ...form, sizes: sz });
                    }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${form.sizes.includes(s) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Colors</label>
                <div className="space-y-2">
                  {form.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="color" value={c.hex} onChange={(e) => setColor(i, "hex", e.target.value)} className="w-8 h-8 cursor-pointer rounded-lg border-0 bg-transparent" />
                      <input value={c.name} onChange={(e) => setColor(i, "name", e.target.value)} placeholder="Color name" className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                      {form.colors.length > 1 && <button onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })} className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, colors: [...form.colors, { name: "", hex: "#888888" }] })} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add color</button>
                </div>
              </div>

              {/* Stock + Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="cotton, formal, eid" />
                </div>
              </div>

              {/* Rating + Reviews */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rating (0–5)</label>
                  <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Review Count</label>
                  <input type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm({ ...form, featured: !form.featured })} className={`w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-indigo-600" : "bg-zinc-700"} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.featured ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                  <span className="text-sm text-zinc-300">Featured Product</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm({ ...form, tryOnEnabled: !form.tryOnEnabled })} className={`w-10 h-6 rounded-full transition-colors ${form.tryOnEnabled ? "bg-indigo-600" : "bg-zinc-700"} relative`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.tryOnEnabled ? "translate-x-5" : "translate-x-1"}`} />
                  </div>
                  <span className="text-sm text-zinc-300">Try-On Enabled</span>
                </label>
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm w-full">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Product?</h3>
            <p className="text-zinc-400 text-sm text-center mb-6">Yeh action undo nahi ho sakta.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminGuard>
  );
}
