"use client";

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";

export default function CartSidebar() {
  const { items, isOpen, setCartOpen, removeItem, updateQuantity } =
    useCartStore();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-zinc-300" />
              <h2 className="text-lg font-semibold text-zinc-100">Cart ({itemCount})</h2>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-zinc-400 text-lg font-medium">
                  Your cart is empty
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Add some items to get started
                </p>
                <Link
                  href="/shop"
                  onClick={() => setCartOpen(false)}
                  className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4 p-3 bg-zinc-900 rounded-xl"
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate text-zinc-200">
                      {item.name}
                    </h3>
                    {(item.size || item.color) && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && " · "}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1 text-zinc-100">
                      Rs. {item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3 text-zinc-400" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center text-zinc-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-zinc-800 p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-semibold text-zinc-100">Rs. {total.toLocaleString()}</span>
              </div>
              {total < 5000 && (
                <p className="text-xs text-zinc-500">
                  Add Rs. {(5000 - total).toLocaleString()} more for free shipping!
                </p>
              )}
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="block w-full py-3 bg-indigo-600 text-white text-center rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Checkout · Rs. {total.toLocaleString()}
              </Link>
              <button
                onClick={() => setCartOpen(false)}
                className="block w-full py-2.5 text-sm text-zinc-400 hover:text-indigo-400 text-center transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
