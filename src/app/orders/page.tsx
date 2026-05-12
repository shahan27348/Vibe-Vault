"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Clock, Truck, CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";

interface Order {
  _id: string;
  orderNumber: string;
  items: { name: string; price: number; quantity: number; image?: string }[];
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  processing: "bg-blue-500/10 text-blue-400",
  shipped: "bg-purple-500/10 text-purple-400",
  delivered: "bg-green-500/10 text-green-400",
  cancelled: "bg-red-500/10 text-red-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        else if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">My Orders</h1>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-zinc-500 mb-6">
              When you place orders, they&apos;ll appear here
            </p>
            <Link
              href="/shop"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const Icon = STATUS_ICONS[order.status] || Clock;
              const colorClass = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              return (
                <div
                  key={order._id}
                  className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-white">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                          <p className="text-xs text-zinc-500">
                            Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <p className="text-sm text-zinc-500">
                      Paid via {order.paymentMethod.toUpperCase()}
                    </p>
                    <p className="font-bold text-white">
                      Rs. {order.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
