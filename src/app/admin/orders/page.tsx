"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Loader2,
  RefreshCw,
  Search,
  ChevronDown,
} from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Order = Record<string, any>;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="pt-20">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white">Orders</h1>
                <p className="text-zinc-500 mt-1">{orders.length} total orders</p>
              </div>
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by order number or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 pr-8 text-sm text-zinc-300 cursor-pointer hover:bg-zinc-800"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((order) => (
                  <div key={order._id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-white text-lg">{order.orderNumber}</h3>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[order.status] || "bg-zinc-800 text-zinc-400"}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">
                          {order.shippingAddress?.name} • {order.shippingAddress?.city}, {order.shippingAddress?.country}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                          {order.items?.length} item(s) • Rs. {order.total?.toLocaleString()} •{" "}
                          {order.paymentMethod?.toUpperCase()} •{" "}
                          <span className={order.paymentStatus === "paid" ? "text-green-400" : "text-amber-400"}>
                            {order.paymentStatus}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {updatingId === order._id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                        ) : (
                          <div className="relative">
                            <select
                              value={order.status}
                              onChange={(e) => updateStatus(order._id, e.target.value)}
                              className="appearance-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 pr-8 text-sm text-zinc-300 cursor-pointer hover:bg-zinc-700"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    {order.items?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item: Order, i: number) => (
                            <span key={i} className="px-3 py-1 bg-zinc-800 rounded-lg text-xs text-zinc-400">
                              {item.quantity}x {item.name} {item.size ? `(${item.size})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
