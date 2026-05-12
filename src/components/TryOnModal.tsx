"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, Camera, Loader2, RefreshCw, Download, Shirt } from "lucide-react";
import type { Product } from "@/lib/store";

interface TryOnModalProps {
  product: Product;
  onClose: () => void;
}

export default function TryOnModal({ product, onClose }: TryOnModalProps) {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "generate">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [showWebcam, setShowWebcam] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserPhoto(reader.result as string);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        setShowWebcam(true);
      }
    } catch {
      setError("Could not access camera. Please upload an image instead.");
    }
  };

  const capturePhoto = () => {
    if (!webcamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = webcamRef.current.videoWidth;
    canvas.height = webcamRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(webcamRef.current, 0, 0);
    setUserPhoto(canvas.toDataURL("image/jpeg"));
    setShowWebcam(false);
    const stream = webcamRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
  };

  const handleTryOn = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      if (mode === "upload" && userPhoto) {
        // Route through server API — converts external garment URL server-side
        const garmentRes = await fetch(product.images[0]);
        const garmentBlob = await garmentRes.blob();
        const garmentDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(garmentBlob);
        });

        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "tryOn",
            modelImage: userPhoto,
            garmentImage: garmentDataUrl,
          }),
        });
        const data = await res.json();
        if (data.success && data.image) {
          setResultImage(data.image);
        } else {
          setError(data.error || "Failed to generate try-on image. Please try a different photo.");
        }
      } else {
        // AI model generation
        const productRes = await fetch(product.images[0]);
        const productBlob = await productRes.blob();
        const productDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(productBlob);
        });

        const res = await fetch("/api/tryon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generateModel", image: productDataUrl }),
        });
        const data = await res.json();
        if (data.success && data.image) {
          setResultImage(data.image);
        } else {
          setError(data.error || "Failed to generate model image. Please try again.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [mode, userPhoto, product]);

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.download = `vibe-vault-tryon-${product.name.replace(/\s+/g, "-")}.png`;
    link.href = resultImage;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Virtual Try-On</h2>
            <p className="text-sm text-zinc-500">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                mode === "upload"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Your Photo
            </button>
            <button
              onClick={() => setMode("generate")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                mode === "generate"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              <Shirt className="w-4 h-4 inline mr-2" />
              AI Model Preview
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Input */}
            <div>
              {mode === "upload" ? (
                <div className="space-y-4">
                  {/* Upload area */}
                  {!userPhoto && !showWebcam && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
                    >
                      <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm font-medium text-zinc-300">
                        Upload a full-body photo
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        JPG, PNG — for best results use a clear, well-lit photo
                      </p>
                    </div>
                  )}

                  {/* Webcam */}
                  {showWebcam && (
                    <div className="relative rounded-xl overflow-hidden">
                      <video
                        ref={webcamRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-xl"
                      />
                      <button
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-200 rounded-full px-4 py-2 text-sm font-medium shadow-lg hover:bg-zinc-700 transition-colors"
                      >
                        📸 Capture
                      </button>
                    </div>
                  )}

                  {/* Preview uploaded photo */}
                  {userPhoto && (
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={userPhoto}
                        alt="Your photo"
                        className="w-full rounded-xl object-cover max-h-80"
                      />
                      <button
                        onClick={() => {
                          setUserPhoto(null);
                          setResultImage(null);
                        }}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {!userPhoto && !showWebcam && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 px-3 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        <Upload className="w-4 h-4 inline mr-1" /> Browse Files
                      </button>
                      <button
                        onClick={startWebcam}
                        className="flex-1 py-2 px-3 bg-zinc-800 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
                      >
                        <Camera className="w-4 h-4 inline mr-1" /> Camera
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-6 text-center">
                  <Shirt className="w-16 h-16 text-indigo-400/50 mx-auto mb-3" />
                  <p className="font-medium text-zinc-300">
                    AI Model Preview
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    Generate a high-quality image of a model wearing{" "}
                    <strong>{product.name}</strong>
                  </p>
                </div>
              )}

              {/* Product info */}
              <div className="mt-4 bg-zinc-800 rounded-xl p-4 flex gap-3">
                {product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-zinc-200 text-sm">
                    {product.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {product.category} • Rs. {product.price.toLocaleString()}
                  </p>
                  {product.colors && product.colors.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {product.colors.map((c) => (
                        <span
                          key={c.hex}
                          className="w-4 h-4 rounded-full border border-zinc-200"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleTryOn}
                disabled={isLoading || (mode === "upload" && !userPhoto)}
                className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating... (this may take a moment)
                  </>
                ) : (
                  <>
                    ✨{" "}
                    {mode === "upload"
                      ? "Generate Try-On"
                      : "Generate Model Preview"}
                  </>
                )}
              </button>
            </div>

            {/* Right: Result */}
            <div className="flex flex-col">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-sm mb-4">
                  {error}
                </div>
              )}

              {resultImage ? (
                <div className="flex-1 flex flex-col">
                  <div className="relative rounded-xl overflow-hidden flex-1">
                    <img
                      src={resultImage}
                      alt="Try-on result"
                      className="w-full rounded-xl object-cover"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleTryOn}
                      disabled={isLoading}
                      className="flex-1 py-2 bg-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button
                      onClick={downloadResult}
                      className="flex-1 py-2 bg-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-zinc-50 rounded-xl min-h-75">
                  {isLoading ? (
                    <div className="text-center">
                      <div className="shimmer w-20 h-20 rounded-full mx-auto mb-4" />
                      <p className="text-sm font-medium text-zinc-600">
                        AI is working its magic...
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        This usually takes 10-20 seconds
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shirt className="w-8 h-8 text-zinc-300" />
                      </div>
                      <p className="text-sm text-zinc-500">
                        {mode === "upload"
                          ? "Upload a photo and click generate"
                          : "Click generate to see a model preview"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
