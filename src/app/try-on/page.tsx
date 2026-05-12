"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Upload, Camera, Loader2, Shirt, Sparkles, X, Download, RefreshCw, ImageIcon, Trash2 } from "lucide-react";
import { seedProducts, type Product, useVoiceStore } from "@/lib/store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import VoiceControlButton from "@/components/VoiceControlButton";

function TryOnContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  const [products] = useState<Product[]>(
    seedProducts.filter((p) => p.tryOnEnabled)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPhotos, setSavedPhotos] = useState<string[]>([]);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTryOnPhoto } = useVoiceStore();

  useEffect(() => {
    if (productId) {
      const found = seedProducts.find((p) => p._id === productId);
      if (found) setSelectedProduct(found);
    }
    // Load saved photos
    fetch("/api/tryon/photos")
      .then((r) => r.json())
      .then((data) => { if (data.photos) setSavedPhotos(data.photos); })
      .catch(() => {});
  }, [productId]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setUserPhoto(dataUrl);
      setTryOnPhoto(dataUrl); // share with voice agent
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const savePhotoToDb = (photoUrl: string) => {
    setSavingPhoto(true);
    fetch("/api/tryon/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    })
      .then((r) => r.json())
      .then(() => {
        setSavedPhotos((prev) => [...prev, photoUrl]);
      })
      .catch(() => {})
      .finally(() => setSavingPhoto(false));
  };

  const deletePhoto = (index: number) => {
    fetch("/api/tryon/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    })
      .then((r) => r.json())
      .then(() => {
        setSavedPhotos((prev) => prev.filter((_, i) => i !== index));
      })
      .catch(() => {});
  };

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      let body: Record<string, string>;

      if (userPhoto) {
        // Convert garment image URL to dataURL (server can't fetch external URLs in all environments)
        const garmentRes = await fetch(selectedProduct.images[0]);
        const garmentBlob = await garmentRes.blob();
        const garmentDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(garmentBlob);
        });
        body = { action: "tryOn", modelImage: userPhoto, garmentImage: garmentDataUrl };
      } else {
        // Generate AI model wearing the product
        const productRes = await fetch(selectedProduct.images[0]);
        const productBlob = await productRes.blob();
        const productDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(productBlob);
        });
        body = { action: "generateModel", image: productDataUrl };
      }

      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.image) {
        setResultImage(data.image);
        savePhotoToDb(data.image);
      } else {
        setError(data.error || "Failed to generate image. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Virtual Try-On
        </h1>
        <p className="text-zinc-500 max-w-md mx-auto">
          Upload your photo and see how products look on you, or generate an AI
          model preview.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Select Product */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
              1
            </span>
            Select Product
          </h2>
          <div className="space-y-2 max-h-125 overflow-y-auto pr-2">
            {products.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  setSelectedProduct(p);
                  setResultImage(null);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  selectedProduct?._id === p._id
                    ? "bg-indigo-500/10 border-2 border-indigo-500/30"
                    : "bg-zinc-900 border-2 border-transparent hover:border-zinc-700"
                }`}
              >
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-zinc-500">{p.category} — Rs. {p.price.toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Photo */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
              2
            </span>
            Your Photo (Optional)
          </h2>

          {!userPhoto ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-2xl p-10 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all min-h-75 flex flex-col items-center justify-center"
            >
              <Upload className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="font-medium text-zinc-300 mb-1">
                Upload a full-body photo
              </p>
              <p className="text-sm text-zinc-400">
                Or skip to see an AI model preview
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={userPhoto}
                alt="Your photo"
                className="w-full rounded-2xl object-cover max-h-100"
              />
              <button
                onClick={() => {
                  setUserPhoto(null);
                  setResultImage(null);
                }}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || isLoading}
            className="w-full mt-4 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {userPhoto ? "Generate Try-On" : "Generate AI Model Preview"}
              </>
            )}
          </button>
        </div>

        {/* Step 3: Result */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center">
              3
            </span>
            Result
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-sm mb-4">
              {error}
            </div>
          )}

          {resultImage ? (
            <div>
              <div className="rounded-2xl overflow-hidden mb-3">
                <img
                  src={resultImage}
                  alt="Try-on result"
                  className="w-full rounded-2xl"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.download = "vibe-vault-tryon.png";
                    link.href = resultImage;
                    link.click();
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-2xl min-h-87.5 flex items-center justify-center">
              {isLoading ? (
                <div className="text-center">
                  <div className="shimmer w-24 h-24 rounded-full mx-auto mb-4" />
                  <p className="text-sm font-medium text-zinc-300">
                    AI is creating your look...
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    This takes about 10-20 seconds
                  </p>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Shirt className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Select a product and click Generate
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved Try-On Photos */}
      {savedPhotos.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            Your Saved Try-Ons
            <span className="text-sm font-normal text-zinc-500">({savedPhotos.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedPhotos.map((photo, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                <img src={photo} alt={`Try-on ${i + 1}`} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.download = `vibe-vault-tryon-${i + 1}.png`;
                      link.href = photo;
                      link.click();
                    }}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => deletePhoto(i)}
                    className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TryOnPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <CartSidebar />
      <Suspense fallback={<div className="pt-24 text-center">Loading...</div>}>
        <TryOnContent />
      </Suspense>
      <Footer />
      <VoiceControlButton products={seedProducts} />
    </div>
  );
}
