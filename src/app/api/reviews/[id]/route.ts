import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { Review } from "@/models/Review";

// DELETE /api/reviews/[id] — delete own review
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.userId !== userId) {
      return NextResponse.json({ error: "You can only delete your own reviews" }, { status: 403 });
    }

    await review.deleteOne();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE review error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}

// PATCH /api/reviews/[id] — mark review as helpful
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const review = await Review.findByIdAndUpdate(
      id,
      { $inc: { helpful: 1 } },
      { new: true }
    ).lean();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, helpful: review.helpful });
  } catch (error) {
    console.error("PATCH review error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
