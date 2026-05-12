import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";

// GET /api/reviews?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    await connectDB();
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews — create a review (must be signed in)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, title, comment, userName } = body;

    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ error: "productId, rating, title, and comment are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    await connectDB();

    // Check for existing review
    const existing = await Review.findOne({ userId, productId });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
    }

    const review = await Review.create({
      userId,
      userName: userName || "Anonymous",
      productId,
      rating,
      title,
      comment,
      images: [],
    });

    // Recalculate product rating
    const allReviews = await Review.find({ productId }).lean();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("POST review error:", error);
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
