import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// POST /api/tryon/photos — Save a try-on result photo for the logged-in user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to save photos" }, { status: 401 });
    }

    const { photoUrl } = await request.json();
    if (!photoUrl || typeof photoUrl !== "string") {
      return NextResponse.json({ error: "photoUrl required" }, { status: 400 });
    }

    // Limit stored data: only keep a thumbnail reference, not the full base64.
    // If it's a data URL, we store it (can be large — max 10 photos).
    await connectDB();

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Keep max 20 photos, remove oldest if over limit
    if (user.tryOnPhotos.length >= 20) {
      user.tryOnPhotos = user.tryOnPhotos.slice(-19);
    }
    user.tryOnPhotos.push(photoUrl);
    await user.save();

    return NextResponse.json({
      message: "Photo saved",
      count: user.tryOnPhotos.length,
    });
  } catch (error) {
    console.error("Save try-on photo error:", error);
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 });
  }
}

// GET /api/tryon/photos — Get saved try-on photos for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to view photos" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ clerkId: userId }).select("tryOnPhotos").lean();
    if (!user) {
      return NextResponse.json({ photos: [] });
    }

    return NextResponse.json({ photos: user.tryOnPhotos || [] });
  } catch (error) {
    console.error("Get try-on photos error:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

// DELETE /api/tryon/photos — Delete a specific photo by index
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { index } = await request.json();
    if (typeof index !== "number") {
      return NextResponse.json({ error: "index required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (index >= 0 && index < user.tryOnPhotos.length) {
      user.tryOnPhotos.splice(index, 1);
      await user.save();
    }

    return NextResponse.json({ message: "Photo deleted", count: user.tryOnPhotos.length });
  } catch (error) {
    console.error("Delete try-on photo error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
