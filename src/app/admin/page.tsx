"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  ordersByStatus: Record<string, number>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.totalRevenue === "number") {
          setStats(data);
        } else {
          setError(data.error || "Failed to load stats. Check your database connection.");
        }
      })
      .catch(() => {
        setError("Network error — could not reach the API.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Revenue",
          value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
          icon: DollarSign,
          color: "bg-green-500/10 text-green-400",
        },
        {
          label: "Total Orders",
          value: stats.totalOrders,
          icon: ShoppingCart,
          color: "bg-blue-500/10 text-blue-400",
        },
        {
          label: "Products",
          value: stats.totalProducts,
          icon: Package,
          color: "bg-purple-500/10 text-purple-400",
        },
        {
          label: "Low Stock Items",
          value: stats.lowStockCount,
          icon: AlertTriangle,
          color: "bg-amber-500/10 text-amber-400",
        },
      ]
    : [];

  return (
    <AdminGuard>
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="pt-20">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-500 mt-1">Manage your Vibe Vault store</p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 text-sm font-medium hover:bg-zinc-800 transition-colors text-zinc-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 font-medium mb-1">Unable to load dashboard</p>
            <p className="text-red-400/70 text-sm mb-4">{error}</p>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                  <div className="shimmer h-4 w-24 rounded mb-3" />
                  <div className="shimmer h-8 w-16 rounded" />
                </div>
              ))
            : statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-zinc-400">{card.label}</span>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}
                    >
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              ))}
        </div>

        {/* Orders by Status */}
        {stats?.ordersByStatus && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Orders by Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {["pending", "processing", "shipped", "delivered", "cancelled"].map(
                (status) => (
                  <div
                    key={status}
                    className="bg-zinc-800 rounded-xl p-4 text-center"
                  >
                    <p className="text-2xl font-bold text-white">
                      {stats.ordersByStatus[status] || 0}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">{status}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <Package className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Manage Products</p>
                <p className="text-xs text-zinc-500">Add, edit, or delete products</p>
              </div>
            </Link>
            <Link
              href="/admin/slider"
              className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Hero Slider</p>
                <p className="text-xs text-zinc-500">Customize homepage slides</p>
              </div>
            </Link>
            <Link
              href="/admin/voice"
              className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Voice Agent</p>
                <p className="text-xs text-zinc-500">Configure AI assistant</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
    </AdminGuard>
  );
}
