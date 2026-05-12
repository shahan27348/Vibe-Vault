"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ThumbsUp, Trash2, Loader2, Send } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  createdAt: string;
}

interface ReviewsSectionProps {
  productId: string;
  productName: string;
}

export default function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const { user, isSignedIn } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating: form.rating,
          title: form.title,
          comment: form.comment,
          userName: user?.fullName || user?.username || "Anonymous",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setShowForm(false);
        setForm({ rating: 5, title: "", comment: "" });
        fetchReviews();
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}`, { method: "PATCH" });
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch {
      // ignore
    }
  };

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-white mb-8">
        Customer Reviews
        {reviews.length > 0 && (
          <span className="ml-3 text-zinc-500 font-normal text-lg">({reviews.length})</span>
        )}
      </h2>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
          <div className="text-center">
            <div className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(avgRating) ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`}
                />
              ))}
            </div>
            <p className="text-zinc-500 text-sm mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-zinc-400 w-4">{star}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-sm text-zinc-500 w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isSignedIn && !showForm && !success && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </button>
      )}

      {!isSignedIn && (
        <p className="mb-8 text-zinc-500 text-sm">
          <a href="/sign-in" className="text-indigo-400 hover:underline">Sign in</a> to leave a review for {productName}.
        </p>
      )}

      {success && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          Thank you! Your review has been submitted.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4">Your Review</h3>

          {/* Star Rating */}
          <div className="mb-4">
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${star <= form.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600 hover:text-amber-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Summarize your experience..."
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-zinc-400 mb-2 block">Review</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Tell others about your experience with this product..."
              required
              rows={4}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{review.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-zinc-600"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                {user?.id === review.userId && (
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete your review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <h4 className="font-semibold text-zinc-200 mb-1">{review.title}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">{review.comment}</p>
              <button
                onClick={() => handleHelpful(review._id)}
                className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful ({review.helpful})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
