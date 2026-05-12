import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { StoreSettings } from "@/models/StoreSettings";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/settings
export async function GET() {
  try {
    await connectDB();
    let settings = await StoreSettings.findOne().lean();
    if (!settings) {
      const newSettings = await StoreSettings.create({});
      settings = newSettings.toObject();
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT /api/admin/settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) return adminCheck.error;

    await connectDB();
    const body = await request.json();
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create(body);
    } else {
      // Deep merge only the provided keys
      if (body.voiceAgent) Object.assign(settings.voiceAgent, body.voiceAgent);
      if (body.heroSlides !== undefined) settings.heroSlides = body.heroSlides;
      if (body.activeDiscounts !== undefined) settings.activeDiscounts = body.activeDiscounts;
      if (body.storeName) settings.storeName = body.storeName;
      if (body.currency) settings.currency = body.currency;
      if (body.freeShippingThreshold !== undefined) settings.freeShippingThreshold = body.freeShippingThreshold;
      settings.markModified("voiceAgent");
      settings.markModified("heroSlides");
      settings.markModified("activeDiscounts");
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
