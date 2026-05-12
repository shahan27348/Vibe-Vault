"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Trash2,
  Minus,
  Plus,
  Sparkles,
  Lock,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCartStore, seedProducts, type Product } from "@/lib/store";
import Header from "@/components/Header";

// Initialize Stripe outside component to avoid re-renders
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#e4e4e7",
      fontFamily: '"Inter", sans-serif',
      fontSize: "15px",
      fontSmoothing: "antialiased",
      "::placeholder": { color: "#71717a" },
      backgroundColor: "transparent",
    },
    invalid: { color: "#f87171", iconColor: "#f87171" },
  },
};

type PaymentMethod = "stripe" | "jazzcash" | "easypaisa" | "cod";

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Outer page wraps with Stripe Elements provider
export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [shipping, setShipping] = useState<ShippingInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Pakistan",
  });

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const loadRecommendations = async () => {
    const recs = seedProducts
      .filter((p) => !items.find((i) => i.productId === p._id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    setRecommendedProducts(recs);
    try {
      const r = await fetch("/api/products?limit=20");
      const d = await r.json();
      if (d.products?.length) {
        const filtered = d.products.filter(
          (p: Product) => !items.find((i) => i.productId === p._id)
        );
        const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 4);
        if (shuffled.length) setRecommendedProducts(shuffled);
      }
    } catch {
      // use seedProducts fallback already set above
    }
  };

  const handlePlaceOrder = async () => {
    if (!shipping.name || !shipping.email || !shipping.address || !shipping.city) {
      alert("Please fill in all required shipping fields.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            image: i.image,
          })),
          paymentMethod,
          shippingAddress: shipping,
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (paymentMethod === "stripe" && data.clientSecret && stripe && elements) {
          // Confirm payment with Stripe Elements
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            alert("Card details not found. Please enter your card information.");
            setIsProcessing(false);
            return;
          }
          const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: { name: shipping.name, email: shipping.email },
            },
          });
          if (stripeError) {
            alert(stripeError.message || "Payment failed. Please try again.");
            setIsProcessing(false);
            return;
          }
          setOrderNumber(data.orderNumber || "VV-" + Date.now());
          await loadRecommendations();
          setOrderPlaced(true);
          clearCart();
        } else if (data.redirectUrl) {
          // JazzCash/EasyPaisa redirect
          window.location.href = data.redirectUrl;
        } else {
          // COD or other methods
          setOrderNumber(data.orderNumber || "VV-" + Date.now());
          await loadRecommendations();
          setOrderPlaced(true);
          clearCart();
        }
      } else {
        alert(data.error || "Failed to place order. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-20">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Order Placed! 🎉
            </h1>
            <p className="text-zinc-500 mb-4">
              Thank you for shopping with Vibe Vault
            </p>
            <div className="bg-zinc-900 rounded-xl p-4 mb-8 border border-zinc-800 inline-block min-w-48">
              <p className="text-sm text-zinc-500">Order Number</p>
              <p className="text-xl font-bold text-indigo-400">{orderNumber}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/orders"
                className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors"
              >
                View Orders
              </Link>
            </div>
          </div>

          {/* Recommended Products */}
          {recommendedProducts.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">You Might Also Like</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => (
                  <Link
                    key={product._id}
                    href={`/shop/${product.slug}`}
                    className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500/50 transition-all"
                  >
                    <div className="aspect-square relative bg-zinc-800">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide mb-1">
                        {product.category}
                      </p>
                      <p className="text-sm font-semibold text-zinc-200 truncate">{product.name}</p>
                      <p className="text-sm text-indigo-400 font-bold mt-1">
                        Rs. {product.price.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="max-w-lg mx-auto px-4 pt-32 pb-20 text-center">
          <Truck className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Cart is Empty</h1>
          <p className="text-zinc-500 mb-6">Add some products to checkout</p>
          <Link
            href="/shop"
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { id: "stripe" as const, label: "Credit Card", icon: CreditCard, desc: "Visa, Mastercard, AMEX" },
    { id: "jazzcash" as const, label: "JazzCash", icon: Smartphone, desc: "Mobile wallet" },
    { id: "easypaisa" as const, label: "EasyPaisa", icon: Smartphone, desc: "Mobile wallet" },
    { id: "cod" as const, label: "Cash on Delivery", icon: Banknote, desc: "Pay when delivered" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shopping
        </button>

        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-4">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Full Name", type: "text", full: true },
                  { key: "email", label: "Email", type: "email" },
                  { key: "phone", label: "Phone", type: "tel" },
                  { key: "address", label: "Address", type: "text", full: true },
                  { key: "city", label: "City", type: "text" },
                  { key: "state", label: "State/Province", type: "text" },
                  { key: "zip", label: "ZIP Code", type: "text" },
                  { key: "country", label: "Country", type: "text" },
                ].map((field) => (
                  <div
                    key={field.key}
                    className={field.full ? "sm:col-span-2" : ""}
                  >
                    <label className="text-sm font-medium text-zinc-400 mb-1 block">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={shipping[field.key as keyof ShippingInfo]}
                      onChange={(e) =>
                        setShipping((s) => ({
                          ...s,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="text-lg font-bold text-white mb-4">
                Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all border-2 ${
                      paymentMethod === pm.id
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <pm.icon
                      className={`w-5 h-5 ${
                        paymentMethod === pm.id
                          ? "text-indigo-400"
                          : "text-zinc-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {pm.label}
                      </p>
                      <p className="text-xs text-zinc-500">{pm.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Stripe Card Element — shown when Credit Card is selected and Stripe is configured */}
              {paymentMethod === "stripe" && stripePromise && (
                <div className="mt-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-zinc-400">
                      Secure card details — powered by Stripe
                    </span>
                  </div>
                  <CardElement options={CARD_ELEMENT_OPTIONS} className="py-1" />
                </div>
              )}
              {paymentMethod === "stripe" && !stripePromise && (
                <div className="mt-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400">
                      Card payment — order will be confirmed and you can pay securely at delivery.
                    </span>
                  </div>
                </div>
              )}

              {/* JazzCash/EasyPaisa instructions */}
              {(paymentMethod === "jazzcash" || paymentMethod === "easypaisa") && (
                <div className="mt-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl">
                  <p className="text-sm text-zinc-400">
                    You will be redirected to {paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"} to complete your payment securely.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 sticky top-24">
              <h2 className="text-lg font-bold text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.size && `${item.size} · `}
                        {item.color && `${item.color} · `}$
                        {item.price}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              Math.max(0, item.quantity - 1)
                            )
                          }
                          className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3 text-zinc-400" />
                        </button>
                        <span className="text-xs font-medium text-zinc-300">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3 text-zinc-400" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-400">Free</span>
                    ) : (
                      `Rs. ${shippingCost.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Tax</span>
                  <span>Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-base pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full mt-6 py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Place Order — Rs. {total.toLocaleString()}
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-400 text-center mt-3">
                🔒 Secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
