import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { requireAdmin } from "@/lib/admin";

// GET /api/admin/stats
export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck.error) return adminCheck.error;

    await connectDB();

    const [
      totalProducts,
      totalOrders,
      lowStockCount,
      orders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $lt: 20 } }),
      Order.find({ paymentStatus: "paid" }).lean(),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      Product.find().sort({ reviewCount: -1 }).limit(5).lean(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const ordersByStatus = {
      pending: await Order.countDocuments({ status: "pending" }),
      processing: await Order.countDocuments({ status: "processing" }),
      shipped: await Order.countDocuments({ status: "shipped" }),
      delivered: await Order.countDocuments({ status: "delivered" }),
    };

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      lowStockCount,
      ordersByStatus,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
