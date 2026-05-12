"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Trash2, Loader2, RefreshCw, Search } from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Review = Record<string, any>;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch reviews for all products via admin stats which gives us recent reviews
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const deleteReview = async (id: string) => {
    setDeletingId(id);
    try {
      // Admin can delete any review via admin endpoint
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = reviews.filter(
    (r) =>
      !search ||
      r.userName?.toLowerCase().includes(search.toLowerCase()) ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="pt-20">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Reviews</h1>
                <p className="text-zinc-500 mt-1">{reviews.length} total reviews</p>
              </div>
              <button
                onClick={fetchReviews}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No reviews found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((review) => (
                  <div key={review._id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-white">{review.userName}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-zinc-300 mb-1">{review.title}</p>
                        <p className="text-sm text-zinc-400">{review.comment}</p>
                        <p className="text-xs text-zinc-600 mt-2">Product ID: {review.productId}</p>
                      </div>
                      <button
                        onClick={() => deleteReview(review._id)}
                        disabled={deletingId === review._id}
                        className="ml-4 p-2 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === review._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
