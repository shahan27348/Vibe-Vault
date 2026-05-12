import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";

// Stripe is optional — only initialised when STRIPE_SECRET_KEY is set
const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-01-28.clover" })
  : null;

// POST /api/checkout - Create payment intent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shippingAddress, paymentMethod, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08;
    const shipping = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + tax + shipping;

    if (paymentMethod === "stripe") {
      if (!stripe) {
        // Stripe not configured — treat as COD with card-pending status
        await connectDB();
        const orderNumber = `VV-${Date.now().toString(36).toUpperCase()}`;
        const order = await Order.create({
          userId: userId || "guest",
          orderNumber,
          items,
          subtotal,
          tax,
          shipping,
          total,
          status: "pending",
          paymentMethod: "stripe",
          paymentStatus: "pending",
          shippingAddress,
        });
        return NextResponse.json({ success: true, orderNumber, orderId: order._id, total });
      }
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Stripe uses cents
        currency: "usd",
        metadata: {
          userId: userId || "guest",
        },
      });

      // Create pending order
      await connectDB();
      const orderNumber = `VV-${Date.now().toString(36).toUpperCase()}`;
      await Order.create({
        userId: userId || "guest",
        orderNumber,
        items,
        subtotal,
        tax,
        shipping,
        total,
        status: "pending",
        paymentMethod: "stripe",
        paymentStatus: "pending",
        paymentIntentId: paymentIntent.id,
        shippingAddress,
      });

      return NextResponse.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        orderNumber,
        total,
      });
    }

    if (paymentMethod === "cod") {
      await connectDB();
      const orderNumber = `VV-${Date.now().toString(36).toUpperCase()}`;
      const order = await Order.create({
        userId: userId || "guest",
        orderNumber,
        items,
        subtotal,
        tax,
        shipping,
        total,
        status: "pending",
        paymentMethod: "cod",
        paymentStatus: "pending",
        shippingAddress,
      });

      return NextResponse.json({
        success: true,
        orderNumber,
        orderId: order._id,
        total,
        message: "Order placed! Pay on delivery.",
      });
    }

    // JazzCash / Easypaisa
    if (paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
      await connectDB();
      const orderNumber = `VV-${Date.now().toString(36).toUpperCase()}`;
      await Order.create({
        userId: userId || "guest",
        orderNumber,
        items,
        subtotal,
        tax,
        shipping,
        total,
        status: "pending",
        paymentMethod,
        paymentStatus: "pending",
        shippingAddress,
      });

      return NextResponse.json({
        success: true,
        orderNumber,
        total,
        redirectUrl: `/checkout/mobile-payment?method=${paymentMethod}&order=${orderNumber}&amount=${total}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
