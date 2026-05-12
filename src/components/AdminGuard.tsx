"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ShieldAlert, Loader2 } from "lucide-react";
import Header from "@/components/Header";

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "admin" | "denied">("loading");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.isAdmin) {
          setStatus("admin");
        } else {
          setStatus("denied");
        }
      })
      .catch(() => setStatus("denied"));
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="flex items-center justify-center pt-40">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-zinc-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-zinc-950">
        <Header />
        <div className="flex items-center justify-center pt-40">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-zinc-400 mb-6">
              You don&apos;t have admin privileges. Only authorized administrators can access this area.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2.5 bg-white text-zinc-900 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
              >
                Go to Store
              </button>
              <button
                onClick={() => router.push("/orders")}
                className="px-6 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                My Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
