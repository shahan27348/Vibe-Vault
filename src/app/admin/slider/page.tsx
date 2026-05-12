"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Image as ImageIcon, GripVertical, Eye } from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

interface Slide {
  imageUrl: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

const defaultSlide = (): Slide => ({
  imageUrl: "",
  badge: "New",
  title: "",
  subtitle: "",
  ctaText: "Shop Now",
  ctaLink: "/shop",
});

export default function AdminSliderPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.heroSlides?.length) setSlides(data.heroSlides);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const update = (i: number, field: keyof Slide, val: string) => {
    const updated = [...slides];
    updated[i] = { ...updated[i], [field]: val };
    setSlides(updated);
  };

  const addSlide = () => setSlides([...slides, defaultSlide()]);

  const removeSlide = (i: number) => setSlides(slides.filter((_, j) => j !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const s = [...slides];
    [s[i - 1], s[i]] = [s[i], s[i - 1]];
    setSlides(s);
  };

  const moveDown = (i: number) => {
    if (i === slides.length - 1) return;
    const s = [...slides];
    [s[i], s[i + 1]] = [s[i + 1], s[i]];
    setSlides(s);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ heroSlides: slides }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              <h1 className="text-2xl font-bold text-white">Hero Slider</h1>
              <p className="text-zinc-500 text-sm mt-1">Homepage par dikhne wale slides customize karein</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={addSlide} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-medium transition-colors border border-zinc-700">
                <Plus className="w-4 h-4" /> Add Slide
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? "Saved! ✓" : saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />Loading slides...</div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  {/* Slide header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 bg-zinc-900/80">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(i)} disabled={i === 0} className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 text-xs leading-none">▲</button>
                      <button onClick={() => moveDown(i)} disabled={i === slides.length - 1} className="text-zinc-600 hover:text-zinc-400 disabled:opacity-20 text-xs leading-none">▼</button>
                    </div>
                    <GripVertical className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm font-medium text-zinc-300">Slide {i + 1}</span>
                    {slide.title && <span className="text-xs text-zinc-500">— {slide.title}</span>}
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => setPreviewIdx(previewIdx === i ? null : i)} className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeSlide(i)} disabled={slides.length <= 1} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {previewIdx === i && slide.imageUrl && (
                    <div className="relative h-40 overflow-hidden border-b border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col justify-center px-8">
                        {slide.badge && <span className="text-xs text-indigo-300 font-semibold tracking-widest uppercase mb-1">{slide.badge}</span>}
                        <h3 className="text-2xl font-bold text-white">{slide.title}</h3>
                        <p className="text-zinc-300 text-sm">{slide.subtitle}</p>
                      </div>
                    </div>
                  )}

                  {/* Fields */}
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Image URL */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Image URL (Unsplash recommended)</label>
                      <div className="flex gap-2">
                        <input value={slide.imageUrl} onChange={(e) => update(i, "imageUrl", e.target.value)}
                          className="flex-1 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="https://images.unsplash.com/photo-...?w=1600&h=900&fit=crop" />
                        <button onClick={() => setPreviewIdx(previewIdx === i ? null : i)} className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-indigo-400 transition-colors text-xs">Preview</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Badge Text</label>
                      <input value={slide.badge} onChange={(e) => update(i, "badge", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="New Collection" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
                      <input value={slide.title} onChange={(e) => update(i, "title", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Eastern Elegance" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subtitle</label>
                      <input value={slide.subtitle} onChange={(e) => update(i, "subtitle", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Premium collection crafted for you" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Button Text</label>
                      <input value={slide.ctaText} onChange={(e) => update(i, "ctaText", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Shop Now" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Button Link</label>
                      <input value={slide.ctaLink} onChange={(e) => update(i, "ctaLink", e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="/shop" />
                    </div>
                  </div>
                </div>
              ))}

              {slides.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Koi slide nahi hai. &quot;Add Slide&quot; click karein.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
